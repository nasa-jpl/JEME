#!/usr/bin/env python3
"""
Extract multi-label research domains for each paper using Gemini.

For each citation entry, asks Gemini to identify all relevant research domains
(up to 10) that the paper touches. Results are stored as a `research_domains`
array on each entry (the existing single `research_domain` field is kept).

Usage:
    python scripts/extract_research_domains.py --model RAPID
    python scripts/extract_research_domains.py --model RAPID --sample 20 --dry-run
    python scripts/extract_research_domains.py --all
    python scripts/extract_research_domains.py --all --batch-size 10
"""

import argparse
import json
import time
from pathlib import Path

from llm_client import call_llm

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TIMEOUT = 60
SLEEP_BETWEEN_REQUESTS = 1.0
MAX_RETRIES = 5
BATCH_SIZE = 5  # papers per Gemini call

ALL_MODELS = [
    "CARDAMOM", "CMS-Flux", "ECCO", "EDMF", "GRACE",
    "ISSM", "LES", "MOMO-CHEM", "RAPID", "SWOT",
]

DATA_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
CACHE_FILE = Path(__file__).parent / "domain_extraction_cache.json"

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

PROMPT_TEMPLATE = """You are a scientific paper classifier. For each paper below, identify ALL research domains it belongs to. A paper can belong to multiple domains.

Return up to 10 relevant domains per paper, ordered from most to least relevant. Only include domains that genuinely apply — do not pad to 10 if fewer are relevant.

Use specific, standardized domain names. Examples of good domain names:
- "Hydrology & Water Resources"
- "Ocean Circulation"
- "Climate Modeling"
- "Remote Sensing"
- "Machine Learning"
- "Cryosphere & Glaciology"
- "Atmospheric Science"
- "Biogeochemistry"
- "Geodesy & Gravity"
- "Sea Level Change"
- "Data Assimilation"
- "Numerical Methods"
- "Ecosystem Science"
- "Air Quality"
- "Carbon Cycle"
- "Flood Modeling"
- "River Routing"
- "Ice Sheet Dynamics"
- "Coastal Dynamics"
- "Geophysics"
- "Weather Prediction"
- "Satellite Altimetry"
- "Boundary Layer Turbulence"
- "Chemical Transport"
- "Fire & Smoke Modeling"
- "Water Resource Management"
- "Polar Oceanography"
- "Convection & Cloud Physics"
- "Soil Science"
- "Wind Energy"

Use these as a guide but you may use other specific domain names when appropriate. Be consistent in naming across papers.

{papers_block}

Respond ONLY with valid JSON (no markdown fences, no explanation). Format:
[
  {{"id": 0, "domains": ["Domain A", "Domain B", ...]}},
  {{"id": 1, "domains": ["Domain C", "Domain D", ...]}}
]
"""

SINGLE_PAPER_BLOCK = """Paper {idx}:
- Title: {title}
- Abstract: {abstract}
- Venue: {venue}"""

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


def llm_domains(prompt):
    """Make a single LLM call via the shared Bedrock client. Returns parsed JSON or None."""
    try:
        return call_llm(prompt, temperature=0.2)
    except RuntimeError as e:
        print(f"    LLM call error: {e}")
        return None


# ---------------------------------------------------------------------------
# Core processing
# ---------------------------------------------------------------------------

def build_batch_prompt(entries_with_idx):
    """Build a prompt for a batch of papers."""
    blocks = []
    for local_idx, (_, entry) in enumerate(entries_with_idx):
        title, abstract, venue = extract_text_fields(entry)
        blocks.append(SINGLE_PAPER_BLOCK.format(
            idx=local_idx,
            title=title or "(no title)",
            abstract=abstract or "(no abstract)",
            venue=venue or "(no venue)",
        ))

    papers_block = "\n\n".join(blocks)
    return PROMPT_TEMPLATE.format(papers_block=papers_block)


