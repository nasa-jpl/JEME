#!/usr/bin/env python3
"""
Enrich citation entries with author-institution countries, so the geographic
impact map has something to plot and the collaboration lines have something to
link.

A collaboration line needs a paper with two or more author-affiliation
countries. Without this data the page falls back to scanning titles and
abstracts for place names, which yields exactly one country per paper by
construction, so no line can ever be drawn.

Adds to each entry:
  country        primary country (first author's institution)
  all_countries  every distinct affiliation country, first author's first
  institutions   up to MAX_INSTITUTIONS unique institution names

Source is OpenAlex, queried in batches of 50 DOIs (~600 requests for the whole
corpus rather than ~30,000). Crossref is available as a per-DOI fallback for
works OpenAlex has no affiliations for; it is off by default because it costs
one request per paper.

This supersedes the per-DOI serial path in enrich_geographic.py, which remains
for single-model reruns.

Usage:
    python scripts/enrich_affiliations.py --model RAPID --dry-run
    python scripts/enrich_affiliations.py --model RAPID
    python scripts/enrich_affiliations.py --all
    python scripts/enrich_affiliations.py --all --crossref-fallback
"""

import argparse
import json
import sys
import time
from collections import Counter
from pathlib import Path

import requests

DATA_DIR = Path(__file__).parent.parent / "public" / "data"
CACHE_FILE = Path(__file__).parent / "affiliation_cache.json"

MODELS = [
    "CARDAMOM", "CMS-Flux", "ECCO", "EDMF", "GRACE", "ISSM",
    "LES", "MOMO-CHEM", "RAPID", "SWOT", "TROPESS",
]

OPENALEX_URL = "https://api.openalex.org/works"
CROSSREF_URL = "https://api.crossref.org/works/{doi}"
MAILTO = "yunkss@gmail.com"          # polite pool on both APIs
BATCH_SIZE = 50                       # OpenAlex OR-filter limit
TIMEOUT = 30
SLEEP = 0.12                          # stay under 10 req/s
MAX_RETRIES = 3
MAX_INSTITUTIONS = 10                 # cap; ECCO alone is 16k entries

