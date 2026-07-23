#!/usr/bin/env python3
"""
Peer-Review Verification & Removal Script.

Three-tier classification:
  Tier 1 — Deterministic venue pattern matching (whitelist / blocklist)
  Tier 2 — Crossref DOI type lookup for ambiguous venues
  Tier 3 — Gemini LLM fallback for remaining unknowns

Non-peer-reviewed papers are removed from the JSON files.
A detailed removal log is written to scripts/removed_non_peer_reviewed.json.

Usage:
    python scripts/verify_peer_review.py --all --dry-run
    python scripts/verify_peer_review.py --model ECCO
    python scripts/verify_peer_review.py --all
"""

import argparse
import csv
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock

import requests

from llm_client import call_llm

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_DIR = PROJECT_DIR / "public" / "data"
GRACE_CSV = PROJECT_DIR / "mission_data" / "grace.publications.csv"

CACHE_FILE = SCRIPT_DIR / "peer_review_cache.json"
REMOVAL_LOG = SCRIPT_DIR / "removed_non_peer_reviewed.json"

MODELS = [
    "CARDAMOM", "CMS-Flux", "ECCO", "EDMF", "GRACE",
    "ISSM", "LES", "MOMO-CHEM", "RAPID", "SWOT", "TROPESS",
]

CROSSREF_URL = "https://api.crossref.org/works"
CROSSREF_HEADERS = {
    "User-Agent": "ScienceModelDashboard/1.0 (mailto:research@jpl.nasa.gov)",
}
CROSSREF_TIMEOUT = 15

CONCURRENT_LOOKUPS = 5
SAVE_EVERY = 100

# ---------------------------------------------------------------------------
# Venue Classification Lists
# ---------------------------------------------------------------------------

# Patterns that indicate NOT peer-reviewed (substring match on lowercase venue)
NOT_PEER_REVIEWED_PATTERNS = [
    "arxiv",
    "preprint",
    "essoar",
    "eartharxiv",
    "biorxiv",
    "medrxiv",
    "ssrn",
    "research square",
    "thesis",
    "dissertation",
    "phd",
    "master's",
    "masters",
    "fall meeting",
    "spring meeting",
    "presented at",
    "workshop abstract",
    "technical report",
    "working paper",
    "conference abstract",
    "discussions",
    "discussion papers",
    "egusphere",
    "monograph series",
    "geophysical monograph",
    "encyclopedia",
    "handbook",
    "poster",
    "agu fall",
    "agu spring",
    "egu general assembly",
    "seg technical program",
    "paper presented at",
    "expanded abstracts",
]

# Venues that contain blocklist words but ARE peer-reviewed
PEER_REVIEWED_EXCEPTIONS = {
    "proceedings of the national academy of sciences",
    "proceedings of the royal society a",
    "proceedings of the royal society b",
    "proceedings of the royal society b: biological sciences",
    "proceedings of the ieee",
    "proceedings of the institution of civil engineers",
    "proceedings of the indian academy of sciences",
    "proceedings of the international association of hydrological sciences",
    "coastal engineering proceedings",
    "agu advances",
}

# Crossref types considered peer-reviewed
PEER_REVIEWED_TYPES = {"journal-article", "proceedings-article"}
NOT_PEER_REVIEWED_TYPES = {"posted-content", "dissertation", "book-chapter", "monograph",
                           "report", "peer-review", "dataset", "reference-entry"}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

cache_lock = Lock()


def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def get_entry_key(entry):
    doi = entry.get("doi") or entry.get("DOI") or ""
    paper_id = entry.get("paper_id") or ""
    if doi:
        return f"doi:{doi}"
    if paper_id:
        return f"pid:{paper_id}"
    title = entry.get("title", "")
    if isinstance(title, list):
        title = title[0] if title else ""
    return f"title:{title[:100]}"


def get_venue(paper):
    if paper.get("venue"):
        return paper["venue"]
    ct = paper.get("container-title")
    if ct:
        if isinstance(ct, list) and len(ct) > 0:
            return ct[0]
        if isinstance(ct, str):
            return ct
    return ""


def get_doi(paper):
    return paper.get("doi") or paper.get("DOI") or ""


def get_title(paper):
    title = paper.get("title", "")
    if isinstance(title, list):
        title = title[0] if title else ""
    return title