def process_model(model_name, cache, batch_size=BATCH_SIZE,
                   sample=None, dry_run=False):
    """Process all papers for a model."""
    data_file = DATA_DIR / f"{model_name}_analyzed.json"
    if not data_file.exists():
        print(f"  ERROR: {data_file} not found")
        return

    with open(data_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"  {model_name}: {len(data)} papers total")

    # Determine which entries need processing
    to_process = []
    already_cached = 0
    for i, entry in enumerate(data):
        key = get_entry_key(entry)
        if key in cache:
            already_cached += 1
            # Apply cached result
            data[i]["research_domains"] = cache[key]
        else:
            to_process.append((i, entry))

    if sample and len(to_process) > sample:
        to_process = to_process[:sample]

    print(f"  {already_cached} cached, {len(to_process)} to process")

    if dry_run:
        print("  DRY RUN — skipping API calls")
        if to_process:
            prompt = build_batch_prompt(to_process[:min(batch_size, len(to_process))])
            print(f"  Sample prompt ({len(prompt)} chars):")
            print(prompt[:500])
        return

    if not to_process:
        # Still save file to apply cached results
        with open(data_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  All cached — file updated")
        return

    # Process in batches
    total_batches = (len(to_process) + batch_size - 1) // batch_size
    processed = 0
    errors = 0

    for batch_idx in range(total_batches):
        start = batch_idx * batch_size
        end = min(start + batch_size, len(to_process))
        batch = to_process[start:end]

        print(f"  Batch {batch_idx + 1}/{total_batches} "
              f"(papers {start + 1}-{end}/{len(to_process)})", end="", flush=True)

        prompt = build_batch_prompt(batch)
        result = llm_domains(prompt)

        if result and isinstance(result, list):
            for item in result:
                local_id = item.get("id")
                domains = item.get("domains", [])
                if local_id is not None and 0 <= local_id < len(batch):
                    global_idx, entry = batch[local_id]
                    # Validate domains is a list of strings
                    if isinstance(domains, list):
                        domains = [d for d in domains if isinstance(d, str)]
                    else:
                        domains = []
                    data[global_idx]["research_domains"] = domains
                    cache[get_entry_key(entry)] = domains
                    processed += 1
            print(f" -> {len(result)} classified")
        else:
            # Fallback: try single-paper calls for this batch
            print(f" -> batch failed, trying individually...")
            for local_id, (global_idx, entry) in enumerate(batch):
                single_prompt = build_batch_prompt([(global_idx, entry)])
                single_result = llm_domains(single_prompt)
                if single_result and isinstance(single_result, list) and len(single_result) > 0:
                    domains = single_result[0].get("domains", [])
                    if isinstance(domains, list):
                        domains = [d for d in domains if isinstance(d, str)]
                    else:
                        domains = []
                    data[global_idx]["research_domains"] = domains
                    cache[get_entry_key(entry)] = domains
                    processed += 1
                else:
                    errors += 1
                    data[global_idx]["research_domains"] = []
                time.sleep(SLEEP_BETWEEN_REQUESTS)

        # Save cache periodically (every 10 batches)
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

    print(f"  Done: {processed} classified, {errors} errors")

    # Print domain distribution
    all_domains = {}
    for entry in data:
        for d in entry.get("research_domains", []):
            all_domains[d] = all_domains.get(d, 0) + 1
    print(f"  Unique domains found: {len(all_domains)}")
    for domain, count in sorted(all_domains.items(), key=lambda x: -x[1])[:15]:
        pct = 100.0 * count / len(data)
        print(f"    {domain}: {count} ({pct:.1f}%)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Extract multi-label research domains using Gemini"
    )
    parser.add_argument("--model", type=str, help="Process a specific model")
    parser.add_argument("--all", action="store_true", help="Process all models")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE,
                        help=f"Papers per Gemini call (default: {BATCH_SIZE})")
    parser.add_argument("--sample", type=int, default=None,
                        help="Only process first N uncached papers per model")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be done without calling API")
    args = parser.parse_args()

    if not args.model and not args.all:
        parser.error("Specify --model NAME or --all")

    cache = load_cache()
    print(f"Cache: {len(cache)} entries loaded from {CACHE_FILE}")

    models = ALL_MODELS if args.all else [args.model]

    for model_name in models:
        print(f"\n{'='*60}")
        print(f"Processing {model_name}")
        print(f"{'='*60}")
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
