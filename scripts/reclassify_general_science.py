#!/usr/bin/env python3
"""
Reclassify papers labeled "General Science" across all models/missions.

Steps per model:
  1. Rename any "General Science" value to "Cross-Disciplinary" immediately.
  2. Build a vocabulary of existing domain labels used by the model.
  3. Send batches of those papers to Gemini with model-specific context,
     asking for the *most specific* applicable domain.
  4. Only keep "Cross-Disciplinary" when the paper genuinely spans several
     unrelated scientific fields (e.g., a methodology paper applied to
     hydrology, oceanography, and atmospheric science simultaneously).
  5. Update both `research_domain` (primary) and `research_domains` (multi-label).
  6. Save to the JSON file and cache results for incremental reruns.

Usage:
    python scripts/reclassify_general_science.py --model ECCO
    python scripts/reclassify_general_science.py --all
    python scripts/reclassify_general_science.py --all --dry-run
    python scripts/reclassify_general_science.py --model ISSM --sample 20
"""

import argparse
import json
import time
from collections import Counter
from pathlib import Path

from llm_client import call_llm

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TIMEOUT = 60
SLEEP_BETWEEN_REQUESTS = 1.0
BATCH_SIZE = 8

ALL_MODELS = [
    "CARDAMOM", "CMS-Flux", "ECCO", "EDMF", "GRACE",
    "ISSM", "LES", "MOMO-CHEM", "RAPID", "SWOT", "TROPESS",
]

DATA_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
CACHE_FILE = Path(__file__).parent / "reclassify_general_science_cache.json"

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

PROMPT_TEMPLATE = """\
You are a scientific paper domain classifier for a NASA/JPL science model dashboard.

Your job: re-classify papers that were previously labeled "General Science" into a \
more specific scientific domain. Each paper should get the most specific domain that \
genuinely applies.

IMPORTANT RULES:
- Only use "Cross-Disciplinary" if the paper *simultaneously* addresses 3+ distinct \
scientific fields with equal depth (e.g., a methods paper equally applicable to \
hydrology, oceanography, and atmospheric chemistry). This should be rare (<5% of papers).
- If a paper is *clearly off-topic* for the model (e.g., an ECCO ocean model paper \
that's actually about wheat genetics or religious philosophy), assign the most specific \
real domain it belongs to — do NOT assign the model's primary domain just because \
it's unrelated.
- Prefer domain names already in use by this model (listed below) to maintain \
consistency. You may introduce a new specific name if nothing fits.
- The primary domain should be the single most relevant domain.

Model: {model_name}
Existing domain labels used in this model (most frequent first):
{domain_list}

{papers_block}

Respond ONLY with valid JSON (no markdown fences, no explanation). Format:
[
  {{"id": 0, "primary_domain": "Hydrology", "all_domains": ["Hydrology", "Remote Sensing"]}},
  {{"id": 1, "primary_domain": "Cross-Disciplinary", "all_domains": ["Cross-Disciplinary"]}}
]
"""

PAPER_BLOCK = """\
Paper {idx}:
- Title: {title}
- Abstract: {abstract}
- Venue: {venue}
- Current label: General Science / Cross-Disciplinary"""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)


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
    return f"title:{title[:120]}"


def extract_text_fields(entry):
    title = entry.get("title", "")
    if isinstance(title, list):
        title = title[0] if title else ""

    abstract = entry.get("abstract", "") or ""
    if len(abstract) > 800:
        abstract = abstract[:800] + "..."

    venue = entry.get("venue", "") or entry.get("container-title", "")
    if isinstance(venue, list):
        venue = venue[0] if venue else ""

    return title, abstract, venue


def build_domain_list(data, top_n=40):
    """Collect the most frequent domain labels already in this model's data,
    excluding General Science / Cross-Disciplinary."""
    counts = Counter()
    skip = {"General Science", "Cross-Disciplinary", "Unknown", "Other", ""}
    for entry in data:
        d = entry.get("research_domain", "")
        if d and d not in skip:
            counts[d] += 1
        for d2 in entry.get("research_domains", []):
            if d2 and d2 not in skip:
                counts[d2] += 1
    top = [f'"{d}" ({c} papers)' for d, c in counts.most_common(top_n)]
    return "\n".join(f"  - {t}" for t in top) if top else "  (no existing domains found)"