# ISO-3166 alpha-2 to the country names the dashboard uses. Names must match
# getCountryCoordinates in GoogleMapComponent.js and getRegionFromCountry in
# GenericGeographicImpactPage.js, or the country lands on neither the map nor a
# region, so the spellings here are deliberate ("South Korea", not "Korea,
# Republic of").
ISO2_COUNTRY = {
    "AD": "Andorra", "AE": "United Arab Emirates", "AF": "Afghanistan",
    "AG": "Antigua and Barbuda", "AL": "Albania", "AM": "Armenia",
    "AO": "Angola", "AR": "Argentina", "AT": "Austria", "AU": "Australia",
    "AZ": "Azerbaijan", "BA": "Bosnia and Herzegovina", "BB": "Barbados",
    "BD": "Bangladesh", "BE": "Belgium", "BF": "Burkina Faso", "BG": "Bulgaria",
    "BH": "Bahrain", "BI": "Burundi", "BJ": "Benin", "BN": "Brunei",
    "BO": "Bolivia", "BR": "Brazil", "BS": "Bahamas", "BT": "Bhutan",
    "BW": "Botswana", "BY": "Belarus", "BZ": "Belize", "CA": "Canada",
    "CD": "Democratic Republic of the Congo", "CF": "Central African Republic",
    "CG": "Republic of the Congo", "CH": "Switzerland", "CI": "Ivory Coast",
    "CL": "Chile", "CM": "Cameroon", "CN": "China", "CO": "Colombia",
    "CR": "Costa Rica", "CU": "Cuba", "CV": "Cape Verde", "CY": "Cyprus",
    "CZ": "Czech Republic", "DE": "Germany", "DJ": "Djibouti", "DK": "Denmark",
    "DO": "Dominican Republic", "DZ": "Algeria", "EC": "Ecuador",
    "EE": "Estonia", "EG": "Egypt", "ER": "Eritrea", "ES": "Spain",
    "ET": "Ethiopia", "FI": "Finland", "FJ": "Fiji", "FR": "France",
    "GA": "Gabon", "GB": "United Kingdom", "GE": "Georgia", "GH": "Ghana",
    "GL": "Greenland", "GM": "Gambia", "GN": "Guinea", "GQ": "Equatorial Guinea",
    "GR": "Greece", "GT": "Guatemala", "GY": "Guyana", "HK": "Hong Kong",
    "HN": "Honduras", "HR": "Croatia", "HT": "Haiti", "HU": "Hungary",
    "ID": "Indonesia", "IE": "Ireland", "IL": "Israel", "IN": "India",
    "IQ": "Iraq", "IR": "Iran", "IS": "Iceland", "IT": "Italy",
    "JM": "Jamaica", "JO": "Jordan", "JP": "Japan", "KE": "Kenya",
    "KG": "Kyrgyzstan", "KH": "Cambodia", "KP": "North Korea", "KR": "South Korea",
    "KW": "Kuwait", "KZ": "Kazakhstan", "LA": "Laos", "LB": "Lebanon",
    "LI": "Liechtenstein", "LK": "Sri Lanka", "LR": "Liberia", "LS": "Lesotho",
    "LT": "Lithuania", "LU": "Luxembourg", "LV": "Latvia", "LY": "Libya",
    "MA": "Morocco", "MC": "Monaco", "MD": "Moldova", "ME": "Montenegro",
    "MG": "Madagascar", "MK": "North Macedonia", "ML": "Mali", "MM": "Myanmar",
    "MN": "Mongolia", "MO": "Macau", "MR": "Mauritania", "MT": "Malta",
    "MU": "Mauritius", "MV": "Maldives", "MW": "Malawi", "MX": "Mexico",
    "MY": "Malaysia", "MZ": "Mozambique", "NA": "Namibia", "NE": "Niger",
    "NG": "Nigeria", "NI": "Nicaragua", "NL": "Netherlands", "NO": "Norway",
    "NP": "Nepal", "NZ": "New Zealand", "OM": "Oman", "PA": "Panama",
    "PE": "Peru", "PG": "Papua New Guinea", "PH": "Philippines",
    "PK": "Pakistan", "PL": "Poland", "PR": "Puerto Rico", "PS": "Palestine",
    "PT": "Portugal", "PY": "Paraguay", "QA": "Qatar", "RO": "Romania",
    "RS": "Serbia", "RU": "Russia", "RW": "Rwanda", "SA": "Saudi Arabia",
    "SD": "Sudan", "SE": "Sweden", "SG": "Singapore", "SI": "Slovenia",
    "SK": "Slovakia", "SL": "Sierra Leone", "SN": "Senegal", "SO": "Somalia",
    "SR": "Suriname", "SS": "South Sudan", "SV": "El Salvador", "SY": "Syria",
    "SZ": "Eswatini", "TD": "Chad", "TG": "Togo", "TH": "Thailand",
    "TJ": "Tajikistan", "TM": "Turkmenistan", "TN": "Tunisia", "TR": "Turkey",
    "TT": "Trinidad and Tobago", "TW": "Taiwan", "TZ": "Tanzania",
    "UA": "Ukraine", "UG": "Uganda", "US": "United States", "UY": "Uruguay",
    "UZ": "Uzbekistan", "VE": "Venezuela", "VN": "Vietnam", "YE": "Yemen",
    "ZA": "South Africa", "ZM": "Zambia", "ZW": "Zimbabwe",
}

# Crossref affiliation strings are free text, so the fallback matches on
# country words and a few unambiguous institution names.
CROSSREF_HINTS = [
    ("United States", ["USA", "U.S.A", "United States", "NASA", "JPL",
                       "Jet Propulsion", "Goddard", "NOAA", "NCAR", "Caltech"]),
    ("United Kingdom", ["United Kingdom", "England", "Scotland", "Wales", " UK"]),
    ("China", ["China", "Chinese Academy", "Beijing", "Shanghai", "Tsinghua"]),
    ("Germany", ["Germany", "Deutschland", "Max Planck", "DLR", "Jülich"]),
    ("France", ["France", "CNRS", "CNES", "Sorbonne", "Toulouse"]),
    ("Japan", ["Japan", "JAXA", "Tokyo", "Kyoto", "JAMSTEC"]),
    ("Canada", ["Canada", "Toronto", "Montreal", "British Columbia"]),
    ("Australia", ["Australia", "CSIRO", "Melbourne", "Sydney"]),
    ("Netherlands", ["Netherlands", "Utrecht", "Delft", "Wageningen", "KNMI"]),
    ("Switzerland", ["Switzerland", "ETH Z", "EPFL", "Zurich", "Geneva"]),
    ("Italy", ["Italy", "Italia", "Rome", "Milano", "Bologna"]),
    ("Spain", ["Spain", "Espa", "Madrid", "Barcelona"]),
    ("India", ["India", "Indian Institute", "Bangalore", "Delhi"]),
    ("South Korea", ["Korea", "Seoul", "KAIST"]),
    ("Brazil", ["Brazil", "Brasil", "INPE"]),
    ("Norway", ["Norway", "Norge", "Oslo", "Bergen"]),
    ("Sweden", ["Sweden", "Sverige", "Stockholm", "Uppsala"]),
    ("Denmark", ["Denmark", "Danmark", "Copenhagen"]),
    ("Belgium", ["Belgium", "Belgique", "Leuven", "Brussels"]),
    ("Austria", ["Austria", "Vienna", "Wien", "Innsbruck"]),
    ("Finland", ["Finland", "Helsinki"]),
    ("Russia", ["Russia", "Moscow", "Russian Academy"]),
    ("Israel", ["Israel", "Technion", "Weizmann"]),
    ("New Zealand", ["New Zealand", "NIWA", "Auckland"]),
    ("South Africa", ["South Africa", "Pretoria", "Cape Town"]),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def norm_doi(value):
    """Bare lowercase DOI, with any doi.org prefix stripped."""
    s = str(value or "").strip().lower()
    for prefix in ("https://doi.org/", "http://doi.org/", "doi:"):
        if s.startswith(prefix):
            s = s[len(prefix):]
    return s.strip()


def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)


