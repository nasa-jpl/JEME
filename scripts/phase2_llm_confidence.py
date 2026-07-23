#!/usr/bin/env python3
"""
Phase 2: Multi-temperature LLM confidence sampling.

For each citation entry, calls Gemini 3x at temperatures [0.1, 0.5, 1.0]
to classify engagement_level, research_domain, and self-assessed confidence.
Computes stochastic_variance and reasoning_confidence from the responses.

Usage:
    python scripts/phase2_llm_confidence.py --model RAPID --sample 10 --dry-run
    python scripts/phase2_llm_confidence.py --model ECCO
    python scripts/phase2_llm_confidence.py --all
"""

import argparse
import json
import sys
import time
from collections import Counter
from pathlib import Path

from llm_client import call_llm

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TEMPERATURES = [0.1, 0.5, 1.0]
SLEEP_BETWEEN_REQUESTS = 0.3

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

def load_cache():
    """Load persistent cache from disk."""
    if CACHE_FILE.exists():
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    """Write cache to disk."""
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def get_entry_key(entry):
    """Unique cache key for a citation entry."""
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
    """Extract title, abstract, venue, citing_team_paper from an entry."""
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
    except RuntimeError as e:
        print(f"    LLM call error: {e}")
        return None


def compute_stochastic_variance(responses):
    """
    Compute fraction of runs disagreeing with majority labels.

    Returns 0.0 if all 3 agree, up to 0.67 if all 3 differ.
    Averages domain and engagement disagreement.
    """
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
    """Average self-assessed confidence from Gemini, normalized to 0-1."""
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
    """Return the most common label across responses."""
    labels = [r.get(field, "") for r in responses if r and r.get(field)]
    if not labels:
        return None
    return Counter(labels).most_common(1)[0][0]


# ---------------------------------------------------------------------------
# Processing
# ---------------------------------------------------------------------------

def process_entry(entry, dry_run=False, model_name=None):
    """Run multi-temperature sampling on a single entry. Returns Phase 2 data."""
    title, abstract, venue, citing = extract_text_fields(entry)

    # Build model-specific domain list for the prompt
    from classify_papers import get_domain_list
    domains = get_domain_list(model_name)
    domain_list_str = "\n".join(f"   - {d}" for d in domains)

    prompt = PROMPT_TEMPLATE.format(
        title=title or "(no title)",
        abstract=abstract or "(no abstract available)",
        venue=venue or "(unknown venue)",
        citing_team_paper=citing or "(unknown)",
        domain_list=domain_list_str,
    )

    if dry_run:
        print(f"    Would call Gemini 3x for: {title[:60]}...")
        return {
            "stochastic_variance": 0.0,
            "reasoning_confidence": 0.7,
            "responses": [],
            "majority_engagement": entry.get("engagement_level", "Level 1: Simple Citation"),
            "majority_domain": entry.get("research_domain", "General Science"),
        }

    responses = []
    for temp in TEMPERATURES:
        result = sample_llm(prompt, temp)
        responses.append(result)
        time.sleep(SLEEP_BETWEEN_REQUESTS)

    valid_responses = [r for r in responses if r is not None]
    if not valid_responses:
        return None

    return {
        "stochastic_variance": compute_stochastic_variance(valid_responses),
        "reasoning_confidence": compute_reasoning_confidence(valid_responses),
        "responses": valid_responses,
        "majority_engagement": majority_label(valid_responses, "engagement_level"),
        "majority_domain": majority_label(valid_responses, "research_domain"),
    }


def process_model(model_name, data_dir, cache, sample=None, dry_run=False):
    """Process a single model's JSON file with Phase 2 sampling."""
    file_path = data_dir / f"{model_name}_analyzed.json"
    if not file_path.exists():
        print(f"  WARNING: {file_path} not found, skipping")
        return 0

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data
    if sample:
        entries_to_process = entries[:sample]
    else:
        entries_to_process = entries

    print(f"  Processing {model_name}: {len(entries_to_process)} of {len(data)} entries")

    processed = 0
    skipped = 0

    for i, entry in enumerate(entries_to_process):
        key = get_entry_key(entry)

        # Check cache
        if key in cache:
            cached = cache[key]
            _apply_phase2(entry, cached)
            skipped += 1
            continue

        result = process_entry(entry, dry_run=dry_run, model_name=model_name)
        if result is None:
            print(f"    [{i+1}/{len(entries_to_process)}] FAILED — no valid responses")
            continue

        # Cache result (without raw responses to save space)
        cache[key] = {
            "stochastic_variance": result["stochastic_variance"],
            "reasoning_confidence": result["reasoning_confidence"],
            "majority_engagement": result["majority_engagement"],
            "majority_domain": result["majority_domain"],
        }

        _apply_phase2(entry, result)
        processed += 1

        title = entry.get("title", "")
        if isinstance(title, list):
            title = title[0] if title else ""
        sv = result["stochastic_variance"]
        rc = result["reasoning_confidence"]
        print(f"    [{i+1}/{len(entries_to_process)}] sv={sv}, rc={rc} — {title[:50]}")

    print(f"  Done: {processed} processed, {skipped} from cache")

    if not dry_run:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  Written to {file_path}")
        save_cache(cache)
        print(f"  Cache saved ({len(cache)} entries)")

    return processed


def _apply_phase2(entry, result):
    """Apply Phase 2 results to an entry's uncertainty block."""
    if "uncertainty" not in entry:
        entry["uncertainty"] = {}

    u = entry["uncertainty"]

    # Update stochastic_variance
    if "error_estimates" not in u:
        u["error_estimates"] = {}
    u["error_estimates"]["stochastic_variance"] = result["stochastic_variance"]

    # Update reasoning_confidence
    u["reasoning_confidence"] = result["reasoning_confidence"]

    # Update classification_provenance with agreement metrics
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


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Phase 2: Multi-temperature LLM confidence sampling"
    )
    parser.add_argument("--model", type=str, help="Process a specific model (e.g. RAPID)")
    parser.add_argument("--all", action="store_true", help="Process all models")
    parser.add_argument("--sample", type=int, help="Only process first N entries per model")
    parser.add_argument("--dry-run", action="store_true", help="Preview without API calls or file writes")
    args = parser.parse_args()

    if not args.model and not args.all:
        parser.print_help()
        sys.exit(1)

    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / "public" / "data"

    models = list(ALL_MODELS)
    if args.model:
        if args.model not in ALL_MODELS:
            print(f"ERROR: Unknown model '{args.model}'. Valid: {', '.join(ALL_MODELS)}")
            sys.exit(1)
        models = [args.model]

    cache = load_cache()

    print(f"Phase 2: Multi-temperature sampling {'(DRY RUN)' if args.dry_run else ''}")
    print(f"Temperatures: {TEMPERATURES}")
    print(f"Data directory: {data_dir}")
    if args.sample:
        print(f"Sample size: {args.sample} entries per model")
    print(f"Cache: {len(cache)} entries loaded")
    print()

    total = 0
    for model in models:
        print(f"[{model}]")
        count = process_model(model, data_dir, cache, sample=args.sample, dry_run=args.dry_run)
        total += count
        print()

    print(f"Total entries processed: {total}")


if __name__ == "__main__":
    main()
