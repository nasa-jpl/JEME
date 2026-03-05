#!/usr/bin/env python3
"""
Peer-Review Classification Script
Adds `is_peer_reviewed` field (true/false) to every paper across all model JSON files.

Classification logic:
  - Not peer-reviewed if venue matches blocklist patterns (preprints, theses, conferences, etc.)
  - Default: has DOI + venue doesn't match blocklist → true. No venue and no DOI → false.

Usage:
  python3 scripts/classify_peer_review.py --all --dry-run   # preview
  python3 scripts/classify_peer_review.py --all              # apply
  python3 scripts/classify_peer_review.py --model ECCO       # single model
"""

import argparse
import csv
import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "public", "data")
GRACE_CSV = os.path.join(PROJECT_DIR, "mission_data", "grace.publications.csv")

MODELS = [
    "CARDAMOM", "CMS-Flux", "ECCO", "EDMF", "GRACE",
    "ISSM", "LES", "MOMO-CHEM", "RAPID", "SWOT",
]

# Venue patterns that indicate NOT peer-reviewed
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
    "meeting",
    "fall meeting",
    "spring meeting",
    "presented at",
    "workshop abstract",
    "technical report",
    "working paper",
    "conference abstract",
]


def load_grace_peer_review_map():
    """Load GRACE CSV and build title -> is_peer_reviewed mapping."""
    mapping = {}
    if not os.path.exists(GRACE_CSV):
        print(f"  Warning: GRACE CSV not found at {GRACE_CSV}, skipping CSV lookup")
        return mapping

    with open(GRACE_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            title = (row.get("title") or "").strip().rstrip("\r")
            is_pr = row.get("is_peer_reviewed", "").strip().lower()
            if title:
                # Normalize title for matching
                key = title.lower().strip()
                mapping[key] = is_pr == "t"

    print(f"  Loaded {len(mapping)} GRACE titles from CSV ({sum(1 for v in mapping.values() if v)} peer-reviewed)")
    return mapping


def venue_matches_blocklist(venue):
    """Check if venue matches any non-peer-reviewed pattern."""
    if not venue:
        return False
    venue_lower = venue.lower()
    for pattern in NOT_PEER_REVIEWED_PATTERNS:
        if pattern in venue_lower:
            return True
    return False


def get_venue(paper):
    """Extract venue from paper, handling both data formats."""
    # Simplified format
    if paper.get("venue"):
        return paper["venue"]
    # Crossref format
    ct = paper.get("container-title")
    if ct:
        if isinstance(ct, list) and len(ct) > 0:
            return ct[0]
        if isinstance(ct, str):
            return ct
    return ""


def get_doi(paper):
    """Extract DOI from paper."""
    return paper.get("doi") or paper.get("DOI") or ""


def classify_paper(paper, grace_map=None):
    """Classify a single paper as peer-reviewed or not."""
    venue = get_venue(paper)
    doi = get_doi(paper)
    title = (paper.get("title") or "")
    if isinstance(title, list):
        title = title[0] if title else ""
    title_key = title.lower().strip()

    # Check venue against blocklist
    if venue_matches_blocklist(venue):
        return False

    # Check title for thesis/dissertation patterns (some don't have venue set)
    title_lower = title.lower()
    for pattern in ["thesis", "dissertation"]:
        if pattern in title_lower:
            return False

    # Has DOI + venue doesn't match blocklist → peer-reviewed
    if doi and venue and not venue_matches_blocklist(venue):
        return True

    # Has DOI but no venue → likely peer-reviewed
    if doi and not venue:
        return True

    # No DOI and no meaningful venue → not peer-reviewed
    if not doi and (not venue or venue.lower() in ("edited", "unknown", "")):
        return False

    # Has venue but no DOI → check if venue looks like a journal
    if venue and not doi:
        # "edited" is a common placeholder for conference proceedings/reports
        if venue.lower().strip() in ("edited",):
            return False
        # If venue exists and doesn't match blocklist, assume peer-reviewed
        return True

    # Default: not peer-reviewed
    return False


def process_model(model_name, dry_run=False, grace_map=None):
    """Process a single model's JSON file."""
    filepath = os.path.join(DATA_DIR, f"{model_name}_analyzed.json")
    if not os.path.exists(filepath):
        print(f"  File not found: {filepath}")
        return

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    total = len(data)
    peer_reviewed = 0
    not_peer_reviewed = 0
    changed = 0

    use_grace = grace_map if model_name == "GRACE" else None

    for paper in data:
        is_pr = classify_paper(paper, grace_map=use_grace)
        old_val = paper.get("is_peer_reviewed")
        if old_val != is_pr:
            changed += 1
        paper["is_peer_reviewed"] = is_pr
        if is_pr:
            peer_reviewed += 1
        else:
            not_peer_reviewed += 1

    print(f"  {model_name}: {total} papers → {peer_reviewed} peer-reviewed, {not_peer_reviewed} not ({changed} changed)")

    if not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"    Written to {filepath}")


def main():
    parser = argparse.ArgumentParser(description="Classify papers as peer-reviewed or not")
    parser.add_argument("--model", type=str, help="Process a specific model")
    parser.add_argument("--all", action="store_true", help="Process all models")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()

    if not args.model and not args.all:
        parser.print_help()
        sys.exit(1)

    models = MODELS if args.all else [args.model]
    mode = "DRY RUN" if args.dry_run else "APPLYING"
    print(f"\nPeer-Review Classification ({mode})")
    print("=" * 50)

    # Load GRACE CSV mapping if needed
    grace_map = None
    if "GRACE" in models:
        print("\nLoading GRACE CSV data...")
        grace_map = load_grace_peer_review_map()

    print()
    for model in models:
        process_model(model, dry_run=args.dry_run, grace_map=grace_map)

    print(f"\nDone. {'No files modified (dry run).' if args.dry_run else 'Files updated.'}\n")


if __name__ == "__main__":
    main()