def load_model(model):
    path = DATA_DIR / f"{model}_analyzed.json"
    if not path.exists():
        return None, None
    with open(path) as f:
        return json.load(f), path


# ---------------------------------------------------------------------------
# OpenAlex
# ---------------------------------------------------------------------------

def extract_from_authorships(authorships):
    """(primary_country, all_countries, institutions) from OpenAlex authorships."""
    countries = []
    institutions = []
    primary = None

    for authorship in authorships or []:
        author_countries = []
        for inst in authorship.get("institutions") or []:
            name = inst.get("display_name")
            if name:
                institutions.append(name)
            country = ISO2_COUNTRY.get(inst.get("country_code") or "")
            if country:
                author_countries.append(country)
        # Newer OpenAlex records carry countries directly on the authorship.
        for code in authorship.get("countries") or []:
            country = ISO2_COUNTRY.get(code)
            if country:
                author_countries.append(country)

        for country in author_countries:
            if country not in countries:
                countries.append(country)
        # First author with any affiliation country sets the primary.
        if primary is None and author_countries:
            primary = author_countries[0]

    institutions = list(dict.fromkeys(institutions))[:MAX_INSTITUTIONS]
    return primary, countries, institutions


def fetch_openalex_batch(dois):
    """Map normalized DOI -> record for up to BATCH_SIZE DOIs."""
    params = {
        "filter": "doi:" + "|".join(dois),
        "per-page": len(dois),
        "select": "doi,authorships",
        "mailto": MAILTO,
    }
    for attempt in range(MAX_RETRIES):
        try:
            r = requests.get(OPENALEX_URL, params=params, timeout=TIMEOUT)
            if r.status_code == 200:
                out = {}
                for work in r.json().get("results", []):
                    doi = norm_doi(work.get("doi"))
                    if not doi:
                        continue
                    primary, countries, institutions = extract_from_authorships(
                        work.get("authorships"))
                    out[doi] = {
                        "country": primary,
                        "all_countries": countries,
                        "institutions": institutions,
                        "source": "openalex",
                    }
                return out
            if r.status_code in (403, 404):
                return {}
            time.sleep(2 ** attempt)
        except requests.RequestException:
            time.sleep(2 ** attempt)
    return {}


# ---------------------------------------------------------------------------
# Crossref fallback
# ---------------------------------------------------------------------------

def country_from_affiliation(text):
    for country, hints in CROSSREF_HINTS:
        for hint in hints:
            if hint.lower() in text.lower():
                return country
    return None


