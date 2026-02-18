#!/usr/bin/env python3
"""
Fetch missing venue/journal info for all model citation papers.
Uses Crossref API (for DOIs) and Semantic Scholar batch API (for paper_ids).
"""

import asyncio
import aiohttp
import json
import os
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "src" / "data"
CACHE_FILE = Path(__file__).parent / "venue_cache.json"

CROSSREF_CONCURRENCY = 15
CROSSREF_DELAY = 0.05
S2_BATCH_SIZE = 500
S2_DELAY = 1.0
CROSSREF_EMAIL = "science-model-dashboard@example.com"

ALL_MODELS = ['RAPID', 'CARDAMOM', 'CMS-Flux', 'ECCO', 'ISSM', 'MOMO-CHEM', 'LES', 'EDMF']


def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)


def entry_has_venue(d):
    v = d.get('venue') or ''
    ct = d.get('container-title', [])
    if isinstance(ct, list) and ct:
        v = ct[0]
    elif isinstance(ct, str):
        v = ct
    return bool(v.strip())


async def fetch_crossref_venue(session, doi, semaphore):
    async with semaphore:
        url = f"https://api.crossref.org/works/{doi}"
        headers = {"User-Agent": f"ScienceModelDashboard/1.0 (mailto:{CROSSREF_EMAIL})"}
        try:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    msg = data.get("message", {})
                    container = msg.get("container-title", [])
                    if container:
                        return doi, container[0]
                    short = msg.get("short-container-title", [])
                    if short:
                        return doi, short[0]
                elif resp.status == 429:
                    await asyncio.sleep(2)
                    return doi, "__RETRY__"
                return doi, None
        except (asyncio.TimeoutError, aiohttp.ClientError):
            return doi, "__RETRY__"


async def fetch_crossref_venues(dois, cache):
    to_fetch = [doi for doi in dois if f"cr:{doi}" not in cache]
    print(f"  Crossref: {len(to_fetch)} DOIs to fetch ({len(dois) - len(to_fetch)} cached)")
    if not to_fetch:
        return cache

    semaphore = asyncio.Semaphore(CROSSREF_CONCURRENCY)
    connector = aiohttp.TCPConnector(limit=CROSSREF_CONCURRENCY)

    async with aiohttp.ClientSession(connector=connector) as session:
        chunk_size = 200
        retries = []
        for i in range(0, len(to_fetch), chunk_size):
            chunk = to_fetch[i:i + chunk_size]
            tasks = [fetch_crossref_venue(session, doi, semaphore) for doi in chunk]
            results = await asyncio.gather(*tasks)
            for doi, venue in results:
                if venue == "__RETRY__":
                    retries.append(doi)
                elif venue:
                    cache[f"cr:{doi}"] = venue
                else:
                    cache[f"cr:{doi}"] = ""
            done = min(i + chunk_size, len(to_fetch))
            found = sum(1 for doi in chunk if cache.get(f"cr:{doi}", "") != "")
            print(f"    {done}/{len(to_fetch)} (found {found}/{len(chunk)})")
            if done % 1000 == 0:
                save_cache(cache)
            await asyncio.sleep(CROSSREF_DELAY)

        if retries:
            print(f"    Retrying {len(retries)} failed...")
            await asyncio.sleep(3)
            tasks = [fetch_crossref_venue(session, doi, semaphore) for doi in retries]
            results = await asyncio.gather(*tasks)
            for doi, venue in results:
                if venue and venue != "__RETRY__":
                    cache[f"cr:{doi}"] = venue
                else:
                    cache[f"cr:{doi}"] = ""

    save_cache(cache)
    return cache


