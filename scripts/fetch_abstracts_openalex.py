#!/usr/bin/env python3
"""
Fetch missing abstracts from OpenAlex API for DOIs not covered by S2/Crossref.
OpenAlex provides abstracts as inverted indexes which we reconstruct.
Uses synchronous requests to avoid aiohttp brotli issues.
"""

import json
import sys
import time
import requests
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
CACHE_FILE = Path(__file__).parent / "abstract_cache.json"
ALL_MODELS = ['RAPID', 'CARDAMOM', 'CMS-Flux', 'ECCO', 'ISSM', 'MOMO-CHEM', 'LES', 'EDMF']
OPENALEX_EMAIL = "science-model-dashboard@example.com"
BATCH_SIZE = 50  # OpenAlex filter limit


def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)


def reconstruct_abstract(inverted_index):
    """Reconstruct abstract text from OpenAlex inverted index format."""
    if not inverted_index:
        return ""
    positions = {}
    for word, idxs in inverted_index.items():
        for idx in idxs:
            positions[idx] = word
    if not positions:
        return ""
    return " ".join(positions[i] for i in sorted(positions))


def entry_needs_abstract(d):
    return not (d.get('abstract') or '').strip()


def main():
    cache = load_cache()
    print(f"Cache: {len(cache)} entries")

    # Find DOIs that have no abstract from S2 or Crossref
    empty_dois = []
    for k, v in cache.items():
        if k.startswith('cr:') and v == '':
            doi = k[3:]
            s2_key = f"s2:DOI:{doi}"
            if cache.get(s2_key, '') == '':
                if f"oa:{doi}" not in cache:
                    empty_dois.append(doi)

    print(f"DOIs with no abstract from S2/Crossref: {len(empty_dois)}")
    already_cached = sum(1 for d in empty_dois if f"oa:{d}" in cache)
    to_fetch = [d for d in empty_dois if f"oa:{d}" not in cache]
    print(f"To fetch from OpenAlex: {len(to_fetch)} ({already_cached} already cached)")

    if not to_fetch:
        print("Nothing to fetch")
        return

    session = requests.Session()
    session.headers['Accept-Encoding'] = 'gzip, deflate'
    found = 0

    for i in range(0, len(to_fetch), BATCH_SIZE):
        batch = to_fetch[i:i + BATCH_SIZE]
        doi_filter = "|".join(f"https://doi.org/{d}" for d in batch)
        params = {
            "filter": f"doi:{doi_filter}",
            "select": "doi,abstract_inverted_index",
            "per_page": BATCH_SIZE,
            "mailto": OPENALEX_EMAIL,
        }

        try:
            resp = session.get("https://api.openalex.org/works", params=params, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                result_map = {}
                for work in data.get("results", []):
                    doi = (work.get("doi") or "").replace("https://doi.org/", "")
                    aii = work.get("abstract_inverted_index")
                    abstract = reconstruct_abstract(aii)
                    if doi:
                        result_map[doi.lower()] = abstract

                for doi in batch:
                    abstract = result_map.get(doi.lower(), "")
                    cache[f"oa:{doi}"] = abstract
                    if abstract:
                        found += 1
            elif resp.status_code == 429:
                print(f"  Rate limited at {i}, waiting 5s...")
                time.sleep(5)
                # Don't cache - will retry next run
                continue
            else:
                print(f"  Error {resp.status_code} at batch {i}")
                for doi in batch:
                    cache[f"oa:{doi}"] = ""
        except requests.RequestException as e:
            print(f"  Request error: {e}")
            for doi in batch:
                cache[f"oa:{doi}"] = ""

        done = min(i + BATCH_SIZE, len(to_fetch))
        if done % 500 == 0 or done == len(to_fetch):
            print(f"  {done}/{len(to_fetch)} processed, {found} abstracts found")
            save_cache(cache)

        time.sleep(0.1)  # Rate limit: ~10 req/sec with polite pool

    save_cache(cache)
    print(f"\nOpenAlex found {found} abstracts")

    # Apply results to model data
    models = sys.argv[1:] if len(sys.argv) > 1 else ALL_MODELS
    print("\n--- Applying OpenAlex abstracts ---")
    for model in models:
        path = DATA_DIR / f"{model}_analyzed.json"
        with open(path) as f:
            data = json.load(f)

        updated = 0
        for d in data:
            if not entry_needs_abstract(d):
                continue
            doi = (d.get('doi') or d.get('DOI') or '').strip()
            if doi:
                oa_key = f"oa:{doi}"
                abstract = cache.get(oa_key, "")
                if abstract:
                    d['abstract'] = abstract
                    updated += 1

        if updated > 0:
            with open(path, 'w') as f:
                json.dump(data, f, indent=2)

        total = len(data)
        still_missing = sum(1 for d in data if entry_needs_abstract(d))
        pct = 100 * (total - still_missing) / total
        print(f"  {model}: +{updated} abstracts, {still_missing} still missing ({pct:.1f}% coverage)")

    print(f"\nDone. Cache: {len(cache)} entries")


if __name__ == "__main__":
    main()