def classify(prompt):
    """Make a single LLM call via the shared Bedrock client. Returns parsed JSON or None."""
    try:
        return call_llm(prompt, temperature=0.1)
    except RuntimeError as e:
        print(f"    LLM call error: {e}")
        return None


# ---------------------------------------------------------------------------
# Step 1: Rename "General Science" → "Cross-Disciplinary" in all fields
# ---------------------------------------------------------------------------

def rename_general_science(data):
    """In-place rename. Returns count of entries changed."""
    changed = 0
    for entry in data:
        modified = False
        if entry.get("research_domain") == "General Science":
            entry["research_domain"] = "Cross-Disciplinary"
            modified = True
        domains = entry.get("research_domains", [])
        new_domains = [
            "Cross-Disciplinary" if d == "General Science" else d
            for d in domains
        ]
        if new_domains != domains:
            entry["research_domains"] = new_domains
            modified = True
        if modified:
            changed += 1
    return changed


# ---------------------------------------------------------------------------
# Core processing
# ---------------------------------------------------------------------------

def build_batch_prompt(model_name, domain_list, entries_with_idx):
    blocks = []
    for local_idx, (_, entry) in enumerate(entries_with_idx):
        title, abstract, venue = extract_text_fields(entry)
        blocks.append(PAPER_BLOCK.format(
            idx=local_idx,
            title=title or "(no title)",
            abstract=abstract or "(no abstract)",
            venue=venue or "(no venue)",
        ))
    papers_block = "\n\n".join(blocks)
    return PROMPT_TEMPLATE.format(
        model_name=model_name,
        domain_list=domain_list,
        papers_block=papers_block,
    )


