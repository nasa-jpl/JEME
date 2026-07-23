#!/usr/bin/env python3
"""
Re-evaluate 'Simple Citation' papers for potential reclassification to 'Data Usage'.

Uses Gemini to assess whether a paper that was labeled Simple Citation actually
uses TROPESS or related satellite data products in its analysis.

Adds/updates:
  engagement_level          : may change from 'Simple Citation' to 'Data Usage'
  engagement_level_rationale: updated explanation with reclassification reasoning

Usage:
    python scripts/reclassify_engagement.py --dry-run --sample 5
    python scripts/reclassify_engagement.py
    python scripts/reclassify_engagement.py --rerun   # reprocess all Simple Citations
"""

import argparse
import json
import time
from pathlib import Path

from llm_client import call_llm

TIMEOUT = 60
SLEEP = 0.5
BATCH_SIZE = 8

DATA_FILE = Path(__file__).parent.parent / "public" / "data" / "TROPESS_analyzed.json"
CACHE_FILE = Path(__file__).parent / "reclassify_engagement_cache.json"

SYSTEM_PROMPT = """You are reviewing citation papers for the TROPESS satellite data project.
TROPESS retrieves trace gas profiles (CO, CH4, NH3, O3, PAN, HDO/H2O, temperature) from
CrIS, AIRS, and combined satellite instruments.

Related instruments and products that count as TROPESS-adjacent data usage:
- CrIS, AIRS, MUSES, TROPOMI, OMI, MOPITT, TES (infrared sounders/tropospheric instruments)
- AIRS + OMI synergy products
- Any TROPESS/CrIS/AIRS retrieved profile data
- Reanalysis products that assimilate these satellite data (TCR-2, etc.)

Your task: determine whether each paper's engagement level should stay as 'Simple Citation'
or be upgraded to 'Data Usage'.

Definition:
- 'Simple Citation': merely references TROPESS/related products as context, background,
  or in a literature list, without actually using the data in the paper's analysis.
- 'Data Usage': actively ingests, compares against, validates with, or builds upon
  TROPESS or a closely related satellite product as a primary or significant data source.

Respond with a JSON array. Each element must have exactly:
  paper_id, new_engagement_level, rationale

  new_engagement_level: 'Data Usage' or 'Simple Citation' (no other values)
  rationale: 1-2 sentences citing specific evidence from title/abstract for the decision.
             If upgrading, quote the specific phrase that shows active data use.
             If keeping Simple Citation, briefly say why it does not qualify."""


def build_batch_prompt(papers):
    items = []
    for p in papers:
        abstract = p.get("abstract") or ""
        if abstract and abstract != "None":
            abstract = abstract[:600]
        else:
            abstract = "(no abstract available)"
        items.append({
            "paper_id": p.get("paper_id", ""),
            "title": p.get("title", ""),
            "venue": p.get("venue", ""),
            "current_engagement_level": p.get("engagement_level", "Citation"),
            "current_rationale": p.get("engagement_level_rationale", ""),
            "abstract_excerpt": abstract,
        })
    return (
        "Review these papers currently labeled 'Simple Citation'. "
        "Determine whether each should be reclassified to 'Data Usage'.\n\n"
        + json.dumps(items, indent=2)
    )


def classify(prompt):
    """Classify a batch prompt via the shared Bedrock client. Returns parsed JSON."""
    return call_llm(prompt, system=SYSTEM_PROMPT, temperature=0.1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sample", type=int, default=0)
    parser.add_argument("--rerun", action="store_true")
    args = parser.parse_args()

    with open(DATA_FILE) as f:
        data = json.load(f)

    cache = {}
    if CACHE_FILE.exists() and not args.rerun:
        with open(CACHE_FILE) as f:
            cache = json.load(f)
        print(f"Loaded {len(cache)} cached results")

    # Only look at Simple Citation papers
    simple_papers = [p for p in data if p.get("engagement_level") == "Citation"]
    print(f"Total Simple Citation papers: {len(simple_papers)}")

    if args.sample:
        simple_papers = simple_papers[:args.sample]

    todo = [p for p in simple_papers if p.get("paper_id", "") not in cache]
    print(f"To process: {len(todo)} | Already cached: {len(simple_papers) - len(todo)}")

    if args.dry_run:
        batch = todo[:min(BATCH_SIZE, len(todo))]
        print("Dry-run batch prompt:")
        print(build_batch_prompt(batch))
        return

    if todo:
        batches = [todo[i:i+BATCH_SIZE] for i in range(0, len(todo), BATCH_SIZE)]
        for bi, batch in enumerate(batches):
            print(f"Batch {bi+1}/{len(batches)} ({len(batch)} papers)...", end=" ", flush=True)
            try:
                results = classify(build_batch_prompt(batch))
                if isinstance(results, list):
                    for r in results:
                        pid = r.get("paper_id", "")
                        if pid:
                            cache[pid] = r
                    print(f"ok ({len(results)} reviewed)")
                else:
                    print(f"WARN: unexpected type {type(results)}")
            except RuntimeError as e:
                print(f"ERROR: {e}")
            time.sleep(SLEEP)

        with open(CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)
        print(f"Cache saved: {len(cache)} entries")

    # Apply results
    reclassified = 0
    for p in data:
        pid = p.get("paper_id", "")
        if pid in cache:
            r = cache[pid]
            new_level = r.get("new_engagement_level", "")
            if new_level == "Data Usage" and p.get("engagement_level") == "Citation":
                p["engagement_level"] = "Data Usage"
                p["engagement_level_rationale"] = r.get("rationale", "")
                reclassified += 1
            elif new_level == "Citation":
                # Update rationale even if level stays the same
                if r.get("rationale"):
                    p["engagement_level_rationale"] = r.get("rationale", "")

    from collections import Counter
    el = Counter(p.get("engagement_level", "") for p in data)
    print(f"Reclassified Simple Citation → Data Usage: {reclassified}")
    print(f"Final engagement level distribution: {dict(el)}")

    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Saved {DATA_FILE}")


if __name__ == "__main__":
    main()
