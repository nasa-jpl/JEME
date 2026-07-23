#!/usr/bin/env python3
"""
Phase 2 Parallel: Fast multi-temperature LLM confidence sampling.

Parallelizes the 3 temperature calls per paper using ThreadPoolExecutor,
and supports running multiple models with periodic cache saves.

Usage:
    python scripts/phase2_parallel.py --model SWOT
    python scripts/phase2_parallel.py --models SWOT,EDMF,GRACE
    python scripts/phase2_parallel.py --all
"""

import argparse
import json
import sys
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock

from llm_client import call_llm

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TEMPERATURES = [0.1, 0.5, 1.0]
CONCURRENT_PAPERS = 5  # Process 5 papers at a time
SAVE_EVERY = 50  # Save cache every N papers

ALL_MODELS = [
    "CARDAMOM", "CMS-Flux", "ECCO", "EDMF", "GRACE",
    "ISSM", "LES", "MOMO-CHEM", "RAPID", "SWOT", "TROPESS"
]

CACHE_FILE = Path(__file__).parent / "phase2_cache.json"

PROMPT_TEMPLATE = """You are a scientific paper classifier. Analyze the following citation and provide:

1. **engagement_level**: How deeply the citing paper engages with the model/dataset. Choose one:
   - "Level 4: Foundational Method" — builds directly on the model as a core method
   - "Level 3: Model Adaptation" — modifies, extends, or couples the model
   - "Level 2: Data Usage" — uses data or outputs from the model
   - "Level 1: Simple Citation" — mentions or references the model briefly

2. **research_domain**: The primary research domain. Choose one:
{domain_list}

3. **confidence**: Your self-assessed confidence in these classifications (1-5 scale):
   - 5 = Very confident (clear signals in title/abstract)
   - 4 = Confident (good evidence)
   - 3 = Moderate (some ambiguity)
   - 2 = Low (limited information)
   - 1 = Very low (guessing)

Paper information:
- Title: {title}
- Abstract: {abstract}
- Venue: {venue}
- Cited team paper: {citing_team_paper}

Respond ONLY with valid JSON (no markdown, no explanation):
{{"engagement_level": "...", "research_domain": "...", "confidence": N}}"""


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
    with cache_lock:
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


def extract_text_fields(entry):
    title = entry.get("title", "")
    if isinstance(title, list):
        title = title[0] if title else ""
    abstract = entry.get("abstract", "") or ""
    venue = entry.get("venue", "") or entry.get("container-title", "")
    if isinstance(venue, list):
        venue = venue[0] if venue else ""
    citing = entry.get("citing_team_paper", "") or ""
    return title, abstract, venue, citing


def sample_llm(prompt, temperature):
    """Make a single LLM call via the shared Bedrock client. Returns parsed JSON or None."""
    try:
        return call_llm(prompt, temperature=temperature)
    except RuntimeError:
        return None


def compute_stochastic_variance(responses):
    engagement_labels = [r.get("engagement_level", "") for r in responses if r]
    domain_labels = [r.get("research_domain", "") for r in responses if r]
    if len(engagement_labels) < 2:
        return None

    def disagreement_fraction(labels):
        if not labels:
            return 0.0
        counts = Counter(labels)
        majority_count = counts.most_common(1)[0][1]
        return round(1.0 - majority_count / len(labels), 3)

    eng_var = disagreement_fraction(engagement_labels)
    dom_var = disagreement_fraction(domain_labels)
    return round((eng_var + dom_var) / 2, 3)


def compute_reasoning_confidence(responses):
    confidences = []
    for r in responses:
        if r and "confidence" in r:
            c = r["confidence"]
            if isinstance(c, (int, float)) and 1 <= c <= 5:
                confidences.append(c)
    if not confidences:
        return None
    return round(sum(confidences) / len(confidences) / 5.0, 3)


def majority_label(responses, field):
    labels = [r.get(field, "") for r in responses if r and r.get(field)]
    if not labels:
        return None
    return Counter(labels).most_common(1)[0][0]


# ---------------------------------------------------------------------------
# Processing
# ---------------------------------------------------------------------------

def process_single_paper(entry, domain_list_str):
    """Process one paper: call the LLM at 3 temperatures in parallel."""
    title, abstract, venue, citing = extract_text_fields(entry)

    prompt = PROMPT_TEMPLATE.format(
        title=title or "(no title)",
        abstract=abstract or "(no abstract available)",
        venue=venue or "(unknown venue)",
        citing_team_paper=citing or "(unknown)",
        domain_list=domain_list_str,
    )

    # Call all 3 temperatures in parallel
    responses = [None, None, None]
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(sample_llm, prompt, temp): i
                   for i, temp in enumerate(TEMPERATURES)}
        for future in as_completed(futures):
            idx = futures[future]
            try:
                responses[idx] = future.result()
            except Exception:
                responses[idx] = None

    valid_responses = [r for r in responses if r is not None]
    if not valid_responses:
        return None

    return {
        "stochastic_variance": compute_stochastic_variance(valid_responses),
        "reasoning_confidence": compute_reasoning_confidence(valid_responses),
        "majority_engagement": majority_label(valid_responses, "engagement_level"),
        "majority_domain": majority_label(valid_responses, "research_domain"),
    }