def load_grace_peer_review_map():
    mapping = {}
    if not GRACE_CSV.exists():
        return mapping
    with open(GRACE_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            title = (row.get("title") or "").strip().rstrip("\r")
            is_pr = row.get("is_peer_reviewed", "").strip().lower()
            if title:
                mapping[title.lower().strip()] = is_pr == "t"
    return mapping


# ---------------------------------------------------------------------------
# Tier 1: Deterministic venue-based classification
# ---------------------------------------------------------------------------

def tier1_classify(paper, grace_map=None):
    """
    Returns (is_peer_reviewed: bool|None, reason: str).
    None means inconclusive — proceed to Tier 2.
    """
    venue = get_venue(paper)
    doi = get_doi(paper)
    title = get_title(paper)
    venue_lower = venue.lower().strip()
    title_lower = title.lower()

    # GRACE CSV: only trust explicit peer-reviewed=true as confirmation
    # Do NOT use it to reject papers — many legitimate journal papers are marked f
    if grace_map:
        key = title_lower.strip()
        if key in grace_map and grace_map[key] is True:
            return True, "tier1_grace_csv"

    # Check venue against blocklist patterns
    for pattern in NOT_PEER_REVIEWED_PATTERNS:
        if pattern in venue_lower:
            # Check exceptions
            is_exception = any(exc in venue_lower for exc in PEER_REVIEWED_EXCEPTIONS)
            if not is_exception:
                return False, f"tier1_venue_pattern:{pattern}"

    # Title-based thesis/dissertation detection
    for pattern in ["thesis", "dissertation"]:
        if pattern in title_lower:
            return False, f"tier1_title_pattern:{pattern}"

    # Conference proceedings (not in exceptions list)
    if "proceedings" in venue_lower or "conference" in venue_lower:
        is_exception = any(exc in venue_lower for exc in PEER_REVIEWED_EXCEPTIONS)
        if not is_exception:
            return False, "tier1_conference_proceedings"

    # "in ..." patterns (conference abstracts / meeting presentations)
    if venue_lower.startswith("in ") and ("meeting" in venue_lower or "agu" in venue_lower or "egu" in venue_lower):
        return False, "tier1_conference_abstract"

    # AGU meeting patterns
    if "agu" in venue_lower and ("meeting" in venue_lower or "fall" in venue_lower or "spring" in venue_lower):
        return False, "tier1_agu_meeting"

    # No venue and no DOI
    if not venue and not doi:
        return False, "tier1_no_venue_no_doi"

    # Venue is a placeholder
    if venue_lower in ("edited", "unknown", ""):
        if not doi:
            return False, "tier1_placeholder_venue_no_doi"
        # Has DOI but placeholder venue — inconclusive, go to Tier 2
        return None, "tier1_inconclusive_placeholder_with_doi"

    # Has venue that doesn't match blocklist — peer-reviewed
    if venue:
        return True, "tier1_clean_venue"

    # Has DOI but no venue — inconclusive
    return None, "tier1_inconclusive"


# ---------------------------------------------------------------------------
# Tier 2: Crossref DOI type lookup
# ---------------------------------------------------------------------------

def lookup_crossref_type(doi, cache):
    """Query Crossref for the work type. Returns type string or None."""
    cache_key = f"crossref:{doi}"

    with cache_lock:
        if cache_key in cache:
            return cache[cache_key]

    try:
        resp = requests.get(
            f"{CROSSREF_URL}/{doi}",
            headers=CROSSREF_HEADERS,
            timeout=CROSSREF_TIMEOUT,
        )
        if resp.status_code == 200:
            data = resp.json()
            work_type = data.get("message", {}).get("type", "unknown")
            with cache_lock:
                cache[cache_key] = work_type
            return work_type
        elif resp.status_code == 404:
            with cache_lock:
                cache[cache_key] = "not_found"
            return "not_found"
        elif resp.status_code == 429:
            time.sleep(2)
            return None
    except (requests.exceptions.RequestException, json.JSONDecodeError):
        pass

    return None


def tier2_classify(paper, cache):
    """Crossref-based classification. Returns (bool|None, reason)."""
    doi = get_doi(paper)
    if not doi:
        return None, "tier2_no_doi"

    work_type = lookup_crossref_type(doi, cache)
    if work_type is None:
        return None, "tier2_lookup_failed"

    if work_type in PEER_REVIEWED_TYPES:
        return True, f"tier2_crossref:{work_type}"
    if work_type in NOT_PEER_REVIEWED_TYPES:
        return False, f"tier2_crossref:{work_type}"

    # Unknown type — default to peer-reviewed if has DOI
    return True, f"tier2_crossref_default:{work_type}"


# ---------------------------------------------------------------------------
# Tier 3: Gemini LLM fallback
# ---------------------------------------------------------------------------

PEER_REVIEW_PROMPT = """Determine if this scientific paper is published in a peer-reviewed journal or venue.

Peer-reviewed: journal articles, peer-reviewed conference papers in established venues.
NOT peer-reviewed: preprints, theses, dissertations, technical reports, conference abstracts, posters, book chapters, encyclopedias, working papers.

Paper information:
- Title: {title}
- Venue: {venue}
- DOI: {doi}

Respond ONLY with valid JSON (no markdown): {{"is_peer_reviewed": true/false, "reason": "brief explanation"}}"""


def tier3_classify(paper, cache):
    """LLM-based classification via the shared Bedrock client. Returns (bool, reason)."""
    key = get_entry_key(paper)
    cache_key = f"llm:{key}"

    with cache_lock:
        if cache_key in cache:
            return cache[cache_key].get("is_peer_reviewed", True), "tier3_cached"

    title = get_title(paper)
    venue = get_venue(paper)
    doi = get_doi(paper)

    prompt = PEER_REVIEW_PROMPT.format(
        title=title or "(no title)",
        venue=venue or "(unknown)",
        doi=doi or "(none)",
    )

    try:
        parsed = call_llm(prompt, temperature=0.1, max_tokens=256)
        is_pr = parsed.get("is_peer_reviewed", True)
        reason = parsed.get("reason", "")
        with cache_lock:
            cache[cache_key] = {"is_peer_reviewed": is_pr, "reason": reason}
        return is_pr, f"tier3_llm:{reason}"
    except Exception:
        # Fallback: assume peer-reviewed if the LLM call fails.
        return True, "tier3_fallback"


# ---------------------------------------------------------------------------
# Main classification pipeline
# ---------------------------------------------------------------------------

def classify_paper(paper, cache, use_llm=True, grace_map=None):
    """Three-tier classification. Returns (is_peer_reviewed, reason)."""
    # Tier 1
    result, reason = tier1_classify(paper, grace_map=grace_map)
    if result is not None:
        return result, reason

    # Tier 2
    result, reason = tier2_classify(paper, cache)
    if result is not None:
        return result, reason

    # Tier 3
    if use_llm:
        return tier3_classify(paper, cache)

    # LLM disabled — default peer-reviewed
    return True, "default_no_llm"


def process_model(model_name, cache, use_llm=True, dry_run=False, grace_map=None):
    """Process a single model's JSON file. Returns list of removed papers."""
    filepath = DATA_DIR / f"{model_name}_analyzed.json"
    if not filepath.exists():
        print(f"  WARNING: {filepath} not found, skipping")
        return []

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    total = len(data)
    kept = []
    removed = []
    tier_counts = {"tier1": 0, "tier2": 0, "tier3": 0}

    for i, paper in enumerate(data):
        is_pr, reason = classify_paper(paper, cache, use_llm=use_llm, grace_map=grace_map)
        tier = reason.split("_")[0]  # tier1, tier2, tier3
        tier_counts[tier] = tier_counts.get(tier, 0) + 1

        if is_pr:
            paper["is_peer_reviewed"] = True
            kept.append(paper)
        else:
            title = get_title(paper)
            venue = get_venue(paper)
            doi = get_doi(paper)
            removed.append({
                "model": model_name,
                "title": title,
                "venue": venue,
                "doi": doi,
                "reason": reason,
            })

        if (i + 1) % SAVE_EVERY == 0:
            with cache_lock:
                save_cache(cache)

    n_removed = len(removed)
    print(f"  {model_name}: {total} papers → {len(kept)} kept, {n_removed} removed ({n_removed/total*100:.1f}%)")
    print(f"    Tier breakdown: T1={tier_counts.get('tier1',0)}, T2={tier_counts.get('tier2',0)}, T3={tier_counts.get('tier3',0)}")

    if removed:
        print(f"    Sample removals:")
        for r in removed[:5]:
            print(f"      - {r['reason']:40s} | {r['title'][:50]}")
        if len(removed) > 5:
            print(f"      ... and {len(removed)-5} more")

    if not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(kept, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"    Written to {filepath}")
        save_cache(cache)

    return removed


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Verify peer-review status and remove non-peer-reviewed papers"
    )
    parser.add_argument("--model", type=str, help="Process a specific model")
    parser.add_argument("--all", action="store_true", help="Process all models")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--no-llm", action="store_true",
                        help="Skip Tier 3 (LLM); rely only on deterministic + Crossref tiers")
    args = parser.parse_args()

    if not args.model and not args.all:
        parser.print_help()
        sys.exit(1)

    use_llm = not args.no_llm
    models = MODELS if args.all else [args.model]

    if args.model and args.model not in MODELS:
        print(f"ERROR: Unknown model '{args.model}'. Valid: {', '.join(MODELS)}")
        sys.exit(1)

    mode = "DRY RUN" if args.dry_run else "REMOVING"
    print(f"\nPeer-Review Verification ({mode})")
    print("=" * 60)
    if not use_llm:
        print("Note: --no-llm set — Tier 3 (LLM) will be skipped")
    print()

    cache = load_cache()
    print(f"Cache: {len(cache)} entries loaded")

    grace_map = None
    if "GRACE" in models:
        grace_map = load_grace_peer_review_map()
        if grace_map:
            print(f"GRACE CSV: {len(grace_map)} titles loaded")
    print()

    all_removed = []
    for model in models:
        print(f"[{model}]")
        use_grace = grace_map if model == "GRACE" else None
        removed = process_model(model, cache, use_llm=use_llm, dry_run=args.dry_run, grace_map=use_grace)
        all_removed.extend(removed)
        print()

    # Write removal log
    if all_removed and not args.dry_run:
        # Append to existing log if present
        existing = []
        if REMOVAL_LOG.exists():
            with open(REMOVAL_LOG, "r", encoding="utf-8") as f:
                existing = json.load(f)
        existing.extend(all_removed)
        with open(REMOVAL_LOG, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"Removal log: {len(all_removed)} entries written to {REMOVAL_LOG}")

    save_cache(cache)

    # Summary
    print(f"\nSummary: {len(all_removed)} papers removed across {len(models)} models")
    if args.dry_run:
        print("(Dry run — no files modified)")
    print()


if __name__ == "__main__":
    main()
