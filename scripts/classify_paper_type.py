#!/usr/bin/env python3
"""
Classify TROPESS citing papers as 'algorithm' or 'science' and generate
rationale for both paper_type and engagement_level.

Fields added to each entry:
  paper_type            : 'algorithm' | 'science'
  paper_type_rationale  : explanation citing title/abstract/venue evidence
  engagement_level_rationale : explanation for the existing engagement_level

Usage:
    python scripts/classify_paper_type.py --dry-run --sample 5
    python scripts/classify_paper_type.py
    python scripts/classify_paper_type.py --rerun   # reprocess all, overwriting cache
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

from llm_client import call_llm

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SLEEP_BETWEEN_BATCHES = 0.5
BATCH_SIZE = 10

DATA_FILE = Path(__file__).parent.parent / "public" / "data" / "TROPESS_analyzed.json"
CACHE_FILE = Path(__file__).parent / "classify_paper_type_cache.json"

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a scientific literature classifier for the TROPESS satellite data project.
TROPESS (TRopospheric Ozone and its Precursors from Earth System Sounding) is a NASA JPL product
that retrieves trace gas vertical profiles (CO, CH4, NH3, O3, PAN, HDO/H2O, temperature) from
CrIS, AIRS, and combined satellite instruments.

Classify each paper into exactly ONE of:
  - "algorithm": focuses on retrieval methodology, instrument calibration, forward models,
    radiative transfer, data processing pipelines, validation of satellite products,
    measurement technique development, or satellite instrument design.
  - "science": uses satellite/model data primarily to understand atmospheric processes,
    chemistry, climate, air quality, emissions, carbon cycle, wildfires, hydrology,
    or other Earth science phenomena.

Also explain the existing engagement_level:
  - "Citation": briefly references TROPESS or related satellite products without
    detailed analysis or use of the data.
  - "Data Usage": actively uses TROPESS or closely related satellite retrievals as a
    primary data source in the analysis.
  - "Review Paper": is a survey or review article covering the field broadly.

Respond with a JSON array. Each element must have exactly these keys:
  paper_id, paper_type, paper_type_rationale, engagement_level_rationale

Keep each rationale concise (1-2 sentences), citing specific evidence from the title,
abstract, or venue. Do not invent information not present in the input."""

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
            "research_domain": p.get("research_domain", ""),
            "engagement_level": p.get("engagement_level", ""),
            "abstract_excerpt": abstract,
        })
    return (
        "Classify these papers. Return a JSON array with one object per paper.\n\n"
        + json.dumps(items, indent=2)
    )

# ---------------------------------------------------------------------------
# LLM call
# ---------------------------------------------------------------------------

def classify(prompt, temperature=0.1):
    """Classify a batch prompt via the shared Bedrock client. Returns parsed JSON."""
    return call_llm(prompt, system=SYSTEM_PROMPT, temperature=temperature)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sample", type=int, default=0)
    parser.add_argument("--rerun", action="store_true", help="Reprocess all, overwriting cache")
    args = parser.parse_args()

    with open(DATA_FILE) as f:
        data = json.load(f)

    # Load cache
    cache = {}
    if CACHE_FILE.exists() and not args.rerun:
        with open(CACHE_FILE) as f:
            cache = json.load(f)
        print(f"Loaded {len(cache)} cached results")

    papers = data
    if args.sample:
        papers = data[:args.sample]

    # Identify papers needing processing
    todo = [p for p in papers if p.get("paper_id", "") not in cache]
    done = len(papers) - len(todo)
    print(f"Total: {len(papers)} | Already cached: {done} | To process: {len(todo)}")

    if args.dry_run:
        print("Dry-run: showing first batch prompt")
        batch = todo[:min(BATCH_SIZE, len(todo))]
        print(build_batch_prompt(batch))
        return

    if not todo:
        print("All papers already classified, applying cache to data...")
    else:
        # Process in batches
        batches = [todo[i:i+BATCH_SIZE] for i in range(0, len(todo), BATCH_SIZE)]
        for bi, batch in enumerate(batches):
            print(f"Batch {bi+1}/{len(batches)} ({len(batch)} papers)...", end=" ", flush=True)
            prompt = build_batch_prompt(batch)
            try:
                results = classify(prompt)
                if not isinstance(results, list):
                    print(f"WARN: unexpected response type {type(results)}, skipping")
                    continue
                for r in results:
                    pid = r.get("paper_id", "")
                    if pid:
                        cache[pid] = r
                print(f"ok ({len(results)} classified)")
            except RuntimeError as e:
                print(f"ERROR: {e}")
            time.sleep(SLEEP_BETWEEN_BATCHES)

        # Save cache
        with open(CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)
        print(f"Cache saved: {len(cache)} entries")

    # Apply cache to data
    applied = 0
    missing = 0
    for p in data:
        pid = p.get("paper_id", "")
        if pid in cache:
            r = cache[pid]
            p["paper_type"] = r.get("paper_type", "")
            p["paper_type_rationale"] = r.get("paper_type_rationale", "")
            p["engagement_level_rationale"] = r.get("engagement_level_rationale", "")
            applied += 1
        else:
            missing += 1

    print(f"Applied: {applied} | Missing from cache: {missing}")

    # Summary
    from collections import Counter
    pt = Counter(p.get("paper_type", "") for p in data)
    print(f"paper_type distribution: {dict(pt)}")

    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Saved {DATA_FILE}")


if __name__ == "__main__":
    main()
