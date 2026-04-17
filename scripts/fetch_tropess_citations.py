#!/usr/bin/env python3
"""
Build TROPESS_analyzed.json from the TROPESS team-paper seed list.

Pipeline:
  1. Read public/data/tropess_team_papers.json (27 team papers).
  2. For each team paper DOI, query Semantic Scholar
     /paper/DOI:{doi}/citations to get all citing papers (paginated).
  3. Deduplicate citing papers across team papers (DOI-first, title fallback).
  4. Map both team papers and citing papers to the dashboard schema.
  5. Run classify_domain + classify_mission_engagement (TROPESS-specific
     keywords from classify_papers.py).
  6. Run compute_entry_uncertainty (Phase 1 deterministic).
  7. Write public/data/TROPESS_analyzed.json.

Usage:
    python scripts/fetch_tropess_citations.py
    python scripts/fetch_tropess_citations.py --dry-run
    python scripts/fetch_tropess_citations.py --max-citations-per-team 200
"""

import argparse
import hashlib
import json
import os
import re
import sys
import time
from pathlib import Path

import urllib.request
import urllib.parse
import urllib.error

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

from classify_papers import (
    classify_domain,
    classify_mission_engagement,
    get_domain_keywords,
)
from compute_uncertainty import compute_entry_uncertainty

PROJECT_ROOT = SCRIPT_DIR.parent
SEED_PATH = PROJECT_ROOT / "public" / "data" / "tropess_team_papers.json"
OUTPUT_PATH = PROJECT_ROOT / "public" / "data" / "TROPESS_analyzed.json"
CACHE_PATH = SCRIPT_DIR / "tropess_citations_cache.json"

S2_BASE = "https://api.semanticscholar.org/graph/v1"
S2_API_KEY = os.environ.get("S2_API_KEY") or os.environ.get("SEMANTIC_SCHOLAR_API_KEY")

# Conservative rate-limit when unauthenticated. The S2 unauthenticated limit is
# ~1 req/sec; using 1.2s gives a small safety margin.
REQUEST_DELAY_SEC = 0.4 if S2_API_KEY else 1.2

CITATION_FIELDS = ",".join([
    "paperId", "title", "abstract", "year", "venue", "externalIds",
    "authors", "citationCount", "openAccessPdf",
])
PAPER_FIELDS = ",".join([
    "paperId", "title", "abstract", "year", "venue", "externalIds",
    "authors", "citationCount", "openAccessPdf",
])

PAGE_LIMIT = 1000  # S2 max per page for /citations


def _http_get(url, max_retries=5):
    """GET a URL with retry/backoff for 429s and transient 5xx errors."""
    headers = {"User-Agent": "tropess-dashboard-fetcher/1.0"}
    if S2_API_KEY:
        headers["x-api-key"] = S2_API_KEY

    backoff = 2.0
    for attempt in range(max_retries):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504):
                wait = backoff * (2 ** attempt)
                print(f"      HTTP {e.code}, retrying in {wait:.0f}s...", flush=True)
                time.sleep(wait)
                continue
            if e.code == 404:
                return None
            raise
        except urllib.error.URLError as e:
            wait = backoff * (2 ** attempt)
            print(f"      URLError {e}, retrying in {wait:.0f}s...", flush=True)
            time.sleep(wait)
    print(f"      FAILED after {max_retries} attempts: {url}", flush=True)
    return None


def fetch_citations_for_doi(doi, max_total=None):
    """Fetch all citations for a paper identified by DOI.

    Returns a list of citing-paper dicts. The S2 endpoint returns
    {"data": [{"citingPaper": {...}}], "next": <int>, "offset": <int>}.
    """
    citing_papers = []
    offset = 0
    while True:
        params = {
            "fields": CITATION_FIELDS,
            "limit": PAGE_LIMIT,
            "offset": offset,
        }
        url = f"{S2_BASE}/paper/DOI:{urllib.parse.quote(doi, safe='')}/citations?{urllib.parse.urlencode(params)}"
        time.sleep(REQUEST_DELAY_SEC)
        result = _http_get(url)
        if result is None:
            break
        page_data = result.get("data", []) or []
        for item in page_data:
            cp = item.get("citingPaper")
            if cp:
                citing_papers.append(cp)
        if max_total and len(citing_papers) >= max_total:
            citing_papers = citing_papers[:max_total]
            break
        next_offset = result.get("next")
        if next_offset is None or len(page_data) < PAGE_LIMIT:
            break
        offset = next_offset
    return citing_papers


