#!/usr/bin/env python3
"""
Fetch missing abstracts for all model citation papers.
Uses Semantic Scholar batch API (supports both DOIs and paper_ids) as primary source,
with Crossref API as fallback for DOIs that S2 doesn't cover.
"""

import asyncio
import aiohttp
import json
import sys
import time
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
CACHE_FILE = Path(__file__).parent / "abstract_cache.json"

ALL_MODELS = ['RAPID', 'CARDAMOM', 'CMS-Flux', 'ECCO', 'ISSM', 'MOMO-CHEM', 'LES', 'EDMF']

S2_BATCH_SIZE = 500
S2_DELAY = 1.1  # Semantic Scholar rate limit: 1 req/sec for batch
CROSSREF_CONCURRENCY = 15
CROSSREF_DELAY = 0.05
CROSSREF_EMAIL = "science-model-dashboard@example.com"


def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)


def entry_needs_abstract(d):
    return not (d.get('abstract') or '').strip()


def get_entry_id(d):
    """Get the best identifier for an entry: DOI preferred, then paper_id."""
    doi = (d.get('doi') or d.get('DOI') or '').strip()
    pid = (d.get('paper_id') or '').strip()
    return doi, pid


async def fetch_s2_batch_abstracts(session, ids, cache):
    """Fetch abstracts from Semantic Scholar batch API.
    ids: list of S2-compatible identifiers (DOI:xxx or paper_id)
    """
    url = "https://api.semanticscholar.org/graph/v1/paper/batch"
    params = {"fields": "abstract,externalIds"}

    fetched = 0
    for i in range(0, len(ids), S2_BATCH_SIZE):
        batch = ids[i:i + S2_BATCH_SIZE]
        payload = {"ids": batch}
        try:
            async with session.post(url, json=payload, params=params,
                                    timeout=aiohttp.ClientTimeout(total=120)) as resp:
                if resp.status == 200:
                    results = await resp.json()
                    for identifier, result in zip(batch, results):
                        cache_key = f"s2:{identifier}"
                        if result is None:
                            cache[cache_key] = ""
                            continue
                        abstract = (result.get("abstract") or "").strip()
                        cache[cache_key] = abstract
                        if abstract:
                            fetched += 1
                elif resp.status == 429:
                    print(f"    S2 rate limited at batch {i}, waiting 10s...")
                    await asyncio.sleep(10)
                    # Retry this batch
                    try:
                        async with session.post(url, json=payload, params=params,
                                                timeout=aiohttp.ClientTimeout(total=120)) as resp2:
                            if resp2.status == 200:
                                results = await resp2.json()
                                for identifier, result in zip(batch, results):
                                    cache_key = f"s2:{identifier}"
                                    if result is None:
                                        cache[cache_key] = ""
                                        continue
                                    abstract = (result.get("abstract") or "").strip()
                                    cache[cache_key] = abstract
                                    if abstract:
                                        fetched += 1
                            else:
                                print(f"    S2 retry failed: {resp2.status}")
                                for identifier in batch:
                                    cache[f"s2:{identifier}"] = ""
                    except Exception as e:
                        print(f"    S2 retry error: {e}")
                        for identifier in batch:
                            cache[f"s2:{identifier}"] = ""
                else:
                    text = await resp.text()
                    print(f"    S2 error {resp.status}: {text[:200]}")
                    for identifier in batch:
                        cache[f"s2:{identifier}"] = ""
        except (asyncio.TimeoutError, aiohttp.ClientError) as e:
            print(f"    S2 batch error: {e}")
            for identifier in batch:
                cache[f"s2:{identifier}"] = ""

        done = min(i + S2_BATCH_SIZE, len(ids))
        if done % 2000 == 0 or done == len(ids):
            print(f"    S2: {done}/{len(ids)} processed, {fetched} abstracts found")
            save_cache(cache)

        await asyncio.sleep(S2_DELAY)

    return fetched


