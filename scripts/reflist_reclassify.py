#!/usr/bin/env python3
"""
Reclassify 'Citation' and 'Simple Citation' TROPESS papers using reference list analysis.

Pipeline:
  1. Resolve OpenAlex IDs for the 27 TROPESS team papers (seed papers)
  2. Batch-fetch referenced_works for all Citation/Simple Citation papers
  3. For each paper, identify which team papers appear in its reference list
  4. Run Gemini with abstract + reference evidence → final engagement_level

Engagement levels (3-tier TROPESS system):
  Review Paper    — survey/overview/synthesis
  Data Usage      — actively uses TROPESS/CrIS/AIRS/MUSES data products
  Citation — mentions TROPESS-related work in passing

Usage:
    python scripts/reflist_reclassify.py --dry-run
    python scripts/reflist_reclassify.py [--sample N] [--rerun]
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DATA_FILE  = Path(__file__).parent.parent / "public" / "data" / "TROPESS_analyzed.json"
CACHE_FILE = Path(__file__).parent / "reflist_cache.json"

OPENALEX_BASE = "https://api.openalex.org"
USER_AGENT    = "science-model-dashboard/1.0 (mailto:yunkss@gmail.com)"

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_BASE  = "https://generativelanguage.googleapis.com/v1beta/models"
TIMEOUT      = 90
SLEEP        = 0.12   # ~8 req/s — within OpenAlex polite-pool limit
BATCH_SIZE   = 8

TARGET_LEVELS = {"Citation"}

# ---------------------------------------------------------------------------
# OpenAlex helpers
# ---------------------------------------------------------------------------

def oa_get(url, params=None):
    headers = {"User-Agent": USER_AGENT}
    r = requests.get(url, params=params, headers=headers, timeout=20)
    if r.status_code == 429:
        print("  [OpenAlex] rate-limited, sleeping 15s")
        time.sleep(15)
        r = requests.get(url, params=params, headers=headers, timeout=20)
    r.raise_for_status()
    return r.json()


def resolve_team_paper_ids(team_titles):
    """Search OpenAlex for each team paper title → return {title: openalex_id}.
    Uses free-text ?search= endpoint which tolerates special characters."""
    resolved = {}
    for title in team_titles:
        # Use first 8 significant words as query
        words = [w for w in title.split() if len(w) > 4][:8]
        query = " ".join(words)
        try:
            data = oa_get(f"{OPENALEX_BASE}/works", params={
                "search": query,
                "select": "id,title,doi",
                "per_page": 5,
            })
            for work in data.get("results", []):
                wt = (work.get("title") or "").lower()
                # Accept if 3+ significant words match (titles may be truncated)
                hits = sum(1 for w in words if w.lower() in wt)
                if hits >= min(3, len(words)):
                    resolved[title] = work["id"]
                    break
        except Exception as e:
            print(f"  [team lookup] error for '{short}': {e}")
        time.sleep(SLEEP)
    return resolved


def fetch_references_batch(dois):
    """
    Fetch referenced_works for a list of DOIs using OpenAlex filter.
    Returns {doi: [openalex_ref_ids]}.
    """
    if not dois:
        return {}

    # OpenAlex accepts up to 100 DOIs per filter request
    result = {}
    chunk_size = 50
    for i in range(0, len(dois), chunk_size):
        chunk = dois[i:i + chunk_size]
        doi_filter = "|".join(chunk)
        try:
            data = oa_get(f"{OPENALEX_BASE}/works", params={
                "filter": f"doi:{doi_filter}",
                "select": "doi,referenced_works",
                "per_page": chunk_size,
            })
            for work in data.get("results", []):
                doi = (work.get("doi") or "").lower().replace("https://doi.org/", "")
                refs = work.get("referenced_works") or []
                result[doi] = refs
        except Exception as e:
            print(f"  [batch fetch] error on chunk {i//chunk_size}: {e}")
        time.sleep(SLEEP)
    return result


# ---------------------------------------------------------------------------
# Gemini helpers
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are classifying TROPESS satellite data citation papers into the 3-tier
engagement system:

  Review Paper    — survey/overview/synthesis papers covering the field broadly
  Data Usage      — papers that actively use TROPESS, CrIS, AIRS, MUSES, or closely
                    related satellite retrievals as a primary data source for analysis
  Citation — papers that merely mention TROPESS/related instruments in passing,
                    as background, or in an introduction/conclusion without actually
                    using the data

Additional reference-list evidence is provided for each paper: a list of TROPESS team
papers that appear in its bibliography. A paper that explicitly cites 1+ TROPESS data
product or algorithm papers is a strong candidate for Data Usage.

Respond with a JSON array. Each element must have exactly:
  paper_id, engagement_level, rationale

  engagement_level: "Review Paper" | "Data Usage" | "Citation"
  rationale: 1-2 sentences citing title/abstract/reference evidence."""