def process_model(model_name, cache, batch_size=BATCH_SIZE,
                  sample=None, dry_run=False):
    data_file = DATA_DIR / f"{model_name}_analyzed.json"
    if not data_file.exists():
        print(f"  ERROR: {data_file} not found")
        return

    with open(data_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Step 1: rename
    renamed = rename_general_science(data)
    print(f"  {model_name}: {len(data)} papers total, {renamed} renamed General Science → Cross-Disciplinary")

    # Identify papers that are still "Cross-Disciplinary" and need reclassification
    targets = [
        (i, entry) for i, entry in enumerate(data)
        if entry.get("research_domain") == "Cross-Disciplinary"
    ]

    if not targets:
        print("  No Cross-Disciplinary papers to reclassify.")
        if not dry_run and renamed > 0:
            with open(data_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print("  File saved (rename only).")
        return

    # Build domain vocabulary from existing data
    domain_list = build_domain_list(data)

    # Split into uncached and cached
    to_process = []
    applied_from_cache = 0
    for global_idx, entry in targets:
        key = get_entry_key(entry)
        if key in cache:
            cached = cache[key]
            data[global_idx]["research_domain"] = cached["primary_domain"]
            data[global_idx]["research_domains"] = cached["all_domains"]
            applied_from_cache += 1
        else:
            to_process.append((global_idx, entry))

    print(f"  Cross-Disciplinary targets: {len(targets)} "
          f"({applied_from_cache} from cache, {len(to_process)} need API)")

    if sample and len(to_process) > sample:
        to_process = to_process[:sample]
        print(f"  (limited to sample of {sample})")

    if dry_run:
        print("  DRY RUN — skipping API calls")
        if to_process:
            prompt = build_batch_prompt(
                model_name, domain_list,
                to_process[:min(batch_size, len(to_process))]
            )
            print(f"  Sample prompt ({len(prompt)} chars, first 800 chars):")
            print(prompt[:800])
        return

    # Apply cached results even if no new processing needed
    if not to_process:
        with open(data_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("  All cached — file updated.")
        return

    # Process in batches
    total_batches = (len(to_process) + batch_size - 1) // batch_size
    processed = 0
    errors = 0
    cross_disciplinary_kept = 0

    for batch_idx in range(total_batches):
        start = batch_idx * batch_size
        end = min(start + batch_size, len(to_process))
        batch = to_process[start:end]

        print(f"  Batch {batch_idx + 1}/{total_batches} "
              f"(papers {start + 1}–{end}/{len(to_process)})", end="", flush=True)

        prompt = build_batch_prompt(model_name, domain_list, batch)
        result = classify(prompt)

        if result and isinstance(result, list):
            for item in result:
                local_id = item.get("id")
                primary = item.get("primary_domain", "Cross-Disciplinary")
                all_domains = item.get("all_domains", [primary])

                if not isinstance(primary, str) or not primary.strip():
                    primary = "Cross-Disciplinary"
                if not isinstance(all_domains, list):
                    all_domains = [primary]
                all_domains = [d for d in all_domains if isinstance(d, str) and d.strip()]
                if not all_domains:
                    all_domains = [primary]

                if local_id is not None and 0 <= local_id < len(batch):
                    global_idx, entry = batch[local_id]
                    data[global_idx]["research_domain"] = primary
                    data[global_idx]["research_domains"] = all_domains
                    cache[get_entry_key(entry)] = {
                        "primary_domain": primary,
                        "all_domains": all_domains,
                    }
                    processed += 1
                    if primary == "Cross-Disciplinary":
                        cross_disciplinary_kept += 1

            print(f" ✓ {len(result)} classified")
        else:
            # Fallback to individual calls
            print(f" → batch failed, trying individually...")
            for local_id, (global_idx, entry) in enumerate(batch):
                single_prompt = build_batch_prompt(model_name, domain_list, [(global_idx, entry)])
                single_result = classify(single_prompt)
                if single_result and isinstance(single_result, list) and single_result:
                    item = single_result[0]
                    primary = item.get("primary_domain", "Cross-Disciplinary")
                    all_domains = item.get("all_domains", [primary])
                    if not isinstance(primary, str):
                        primary = "Cross-Disciplinary"
                    if not isinstance(all_domains, list):
                        all_domains = [primary]
                    all_domains = [d for d in all_domains if isinstance(d, str)]
                    data[global_idx]["research_domain"] = primary
                    data[global_idx]["research_domains"] = all_domains
                    cache[get_entry_key(entry)] = {
                        "primary_domain": primary,
                        "all_domains": all_domains,
                    }
                    processed += 1
                    if primary == "Cross-Disciplinary":
                        cross_disciplinary_kept += 1
                else:
                    errors += 1
                time.sleep(SLEEP_BETWEEN_REQUESTS)

        # Checkpoint every 10 batches
        if (batch_idx + 1) % 10 == 0:
            save_cache(cache)
            with open(data_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"    [checkpoint saved]")

        time.sleep(SLEEP_BETWEEN_REQUESTS)

    # Final save
    save_cache(cache)
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    total_reclassified = processed - cross_disciplinary_kept
    print(f"\n  {model_name} summary:")
    print(f"    Processed:          {processed}")
    print(f"    Reclassified away:  {total_reclassified}")
    print(f"    Kept Cross-Disc.:   {cross_disciplinary_kept}")
    print(f"    Errors:             {errors}")

    # Show new domain distribution for formerly-General-Science papers
    new_domains = Counter(
        data[global_idx]["research_domain"]
        for global_idx, _ in targets
    )
    print(f"  New domain breakdown (top 15):")
    for domain, count in new_domains.most_common(15):
        print(f"    {count:4d}  {domain}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Reclassify "General Science" papers; rename to "Cross-Disciplinary"'
    )
    parser.add_argument("--model", type=str, help="Process a specific model")
    parser.add_argument("--all", action="store_true", help="Process all models")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE,
                        help=f"Papers per Gemini call (default: {BATCH_SIZE})")
    parser.add_argument("--sample", type=int, default=None,
                        help="Only process first N uncached papers (for testing)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would happen without calling the API")
    args = parser.parse_args()

    if not args.model and not args.all:
        parser.error("Specify --model NAME or --all")

    cache = load_cache()
    print(f"Cache: {len(cache)} entries loaded from {CACHE_FILE}")

    models = ALL_MODELS if args.all else [args.model]

    for model_name in models:
        print(f"\n{'=' * 60}")
        print(f"Processing {model_name}")
        print(f"{'=' * 60}")
        process_model(
            model_name, cache,
            batch_size=args.batch_size,
            sample=args.sample,
            dry_run=args.dry_run,
        )

    print(f"\nCache: {len(cache)} total entries saved")
    print("Done.")


if __name__ == "__main__":
    main()
