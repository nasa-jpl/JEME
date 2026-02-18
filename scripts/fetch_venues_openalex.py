#!/usr/bin/env python3
"""
Fetch missing venue/journal info using OpenAlex API.
OpenAlex supports batch DOI lookups via filter and has good coverage of DOIs
that Crossref may not resolve (preprints, newer publications).
Also tries Semantic Scholar paper_id -> DOI -> OpenAlex for paper_id-only entries.
"""

import asyncio
import aiohttp
import json
import os
import sys
from pathlib import Path
from urllib.parse import quote

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
ALL_MODELS = ['RAPID', 'CARDAMOM', 'CMS-Flux', 'ECCO', 'ISSM', 'MOMO-CHEM', 'LES', 'EDMF']

OPENALEX_CONCURRENCY = 10
OPENALEX_EMAIL = "science-model-dashboard@example.com"


def entry_has_venue(d):
    v = d.get('venue') or ''
    ct = d.get('container-title', [])
    if isinstance(ct, list) and ct:
        v = ct[0]
    elif isinstance(ct, str):
        v = ct
    return bool(v.strip())


async def fetch_openalex_batch(session, dois, semaphore):
    """Fetch venues for a batch of DOIs using OpenAlex filter API."""
    async with semaphore:
        # OpenAlex allows filtering by multiple DOIs with pipe separator
        doi_filter = "|".join(f"https://doi.org/{doi}" for doi in dois)
        url = "https://api.openalex.org/works"
        params = {
            "filter": f"doi:{doi_filter}",
            "select": "doi,primary_location",
            "per_page": len(dois),
            "mailto": OPENALEX_EMAIL,
        }
        try:
            async with session.get(url, params=params,
                                   timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    results = {}
                    for work in data.get("results", []):
                        doi = (work.get("doi") or "").replace("https://doi.org/", "")
                        loc = work.get("primary_location") or {}
                        src = loc.get("source") or {}
                        venue = src.get("display_name", "")
                        if doi and venue:
                            results[doi.lower()] = venue
                    return results
                elif resp.status == 429:
                    await asyncio.sleep(2)
                    return {}
                else:
                    return {}
        except (asyncio.TimeoutError, aiohttp.ClientError):
            return {}


async def fetch_openalex_by_pid(session, paper_ids, semaphore):
    """Try to find venues for Semantic Scholar paper_ids via OpenAlex.
    Uses the openalex search by title as fallback."""
    # Not efficient for bulk - skip for now, paper_id-only entries
    # were already tried via S2 batch API
    return {}


async def process_all_models(models):
    # Collect all missing DOIs across models
    model_data = {}
    all_dois = []

    for model in models:
        path = DATA_DIR / f"{model}_analyzed.json"
        with open(path) as f:
            data = json.load(f)
        model_data[model] = data

        missing = 0
        for d in data:
            if entry_has_venue(d):
                continue
            doi = (d.get('doi') or d.get('DOI') or '').strip()
            if doi:
                all_dois.append(doi)
                missing += 1

        total_missing = sum(1 for d in data if not entry_has_venue(d))
        print(f"{model}: {total_missing} missing venue ({missing} with DOI)")

    # Deduplicate DOIs
    unique_dois = list(set(d.lower() for d in all_dois))
    print(f"\nTotal unique DOIs to look up: {len(unique_dois)}")

    # Fetch from OpenAlex in batches of 25 (API limit for filter)
    semaphore = asyncio.Semaphore(OPENALEX_CONCURRENCY)
    connector = aiohttp.TCPConnector(limit=OPENALEX_CONCURRENCY)
    venue_map = {}  # doi -> venue

    async with aiohttp.ClientSession(connector=connector) as session:
        batch_size = 25
        for i in range(0, len(unique_dois), batch_size):
            batch = unique_dois[i:i + batch_size]
            results = await fetch_openalex_batch(session, batch, semaphore)
            venue_map.update(results)

            done = min(i + batch_size, len(unique_dois))
            if done % 200 == 0 or done == len(unique_dois):
                found_so_far = len(venue_map)
                print(f"  {done}/{len(unique_dois)} processed, {found_so_far} found")

            await asyncio.sleep(0.1)  # Rate limit: ~10 req/sec

    print(f"\nOpenAlex found venues for {len(venue_map)} DOIs")

    # Apply results to each model
    for model in models:
        data = model_data[model]
        updated = 0
        for d in data:
            if entry_has_venue(d):
                continue
            doi = (d.get('doi') or d.get('DOI') or '').strip().lower()
            if doi and doi in venue_map:
                d['venue'] = venue_map[doi]
                updated += 1

        if updated > 0:
            path = DATA_DIR / f"{model}_analyzed.json"
            with open(path, 'w') as f:
                json.dump(data, f, indent=2)

        still_missing = sum(1 for d in data if not entry_has_venue(d))
        pct = 100 * (len(data) - still_missing) / len(data)
        print(f"  {model}: +{updated} venues, {still_missing} still missing ({pct:.1f}% coverage)")


async def main():
    models = sys.argv[1:] if len(sys.argv) > 1 else ALL_MODELS
    await process_all_models(models)


if __name__ == "__main__":
    asyncio.run(main())
