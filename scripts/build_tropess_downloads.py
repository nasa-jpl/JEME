#!/usr/bin/env python3
"""Build TROPESS download-metrics JSON for the dashboard Monthly Report section.

Reads the monthly GES DISC CSVs and the product lookup spreadsheet from
scripts/tropess_downloads/, classifies each download by trace-gas species,
processing stream (Forward / Reanalysis / Special), and megacity, then writes
an aggregated summary to public/data/TROPESS_downloads.json.

Aggregations map to slides 3-7 of TROPESS_Data_Download_Metrics.pptx. Slides
5-7 count downloads by NUMBER OF FILES to match the deck and the JPL notebook
(download_statistic_plots.ipynb), which all use groupby(...)['Files'].
  Slide 3 -> monthly (download requests = sum of Files; volume in TB) + annotations
  Slide 4 -> monthly_by_species (volume GB, top species time series)
  Slide 5 -> cumulative_by_species + cumulative_by_megacity (files)
  Slide 6 -> cumulative_by_type (Forward / Reanalysis / Special, files)
  Slide 7 -> cumulative_by_country (files, small countries grouped as "Other")

Early history (2021-2022 and the 2023 gap in the CSVs) is backfilled from the
"Product Download Full Record" sheet of the lookup xlsx, which matches the CSVs
exactly on overlapping months.

Usage:
    python scripts/build_tropess_downloads.py

Monthly update: drop the new tropess_monthly_YYYYMM.csv into
scripts/tropess_downloads/ and rerun.
"""

import glob
import json
import os
import re

import pandas as pd

# --- Paths -----------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "tropess_downloads")
LOOKUP_XLSX = os.path.join(DATA_DIR, "product-download-chart.xlsx")
OUTPUT_JSON = os.path.abspath(
    os.path.join(SCRIPT_DIR, "..", "public", "data", "TROPESS_downloads.json")
)

# Trace-gas species featured on slide 4 (monthly time series).
TIMESERIES_SPECIES = ["CO", "CH4", "HDO", "NH3", "O3", "PAN"]

# Slide 3 timeline annotations (release milestones), from the GES DISC deck.
# Dates are the release months noted in the PPTX / confirmed by first data.
TIMELINE_ANNOTATIONS = [
    {"month": "2021-02", "label": "Start of Forward Stream Data"},
    {"month": "2023-02", "label": "Release of Megacity Collections"},
    {"month": "2023-10", "label": "Release of CrIS and AIRS Reanalysis"},
    {"month": "2024-11", "label": "Release of TCR-2 Assimilation Collections"},
    {"month": "2025-10", "label": "Release of Megacity Collections"},
]

# Megacity code (last 5 chars of product) -> display name.
MEGACITY_CODES = {
    "MGLOS": "MC-LA",
    "MGTOK": "MC-Tokyo",
    "MGBEI": "MC-Beijing",
    "MGDEL": "MC-Delhi",
    "MGKAR": "MC-Karachi",
    "MGLAG": "MC-Lagos",
    "MGMEX": "MC-MexicoCity",
    "MGSAO": "MC-SaoPaulo",
}

# Countries contributing less than this % of total volume are grouped as "Other".
COUNTRY_OTHER_CUTOFF_PCT = 1.0

# GES DISC country labels -> Natural Earth atlas names (public/data/countries-110m.json),
# so the choropleth map can join on country name. Only names that differ are listed.
COUNTRY_NAME_TO_ATLAS = {
    "United States": "United States of America",
    "Korea South": "South Korea",
    "Russian Federation": "Russia",
    "The Netherlands": "Netherlands",
    "Burkina": "Burkina Faso",
    "Dominican Republic": "Dominican Rep.",
    "Türkiye": "Turkey",
    "Turkiye": "Turkey",
    "T??rkiye": "Turkey",
    "Czechia": "Czechia",
    # Not present as polygons in the 110m atlas (city-states / small islands):
    # Hong Kong, Singapore, Mauritius -> left unmapped (still shown in the bar list).
}


