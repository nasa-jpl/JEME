#!/usr/bin/env python3
"""
Fetch missing/zero citation counts for all model citation papers.
Uses Semantic Scholar batch API (primary), Crossref (fallback), and OpenAlex (tertiary).

Usage:
    python3 scripts/fetch_citation_counts.py                  # All models
    python3 scripts/fetch_citation_counts.py --model ECCO     # Single model
    python3 scripts/fetch_citation_counts.py --dry-run        # Preview only
    python3 scripts/fetch_citation_counts.py --model ECCO --dry-run
"""

import asyncio
import aiohttp
import json
import sys
import time
import requests
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "public" / "data"
CACHE_FILE = Path(__file__).parent / "citation_count_cache.json"

ALL_MODELS = ['RAPID', 'CARDAMOM', 'CMS-Flux', 'ECCO', 'ISSM', 'MOMO-CHEM', 'LES', 'EDMF']

S2_BATCH_SIZE = 500
S2_DELAY = 1.1  # Semantic Scholar rate limit: 1 req/sec for batch
CROSSREF_CONCURRENCY = 15
CROSSREF_DELAY = 0.05
OPENALEX_BATCH_SIZE = 50
OPENALEX_DELAY = 0.1
CROSSREF_EMAIL = "science-model-dashboard@example.com"
OPENALEX_EMAIL = "science-model-dashboard@example.com"


def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)


def entry_needs_enrichment(d):
    """Check if entry has zero or missing citation count."""
    cc = d.get('citation_count')
    irbc = d.get('is-referenced-by-count')
    # Needs enrichment if both are falsy (0, None, missing)
    return not cc and not irbc


def get_entry_id(d):
    """Get the best identifier for an entry: DOI and paper_id."""
    doi = (d.get('doi') or d.get('DOI') or '').strip()
    pid = (d.get('paper_id') or '').strip()
    return doi, pid


# --- Semantic Scholar ---

async def fetch_s2_batch_counts(session, ids, cache):
    """Fetch citation counts from Semantic Scholar batch API."""
    url = "https://api.semanticscholar.org/graph/v1/paper/batch"
    params = {"fields": "citationCount,externalIds"}

    fetched = 0
    for i in range(0, len(ids), S2_BATCH_SIZE):
        batch = ids[i:i + S2_BATCH_SIZE]
        payload = {"ids": batch}

        for attempt in range(2):
            try:
                async with session.post(url, json=payload, params=params,
                                        timeout=aiohttp.ClientTimeout(total=120)) as resp:
                    if resp.status == 200:
                        results = await resp.json()
                        for identifier, result in zip(batch, results):
                            cache_key = f"s2:{identifier}"
                            if result is None:
                                cache[cache_key] = 0
                                continue
                            count = result.get("citationCount") or 0
                            cache[cache_key] = count
                            if count > 0:
                                fetched += 1
                        break  # Success, exit retry loop
                    elif resp.status == 429:
                        print(f"    S2 rate limited at batch {i}, waiting 10s...")
                        await asyncio.sleep(10)
                        if attempt == 0:
                            continue  # Retry
                        else:
                            for identifier in batch:
                                cache[f"s2:{identifier}"] = 0
                    else:
                        text = await resp.text()
                        print(f"    S2 error {resp.status}: {text[:200]}")
                        for identifier in batch:
                            cache[f"s2:{identifier}"] = 0
                        break
            except (asyncio.TimeoutError, aiohttp.ClientError) as e:
                if attempt == 0:
                    print(f"    S2 batch error: {e}, retrying...")
                    await asyncio.sleep(5)
                else:
                    print(f"    S2 batch error on retry: {e}")
                    for identifier in batch:
                        cache[f"s2:{identifier}"] = 0

        done = min(i + S2_BATCH_SIZE, len(ids))
        if done % 2000 == 0 or done == len(ids):
            print(f"    S2: {done}/{len(ids)} processed, {fetched} counts found")
            save_cache(cache)

        await asyncio.sleep(S2_DELAY)

    return fetched


