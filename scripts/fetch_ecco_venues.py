#!/usr/bin/env python3
"""
Fetch missing venue/journal info for ECCO citation papers.

Strategy:
1. Crossref API for entries with DOIs (individual async requests)
2. Semantic Scholar batch API for entries with paper_ids but no DOIs
3. Save progress incrementally to a cache file
4. Apply results back to the JSON data file
"""

import asyncio
import aiohttp
import json
import os
import sys
import time
from pathlib import Path

DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "ECCO_analyzed.json"
CACHE_FILE = Path(__file__).parent / "ecco_venue_cache.json"

# Rate limiting
CROSSREF_CONCURRENCY = 15  # concurrent requests
CROSSREF_DELAY = 0.05  # seconds between batches
S2_BATCH_SIZE = 500  # Semantic Scholar batch limit
S2_DELAY = 1.0  # seconds between S2 batch requests

CROSSREF_EMAIL = "science-model-dashboard@example.com"


def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)


async def fetch_crossref_venue(session, doi, semaphore):
    """Fetch venue from Crossref API for a single DOI."""
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
                    # Try short-container-title as fallback
                    short = msg.get("short-container-title", [])
                    if short:
                        return doi, short[0]
                elif resp.status == 404:
                    return doi, None
                elif resp.status == 429:
                    # Rate limited - wait and signal retry
                    await asyncio.sleep(2)
                    return doi, "__RETRY__"
                else:
                    return doi, None
        except (asyncio.TimeoutError, aiohttp.ClientError) as e:
            return doi, "__RETRY__"
    return doi, None


async def fetch_crossref_venues(dois, cache):
    """Fetch venues for all DOIs using Crossref API."""
    # Filter out already cached
    to_fetch = [doi for doi in dois if doi not in cache]
    print(f"Crossref: {len(to_fetch)} DOIs to fetch ({len(dois) - len(to_fetch)} cached)")

    if not to_fetch:
        return cache

    semaphore = asyncio.Semaphore(CROSSREF_CONCURRENCY)
    connector = aiohttp.TCPConnector(limit=CROSSREF_CONCURRENCY, limit_per_host=CROSSREF_CONCURRENCY)

    async with aiohttp.ClientSession(connector=connector) as session:
        # Process in chunks for progress reporting and cache saving
        chunk_size = 200
        total_fetched = 0
        retries = []

        for i in range(0, len(to_fetch), chunk_size):
            chunk = to_fetch[i:i + chunk_size]
            tasks = [fetch_crossref_venue(session, doi, semaphore) for doi in chunk]
            results = await asyncio.gather(*tasks)

            for doi, venue in results:
                if venue == "__RETRY__":
                    retries.append(doi)
                elif venue is not None:
                    cache[doi] = venue
                else:
                    cache[doi] = ""  # Mark as looked up but not found

            total_fetched += len(chunk)
            found = sum(1 for doi in chunk if cache.get(doi, "") != "")
            print(f"  Progress: {total_fetched}/{len(to_fetch)} "
                  f"(found {found}/{len(chunk)} in this batch)")

            # Save cache periodically
            if total_fetched % 1000 == 0 or total_fetched == len(to_fetch):
                save_cache(cache)

            await asyncio.sleep(CROSSREF_DELAY)

        # Retry failed requests (once)
        if retries:
            print(f"  Retrying {len(retries)} failed requests...")
            await asyncio.sleep(3)
            tasks = [fetch_crossref_venue(session, doi, semaphore) for doi in retries]
            results = await asyncio.gather(*tasks)
            for doi, venue in results:
                if venue and venue != "__RETRY__":
                    cache[doi] = venue
                else:
                    cache[doi] = ""

    save_cache(cache)
    return cache


