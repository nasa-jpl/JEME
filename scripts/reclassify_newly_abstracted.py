#!/usr/bin/env python3
"""
Reclassify papers that just received new abstracts.

Runs Gemini to re-determine:
  - research_domain
  - engagement_level  (Review Paper / Data Usage / Simple Citation)
  - paper_type        (science / algorithm)
  - engagement_level_rationale
  - paper_type_rationale

Usage:
    python scripts/reclassify_newly_abstracted.py [--ids-file FILE] [--dry-run] [--sample N]
    python scripts/reclassify_newly_abstracted.py --from-commit af3fa31
"""

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

GEMINI_MODEL = "gemini-2.5-flash"
BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
TIMEOUT = 90
SLEEP = 0.5
MAX_RETRIES = 3
BATCH_SIZE = 8

DATA_FILE = Path(__file__).parent.parent / "public" / "data" / "TROPESS_analyzed.json"
CACHE_FILE = Path(__file__).parent / "classify_paper_type_cache.json"

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a scientific literature classifier for the TROPESS satellite data project.
TROPESS (TRopospheric Ozone and its Precursors from Earth System Sounding) is a NASA JPL product
that retrieves trace gas vertical profiles (CO, CH4, NH3, O3, PAN, HDO/H2O, temperature) from
CrIS, AIRS, and combined satellite instruments (MUSES algorithm).

For each paper, determine ALL FOUR of the following:

1. research_domain — pick the SINGLE best-fitting domain from:
   "Tropospheric Composition Retrievals" | "Trace Gas Products" |
   "Atmospheric Chemistry & Reanalysis" | "Wildfire & Biomass Burning Emissions" |
   "Air Quality & Megacity Studies" | "Carbon Cycle & Flux Inversions" |
   "Validation & Intercomparison" | "Radiative Transfer & Forward Modeling" |
   "General Science"

2. engagement_level — pick ONE of:
   "Review Paper"    — survey/overview/synthesis/perspective paper
   "Data Usage"      — actively uses TROPESS, CrIS, AIRS, MUSES, or closely related
                       satellite retrievals as a primary data source
   "Citation" — merely references TROPESS/related instruments in passing

3. paper_type — pick ONE of:
   "algorithm" — focuses on retrieval methodology, instrument calibration, forward
                 models, radiative transfer, data processing, satellite product
                 validation, or measurement technique development
   "science"   — uses satellite/model data to study atmospheric processes,
                 chemistry, climate, air quality, emissions, carbon cycle,
                 wildfires, or other Earth science phenomena

4. engagement_level_rationale — 1-2 sentences citing evidence from title/abstract
5. paper_type_rationale       — 1-2 sentences citing evidence from title/abstract