def normalize_doi(doi):
    if not doi:
        return ""
    return str(doi).strip().lower().rstrip(".")


def normalize_title(title):
    if not title:
        return ""
    t = re.sub(r"\s+", " ", str(title)).strip().lower()
    t = re.sub(r"[^\w\s]", "", t)
    return t


def make_paper_id_from_s2(s2_paper):
    """Use the S2 paperId if present, else hash the title."""
    pid = s2_paper.get("paperId")
    if pid:
        return pid
    title = s2_paper.get("title") or ""
    return hashlib.sha256(title.encode("utf-8")).hexdigest()[:40]


def s2_to_dashboard_entry(s2_paper, team_paper_title, team_paper_id):
    """Convert a Semantic Scholar paper dict to the dashboard schema."""
    ext = s2_paper.get("externalIds") or {}
    doi = ext.get("DOI") or ""
    if doi:
        doi = doi.strip()
    authors = [a.get("name", "") for a in (s2_paper.get("authors") or [])]
    venue = s2_paper.get("venue") or ""
    pdf = (s2_paper.get("openAccessPdf") or {}).get("url") or ""
    url = pdf or (f"https://doi.org/{doi}" if doi else "")

    return {
        "title": s2_paper.get("title") or "",
        "authors": authors,
        "year": s2_paper.get("year"),
        "doi": doi,
        "venue": venue,
        "citation_count": s2_paper.get("citationCount") or 0,
        "paper_id": make_paper_id_from_s2(s2_paper),
        "url": url,
        "abstract": s2_paper.get("abstract"),
        "country": None,
        "citing_team_paper": team_paper_title,
        "team_paper_id": team_paper_id,
        "research_domain": None,
        "engagement_level": None,
        "missions_instruments": [
            {
                "name": "TROPESS",
                "agency": "NASA",
                "type": "Satellite Retrieval Suite",
                "product": "Not specified",
                "data_level": "Not specified",
                "usage_context": "Cites TROPESS team paper",
            }
        ],
    }


def team_paper_to_dashboard_entry(tp):
    """Convert a seed team-paper record to the dashboard schema."""
    authors_raw = tp.get("authors") or ""
    authors = [a.strip() for a in re.split(r",\s*|;\s*", authors_raw) if a.strip()]
    doi = tp.get("doi") or ""
    venue = tp.get("journal") or ""
    title = tp.get("title") or ""
    year = tp.get("year")
    paper_id = f"tropess_team_{hashlib.sha256(doi.lower().encode()).hexdigest()[:16]}" if doi else \
               f"tropess_team_{hashlib.sha256(title.lower().encode()).hexdigest()[:16]}"
    url = tp.get("link") or (f"https://doi.org/{doi}" if doi else "")

    return {
        "title": title,
        "authors": authors,
        "year": year,
        "doi": doi,
        "venue": venue,
        "citation_count": 0,  # filled later from S2 paper lookup
        "paper_id": paper_id,
        "url": url,
        "abstract": None,
        "country": "USA",
        "citing_team_paper": None,
        "team_paper_id": None,
        "research_domain": None,
        "engagement_level": None,
        "missions_instruments": [
            {
                "name": "TROPESS",
                "agency": "NASA",
                "type": "Satellite Retrieval Suite",
                "product": "Not specified",
                "data_level": "Not specified",
                "usage_context": "Team publication for TROPESS",
            }
        ],
    }