def apply_phase2(entry, result):
    if "uncertainty" not in entry:
        entry["uncertainty"] = {}
    u = entry["uncertainty"]
    if "error_estimates" not in u:
        u["error_estimates"] = {}
    u["error_estimates"]["stochastic_variance"] = result["stochastic_variance"]
    u["reasoning_confidence"] = result["reasoning_confidence"]
    if "classification_provenance" not in u:
        u["classification_provenance"] = {}
    prov = u["classification_provenance"]
    existing_eng = entry.get("engagement_level", "")
    existing_dom = entry.get("research_domain", "")
    maj_eng = result.get("majority_engagement", "")
    maj_dom = result.get("majority_domain", "")
    prov["phase2_engagement_agreement"] = 1.0 if existing_eng == maj_eng else 0.0
    prov["phase2_domain_agreement"] = 1.0 if existing_dom == maj_dom else 0.0
    prov["phase2_majority_engagement"] = maj_eng
    prov["phase2_majority_domain"] = maj_dom


def get_domain_list(model_name):
    """Get domain list for a model."""
    try:
        sys.path.insert(0, str(Path(__file__).parent))
        from classify_papers import get_domain_list as _get_domain_list
        return _get_domain_list(model_name)
    except Exception:
        return [
            "Hydrology & Water Resources", "Oceanography", "Climate Science",
            "Atmospheric Science", "Glaciology", "Carbon Cycle",
            "Remote Sensing", "Numerical Methods", "General Science"
        ]


def process_model(model_name, data_dir, cache):
    """Process a single model with parallel paper processing."""
    file_path = data_dir / f"{model_name}_analyzed.json"
    if not file_path.exists():
        print(f"  WARNING: {file_path} not found, skipping")
        return 0

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    domains = get_domain_list(model_name)
    domain_list_str = "\n".join(f"   - {d}" for d in domains)

    # Separate cached vs uncached entries
    to_process = []
    for i, entry in enumerate(data):
        key = get_entry_key(entry)
        if key in cache:
            apply_phase2(entry, cache[key])
        else:
            to_process.append((i, entry, key))

    cached = len(data) - len(to_process)
    print(f"  {model_name}: {len(data)} total, {cached} cached, {len(to_process)} to process")

    if not to_process:
        # Still write file to apply cached results
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  Written cached results to {file_path}")
        return 0

    processed = 0
    failed = 0
    start_time = time.time()

    # Process papers in batches
    for batch_start in range(0, len(to_process), CONCURRENT_PAPERS):
        batch = to_process[batch_start:batch_start + CONCURRENT_PAPERS]

        with ThreadPoolExecutor(max_workers=CONCURRENT_PAPERS) as executor:
            futures = {}
            for idx, entry, key in batch:
                future = executor.submit(process_single_paper, entry, domain_list_str)
                futures[future] = (idx, entry, key)

            for future in as_completed(futures):
                idx, entry, key = futures[future]
                try:
                    result = future.result()
                except Exception as e:
                    print(f"    ERROR on entry {idx}: {e}")
                    failed += 1
                    continue

                if result is None:
                    failed += 1
                    continue

                with cache_lock:
                    cache[key] = {
                        "stochastic_variance": result["stochastic_variance"],
                        "reasoning_confidence": result["reasoning_confidence"],
                        "majority_engagement": result["majority_engagement"],
                        "majority_domain": result["majority_domain"],
                    }

                apply_phase2(entry, result)
                processed += 1

                title = entry.get("title", "")
                if isinstance(title, list):
                    title = title[0] if title else ""
                total_done = cached + processed + failed
                elapsed = time.time() - start_time
                rate = processed / elapsed if elapsed > 0 else 0
                remaining = (len(to_process) - processed - failed) / rate if rate > 0 else 0
                print(f"    [{total_done}/{len(data)}] sv={result['stochastic_variance']}, "
                      f"rc={result['reasoning_confidence']} ({rate:.1f}/s, ~{remaining/60:.0f}m left) "
                      f"— {title[:50]}")

        # Periodic saves
        if (processed + failed) % SAVE_EVERY < CONCURRENT_PAPERS:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            save_cache(cache)

        # Small delay between batches to avoid rate limits
        time.sleep(0.5)

    # Final save
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    save_cache(cache)

    elapsed = time.time() - start_time
    print(f"  Done: {processed} processed, {failed} failed, {cached} cached in {elapsed:.0f}s")
    print(f"  Written to {file_path}, cache: {len(cache)} entries")
    return processed


def main():
    parser = argparse.ArgumentParser(description="Phase 2 Parallel: Fast multi-temperature sampling")
    parser.add_argument("--model", type=str, help="Process a specific model")
    parser.add_argument("--models", type=str, help="Comma-separated list of models")
    parser.add_argument("--all", action="store_true", help="Process all models")
    parser.add_argument("--workers", type=int, default=5, help="Concurrent papers (default: 5)")
    args = parser.parse_args()

    if not args.model and not args.models and not args.all:
        parser.print_help()
        sys.exit(1)

    global CONCURRENT_PAPERS
    CONCURRENT_PAPERS = args.workers

    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / "public" / "data"

    if args.all:
        models = list(ALL_MODELS)
    elif args.models:
        models = [m.strip() for m in args.models.split(",")]
    else:
        models = [args.model]

    cache = load_cache()
    print(f"Phase 2 Parallel: {CONCURRENT_PAPERS} concurrent papers, 3 temps each")
    print(f"Cache: {len(cache)} entries loaded")
    print()

    total = 0
    for model in models:
        print(f"[{model}]")
        count = process_model(model, data_dir, cache)
        total += count
        print()

    print(f"Total processed: {total}")


if __name__ == "__main__":
    main()