def build_gemini_prompt(papers_info):
    items = []
    for p in papers_info:
        items.append({
            "paper_id": p["paper_id"],
            "title": p["title"],
            "venue": p.get("venue", ""),
            "abstract_excerpt": (p.get("abstract") or "(no abstract)")[:600],
            "team_papers_cited": p.get("team_papers_cited", []),
            "team_papers_cited_count": len(p.get("team_papers_cited", [])),
        })
    return (
        "Classify these papers using the 3-tier engagement system.\n\n"
        + json.dumps(items, indent=2)
    )


def call_gemini(prompt, api_key):
    url = f"{GEMINI_BASE}/{GEMINI_MODEL}:generateContent?key={api_key}"
    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"},
    }
    for attempt in range(3):
        try:
            r = requests.post(url, json=payload, timeout=TIMEOUT)
            r.raise_for_status()
            raw = r.json()["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(raw)
        except Exception as e:
            if attempt < 2:
                time.sleep(2 ** attempt)
            else:
                raise RuntimeError(f"Gemini failed: {e}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sample", type=int, default=0)
    parser.add_argument("--rerun", action="store_true", help="Clear cache and reprocess all")
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        sys.exit("GEMINI_API_KEY not set")

    with open(DATA_FILE) as f:
        data = json.load(f)

    # Load / init cache  {paper_id: {engagement_level, rationale, refs_found}}
    cache = {}
    if CACHE_FILE.exists() and not args.rerun:
        with open(CACHE_FILE) as f:
            cache = json.load(f)
        print(f"Loaded cache: {len(cache)} entries")

    # ------------------------------------------------------------------ #
    # Step 1 — resolve team paper OpenAlex IDs
    # ------------------------------------------------------------------ #
    team_titles_raw = list({p.get("citing_team_paper", "") for p in data
                            if p.get("citing_team_paper")})
    print(f"\nStep 1: Resolving {len(team_titles_raw)} team papers via OpenAlex...")

    team_oa_ids = cache.get("__team_oa_ids__", {})
    missing_team = [t for t in team_titles_raw if t not in team_oa_ids]
    if missing_team and not args.dry_run:
        new_ids = resolve_team_paper_ids(missing_team)
        team_oa_ids.update(new_ids)
        cache["__team_oa_ids__"] = team_oa_ids
        print(f"  Resolved {len(new_ids)}/{len(missing_team)} new team papers")
    else:
        if args.dry_run and missing_team:
            print(f"  [dry-run] Would resolve {len(missing_team)} team paper IDs")

    # Set of all team paper OpenAlex IDs
    team_id_set = set(team_oa_ids.values())
    team_id_to_title = {v: k for k, v in team_oa_ids.items()}
    print(f"  Team paper OpenAlex IDs known: {len(team_id_set)}")

    # ------------------------------------------------------------------ #
    # Step 2 — fetch reference lists for target papers
    # ------------------------------------------------------------------ #
    target_papers = [p for p in data if p.get("engagement_level") in TARGET_LEVELS]
    if args.sample:
        target_papers = target_papers[:args.sample]

    print(f"\nStep 2: Fetching reference lists for {len(target_papers)} target papers...")

    ref_cache = cache.get("__ref_lists__", {})
    needs_refs = [p for p in target_papers
                  if p.get("doi") and p.get("doi").lower() not in ref_cache]

    if needs_refs and not args.dry_run:
        dois = [p["doi"].lower() for p in needs_refs]
        print(f"  Fetching {len(dois)} papers from OpenAlex (batches of 50)...")
        new_refs = fetch_references_batch(dois)
        ref_cache.update(new_refs)
        cache["__ref_lists__"] = ref_cache
        print(f"  Got reference lists for {len(new_refs)} papers")
    elif args.dry_run:
        print(f"  [dry-run] Would fetch reference lists for {len(needs_refs)} papers")

    # ------------------------------------------------------------------ #
    # Step 3 — annotate each paper with team papers found in its refs
    # ------------------------------------------------------------------ #
    papers_info = []
    ref_stats = {"0": 0, "1": 0, "2+": 0}

    for p in target_papers:
        doi = (p.get("doi") or "").lower()
        refs = ref_cache.get(doi, [])
        matched = [team_id_to_title.get(r, r) for r in refs if r in team_id_set]
        # Shorten titles for prompt
        matched_short = [t[:60] for t in matched]

        key = "2+" if len(matched) >= 2 else str(min(len(matched), 1))
        ref_stats[key] += 1

        papers_info.append({
            **p,
            "team_papers_cited": matched_short,
        })

    print(f"  Reference match summary: {ref_stats}")
    if args.dry_run:
        print("\n[dry-run] Sample prompt (first 2 papers):")
        print(build_gemini_prompt(papers_info[:2]))
        return

    # ------------------------------------------------------------------ #
    # Step 4 — Gemini reclassification
    # ------------------------------------------------------------------ #
    todo = [p for p in papers_info if p["paper_id"] not in cache]
    done = len(papers_info) - len(todo)
    print(f"\nStep 3: Gemini reclassification — {done} cached, {len(todo)} to process")

    if todo:
        batches = [todo[i:i+BATCH_SIZE] for i in range(0, len(todo), BATCH_SIZE)]
        success = 0
        for bi, batch in enumerate(batches):
            print(f"  Batch {bi+1}/{len(batches)} ({len(batch)})...", end=" ", flush=True)
            try:
                results = call_gemini(build_gemini_prompt(batch), api_key)
                for r in results:
                    pid = r.get("paper_id")
                    if pid:
                        cache[pid] = {
                            "engagement_level": r.get("engagement_level", ""),
                            "rationale": r.get("rationale", ""),
                        }
                        success += len(results)
                print(f"ok ({len(results)})")
            except RuntimeError as e:
                print(f"ERROR: {e}")
            time.sleep(SLEEP)

        with open(CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)
        print(f"  Cache saved ({len(cache)} entries)")
    else:
        # Always persist team IDs and ref lists even if no Gemini calls needed
        with open(CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)

    # ------------------------------------------------------------------ #
    # Step 5 — apply results to data
    # ------------------------------------------------------------------ #
    data_by_id = {p.get("paper_id"): p for p in data}
    changes = {"Data Usage": 0, "Citation": 0, "Review Paper": 0, "no change": 0}

    for pi in papers_info:
        pid = pi["paper_id"]
        if pid not in cache:
            continue
        r = cache[pid]
        p = data_by_id.get(pid)
        if not p:
            continue
        old_level = p.get("engagement_level", "")
        new_level = r.get("engagement_level", "")
        if new_level and new_level != old_level:
            changes[new_level] = changes.get(new_level, 0) + 1
            p["engagement_level"] = new_level
        else:
            changes["no change"] += 1
        if r.get("rationale"):
            p["engagement_level_rationale"] = r["rationale"]

    print(f"\nReclassification results:")
    for level, count in sorted(changes.items()):
        print(f"  {level}: {count}")

    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\nSaved to {DATA_FILE}")

    # Final distribution
    from collections import Counter
    final = Counter(p.get("engagement_level") for p in data)
    print("\nFinal engagement distribution:", dict(final))


if __name__ == "__main__":
    main()