Respond with a JSON array. Each element must have exactly:
  paper_id, research_domain, engagement_level, paper_type,
  engagement_level_rationale, paper_type_rationale"""


def build_prompt(papers):
    items = []
    for p in papers:
        abstract = (p.get("abstract") or "")[:700]
        items.append({
            "paper_id": p.get("paper_id", ""),
            "title": p.get("title", ""),
            "venue": p.get("venue", ""),
            "abstract_excerpt": abstract or "(no abstract)",
        })
    return (
        "Classify these papers. Return a JSON array, one object per paper.\n\n"
        + json.dumps(items, indent=2)
    )


def call_gemini(prompt, api_key):
    url = f"{BASE_URL}/{GEMINI_MODEL}:generateContent?key={api_key}"
    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }
    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.post(url, json=payload, timeout=TIMEOUT)
            resp.raise_for_status()
            raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(raw)
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)
            else:
                raise RuntimeError(f"Gemini failed after {MAX_RETRIES} attempts: {e}")


def find_newly_abstracted_ids(from_commit):
    """Compare current data to a prior git commit to find paper_ids that gained abstracts."""
    result = subprocess.run(
        ["git", "show", f"{from_commit}:public/data/TROPESS_analyzed.json"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        sys.exit(f"git show failed: {result.stderr}")
    old_data = json.loads(result.stdout)
    old_by_id = {p.get("paper_id"): p for p in old_data}

    with open(DATA_FILE) as f:
        new_data = json.load(f)

    ids = []
    for p in new_data:
        pid = p.get("paper_id")
        old_abstract = str(old_by_id.get(pid, {}).get("abstract") or "")
        new_abstract = str(p.get("abstract") or "")
        if len(old_abstract) <= 20 and len(new_abstract) > 20:
            ids.append(pid)
    return ids


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--from-commit", default="af3fa31",
                        help="Git commit SHA before abstract enrichment (default: af3fa31)")
    parser.add_argument("--ids-file", help="JSON file with list of paper_ids to reclassify")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sample", type=int, default=0)
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        sys.exit("GEMINI_API_KEY not set")

    # Determine which paper_ids to reclassify
    if args.ids_file:
        with open(args.ids_file) as f:
            target_ids = set(json.load(f))
    else:
        target_ids = set(find_newly_abstracted_ids(args.from_commit))

    print(f"Target paper_ids to reclassify: {len(target_ids)}")

    with open(DATA_FILE) as f:
        data = json.load(f)

    papers_to_process = [p for p in data if p.get("paper_id") in target_ids]
    if args.sample:
        papers_to_process = papers_to_process[:args.sample]

    print(f"Papers found in data: {len(papers_to_process)}")
    if not papers_to_process:
        print("Nothing to process.")
        return

    if args.dry_run:
        print("\n[dry-run] First batch prompt:")
        print(build_prompt(papers_to_process[:3]))
        return

    # Load existing paper_type cache
    cache = {}
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            cache = json.load(f)

    # Remove target IDs from cache so they get reprocessed
    removed_from_cache = sum(1 for pid in target_ids if pid in cache)
    for pid in target_ids:
        cache.pop(pid, None)
    print(f"Removed {removed_from_cache} entries from paper_type cache for reprocessing")

    # Process in batches
    results_map = {}
    batches = [papers_to_process[i:i+BATCH_SIZE]
               for i in range(0, len(papers_to_process), BATCH_SIZE)]
    success = 0
    errors = 0

    for bi, batch in enumerate(batches):
        print(f"Batch {bi+1}/{len(batches)} ({len(batch)} papers)...", end=" ", flush=True)
        try:
            results = call_gemini(build_prompt(batch), api_key)
            if not isinstance(results, list):
                print(f"WARN: unexpected response type {type(results)}")
                errors += 1
                continue
            for r in results:
                pid = r.get("paper_id", "")
                if pid:
                    results_map[pid] = r
                    cache[pid] = {
                        "paper_type": r.get("paper_type", ""),
                        "paper_type_rationale": r.get("paper_type_rationale", ""),
                        "engagement_level_rationale": r.get("engagement_level_rationale", ""),
                    }
            print(f"ok ({len(results)} classified)")
            success += len(results)
        except RuntimeError as e:
            print(f"ERROR: {e}")
            errors += 1
        time.sleep(SLEEP)

    # Save updated cache
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)
    print(f"\nCache updated: {len(cache)} entries")

    # Apply reclassifications to data
    applied = 0
    domain_changes = 0
    engagement_changes = 0
    type_changes = 0

    data_by_id = {p.get("paper_id"): p for p in data}

    for pid, r in results_map.items():
        p = data_by_id.get(pid)
        if not p:
            continue
        old_domain = p.get("research_domain", "")
        old_engagement = p.get("engagement_level", "")
        old_type = p.get("paper_type", "")

        new_domain = r.get("research_domain", "")
        new_engagement = r.get("engagement_level", "")
        new_type = r.get("paper_type", "")

        if new_domain and new_domain != old_domain:
            p["research_domain"] = new_domain
            domain_changes += 1

        if new_engagement and new_engagement != old_engagement:
            p["engagement_level"] = new_engagement
            engagement_changes += 1

        if new_type and new_type != old_type:
            p["paper_type"] = new_type
            type_changes += 1

        if r.get("engagement_level_rationale"):
            p["engagement_level_rationale"] = r["engagement_level_rationale"]
        if r.get("paper_type_rationale"):
            p["paper_type_rationale"] = r["paper_type_rationale"]

        applied += 1

    print(f"\nApplied to {applied} papers:")
    print(f"  research_domain changes: {domain_changes}")
    print(f"  engagement_level changes: {engagement_changes}")
    print(f"  paper_type changes: {type_changes}")

    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Saved to {DATA_FILE}")

    if errors:
        print(f"\nWARN: {errors} batches had errors — re-run to retry")


if __name__ == "__main__":
    main()
