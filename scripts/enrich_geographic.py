#!/usr/bin/env python3
"""
Enrich TROPESS (or any model) citation data with author institution country
by querying the Crossref API for each paper's DOI.

Adds/updates:
  country       : primary country of the first author's institution
  institutions  : list of unique institution names found across all authors

Usage:
    python scripts/enrich_geographic.py --model TROPESS --dry-run
    python scripts/enrich_geographic.py --model TROPESS
    python scripts/enrich_geographic.py --model TROPESS --rerun  # re-fetch all
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

import requests

CROSSREF_URL = "https://api.crossref.org/works/{doi}"
CROSSREF_EMAIL = "yunkss@gmail.com"   # polite pool
TIMEOUT = 20
SLEEP = 0.15          # stay well under Crossref rate limit
MAX_RETRIES = 3
CACHE_FILE = Path(__file__).parent / "enrich_geographic_cache.json"

# ---------------------------------------------------------------------------
# Country extraction
# ---------------------------------------------------------------------------

COUNTRY_PATTERNS = {
    "United States": ["USA", "U.S.A", "United States", "US ", ", US\b", "CA ", "California",
                      "Colorado", "Maryland", "Massachusetts", "Texas", "New York",
                      "JPL", "NASA", "NOAA", "NCAR", "MIT ", "Caltech", "Stanford",
                      "Harvard", "Princeton", "Yale", "Berkeley", "UCLA", "UCSD",
                      "Jet Propulsion", "Goddard", "Langley"],
    "China": ["China", "Chinese", "Beijing", "Shanghai", "Peking", "Tsinghua",
              "Fudan", "Nanjing", "Wuhan", "Chengdu", "CAS ", "Chinese Academy"],
    "Germany": ["Germany", "Deutschland", "Berlin", "Munich", "Hamburg", "Frankfurt",
                "Heidelberg", "DLR", "Max Planck", "Jülich", "Karlsruhe",
                "Forschungszentrum"],
    "France": ["France", "Paris", "Toulouse", "Lyon", "CNRS", "CNES", "Sorbonne",
               "École Polytechnique", "INRAE", "Météo-France"],
    "United Kingdom": ["United Kingdom", "UK", "England", "Scotland", "Wales",
                       "London", "Oxford", "Cambridge", "Edinburgh", "Manchester",
                       "Imperial College", "UCL"],
    "Japan": ["Japan", "Tokyo", "Kyoto", "Osaka", "Tohoku", "JAXA", "NIES",
              "National Institute for Environmental Studies"],
    "Netherlands": ["Netherlands", "Holland", "Amsterdam", "Utrecht", "Delft", "KNMI",
                    "TNO", "Wageningen"],
    "Switzerland": ["Switzerland", "Bern", "Zurich", "Zürich", "Geneva", "Basel",
                    "ETH ", "EMPA"],
    "Canada": ["Canada", "Canadian", "Toronto", "Montreal", "Vancouver", "Ottawa",
               "Environment and Climate Change Canada", "ECCC"],
    "Australia": ["Australia", "Sydney", "Melbourne", "Brisbane", "Canberra",
                  "CSIRO", "Bureau of Meteorology", "BoM"],
    "Italy": ["Italy", "Rome", "Milan", "Bologna", "Naples", "INGV", "CNR"],
    "South Korea": ["South Korea", "Korea", "Seoul", "Yonsei", "KAIST", "POSTECH",
                    "Korea Institute", "KIST"],
    "Belgium": ["Belgium", "Brussels", "Liège", "Ghent", "Leuven", "ULiège",
                "Royal Belgian Institute"],
    "Norway": ["Norway", "Oslo", "Bergen", "NILU", "CICERO"],
    "Sweden": ["Sweden", "Stockholm", "Gothenburg", "Uppsala", "Chalmers", "SMHI"],
    "Denmark": ["Denmark", "Copenhagen", "Aarhus", "DTU"],
    "Austria": ["Austria", "Vienna", "Wien", "ZAMG"],
    "Finland": ["Finland", "Helsinki", "FMI", "Finnish Meteorological"],
    "Spain": ["Spain", "Madrid", "Barcelona", "Valencia", "AEMET"],
    "Brazil": ["Brazil", "Brasil", "São Paulo", "Rio de Janeiro", "INPE"],
    "India": ["India", "Mumbai", "Delhi", "Bangalore", "IIT ", "ISRO", "IIST",
              "Space Applications Centre"],
    "New Zealand": ["New Zealand", "Auckland", "Wellington", "NIWA"],
}


def extract_country(affiliation_text):
    if not affiliation_text:
        return None
    for country, patterns in COUNTRY_PATTERNS.items():
        for pat in patterns:
            if re.search(r'\b' + re.escape(pat.strip()) + r'\b', affiliation_text, re.I):
                return country
    return None


# ---------------------------------------------------------------------------
# Crossref fetch
# ---------------------------------------------------------------------------

def fetch_crossref(doi, email):
    url = CROSSREF_URL.format(doi=doi)
    headers = {"User-Agent": f"science-model-dashboard/1.0 (mailto:{email})"}
    for attempt in range(MAX_RETRIES):
        try:
            r = requests.get(url, headers=headers, timeout=TIMEOUT)
            if r.status_code == 200:
                return r.json().get("message", {})
            if r.status_code == 404:
                return None  # DOI not found
            time.sleep(2 ** attempt)
        except requests.RequestException:
            time.sleep(2 ** attempt)
    return None


def extract_geo_from_crossref(msg):
    """Return (primary_country, [institution_names]) from Crossref message."""
    if not msg:
        return None, []

    institutions = []
    countries = []

    for author in msg.get("author", []):
        for aff in author.get("affiliation", []):
            name = aff.get("name", "")
            if name:
                institutions.append(name)
                c = extract_country(name)
                if c:
                    countries.append(c)

    # Deduplicate
    institutions = list(dict.fromkeys(institutions))
    countries = list(dict.fromkeys(countries))

    primary = countries[0] if countries else None
    return primary, institutions


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="TROPESS")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--rerun", action="store_true", help="Re-fetch even already-cached DOIs")
    args = parser.parse_args()

    data_file = Path(__file__).parent.parent / "public" / "data" / f"{args.model}_analyzed.json"
    if not data_file.exists():
        sys.exit(f"Data file not found: {data_file}")

    with open(data_file) as f:
        data = json.load(f)

    # Load cache
    cache = {}
    if CACHE_FILE.exists() and not args.rerun:
        with open(CACHE_FILE) as f:
            cache = json.load(f)
        print(f"Loaded {len(cache)} cached DOI lookups")

    # Identify papers to fetch
    todo = []
    for p in data:
        doi = p.get("doi")
        if not doi:
            continue
        already_has_country = p.get("country") and p["country"] not in ("", "None", "null")
        if (not already_has_country or args.rerun) and doi not in cache:
            todo.append(p)

    print(f"Total: {len(data)} | Already enriched: {len(data)-len(todo)} | To fetch: {len(todo)}")

    if args.dry_run:
        print(f"Dry-run: would fetch {len(todo)} DOIs from Crossref")
        if todo:
            print("First DOI:", todo[0].get("doi"))
        return

    # Fetch
    for i, paper in enumerate(todo):
        doi = paper["doi"]
        if i % 50 == 0:
            print(f"  Progress: {i}/{len(todo)}...")
        msg = fetch_crossref(doi, CROSSREF_EMAIL)
        primary_country, institutions = extract_geo_from_crossref(msg)
        cache[doi] = {"country": primary_country, "institutions": institutions}
        time.sleep(SLEEP)

    # Save cache
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)
    print(f"Cache saved: {len(cache)} DOIs")

    # Apply to data
    enriched = 0
    for p in data:
        doi = p.get("doi")
        if doi and doi in cache:
            result = cache[doi]
            if result.get("country"):
                p["country"] = result["country"]
                enriched += 1
            if result.get("institutions"):
                p["institutions"] = result["institutions"]

    from collections import Counter
    countries = Counter(p.get("country") for p in data if p.get("country"))
    print(f"Enriched: {enriched} papers now have country")
    print("Top countries:", dict(countries.most_common(10)))

    with open(data_file, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Saved {data_file}")


if __name__ == "__main__":
    main()
