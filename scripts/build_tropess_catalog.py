#!/usr/bin/env python3
"""Build the TROPESS published-product catalog JSON for the dashboard.

Queries NASA's CMR (Common Metadata Repository) -- the authoritative public
API behind https://disc.gsfc.nasa.gov -- for every TROPESS collection published
at GES DISC, and writes an aggregated summary to public/data/TROPESS_catalog.json.

This powers slides 1 & 2 of TROPESS_Data_Download_Metrics.pptx:
  Slide 1 "Data Products Published in GES DISC" -> summary (counts, levels,
           instruments, streams, optional volume estimate)
  Slide 2 "Data Products Scope and Range"       -> timeline (per-collection
           data-coverage date range, grouped by processing stream)

Unlike the download metrics (private monthly CSVs), the product catalog is fully
public via CMR, so this script fetches it live each time it is run.

Usage:
    python scripts/build_tropess_catalog.py
    python scripts/build_tropess_catalog.py --with-granules   # +volume estimate (slow)

--with-granules issues one extra request per collection (~212) to count granules
and estimate total published volume; off by default.
"""

import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request

CMR = "https://cmr.earthdata.nasa.gov/search"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Known missions -> CMR query + parsing style. TROPESS uses trace-gas species /
# stream title parsing; other missions use provider-agnostic UMM fields.
MISSIONS = {
    "TROPESS": {
        "keyword": "TROPESS",
        "provider": "GES_DISC",
        "parser": "tropess",
        "catalog_url": "https://disc.gsfc.nasa.gov/datasets?keywords=tropess",
        "source_label": "NASA GES DISC",
    },
    "GRACE": {
        "keyword": "GRACE",
        "provider": "POCLOUD",
        "parser": "generic",
        "catalog_url": "https://podaac.jpl.nasa.gov/GRACE",
        "source_label": "NASA PO.DAAC",
    },
    "SWOT": {
        "keyword": "SWOT",
        "provider": "POCLOUD",
        "parser": "generic",
        "catalog_url": "https://podaac.jpl.nasa.gov/SWOT",
        "source_label": "NASA PO.DAAC",
    },
}


def output_path(mission):
    return os.path.abspath(
        os.path.join(SCRIPT_DIR, "..", "public", "data", f"{mission}_catalog.json")
    )

# Long species name (as it appears in EntryTitle) -> short symbol.
SPECIES_MAP = {
    "Ammonia": "NH3",
    "Carbon Monoxide": "CO",
    "Methane": "CH4",
    "Ozone": "O3",
    "Peroxyacetyl Nitrate": "PAN",
    "Peroxyacytyl Nitrate": "PAN",   # known typo in some titles
    "Deuterated Water Vapor": "HDO",
    "Water Vapor": "H2O",
    "Water": "H2O",
    "Atmospheric Temperature": "TATM",
    "Nitric Acid": "HNO3",
    "Nitrogen Dioxide": "NO2",
    "Formaldehyde": "CH2O",
    "Sulfur Dioxide": "SO2",
}


def http_get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read(), dict(resp.headers)


def cmr_hits(short_name, kind="granules"):
    """Return the CMR-Hits count for a granule/collection query (HEAD-like)."""
    url = f"{CMR}/{kind}?short_name={urllib.parse.quote(short_name)}&page_size=0"
    try:
        _, headers = http_get(url)
        return int(headers.get("CMR-Hits", 0))
    except Exception:
        return None


def fetch_collections(keyword, provider):
    """Fetch all matching collections as UMM-JSON, paginating if needed."""
    items = []
    search_after = None
    query = {"keyword": keyword, "provider": provider, "page_size": "250"}
    while True:
        qs = urllib.parse.urlencode(query)
        url = f"{CMR}/collections.umm_json?{qs}"
        headers = {"Accept": "application/json"}
        if search_after:
            headers["CMR-Search-After"] = search_after
        body, resp_headers = http_get(url, headers)
        page = json.loads(body)
        page_items = page.get("items", [])
        items.extend(page_items)
        search_after = resp_headers.get("CMR-Search-After")
        # Stop when no continuation token or nothing came back.
        if not search_after or not page_items:
            break
    return items


def classify_stream(title):
    if "Reanalysis" in title:
        return "Reanalysis"
    if "Forward Stream" in title:
        return "Forward"
    if "Megacity" in title:
        return "Megacity"
    if "Chemical Reanalysis" in title:
        return "Reanalysis"
    return "Special"


MEGACITY_RE = re.compile(r"for (.+?) Megacity")