def load_cache():
    if CACHE_PATH.exists():
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser(description="Build TROPESS_analyzed.json from team-paper seed")
    parser.add_argument("--dry-run", action="store_true", help="Don't write the output file")
    parser.add_argument("--max-citations-per-team", type=int, default=None,
                        help="Cap citing papers per team paper (for testing)")
    parser.add_argument("--no-cache", action="store_true", help="Ignore the citations cache")
    parser.add_argument("--use-cache-only", action="store_true",
                        help="Skip network calls, only use cached citation data")
    args = parser.parse_args()

    if not SEED_PATH.exists():
        print(f"ERROR: seed file not found at {SEED_PATH}")
        sys.exit(1)

    with open(SEED_PATH, "r", encoding="utf-8") as f:
        seed = json.load(f)
    team_papers = seed.get("TROPESS", [])
    print(f"Loaded {len(team_papers)} TROPESS team papers from seed")
    print(f"Semantic Scholar API key: {'set' if S2_API_KEY else 'NOT set (unauthenticated, slow)'}")

    cache = {} if args.no_cache else load_cache()

    # Map team paper DOI -> dashboard entry (for linking)
    team_entries = []
    team_doi_to_entry = {}
    for tp in team_papers:
        e = team_paper_to_dashboard_entry(tp)
        team_entries.append(e)
        if e["doi"]:
            team_doi_to_entry[normalize_doi(e["doi"])] = e

    # Fetch citations for each team paper
    all_citing_raw = []  # list of (s2_paper, team_paper_title, team_paper_id)
    for i, tp_entry in enumerate(team_entries, 1):
        doi = tp_entry["doi"]
        title = tp_entry["title"]
        tp_id = tp_entry["paper_id"]
        if not doi:
            print(f"  [{i}/{len(team_entries)}] {title[:70]}... — NO DOI, skipping")
            continue

        cache_key = normalize_doi(doi)
        if cache_key in cache:
            citing = cache[cache_key]
            print(f"  [{i}/{len(team_entries)}] {title[:60]}... — cached: {len(citing)} citations")
        elif args.use_cache_only:
            print(f"  [{i}/{len(team_entries)}] {title[:60]}... — not in cache, skipping (--use-cache-only)")
            continue
        else:
            print(f"  [{i}/{len(team_entries)}] {title[:60]}... — fetching", flush=True)
            citing = fetch_citations_for_doi(doi, max_total=args.max_citations_per_team)
            print(f"      got {len(citing)} citations")
            cache[cache_key] = citing
            save_cache(cache)

        for cp in citing:
            all_citing_raw.append((cp, title, tp_id))

    print(f"\nTotal raw citing-paper records (pre-dedupe): {len(all_citing_raw)}")

    # Deduplicate citing papers (DOI-first, then title)
    seen_doi = set()
    seen_title = set()
    deduped = []
    skipped_self = 0  # citing paper IS one of the team papers
    team_dois = set(team_doi_to_entry.keys())
    team_titles = set(normalize_title(e["title"]) for e in team_entries)

    for cp, tp_title, tp_id in all_citing_raw:
        ext = cp.get("externalIds") or {}
        doi = normalize_doi(ext.get("DOI") or "")
        title_norm = normalize_title(cp.get("title") or "")

        # Skip if the citing paper IS a team paper
        if doi and doi in team_dois:
            skipped_self += 1
            continue
        if title_norm and title_norm in team_titles:
            skipped_self += 1
            continue

        # Dedupe
        if doi:
            if doi in seen_doi:
                continue
            seen_doi.add(doi)
        elif title_norm:
            if title_norm in seen_title:
                continue
            seen_title.add(title_norm)
        else:
            continue

        deduped.append((cp, tp_title, tp_id))

    print(f"Skipped self-cites (team paper -> team paper): {skipped_self}")
    print(f"Unique citing papers after dedupe: {len(deduped)}")

    # Map citing papers to dashboard schema
    citing_entries = [s2_to_dashboard_entry(cp, tt, ti) for cp, tt, ti in deduped]

    # Combine: team papers first, then citing papers
    all_entries = team_entries + citing_entries
    print(f"Total entries (team + citing): {len(all_entries)}")

    # Filter preprints: remove entries whose venue indicates a preprint server,
    # unless the entry has a DOI (in which case keep it).
    PREPRINT_VENUES = [
        "arxiv", "biorxiv", "medrxiv", "chemrxiv", "eartharxiv", "essoar",
        "ssrn", "preprint", "research square", "authorea", "engrxiv",
        "techrxiv", "psyarxiv", "socarxiv",
    ]
    before_preprint = len(all_entries)
    filtered_entries = []
    for e in all_entries:
        venue_lower = (e.get("venue") or "").lower()
        is_preprint = any(pv in venue_lower for pv in PREPRINT_VENUES)
        if is_preprint and not e.get("doi"):
            continue
        filtered_entries.append(e)
    all_entries = filtered_entries
    if len(all_entries) != before_preprint:
        print(f"Removed {before_preprint - len(all_entries)} preprint entries (no DOI)")

    # Filter invalid years
    MIN_YEAR, MAX_YEAR = 2016, 2027
    before = len(all_entries)
    all_entries = [e for e in all_entries if e.get("year") is None or (MIN_YEAR <= e["year"] <= MAX_YEAR)]
    if len(all_entries) != before:
        print(f"Removed {before - len(all_entries)} entries with invalid years")

    # Classify domain + engagement.
    #
    # For citing papers, run classify_mission_engagement on title+abstract.
    # For team papers (citing_team_paper is None), default to "Data Usage"
    # because team papers produced or directly used the mission's data by
    # definition — but still allow the title-based "Review Paper" check to
    # promote them if the title contains explicit review wording. We can't
    # rely on the keyword classifier for team papers because the seed has
    # no abstracts and many team-paper titles describe science applications
    # rather than the retrieval algorithm.
    domain_kws = get_domain_keywords("TROPESS")
    domain_counts = {}
    eng_counts = {}
    for entry in all_entries:
        d = classify_domain(entry, domain_kws)
        entry["research_domain"] = d
        domain_counts[d] = domain_counts.get(d, 0) + 1

        if entry.get("citing_team_paper") is None:
            # Team paper: default Data Usage, override to Review Paper if title says so
            label = classify_mission_engagement(entry, "TROPESS")
            entry["engagement_level"] = label if label == "Review Paper" else "Data Usage"
        else:
            entry["engagement_level"] = classify_mission_engagement(entry, "TROPESS")
        eng_counts[entry["engagement_level"]] = eng_counts.get(entry["engagement_level"], 0) + 1

    print(f"\nDomain distribution: {domain_counts}")
    print(f"Engagement distribution: {eng_counts}")

    # Compute Phase 1 uncertainty
    for entry in all_entries:
        entry["uncertainty"] = compute_entry_uncertainty(entry, "TROPESS")

    high = sum(1 for e in all_entries if e["uncertainty"]["composite_confidence"] >= 0.7)
    med = sum(1 for e in all_entries if 0.4 <= e["uncertainty"]["composite_confidence"] < 0.7)
    low = sum(1 for e in all_entries if e["uncertainty"]["composite_confidence"] < 0.4)
    with_abs = sum(1 for e in all_entries if e.get("abstract"))
    print(f"\nUncertainty: high={high}, medium={med}, low={low}")
    print(f"Abstract coverage: {with_abs}/{len(all_entries)} ({100*with_abs/max(1,len(all_entries)):.1f}%)")

    if args.dry_run:
        print(f"\nDRY RUN: would write {len(all_entries)} entries to {OUTPUT_PATH}")
        if all_entries:
            print("Sample entry:")
            print(json.dumps(all_entries[0], indent=2)[:1500])
    else:
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(all_entries, f, indent=2, ensure_ascii=False)
        print(f"\nWrote {len(all_entries)} entries to {OUTPUT_PATH}")

    print("\nDone.")


if __name__ == "__main__":
    main()