def classify_stream(long_name):
    """Derive processing stream from a product Long Name."""
    ln = str(long_name)
    if "Reanalysis" in ln:
        return "Reanalysis"
    if "Forward Stream" in ln:
        return "Forward"
    return "Special"


def load_lookup():
    """Return product_code -> {species, stream, city} from the lookup xlsx.

    Sheet "Product Name Lookup Table" has a title row at the top, so the real
    header is on the second row (header=1). Columns:
    V1 Name, Long Name, Species, Instrument, DOI, DOI URL.
    """
    lk = pd.read_excel(LOOKUP_XLSX, sheet_name="Product Name Lookup Table", header=1)
    lk.columns = ["V1Name", "LongName", "Species", "Instrument", "DOI", "DOIURL"]
    lk = lk.dropna(subset=["V1Name"])

    mapping = {}
    for _, row in lk.iterrows():
        code = str(row["V1Name"]).strip()
        species = str(row["Species"]).strip()
        stream = classify_stream(row["LongName"])
        city = None
        if species.startswith("MC-"):
            stream = "Special"
            city = species  # e.g. "MC-LA"
        mapping[code] = {"species": species, "stream": stream, "city": city}
    return mapping


def decode_from_code(code):
    """Fallback classifier for product codes missing from the lookup table.

    Handles the naming convention directly:
      * ...MG<CITY>            -> megacity, Special stream
      * TRPS?L2<SPECIES>CRS..FS -> Forward stream, species from the token
    Returns a dict like the lookup values, or None if it can't be decoded.
    """
    code = str(code)

    # Megacity: last five chars encode the city.
    for mg, city in MEGACITY_CODES.items():
        if mg in code:
            return {"species": city, "stream": "Special", "city": city}

    # Species token sits between the L2/CR marker and "CRS"; "FS" suffix = Forward.
    m = re.match(r"TRPS[A-Z]L2([A-Z0-9]+?)CRS.*", code)
    if m:
        species = m.group(1)
        stream = "Forward" if code.endswith("FS") else "Special"
        return {"species": species, "stream": stream, "city": None}

    return None


def load_backfill():
    """Load the "Product Download Full Record" sheet of the lookup xlsx.

    The Full Record covers 2021-10 .. 2024-09 and matches the CSVs exactly on
    overlapping months. We use it to fill any month the CSVs do not cover -- both
    the pre-CSV history (2021-2022) AND the internal gap in the CSV set
    (2023-05 .. 2024-02), where the monthly files jump from 2023-04 to 2024-03.
    CSVs remain authoritative wherever both sources have a month.
    """
    fr = pd.read_excel(LOOKUP_XLSX, sheet_name="Product Download Full Record")
    fr = fr[["Product", "Date", "Country", "StudyArea", "Users", "Files", "Volume (MB)"]].copy()
    fr["Date"] = pd.to_datetime(fr["Date"], errors="coerce")
    fr = fr.dropna(subset=["Date"])
    return fr


def load_downloads():
    """Load monthly CSVs, backfilled from the Full Record for any month the CSVs
    do not cover.

    Returns (df, csv_files, backfill_months).
    """
    files = sorted(glob.glob(os.path.join(DATA_DIR, "tropess_monthly_*.csv")))
    if not files:
        raise SystemExit(f"No monthly CSVs found in {DATA_DIR}")

    frames = [pd.read_csv(f, index_col=None, header=0) for f in files]
    df = pd.concat(frames, axis=0, ignore_index=True)

    # Fix inconsistent M/D/YY dates -> YYYY-MM-DD (mirrors the JPL notebook).
    bad_date_re = r"(\d+)/(\d+)/(\d\d)"
    bad_loc = df["Date"].astype(str).str.match(bad_date_re)
    if bad_loc.any():
        fixed = df.loc[bad_loc, "Date"].astype(str).str.replace(
            bad_date_re, r"20\3-\1-\2", regex=True
        )
        df.loc[bad_loc, "Date"] = fixed
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df = df.dropna(subset=["Date"])

    # Backfill: add Full Record rows for every month NOT present in the CSVs
    # (pre-CSV history + the internal 2023-05..2024-02 gap). This keeps CSVs
    # authoritative where they exist while recovering months they omit.
    backfill = load_backfill()
    csv_months = set(df["Date"].dt.strftime("%Y-%m"))
    bf_month = backfill["Date"].dt.strftime("%Y-%m")
    early = backfill[~bf_month.isin(csv_months)].copy()
    backfill_months = sorted(early["Date"].dt.strftime("%Y-%m").unique())
    df = pd.concat([early, df], axis=0, ignore_index=True)

    df["Volume (MB)"] = pd.to_numeric(df["Volume (MB)"], errors="coerce").fillna(0.0)
    df["Files"] = pd.to_numeric(df["Files"], errors="coerce").fillna(0).astype(int)
    df["Volume (GB)"] = df["Volume (MB)"] / 1024.0
    df["Volume (TB)"] = df["Volume (MB)"] / (1024.0 ** 2)
    return df, files, backfill_months