async def fetch_s2_venues(paper_ids, cache):
    """Fetch venues for paper_ids using Semantic Scholar batch API."""
    # Filter out already cached (prefix with "s2:" to avoid DOI collisions)
    to_fetch = [pid for pid in paper_ids if f"s2:{pid}" not in cache]
    print(f"Semantic Scholar: {len(to_fetch)} paper_ids to fetch "
          f"({len(paper_ids) - len(to_fetch)} cached)")

    if not to_fetch:
        return cache

    async with aiohttp.ClientSession() as session:
        total_fetched = 0
        for i in range(0, len(to_fetch), S2_BATCH_SIZE):
            batch = to_fetch[i:i + S2_BATCH_SIZE]
            url = "https://api.semanticscholar.org/graph/v1/paper/batch"
            payload = {"ids": batch}
            params = {"fields": "venue,journal,externalIds"}

            try:
                async with session.post(
                    url, json=payload, params=params,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as resp:
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
                        print(f"  S2 rate limited, waiting 10s...")
                        await asyncio.sleep(10)
                        # Re-queue this batch
                        to_fetch[i:i] = batch  # reinsert
                        continue
                    else:
                        body = await resp.text()
                        print(f"  S2 error {resp.status}: {body[:200]}")
                        for pid in batch:
                            cache[f"s2:{pid}"] = ""
            except (asyncio.TimeoutError, aiohttp.ClientError) as e:
                print(f"  S2 request error: {e}")
                for pid in batch:
                    cache[f"s2:{pid}"] = ""

            total_fetched += len(batch)
            found = sum(1 for pid in batch if cache.get(f"s2:{pid}", "") != "")
            print(f"  Progress: {total_fetched}/{len(to_fetch)} "
                  f"(found {found}/{len(batch)} in this batch)")

            save_cache(cache)
            await asyncio.sleep(S2_DELAY)

    return cache


async def main():
    # Load data
    print(f"Loading {DATA_FILE}...")
    with open(DATA_FILE) as f:
        data = json.load(f)
    print(f"Total entries: {len(data)}")

    # Identify entries missing venue
    missing = [d for d in data if not d.get("venue") or d["venue"].strip() == ""]
    print(f"Missing venue: {len(missing)}")

    # Split by lookup strategy
    doi_lookups = [d for d in missing if d.get("doi") and d["doi"].strip()]
    pid_lookups = [d for d in missing
                   if (not d.get("doi") or not d["doi"].strip())
                   and d.get("paper_id") and d["paper_id"].strip()]

    print(f"  With DOI (Crossref lookup): {len(doi_lookups)}")
    print(f"  With paper_id only (S2 lookup): {len(pid_lookups)}")
    print(f"  No DOI or paper_id: {len(missing) - len(doi_lookups) - len(pid_lookups)}")

    # Load cache
    cache = load_cache()
    print(f"Cache entries: {len(cache)}")

    # Fetch from Crossref
    print("\n=== Crossref Lookups ===")
    dois = [d["doi"].strip() for d in doi_lookups]
    cache = await fetch_crossref_venues(dois, cache)

    # Fetch from Semantic Scholar
    print("\n=== Semantic Scholar Lookups ===")
    pids = [d["paper_id"].strip() for d in pid_lookups]
    cache = await fetch_s2_venues(pids, cache)

    # Apply results
    print("\n=== Applying Results ===")
    updated = 0
    for entry in data:
        if entry.get("venue") and entry["venue"].strip():
            continue  # Already has venue

        venue = None
        doi = (entry.get("doi") or "").strip()
        pid = (entry.get("paper_id") or "").strip()

        if doi and doi in cache and cache[doi]:
            venue = cache[doi]
        elif pid and f"s2:{pid}" in cache and cache[f"s2:{pid}"]:
            venue = cache[f"s2:{pid}"]

        if venue:
            entry["venue"] = venue
            updated += 1

    print(f"Updated {updated} entries with venue info")

    # Stats
    still_missing = sum(1 for d in data if not d.get("venue") or d["venue"].strip() == "")
    print(f"Still missing venue: {still_missing}")

    # Save
    print(f"\nSaving to {DATA_FILE}...")
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)
    print("Done!")

    # Cleanup cache
    print(f"Cache file: {CACHE_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