async def fetch_crossref_abstract(session, doi, semaphore):
    """Fetch abstract from Crossref for a single DOI."""
    async with semaphore:
        url = f"https://api.crossref.org/works/{doi}"
        headers = {"User-Agent": f"ScienceModelDashboard/1.0 (mailto:{CROSSREF_EMAIL})"}
        try:
            async with session.get(url, headers=headers,
                                   timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    msg = data.get("message", {})
                    abstract = (msg.get("abstract") or "").strip()
                    return doi, abstract
                elif resp.status == 429:
                    await asyncio.sleep(2)
                    return doi, "__RETRY__"
                return doi, ""
        except (asyncio.TimeoutError, aiohttp.ClientError):
            return doi, "__RETRY__"


async def fetch_crossref_abstracts(dois, cache):
    """Fetch abstracts from Crossref API for DOIs not found in S2."""
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
            tasks = [fetch_crossref_abstract(session, doi, semaphore) for doi in chunk]
            results = await asyncio.gather(*tasks)
            for doi, abstract in results:
                if abstract == "__RETRY__":
                    retries.append(doi)
                else:
                    cache[f"cr:{doi}"] = abstract
                    if abstract:
                        fetched += 1

            done = min(i + chunk_size, len(to_fetch))
            if done % 1000 == 0 or done == len(to_fetch):
                found = sum(1 for doi in to_fetch[:done]
                            if cache.get(f"cr:{doi}", "") != "" and f"cr:{doi}" in cache)
                print(f"    Crossref: {done}/{len(to_fetch)} processed, {found} found")
                save_cache(cache)
            await asyncio.sleep(CROSSREF_DELAY)

        if retries:
            print(f"    Retrying {len(retries)} failed Crossref requests...")
            await asyncio.sleep(3)
            tasks = [fetch_crossref_abstract(session, doi, semaphore) for doi in retries]
            results = await asyncio.gather(*tasks)
            for doi, abstract in results:
                if abstract and abstract != "__RETRY__":
                    cache[f"cr:{doi}"] = abstract
                    fetched += 1
                else:
                    cache[f"cr:{doi}"] = ""

    save_cache(cache)
    return fetched


async def process_all_models(models):
    cache = load_cache()
    print(f"Cache: {len(cache)} entries")

    # Collect all entries needing abstracts across all models
    model_data = {}
    doi_ids = []  # S2-format: "DOI:10.xxx/yyy"
    pid_ids = []  # raw paper_ids
    doi_set = set()
    pid_set = set()

    for model in models:
        path = DATA_DIR / f"{model}_analyzed.json"
        with open(path) as f:
            data = json.load(f)
        model_data[model] = data

        missing = 0
        for d in data:
            if not entry_needs_abstract(d):
                continue
            doi, pid = get_entry_id(d)
            if doi and doi.lower() not in doi_set:
                doi_set.add(doi.lower())
                doi_ids.append(f"DOI:{doi}")
                missing += 1
            elif pid and pid not in pid_set:
                pid_set.add(pid)
                pid_ids.append(pid)
                missing += 1

        total_missing = sum(1 for d in data if entry_needs_abstract(d))
        total = len(data)
        print(f"{model}: {total_missing}/{total} missing abstracts ({100*(total-total_missing)/total:.1f}% coverage)")

    # Filter out already-cached entries
    doi_ids_to_fetch = [did for did in doi_ids if f"s2:{did}" not in cache]
    pid_ids_to_fetch = [pid for pid in pid_ids if f"s2:{pid}" not in cache]

    print(f"\nTotal unique identifiers: {len(doi_ids)} DOIs + {len(pid_ids)} paper_ids")
    print(f"To fetch from S2: {len(doi_ids_to_fetch)} DOIs + {len(pid_ids_to_fetch)} paper_ids "
          f"({len(doi_ids) + len(pid_ids) - len(doi_ids_to_fetch) - len(pid_ids_to_fetch)} cached)")

    # Phase 1: Semantic Scholar batch API
    print("\n--- Phase 1: Semantic Scholar batch API ---")
    all_s2_ids = doi_ids_to_fetch + pid_ids_to_fetch
    if all_s2_ids:
        async with aiohttp.ClientSession() as session:
            s2_found = await fetch_s2_batch_abstracts(session, all_s2_ids, cache)
        print(f"S2 found: {s2_found} abstracts")
    else:
        print("All entries already cached from S2")

    # Phase 2: Crossref fallback for DOIs where S2 had no abstract
    print("\n--- Phase 2: Crossref fallback ---")
    dois_for_crossref = []
    for did in doi_ids:
        doi = did.replace("DOI:", "")
        s2_key = f"s2:{did}"
        if s2_key in cache and cache[s2_key] == "":
            # S2 didn't have abstract, try Crossref
            dois_for_crossref.append(doi)

    if dois_for_crossref:
        cr_found = await fetch_crossref_abstracts(dois_for_crossref, cache)
        print(f"Crossref found: {cr_found} additional abstracts")
    else:
        print("No DOIs need Crossref fallback")

    # Apply results to each model
    print("\n--- Applying results ---")
    for model in models:
        data = model_data[model]
        updated = 0
        for d in data:
            if not entry_needs_abstract(d):
                continue
            doi, pid = get_entry_id(d)
            abstract = None

            # Try S2 by DOI first
            if doi:
                s2_key = f"s2:DOI:{doi}"
                abstract = cache.get(s2_key, "")
                # Fallback to Crossref
                if not abstract:
                    cr_key = f"cr:{doi}"
                    abstract = cache.get(cr_key, "")

            # Try S2 by paper_id
            if not abstract and pid:
                s2_key = f"s2:{pid}"
                abstract = cache.get(s2_key, "")

            if abstract:
                d['abstract'] = abstract
                updated += 1

        if updated > 0:
            path = DATA_DIR / f"{model}_analyzed.json"
            with open(path, 'w') as f:
                json.dump(data, f, indent=2)

        total = len(data)
        still_missing = sum(1 for d in data if entry_needs_abstract(d))
        pct = 100 * (total - still_missing) / total
        print(f"  {model}: +{updated} abstracts, {still_missing} still missing ({pct:.1f}% coverage)")

    save_cache(cache)
    print(f"\nDone. Cache: {len(cache)} entries")


async def main():
    models = sys.argv[1:] if len(sys.argv) > 1 else ALL_MODELS
    await process_all_models(models)


if __name__ == "__main__":
    asyncio.run(main())
