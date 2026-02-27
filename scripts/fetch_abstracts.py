#!/usr/bin/env python3
"""
Fetch missing abstracts for all model citation papers.
4-phase pipeline:
  Phase 1: Semantic Scholar batch API (paper_ids + DOIs)
  Phase 2: Crossref fallback (DOIs where S2 returned empty)
  Phase 3: OpenAlex fallback (DOIs where S2+Crossref returned empty)
  Phase 4: Google Scholar fallback (title search for remaining entries)
"""

import asyncio
import aiohttp
import json
import re
import sys
import time
import requests
import urllib.parse
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "public" / "data"
CACHE_FILE = Path(__file__).parent / "abstract_cache.json"

ALL_MODELS = ['RAPID', 'CARDAMOM', 'CMS-Flux', 'ECCO', 'ISSM', 'MOMO-CHEM', 'LES', 'EDMF', 'GRACE', 'SWOT']

S2_BATCH_SIZE = 500
S2_DELAY = 1.1  # Semantic Scholar rate limit: 1 req/sec for batch
CROSSREF_CONCURRENCY = 15
CROSSREF_DELAY = 0.05
CROSSREF_EMAIL = "science-model-dashboard@example.com"
OPENALEX_EMAIL = "science-model-dashboard@example.com"
OPENALEX_BATCH_SIZE = 50
GS_DELAY = 1.5  # Delay between SerpAPI requests (stay under 200/hr throttle)
GS_MAX_QUERIES = 500  # Cap per run (across both SerpAPI + Scraping Robot)
SERPAPI_KEY = "e8cacc61362aa76e8ae37066372cbad1f3be95229bede4a354e8936e5853c833"
SCRAPINGROBOT_TOKEN = "72636f06-258f-4fdc-87bf-4eaf7ab13ba4"
SCRAPINGROBOT_DELAY = 2.0  # Delay between Scraping Robot requests
# Prioritize smaller models for Google Scholar (most impact per query)
GS_MODEL_PRIORITY = ['SWOT', 'RAPID', 'LES', 'CARDAMOM', 'CMS-Flux', 'EDMF', 'MOMO-CHEM', 'ISSM', 'GRACE', 'ECCO']


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


def get_entry_title(d):
    """Get the title of an entry, handling both data formats."""
    title = d.get('title', '')
    if isinstance(title, list):
        title = title[0] if title else ''
    return (title or '').strip()


# --- Phase 1: Semantic Scholar ---

async def fetch_s2_batch_abstracts(session, ids, cache):
    """Fetch abstracts from Semantic Scholar batch API."""
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


# --- Phase 2: Crossref ---

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


# --- Phase 3: OpenAlex ---

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