def fetch_crossref(doi):
    headers = {"User-Agent": f"ScienceModelDashboard/1.0 (mailto:{MAILTO})"}
    try:
        r = requests.get(CROSSREF_URL.format(doi=doi), headers=headers, timeout=TIMEOUT)
        if r.status_code != 200:
            return None
        msg = r.json().get("message", {})
    except (requests.RequestException, ValueError):
        return None

    countries = []
    institutions = []
    primary = None
    for author in msg.get("author", []) or []:
        author_countries = []
        for aff in author.get("affiliation", []) or []:
            name = aff.get("name", "")
            if not name:
                continue
            institutions.append(name)
            country = country_from_affiliation(name)
            if country:
                author_countries.append(country)
        for country in author_countries:
            if country not in countries:
                countries.append(country)
        if primary is None and author_countries:
            primary = author_countries[0]

    if not primary:
        return None
    return {
        "country": primary,
        "all_countries": countries,
        "institutions": list(dict.fromkeys(institutions))[:MAX_INSTITUTIONS],
        "source": "crossref",
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def collect_todo(models, cache, rerun):
    """Normalized DOIs still needing a lookup, across every requested model."""
    todo = []
    seen = set()
    for model in models:
        data, _ = load_model(model)
        if data is None:
            print(f"  skip {model}: no data file")
            continue
        for entry in data:
            doi = norm_doi(entry.get("doi"))
            if not doi or "|" in doi or "," in doi:
                continue
            if entry.get("country") and not rerun:
                continue
            if doi in cache and not rerun:
                continue
            if doi in seen:
                continue
            seen.add(doi)
            todo.append(doi)
    return todo


def apply_to_model(model, cache, dry_run):
    data, path = load_model(model)
    if data is None:
        return None

    enriched = 0
    multi = 0
    for entry in data:
        doi = norm_doi(entry.get("doi"))
        result = cache.get(doi)
        if not result or not result.get("country"):
            continue
        if not entry.get("country"):
            entry["country"] = result["country"]
            enriched += 1
        countries = result.get("all_countries") or []
        if countries:
            entry["all_countries"] = countries
            if len(countries) >= 2:
                multi += 1
        if result.get("institutions") and not entry.get("institutions"):
            entry["institutions"] = result["institutions"]

    with_country = sum(1 for e in data if e.get("country"))
    pairs = sum(1 for e in data
                if isinstance(e.get("all_countries"), list) and len(e["all_countries"]) >= 2)

    if not dry_run:
        with open(path, "w") as f:
            json.dump(data, f, indent=2)

    return {
        "total": len(data),
        "newly_enriched": enriched,
        "with_country": with_country,
        "multi_country": pairs,
        "multi_this_run": multi,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", help="single model/mission name")
    parser.add_argument("--all", action="store_true", help="every model and mission")
    parser.add_argument("--dry-run", action="store_true",
                        help="report what would be fetched and written, change nothing")
    parser.add_argument("--rerun", action="store_true",
                        help="re-fetch DOIs already in the cache")
    parser.add_argument("--limit", type=int,
                        help="stop after this many DOI lookups")
    parser.add_argument("--crossref-fallback", action="store_true",
                        help="try Crossref for works OpenAlex has no affiliations for "
                             "(one request per paper)")
    args = parser.parse_args()

    if args.all:
        models = MODELS
    elif args.model:
        models = [args.model]
    else:
        sys.exit("Specify --model NAME or --all")

    cache = load_cache()
    print(f"Cache: {len(cache)} DOIs")

    todo = collect_todo(models, cache, args.rerun)
    if args.limit:
        todo = todo[:args.limit]
    batches = (len(todo) + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"Models: {', '.join(models)}")
    print(f"DOIs to look up: {len(todo)} ({batches} OpenAlex batches)")

    if args.dry_run:
        for model in models:
            stats = apply_to_model(model, cache, dry_run=True)
            if stats:
                print(f"  {model:12s} would enrich {stats['newly_enriched']:6d} "
                      f"of {stats['total']:6d} from cache")
        return

    found = 0
    for i in range(0, len(todo), BATCH_SIZE):
        batch = todo[i:i + BATCH_SIZE]
        results = fetch_openalex_batch(batch)
        for doi in batch:
            # Cache misses too, so a rerun does not re-query dead DOIs.
            cache[doi] = results.get(doi, {"country": None, "all_countries": [],
                                           "institutions": [], "source": "openalex-miss"})
            if cache[doi].get("country"):
                found += 1
        if (i // BATCH_SIZE) % 20 == 0:
            print(f"  batch {i // BATCH_SIZE + 1}/{batches} "
                  f"({found} with affiliations so far)")
            save_cache(cache)
        time.sleep(SLEEP)

    if args.crossref_fallback:
        missing = [d for d in todo if not cache.get(d, {}).get("country")]
        print(f"Crossref fallback for {len(missing)} DOIs...")
        for n, doi in enumerate(missing):
            result = fetch_crossref(doi)
            if result:
                cache[doi] = result
                found += 1
            if n % 200 == 0:
                save_cache(cache)
                print(f"  {n}/{len(missing)}")
            time.sleep(SLEEP)

    save_cache(cache)
    print(f"Cache saved: {len(cache)} DOIs, {found} resolved this run")

    print()
    print(f"{'model':12s} {'entries':>8s} {'+country':>9s} {'has country':>12s} {'multi-country':>14s}")
    countries = Counter()
    for model in models:
        stats = apply_to_model(model, cache, dry_run=False)
        if not stats:
            continue
        print(f"{model:12s} {stats['total']:8d} {stats['newly_enriched']:9d} "
              f"{stats['with_country']:12d} {stats['multi_country']:14d}")
        data, _ = load_model(model)
        for entry in data:
            if entry.get("country"):
                countries[entry["country"]] += 1

    print()
    print("Top countries:", dict(countries.most_common(12)))


if __name__ == "__main__":
    main()