def parse_species(title):
    """Extract a species symbol / label from an EntryTitle."""
    if "Megacity" in title:
        m = MEGACITY_RE.search(title)
        return f"MC-{m.group(1)}" if m else "Megacity"
    # L2 satellite products: "... L2 <Species> for <Stream> ..."
    m = re.search(r"L[234] (.+?) for ", title)
    if m and m.group(1) in SPECIES_MAP:
        return SPECIES_MAP[m.group(1)]
    # L4 chemical-reanalysis products: "TROPESS Chemical Reanalysis <Species> ..."
    m = re.search(r"Chemical Reanalysis (?:Aerosol )?([A-Za-z0-9]+)", title)
    if m:
        tok = m.group(1)
        return SPECIES_MAP.get(tok, tok)
    return "Other"


def parse_instrument_label(title):
    """The instrument/platform label as shown in the title (CrIS-SNPP, etc.)."""
    m = re.search(r"TROPESS (.+?) L[234] ", title)
    if m:
        return m.group(1)
    if "Chemical Reanalysis" in title:
        return "Chemical Reanalysis (TCR-2)"
    return "Other"


def platform_from_umm(u):
    """Concise platform label from UMM Platforms for generic missions.

    Groups by platform short name (e.g. GRACE, GRACE-FO, MITgcm) rather than
    the long multi-instrument combinations, which read poorly in a chart. When
    multiple platforms are present, keeps the first two + an ellipsis.
    """
    platforms = []
    for p in u.get("Platforms", []) or []:
        pname = p.get("ShortName")
        if pname and pname.upper() not in ("NOT APPLICABLE", "N/A"):
            platforms.append(pname)
    uniq = sorted(set(platforms))
    if not uniq:
        return "Other"
    if len(uniq) <= 2:
        return " / ".join(uniq)
    return f"{uniq[0]} / {uniq[1]} / +{len(uniq) - 2}"


def valid_start(iso):
    """Reject placeholder start dates (e.g. 1900-01-01) that break the timeline."""
    if not iso:
        return None
    year = iso[:4]
    if year.isdigit() and int(year) < 1990:
        return None
    return iso


def level_label(level_id):
    if level_id == "1" or (level_id or "").startswith("1"):
        return "L1 (raw/calibrated)"
    if level_id == "2":
        return "L2 (satellite)"
    if level_id == "3":
        return "L3 (gridded)"
    if level_id == "4":
        return "L4 (assimilation)"
    return f"L{level_id}" if level_id else "Unknown"


def counter_to_list(counter, key_name):
    return [
        {key_name: k, "count": v}
        for k, v in sorted(counter.items(), key=lambda kv: (-kv[1], str(kv[0])))
    ]