def fetch_openalex_abstracts(dois, cache):
    """Fetch abstracts from OpenAlex API for DOIs not found in S2/Crossref."""
    to_fetch = [doi for doi in dois if f"oa:{doi}" not in cache]
    print(f"  OpenAlex: {len(to_fetch)} DOIs to fetch ({len(dois) - len(to_fetch)} cached)")
    if not to_fetch:
        return 0

    session = requests.Session()
    session.headers['Accept-Encoding'] = 'gzip, deflate'
    found = 0

    for i in range(0, len(to_fetch), OPENALEX_BATCH_SIZE):
        batch = to_fetch[i:i + OPENALEX_BATCH_SIZE]
        doi_filter = "|".join(f"https://doi.org/{d}" for d in batch)
        params = {
            "filter": f"doi:{doi_filter}",
            "select": "doi,abstract_inverted_index",
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
                print(f"    OpenAlex rate limited at {i}, waiting 5s...")
                time.sleep(5)
                continue  # Will retry next run
            else:
                print(f"    OpenAlex error {resp.status_code} at batch {i}")
                for doi in batch:
                    cache[f"oa:{doi}"] = ""
        except requests.RequestException as e:
            print(f"    OpenAlex request error: {e}")
            for doi in batch:
                cache[f"oa:{doi}"] = ""

        done = min(i + OPENALEX_BATCH_SIZE, len(to_fetch))
        if done % 500 == 0 or done == len(to_fetch):
            print(f"    OpenAlex: {done}/{len(to_fetch)} processed, {found} abstracts found")
            save_cache(cache)

        time.sleep(0.1)

    save_cache(cache)
    return found


# --- Phase 4: Google Scholar via SerpAPI or Scraping Robot ---

def _search_serpapi(title):
    """Search Google Scholar via SerpAPI. Returns (snippet, result_title, error_or_None)."""
    from serpapi import GoogleSearch
    search = GoogleSearch({
        "engine": "google_scholar",
        "q": f'"{title}"',
        "api_key": SERPAPI_KEY,
        "num": 1,
    })
    results = search.get_dict()

    err = results.get("error", "")
    if err and ("throttle" in err.lower() or "run out" in err.lower()):
        return None, None, "exhausted"

    organic = results.get("organic_results", [])
    if organic:
        top = organic[0]
        snippet = (top.get("snippet") or "").strip()
        result_title = (top.get("title") or "").strip()
        return snippet, result_title, None
    return "", "", None


def _search_gs_via_scrapingrobot(title, session):
    """Search Google Scholar via Scraping Robot with JS rendering.
    Returns (snippet, result_title, error_or_None)."""
    gs_url = f"https://scholar.google.com/scholar?q={urllib.parse.quote(chr(34) + title + chr(34))}&num=1"
    api_url = (f"https://api.scrapingrobot.com/"
               f"?token={SCRAPINGROBOT_TOKEN}"
               f"&render=true"
               f"&url={urllib.parse.quote(gs_url, safe='')}")

    try:
        resp = session.get(api_url, timeout=45)
        if resp.status_code == 200:
            data = resp.json()
            html = data.get("result", "")
            if not html:
                return "", "", None

            # Parse title: <h3 class="gs_rt">...<a>TITLE</a>...</h3>
            title_match = re.search(
                r'<h3[^>]*class="gs_rt"[^>]*>.*?<a[^>]*>(.*?)</a>',
                html, re.DOTALL)
            result_title = ""
            if title_match:
                result_title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()

            # Parse snippet: <div class="gs_rs">...</div>
            snippet_match = re.search(
                r'<div[^>]*class="gs_rs"[^>]*>(.*?)</div>',
                html, re.DOTALL)
            snippet = ""
            if snippet_match:
                snippet = re.sub(r'<[^>]+>', '', snippet_match.group(1)).strip()
                snippet = snippet.replace('&amp;', '&').replace('&lt;', '<')
                snippet = snippet.replace('&gt;', '>').replace('&#39;', "'")
                snippet = snippet.replace('&quot;', '"')
                snippet = re.sub(r'^\s*\u2026?\s*', '', snippet)
                snippet = re.sub(r'\s*\u2026?\s*$', '', snippet)
                snippet = re.sub(r'^\s*\.{2,}\s*', '', snippet)
                snippet = re.sub(r'\s*\.{2,}\s*$', '', snippet)

            return snippet, result_title, None
        elif resp.status_code == 429:
            return None, None, "throttled"
        else:
            return "", "", f"HTTP {resp.status_code}"
    except requests.RequestException as e:
        return "", "", str(e)


def fetch_google_scholar_abstracts(entries_by_model, cache):
    """Fetch abstracts from Google Scholar.
    Tries SerpAPI first; if exhausted, falls back to Scraping Robot + rendered GS pages.
    entries_by_model: dict of {model: [(title, cache_key), ...]}
    Returns count of abstracts found.
    """
    # Build priority-ordered list of (title, cache_key) tuples
    queries = []
    for model in GS_MODEL_PRIORITY:
        if model not in entries_by_model:
            continue
        for title, cache_key in entries_by_model[model]:
            if cache_key not in cache:
                queries.append((title, cache_key, model))

    total = len(queries)
    to_run = min(total, GS_MAX_QUERIES)
    print(f"  Google Scholar: {total} entries need abstracts, running up to {to_run} queries (cap: {GS_MAX_QUERIES})")
    if to_run == 0:
        return 0

    # Try SerpAPI first
    serpapi_available = True
    try:
        from serpapi import GoogleSearch  # noqa: F401
    except ImportError:
        serpapi_available = False

    use_serpapi = serpapi_available
    http_session = requests.Session()

    found = 0
    errors = 0
    consecutive_empty = 0

    for idx, (title, cache_key, model) in enumerate(queries[:to_run]):
        snippet = ""
        result_title = ""

        # Try SerpAPI
        if use_serpapi:
            try:
                snippet, result_title, error = _search_serpapi(title)
                if error == "exhausted":
                    use_serpapi = False
                    print(f"    SerpAPI exhausted at query {idx}. Switching to Scraping Robot...")
                    snippet, result_title = "", ""
            except Exception as e:
                errors += 1
                if errors <= 3:
                    print(f"    SerpAPI error: {e}")

        # Fallback: Scraping Robot + rendered Google Scholar
        if not snippet and not use_serpapi:
            try:
                snippet, result_title, error = _search_gs_via_scrapingrobot(title, http_session)
                if error == "throttled":
                    print(f"    Scraping Robot throttled at query {idx}. Stopping.")
                    break
                elif error:
                    errors += 1
                    if errors <= 5:
                        print(f"    SR error for '{title[:50]}...': {error}")
            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"    SR error: {e}")

        # Process result
        if snippet and result_title and _titles_match(title.lower(), result_title.lower()):
            cache[cache_key] = snippet
            found += 1
            consecutive_empty = 0
        elif snippet is not None:
            consecutive_empty += 1
            if consecutive_empty >= 100:
                print(f"    {consecutive_empty} consecutive empty results. Stopping.")
                break
            cache[cache_key] = ""

        if errors >= 50:
            print(f"    Too many errors ({errors}), stopping early")
            break

        done = idx + 1
        if done % 50 == 0 or done == to_run:
            backend = "SerpAPI" if use_serpapi else "ScrapingRobot"
            print(f"    [{backend}]: {done}/{to_run} processed, {found} abstracts found, {errors} errors")
            save_cache(cache)

        time.sleep(GS_DELAY if use_serpapi else SCRAPINGROBOT_DELAY)

    save_cache(cache)
    return found