async def fetch_s2_venues(paper_ids, cache):
    to_fetch = [pid for pid in paper_ids if f"s2:{pid}" not in cache]
    print(f"  Semantic Scholar: {len(to_fetch)} paper_ids to fetch ({len(paper_ids) - len(to_fetch)} cached)")
    if not to_fetch:
        return cache

    async with aiohttp.ClientSession() as session:
        for i in range(0, len(to_fetch), S2_BATCH_SIZE):
            batch = to_fetch[i:i + S2_BATCH_SIZE]
            url = "https://api.semanticscholar.org/graph/v1/paper/batch"
            payload = {"ids": batch}
            params = {"fields": "venue,journal"}
            try:
                async with session.post(url, json=payload, params=params,
                                        timeout=aiohttp.ClientTimeout(total=60)) as resp:
                    if resp.status == 200:
                        results = await resp.json()
                        for pid, result in zip(batch, results):
                            if result is None:
                                cache[f"s2:{pid}"] = ""
                                continue
                            venue = result.get("venue", "")
                            if not venue:
                                journal = result.get("journal", {})
                                if journal:
                                    venue = journal.get("name", "")
                            cache[f"s2:{pid}"] = venue or ""
                    elif resp.status == 429:
                        print(f"    S2 rate limited, waiting 10s...")
                        await asyncio.sleep(10)
                        continue
                    else:
                        for pid in batch:
                            cache[f"s2:{pid}"] = ""
            except (asyncio.TimeoutError, aiohttp.ClientError) as e:
                print(f"    S2 error: {e}")
                for pid in batch:
                    cache[f"s2:{pid}"] = ""

            done = min(i + S2_BATCH_SIZE, len(to_fetch))
            found = sum(1 for pid in batch if cache.get(f"s2:{pid}", "") != "")
            print(f"    {done}/{len(to_fetch)} (found {found}/{len(batch)})")
            save_cache(cache)
            await asyncio.sleep(S2_DELAY)

    return cache


async def process_model(model, cache):
    path = DATA_DIR / f"{model}_analyzed.json"
    with open(path) as f:
        data = json.load(f)

    missing = [d for d in data if not entry_has_venue(d)]
    if not missing:
        print(f"\n{model}: All {len(data)} entries have venue info")
        return cache

    doi_lookups = [d for d in missing if (d.get('doi') or d.get('DOI') or '').strip()]
    pid_lookups = [d for d in missing
                   if not (d.get('doi') or d.get('DOI') or '').strip()
                   and (d.get('paper_id') or '').strip()]

    print(f"\n{model}: {len(data)} entries, {len(missing)} missing venue "
          f"(DOI: {len(doi_lookups)}, paper_id: {len(pid_lookups)})")

    # Crossref lookups
    dois = [(d.get('doi') or d.get('DOI', '')).strip() for d in doi_lookups]
    cache = await fetch_crossref_venues(dois, cache)

    # Semantic Scholar lookups
    pids = [d['paper_id'].strip() for d in pid_lookups]
    cache = await fetch_s2_venues(pids, cache)

    # Apply results
    updated = 0
    for entry in data:
        if entry_has_venue(entry):
            continue
        doi = (entry.get('doi') or entry.get('DOI') or '').strip()
        pid = (entry.get('paper_id') or '').strip()
        venue = None
        if doi and cache.get(f"cr:{doi}"):
            venue = cache[f"cr:{doi}"]
        elif pid and cache.get(f"s2:{pid}"):
            venue = cache[f"s2:{pid}"]
        if venue:
            entry['venue'] = venue
            updated += 1

    still_missing = sum(1 for d in data if not entry_has_venue(d))
    print(f"  Updated {updated} entries, {still_missing} still missing")

    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

    return cache


async def main():
    models = sys.argv[1:] if len(sys.argv) > 1 else [m for m in ALL_MODELS if m != 'ECCO']
    cache = load_cache()
    print(f"Cache: {len(cache)} entries")

    for model in models:
        cache = await process_model(model, cache)

    print(f"\nDone. Cache: {len(cache)} entries")


if __name__ == "__main__":
    asyncio.run(main())