def main():
    ap = argparse.ArgumentParser(description="Build a mission product catalog from NASA CMR.")
    ap.add_argument("--mission", default="TROPESS",
                    help="Mission name (TROPESS|GRACE|SWOT|...). Default TROPESS.")
    ap.add_argument("--keyword", help="Override CMR keyword (default from mission config).")
    ap.add_argument("--provider", help="Override CMR provider (default from mission config).")
    ap.add_argument("--output", help="Override output JSON path.")
    ap.add_argument("--catalog-url", help="Override the public catalog URL for the mission.")
    ap.add_argument("--with-granules", action="store_true",
                    help="Also fetch granule counts to estimate published volume (slow).")
    args = ap.parse_args()

    mission = args.mission.upper()
    cfg = MISSIONS.get(mission, {})
    keyword = args.keyword or cfg.get("keyword", mission)
    provider = args.provider or cfg.get("provider", "GES_DISC")
    parser_style = cfg.get("parser", "generic")
    catalog_url = args.catalog_url or cfg.get("catalog_url", "")
    source_label = cfg.get("source_label", provider)
    out_path = os.path.abspath(args.output) if args.output else output_path(mission)

    print(f"Querying CMR for {mission} collections "
          f"(keyword={keyword}, provider={provider}) ...")
    items = fetch_collections(keyword, provider)
    print(f"Fetched {len(items)} collections.")
    if not items:
        raise SystemExit("No collections returned from CMR.")

    products = []
    by_level = {}
    by_instrument = {}
    by_stream = {}
    by_species = {}
    missing = []
    est_total_volume_gb = 0.0
    est_total_files = 0
    have_any_granule = False

    for it in items:
        u = it["umm"]
        sn = u.get("ShortName")
        title = u.get("EntryTitle", "")
        doi = (u.get("DOI") or {}).get("DOI")
        level = (u.get("ProcessingLevel") or {}).get("Id")
        llabel = level_label(level)

        if parser_style == "tropess":
            stream = classify_stream(title)
            species = parse_species(title)
            instrument = parse_instrument_label(title)
        else:
            # Generic missions: no trace-gas species / processing streams;
            # group by platform (concise) from UMM metadata.
            stream = None
            species = None
            instrument = platform_from_umm(u)

        # Temporal coverage
        start = end = None
        ends_present = False
        try:
            te = u["TemporalExtents"][0]
            rdt = te["RangeDateTimes"][0]
            start = valid_start(rdt.get("BeginningDateTime"))
            end = rdt.get("EndingDateTime")
            ends_present = te.get("EndsAtPresentFlag", False)
        except (KeyError, IndexError, TypeError):
            pass

        # Average file size (MB) if present
        avg_mb = None
        for fai in (u.get("ArchiveAndDistributionInformation") or {}).get(
                "FileArchiveInformation", []) or []:
            if fai.get("AverageFileSize"):
                unit = (fai.get("AverageFileSizeUnit") or "MB").upper()
                size = float(fai["AverageFileSize"])
                avg_mb = size if unit == "MB" else (size * 1024 if unit == "GB" else size)
                break

        granules = None
        volume_gb = None
        if args.with_granules and sn:
            granules = cmr_hits(sn, "granules")
            if granules is not None:
                have_any_granule = True
                est_total_files += granules
                if avg_mb:
                    volume_gb = granules * avg_mb / 1024.0
                    est_total_volume_gb += volume_gb

        if not doi:
            missing.append(sn)

        by_level[llabel] = by_level.get(llabel, 0) + 1
        by_instrument[instrument] = by_instrument.get(instrument, 0) + 1
        if stream is not None:
            by_stream[stream] = by_stream.get(stream, 0) + 1
        if species is not None:
            by_species[species] = by_species.get(species, 0) + 1

        products.append({
            "short_name": sn,
            "title": title,
            "doi": doi,
            "doi_url": f"https://doi.org/{doi}" if doi else None,
            "level": llabel,
            "stream": stream,
            "species": species,
            "instrument": instrument,
            "start": start,
            "end": None if ends_present else end,
            "ongoing": ends_present,
            **({"granules": granules} if granules is not None else {}),
            **({"volume_gb": round(volume_gb, 2)} if volume_gb is not None else {}),
        })

    # Timeline: sort by start date (nulls last), keep the display-relevant fields.
    timeline = sorted(
        [
            {
                "short_name": p["short_name"], "title": p["title"], "stream": p["stream"],
                "species": p["species"], "instrument": p["instrument"],
                "start": p["start"], "end": p["end"], "ongoing": p["ongoing"],
                "doi": p["doi"], "doi_url": p["doi_url"],
            }
            for p in products
        ],
        key=lambda p: (p["start"] is None, p["start"] or ""),
    )

    summary = {
        "total_products": len(products),
        "total_dois": sum(1 for p in products if p["doi"]),
        "cloud_enabled": True,
        "by_level": counter_to_list(by_level, "level"),
        "by_instrument": counter_to_list(by_instrument, "instrument"),
        "by_stream": counter_to_list(by_stream, "stream"),
        "by_species": counter_to_list(by_species, "species"),
    }
    if have_any_granule:
        summary["est_total_files"] = est_total_files
        summary["est_total_volume_tb"] = round(est_total_volume_gb / 1024.0, 2)

    output = {
        "meta": {
            "mission": mission,
            "fetched_from": f"NASA CMR (cmr.earthdata.nasa.gov), provider {provider}",
            "source_label": source_label,
            "catalog_url": catalog_url,
            "total_products": len(products),
            "note": ("Live product catalog from CMR. Volume/file totals (when present) "
                     "are estimates from granule counts x average file size."),
        },
        "summary": summary,
        "timeline": timeline,
        "products": products,
    }

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as fh:
        json.dump(output, fh, indent=2)

    # --- Summary print -----------------------------------------------------
    print(f"\nTotal products: {summary['total_products']}  (DOIs: {summary['total_dois']})")
    print("By processing level:")
    for row in summary["by_level"]:
        print(f"  {row['level']:<20} {row['count']}")
    if summary["by_stream"]:
        print("By stream:")
        for row in summary["by_stream"]:
            print(f"  {row['stream']:<14} {row['count']}")
    print("By instrument:")
    for row in summary["by_instrument"]:
        print(f"  {row['instrument']:<26} {row['count']}")
    starts = [p["start"] for p in products if p["start"]]
    if starts:
        print(f"Data coverage earliest start: {min(starts)[:10]}")
    if have_any_granule:
        print(f"Estimated published files: {est_total_files:,}")
        print(f"Estimated published volume: {est_total_volume_gb/1024:.2f} TB")
    if missing:
        print(f"\nWARNING: {len(missing)} products missing DOI: {missing[:5]}")
    print(f"\nWrote {out_path}")


if __name__ == "__main__":
    main()