def _titles_match(a, b):
    """Check if two titles are similar enough to be the same paper."""
    # Strip punctuation and compare
    import re
    clean_a = re.sub(r'[^\w\s]', '', a).lower().split()
    clean_b = re.sub(r'[^\w\s]', '', b).lower().split()
    if not clean_a or not clean_b:
        return False
    # Check word overlap ratio
    set_a = set(clean_a)
    set_b = set(clean_b)
    overlap = len(set_a & set_b)
    min_len = min(len(set_a), len(set_b))
    return overlap / min_len >= 0.7 if min_len > 0 else False


# --- Main pipeline ---

def _resolve_abstract_from_cache(doi, pid, cache):
    """Look up the best abstract from cache for a given entry's identifiers."""
    abstract = None
    # Try S2 by DOI
    if doi:
        abstract = cache.get(f"s2:DOI:{doi}", "")
        # Crossref fallback
        if not abstract:
            abstract = cache.get(f"cr:{doi}", "")
        # OpenAlex fallback
        if not abstract:
            abstract = cache.get(f"oa:{doi}", "")
    # Try S2 by paper_id
    if not abstract and pid:
        abstract = cache.get(f"s2:{pid}", "")
    # Google Scholar fallback
    if not abstract and pid:
        abstract = cache.get(f"gs:{pid}", "")
    if not abstract and doi:
        abstract = cache.get(f"gs:{doi}", "")
    return abstract


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
            dois_for_crossref.append(doi)

    if dois_for_crossref:
        cr_found = await fetch_crossref_abstracts(dois_for_crossref, cache)
        print(f"Crossref found: {cr_found} additional abstracts")
    else:
        print("No DOIs need Crossref fallback")

    # Phase 3: OpenAlex fallback for DOIs where S2+Crossref returned empty
    print("\n--- Phase 3: OpenAlex fallback ---")
    dois_for_openalex = []
    for did in doi_ids:
        doi = did.replace("DOI:", "")
        s2_key = f"s2:{did}"
        cr_key = f"cr:{doi}"
        s2_empty = s2_key in cache and cache[s2_key] == ""
        cr_empty = cr_key in cache and cache[cr_key] == ""
        # Only try OpenAlex if both S2 and Crossref failed
        if s2_empty and cr_empty:
            dois_for_openalex.append(doi)

    if dois_for_openalex:
        oa_found = fetch_openalex_abstracts(dois_for_openalex, cache)
        print(f"OpenAlex found: {oa_found} additional abstracts")
    else:
        print("No DOIs need OpenAlex fallback")

    # Phase 4: Google Scholar fallback for entries still missing abstracts
    print("\n--- Phase 4: Google Scholar fallback ---")
    gs_entries_by_model = {}
    for model in models:
        entries = []
        for d in model_data[model]:
            if not entry_needs_abstract(d):
                continue
            doi, pid = get_entry_id(d)
            # Check if all prior phases failed for this entry
            abstract = _resolve_abstract_from_cache(doi, pid, cache)
            if abstract:
                continue  # Will be applied later
            title = get_entry_title(d)
            if not title or len(title) < 10:
                continue  # Too short to search reliably
            # Use paper_id or doi as cache key
            cache_key = f"gs:{pid}" if pid else f"gs:{doi}" if doi else None
            if cache_key and cache_key not in cache:
                entries.append((title, cache_key))
        if entries:
            gs_entries_by_model[model] = entries

    total_gs = sum(len(v) for v in gs_entries_by_model.values())
    if total_gs > 0:
        print(f"  Entries needing GS lookup by model:")
        for model in GS_MODEL_PRIORITY:
            if model in gs_entries_by_model:
                print(f"    {model}: {len(gs_entries_by_model[model])}")
        gs_found = fetch_google_scholar_abstracts(gs_entries_by_model, cache)
        print(f"Google Scholar found: {gs_found} additional abstracts")
    else:
        print("No entries need Google Scholar fallback")

    # Apply results to each model
    print("\n--- Applying results ---")
    for model in models:
        data = model_data[model]
        updated = 0
        for d in data:
            if not entry_needs_abstract(d):
                continue
            doi, pid = get_entry_id(d)
            abstract = _resolve_abstract_from_cache(doi, pid, cache)

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