def round_tb(x):
    return round(float(x), 4)


def main():
    df, files, backfill_months = load_downloads()
    lookup = load_lookup()

    # Classify each row.
    unmapped = {}

    def resolve(code):
        info = lookup.get(code)
        if info is not None:
            return info
        info = decode_from_code(code)
        if info is not None:
            return info
        unmapped[code] = unmapped.get(code, 0) + 1
        return {"species": "Unknown", "stream": "Special", "city": None}

    resolved = df["Product"].astype(str).map(resolve)
    df["species"] = resolved.map(lambda r: r["species"])
    df["stream"] = resolved.map(lambda r: r["stream"])
    df["city"] = resolved.map(lambda r: r["city"])
    df["month"] = df["Date"].dt.strftime("%Y-%m")

    # Continuous month index (fills the gap where the CSVs have no data, e.g.
    # 2023-05 .. 2024-02) so time-series x-axes stay evenly spaced.
    all_months = (
        pd.period_range(df["Date"].min(), df["Date"].max(), freq="M")
        .strftime("%Y-%m")
        .tolist()
    )

    # --- Slide 3: monthly requests (Files) + volume (TB) -------------------
    monthly = (
        df.groupby("month")
        .agg(files=("Files", "sum"), volume_tb=("Volume (TB)", "sum"))
        .reindex(all_months, fill_value=0.0)
    )
    monthly_out = [
        {"month": m, "files": int(monthly.loc[m, "files"]),
         "volume_tb": round_tb(monthly.loc[m, "volume_tb"])}
        for m in all_months
    ]

    # --- Slide 4: monthly volume (GB) by featured species ------------------
    spec_df = df[df["species"].isin(TIMESERIES_SPECIES)]
    spec_pivot = (
        spec_df.groupby(["month", "species"])["Volume (GB)"].sum().unstack(fill_value=0.0)
        .reindex(all_months, fill_value=0.0)
    )
    monthly_by_species = []
    for month in all_months:
        row = spec_pivot.loc[month]
        entry = {"month": month}
        for sp in TIMESERIES_SPECIES:
            entry[sp] = round(float(row.get(sp, 0.0)), 3)
        monthly_by_species.append(entry)

    # Slides 5-7 count downloads by NUMBER OF FILES (matching the GES DISC deck
    # and download_statistic_plots.ipynb, which all use groupby(...)['Files']).

    # --- Slide 5a: cumulative downloads (files) by species -----------------
    by_species = (
        df.groupby("species")["Files"].sum().sort_values(ascending=False)
    )
    # Megacity products are surfaced separately (cumulative_by_megacity), so
    # exclude them from the per-species breakdown to avoid double-counting.
    cumulative_by_species = [
        {"species": sp, "files": int(v)}
        for sp, v in by_species.items()
        if sp != "Unknown" and not sp.startswith("MC-") and v > 0
    ]

    # --- Slide 5b: cumulative downloads (files) by megacity ----------------
    mc = df[df["city"].notna()]
    by_city = mc.groupby("city")["Files"].sum().sort_values(ascending=False)
    cumulative_by_megacity = [
        {"city": c.replace("MC-", ""), "files": int(v)}
        for c, v in by_city.items()
        if v > 0
    ]

    # --- Slide 6: cumulative downloads (files) by processing type ----------
    by_type = df.groupby("stream")["Files"].sum()
    type_order = ["Forward", "Reanalysis", "Special"]
    cumulative_by_type = [
        {"type": t, "files": int(by_type.get(t, 0))}
        for t in type_order
        if by_type.get(t, 0) > 0
    ]

    # --- Slide 7: cumulative downloads (files) by country ("Other") --------
    # The Full Record's Country column contains stray provider labels
    # (GESDISC / GESDISCCLOUD); treat those as unknown and drop from country
    # breakdowns (they remain in the monthly / species / type totals).
    NON_COUNTRIES = {"GESDISC", "GESDISCCLOUD", "Unresolvable", "nan", "N/A"}
    country_df = df[~df["Country"].astype(str).isin(NON_COUNTRIES)]
    by_country = country_df.groupby("Country")["Files"].sum().sort_values(ascending=False)
    total_files = by_country.sum()
    cumulative_by_country = []
    other_files = 0
    for country, v in by_country.items():
        pct = (v / total_files * 100) if total_files else 0
        if pct >= COUNTRY_OTHER_CUTOFF_PCT:
            cumulative_by_country.append(
                {"country": str(country), "files": int(v)}
            )
        else:
            other_files += v
    if other_files > 0:
        cumulative_by_country.append(
            {"country": "Other", "files": int(other_files)}
        )

    # Full per-country files for the choropleth map, keyed by Natural Earth
    # atlas name so the front end can join on the map's country name.
    country_map = []
    for country, v in by_country.items():
        if v <= 0:
            continue
        name = str(country)
        atlas_name = COUNTRY_NAME_TO_ATLAS.get(name, name)
        country_map.append({
            "country": name,
            "atlas_name": atlas_name,
            "files": int(v),
        })

    # --- Meta --------------------------------------------------------------
    months = all_months
    meta = {
        "generated_from_months": months,
        "date_range": {"start": months[0], "end": months[-1]},
        "total_files": int(df["Files"].sum()),
        "total_volume_tb": round_tb(df["Volume (TB)"].sum()),
        "total_requests": int(df["Files"].sum()),
        "backfill_months": backfill_months,
        "source": "GES DISC download usage metrics",
    }

    # Only surface annotations that fall within the reported time range.
    annotations = [a for a in TIMELINE_ANNOTATIONS if months[0] <= a["month"] <= months[-1]]

    output = {
        "meta": meta,
        "annotations": annotations,
        "monthly": monthly_out,
        "monthly_by_species": monthly_by_species,
        "cumulative_by_species": cumulative_by_species,
        "cumulative_by_megacity": cumulative_by_megacity,
        "cumulative_by_type": cumulative_by_type,
        "cumulative_by_country": cumulative_by_country,
        "country_map": country_map,
    }

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w") as fh:
        json.dump(output, fh, indent=2)

    # --- Summary -----------------------------------------------------------
    print(f"Read {len(files)} monthly CSV files + {len(backfill_months)} "
          f"backfilled months from Full Record")
    print(f"Coverage: {months[0]} .. {months[-1]} ({len(months)} months)")
    if backfill_months:
        print(f"Backfilled (pre-CSV): {backfill_months[0]} .. {backfill_months[-1]}")
    print(f"Total downloads (files): {meta['total_files']:,}")
    print(f"Total download volume: {meta['total_volume_tb']:.2f} TB")
    print("Downloads by processing type (files):")
    for item in cumulative_by_type:
        print(f"  {item['type']:<12} {item['files']:,}")
    print(f"Megacities: {[c['city'] for c in cumulative_by_megacity]}")
    if unmapped:
        print(f"\nWARNING: {len(unmapped)} unmapped product code(s) "
              f"(bucketed as Unknown/Special):")
        for code, n in sorted(unmapped.items()):
            print(f"  {code}  ({n} rows)")
    else:
        print("\nAll product codes classified (lookup + fallback).")
    print(f"\nWrote {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