# --- Crossref ---

async def fetch_crossref_count(session, doi, semaphore):
    """Fetch citation count from Crossref for a single DOI."""
    async with semaphore:
        url = f"https://api.crossref.org/works/{doi}"
        headers = {"User-Agent": f"ScienceModelDashboard/1.0 (mailto:{CROSSREF_EMAIL})"}
        try:
            async with session.get(url, headers=headers,
                                   timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    msg = data.get("message", {})
                    count = msg.get("is-referenced-by-count", 0) or 0
                    return doi, count
                elif resp.status == 429:
                    await asyncio.sleep(2)
                    return doi, "__RETRY__"
                return doi, 0
        except (asyncio.TimeoutError, aiohttp.ClientError):
            return doi, "__RETRY__"


async def fetch_crossref_counts(dois, cache):
    """Fetch citation counts from Crossref for DOIs not found in S2."""
    to_fetch = [doi for doi in dois if f"cr:{doi}" not in cache]
    print(f"  Crossref: {len(to_fetch)} DOIs to fetch ({len(dois) - len(to_fetch)} cached)")
    if not to_fetch:
        return 0

    semaphore = asyncio.Semaphore(CROSSREF_CONCURRENCY)
    connector = aiohttp.TCPConnector(limit=CROSSREF_CONCURRENCY)
    fetched = 0

    async with aiohttp.ClientSession(connector=connector) as session:
        chunk_size = 200
        retries = []
        for i in range(0, len(to_fetch), chunk_size):
            chunk = to_fetch[i:i + chunk_size]
            tasks = [fetch_crossref_count(session, doi, semaphore) for doi in chunk]
            results = await asyncio.gather(*tasks)
            for doi, count in results:
                if count == "__RETRY__":
                    retries.append(doi)
                else:
                    cache[f"cr:{doi}"] = count
                    if count > 0:
                        fetched += 1

            done = min(i + chunk_size, len(to_fetch))
            if done % 1000 == 0 or done == len(to_fetch):
                print(f"    Crossref: {done}/{len(to_fetch)} processed, {fetched} counts found")
                save_cache(cache)
            await asyncio.sleep(CROSSREF_DELAY)

        if retries:
            print(f"    Retrying {len(retries)} failed Crossref requests...")
            await asyncio.sleep(3)
            tasks = [fetch_crossref_count(session, doi, semaphore) for doi in retries]
            results = await asyncio.gather(*tasks)
            for doi, count in results:
                if isinstance(count, int) and count > 0:
                    cache[f"cr:{doi}"] = count
                    fetched += 1
                else:
                    cache[f"cr:{doi}"] = 0

    save_cache(cache)
    return fetched


# --- OpenAlex ---

def fetch_openalex_counts(dois, cache):
    """Fetch citation counts from OpenAlex for DOIs not covered by S2/Crossref."""
    to_fetch = [doi for doi in dois if f"oa:{doi}" not in cache]
    print(f"  OpenAlex: {len(to_fetch)} DOIs to fetch ({len(dois) - len(to_fetch)} cached)")
    if not to_fetch:
        return 0

    session = requests.Session()
    session.headers['Accept-Encoding'] = 'gzip, deflate'
    fetched = 0

    for i in range(0, len(to_fetch), OPENALEX_BATCH_SIZE):
        batch = to_fetch[i:i + OPENALEX_BATCH_SIZE]
        doi_filter = "|".join(f"https://doi.org/{d}" for d in batch)
        params = {
            "filter": f"doi:{doi_filter}",
            "select": "doi,cited_by_count",
            "per_page": OPENALEX_BATCH_SIZE,
            "mailto": OPENALEX_EMAIL,
        }

        try:
            resp = session.get("https://api.openalex.org/works", params=params, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                result_map = {}
                for work in data.get("results", []):
                    doi = (work.get("doi") or "").replace("https://doi.org/", "")
                    count = work.get("cited_by_count", 0) or 0
                    if doi:
                        result_map[doi.lower()] = count

                for doi in batch:
                    count = result_map.get(doi.lower(), 0)
                    cache[f"oa:{doi}"] = count
                    if count > 0:
                        fetched += 1
            elif resp.status_code == 429:
                print(f"    OpenAlex rate limited at batch {i}, waiting 5s...")
                time.sleep(5)
                continue  # Will retry next run
            else:
                print(f"    OpenAlex error {resp.status_code} at batch {i}")
                for doi in batch:
                    cache[f"oa:{doi}"] = 0
        except requests.RequestException as e:
            print(f"    OpenAlex request error: {e}")
            for doi in batch:
                cache[f"oa:{doi}"] = 0

        done = min(i + OPENALEX_BATCH_SIZE, len(to_fetch))
        if done % 500 == 0 or done == len(to_fetch):
            print(f"    OpenAlex: {done}/{len(to_fetch)} processed, {fetched} counts found")
            save_cache(cache)

        time.sleep(OPENALEX_DELAY)

    save_cache(cache)
    return fetched


# --- Main orchestration ---

async def process_all_models(models, dry_run=False):
    cache = load_cache()
    print(f"Cache: {len(cache)} entries")

    # Collect all entries needing enrichment across all models
    model_data = {}
    all_pids = []      # S2 paper_ids
    all_doi_pids = []  # S2 DOI-format ids
    pid_set = set()
    doi_set = set()

    for model in models:
        path = DATA_DIR / f"{model}_analyzed.json"
        with open(path) as f:
            data = json.load(f)
        model_data[model] = data

        missing = sum(1 for d in data if entry_needs_enrichment(d))
        total = len(data)
        print(f"{model}: {missing}/{total} need citation count enrichment "
              f"({100 * (total - missing) / total:.1f}% have counts)")

    if dry_run:
        # Count what we'd need to fetch
        total_need = sum(
            sum(1 for d in data if entry_needs_enrichment(d))
            for data in model_data.values()
        )
        total_papers = sum(len(data) for data in model_data.values())
        print(f"\n--- DRY RUN ---")
        print(f"Total papers needing enrichment: {total_need}/{total_papers} ({100*total_need/total_papers:.1f}%)")
        print(f"Would query Semantic Scholar batch API for paper_ids")
        print(f"Would fall back to Crossref for DOIs where S2 returns 0")
        print(f"Would fall back to OpenAlex for remaining DOIs")
        print(f"No files will be modified.")
        return

    # Build unique identifier lists
    for model in models:
        for d in model_data[model]:
            if not entry_needs_enrichment(d):
                continue
            doi, pid = get_entry_id(d)
            if pid and pid not in pid_set:
                pid_set.add(pid)
                all_pids.append(pid)
            if doi and doi.lower() not in doi_set:
                doi_set.add(doi.lower())
                all_doi_pids.append(f"DOI:{doi}")

    # Filter out already-cached entries
    pids_to_fetch = [pid for pid in all_pids if f"s2:{pid}" not in cache]
    dois_to_fetch = [did for did in all_doi_pids if f"s2:{did}" not in cache]

    print(f"\nUnique identifiers: {len(all_pids)} paper_ids, {len(all_doi_pids)} DOIs")
    print(f"To fetch from S2: {len(pids_to_fetch)} paper_ids + {len(dois_to_fetch)} DOIs "
          f"({len(all_pids) + len(all_doi_pids) - len(pids_to_fetch) - len(dois_to_fetch)} cached)")

    # Phase 1: Semantic Scholar batch API (paper_ids first, then DOIs)
    print("\n--- Phase 1: Semantic Scholar batch API ---")
    all_s2_ids = pids_to_fetch + dois_to_fetch
    if all_s2_ids:
        async with aiohttp.ClientSession() as session:
            s2_found = await fetch_s2_batch_counts(session, all_s2_ids, cache)
        print(f"S2 total: {s2_found} citation counts found")
    else:
        print("All entries already cached from S2")

    # Phase 2: Crossref fallback for DOIs where S2 returned 0
    print("\n--- Phase 2: Crossref fallback ---")
    dois_for_crossref = []
    for did in all_doi_pids:
        doi = did.replace("DOI:", "")
        s2_key = f"s2:{did}"
        # Also check if we looked up by paper_id and got 0
        if s2_key in cache and cache[s2_key] == 0:
            dois_for_crossref.append(doi)

    if dois_for_crossref:
        cr_found = await fetch_crossref_counts(dois_for_crossref, cache)
        print(f"Crossref total: {cr_found} additional counts found")
    else:
        print("No DOIs need Crossref fallback")

    # Phase 3: OpenAlex for remaining DOIs where both S2 and Crossref returned 0
    print("\n--- Phase 3: OpenAlex fallback ---")
    dois_for_openalex = []
    for doi in dois_for_crossref:
        cr_key = f"cr:{doi}"
        if cr_key in cache and cache[cr_key] == 0:
            dois_for_openalex.append(doi)

    if dois_for_openalex:
        oa_found = fetch_openalex_counts(dois_for_openalex, cache)
        print(f"OpenAlex total: {oa_found} additional counts found")
    else:
        print("No DOIs need OpenAlex fallback")

    # Apply results to each model
    print("\n--- Applying results ---")
    grand_total_updated = 0
    for model in models:
        data = model_data[model]
        updated = 0
        for d in data:
            if not entry_needs_enrichment(d):
                continue
            doi, pid = get_entry_id(d)
            best_count = 0

            # Try S2 by paper_id
            if pid:
                s2_count = cache.get(f"s2:{pid}", 0)
                if s2_count > best_count:
                    best_count = s2_count

            # Try S2 by DOI
            if doi:
                s2_doi_count = cache.get(f"s2:DOI:{doi}", 0)
                if s2_doi_count > best_count:
                    best_count = s2_doi_count

                # Try Crossref
                cr_count = cache.get(f"cr:{doi}", 0)
                if cr_count > best_count:
                    best_count = cr_count

                # Try OpenAlex
                oa_count = cache.get(f"oa:{doi}", 0)
                if oa_count > best_count:
                    best_count = oa_count

            # Only update if we found a positive count
            if best_count > 0:
                d['citation_count'] = best_count
                updated += 1

        if updated > 0:
            path = DATA_DIR / f"{model}_analyzed.json"
            with open(path, 'w') as f:
                json.dump(data, f, indent=2)

        total = len(data)
        still_missing = sum(1 for d in data if entry_needs_enrichment(d))
        pct = 100 * (total - still_missing) / total
        print(f"  {model}: +{updated} enriched, {still_missing} still zero ({pct:.1f}% have counts)")
        grand_total_updated += updated

    save_cache(cache)
    print(f"\nDone. {grand_total_updated} papers enriched. Cache: {len(cache)} entries")


def parse_args():
    models = ALL_MODELS
    dry_run = False
    i = 1
    while i < len(sys.argv):
        if sys.argv[i] == '--dry-run':
            dry_run = True
        elif sys.argv[i] == '--model' and i + 1 < len(sys.argv):
            model = sys.argv[i + 1]
            if model not in ALL_MODELS:
                print(f"Unknown model: {model}")
                print(f"Available: {', '.join(ALL_MODELS)}")
                sys.exit(1)
            models = [model]
            i += 1
        else:
            print(f"Unknown argument: {sys.argv[i]}")
            print("Usage: python3 fetch_citation_counts.py [--model NAME] [--dry-run]")
            sys.exit(1)
        i += 1
    return models, dry_run


async def main():
    models, dry_run = parse_args()
    await process_all_models(models, dry_run=dry_run)


if __name__ == "__main__":
    asyncio.run(main())
