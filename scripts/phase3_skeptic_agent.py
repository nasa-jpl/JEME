#!/usr/bin/env python3
"""
Phase 3: Skeptic Agent for adversarial review of high-risk entries.

Reviews entries flagged as high-risk by Phase 1/2 and asks Gemini to
challenge the existing classification. Adds skeptic_review data to
the uncertainty block.

Flagging criteria (any one triggers review):
  - miscalibration_risk == "high"
  - stochastic_variance > 0.3
  - Engagement Level 3-4 with composite_confidence < 0.5

Usage:
    python scripts/phase3_skeptic_agent.py --model RAPID --dry-run
    python scripts/phase3_skeptic_agent.py --model ECCO
    python scripts/phase3_skeptic_agent.py --all
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

GEMINI_MODEL = "gemini-2.5-flash"
BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
TIMEOUT = 30
SLEEP_BETWEEN_REQUESTS = 1
MAX_RETRIES = 3

ALL_MODELS = [
    "CARDAMOM", "CMS-Flux", "ECCO", "EDMF", "GRACE",
    "ISSM", "LES", "MOMO-CHEM", "RAPID", "SWOT"
]

CACHE_FILE = Path(__file__).parent / "phase3_cache.json"

SKEPTIC_PROMPT = """You are a skeptical scientific paper reviewer. Your job is to CHALLENGE the existing classification of this citation. Be critical — look for reasons the classification might be wrong.

Current classification:
- Engagement Level: {engagement_level}
- Research Domain: {research_domain}

Paper information:
- Title: {title}
- Abstract: {abstract}
- Venue: {venue}
- Cited team paper: {citing_team_paper}

Questions:
1. Do you AGREE with the engagement level? Could it be lower than assigned? (e.g., "Level 3: Model Adaptation" might really be "Level 2: Data Usage" if the paper only uses outputs)
2. Do you AGREE with the research domain? Could a different domain be more appropriate?
3. Rate your agreement with the CURRENT classification (1-5):
   - 5 = Strongly agree, classification is clearly correct
   - 4 = Agree, classification is reasonable
   - 3 = Neutral, could go either way
   - 2 = Disagree, a different classification is more appropriate
   - 1 = Strongly disagree, classification is clearly wrong
4. What engagement level and domain would YOU assign?

Respond ONLY with valid JSON (no markdown, no explanation):
{{"agreement": N, "skeptic_engagement": "...", "skeptic_domain": "...", "reasoning": "brief explanation"}}"""


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


def should_review(entry):
    """
    Determine if an entry should be reviewed by the skeptic agent.
    Returns (should_review: bool, reason: str).
    """
    u = entry.get("uncertainty", {})
    if not u:
        return False, ""

    err = u.get("error_estimates", {})
    misc_risk = err.get("miscalibration_risk", "")
    stoch_var = err.get("stochastic_variance")
    composite = u.get("composite_confidence", 1.0)
    engagement = entry.get("engagement_level", "")

    # Criterion 1: high miscalibration risk
    if misc_risk == "high":
        return True, "high_miscalibration_risk"

    # Criterion 2: high stochastic variance
    if stoch_var is not None and stoch_var > 0.3:
        return True, "high_stochastic_variance"

    # Criterion 3: high engagement but low confidence
    if engagement in ("Level 3: Model Adaptation", "Level 4: Foundational Method"):
        if composite < 0.5:
            return True, "high_engagement_low_confidence"

    return False, ""


def call_gemini(api_key, prompt):
    """Make a Gemini API call at temperature 0.3 (moderately deterministic for review)."""
    url = f"{BASE_URL}/{GEMINI_MODEL}:generateContent"
    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 2048,
            "topP": 0.8,
            "topK": 10,
        },
    }

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(
                f"{url}?key={api_key}",
                headers=headers,
                json=data,
                timeout=TIMEOUT,
            )
            if response.status_code == 429:
                wait = (2 ** attempt) * 2
                print(f"    Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            response.raise_for_status()
            result = response.json()

            if "candidates" in result and len(result["candidates"]) > 0:
                text = result["candidates"][0].get("content", {}).get("parts", [{}])[0].get("text", "")
                text = text.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                return json.loads(text)
            return None

        except requests.exceptions.Timeout:
            print(f"    Timeout (attempt {attempt + 1}/{MAX_RETRIES})")
        except requests.exceptions.RequestException as e:
            print(f"    API error (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)
        except json.JSONDecodeError:
            print(f"    Invalid JSON response (attempt {attempt + 1}/{MAX_RETRIES})")

    return None


# ---------------------------------------------------------------------------
# Processing
# ---------------------------------------------------------------------------

def review_entry(entry, api_key, reason, dry_run=False):
    """Run skeptic review on a single entry."""
    title = entry.get("title", "")
    if isinstance(title, list):
        title = title[0] if title else ""

    abstract = entry.get("abstract", "") or ""
    venue = entry.get("venue", "") or entry.get("container-title", "")
    if isinstance(venue, list):
        venue = venue[0] if venue else ""
    citing = entry.get("citing_team_paper", "") or ""

    engagement = entry.get("engagement_level", "Unknown")
    domain = entry.get("research_domain", "Unknown")

    prompt = SKEPTIC_PROMPT.format(
        engagement_level=engagement,
        research_domain=domain,
        title=title or "(no title)",
        abstract=abstract or "(no abstract available)",
        venue=venue or "(unknown venue)",
        citing_team_paper=citing or "(unknown)",
    )

    if dry_run:
        print(f"    Would review: {title[:60]}... (reason: {reason})")
        return {
            "reviewed": True,
            "skeptic_agreement": 0.6,
            "skeptic_engagement": engagement,
            "skeptic_domain": domain,
            "override_flag": False,
            "review_reason": reason,
        }

    result = call_gemini(api_key, prompt)
    time.sleep(SLEEP_BETWEEN_REQUESTS)

    if result is None:
        return None

    agreement = result.get("agreement", 3)
    if not isinstance(agreement, (int, float)):
        agreement = 3
    agreement = max(1, min(5, agreement))

    skeptic_eng = result.get("skeptic_engagement", engagement)
    skeptic_dom = result.get("skeptic_domain", domain)
    override = agreement <= 2

    return {
        "reviewed": True,
        "skeptic_agreement": round(agreement / 5.0, 2),
        "skeptic_engagement": skeptic_eng,
        "skeptic_domain": skeptic_dom,
        "override_flag": override,
        "review_reason": reason,
    }


def process_model(model_name, data_dir, api_key, cache, dry_run=False):
    """Process a single model's JSON file with skeptic review."""
    file_path = data_dir / f"{model_name}_analyzed.json"
    if not file_path.exists():
        print(f"  WARNING: {file_path} not found, skipping")
        return 0, 0

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Find entries needing review
    flagged = []
    for i, entry in enumerate(data):
        needs_review, reason = should_review(entry)
        if needs_review:
            flagged.append((i, entry, reason))

    print(f"  {model_name}: {len(flagged)} of {len(data)} entries flagged for review ({100*len(flagged)/max(len(data),1):.1f}%)")

    if not flagged:
        print(f"  No entries need skeptic review")
        return 0, 0

    # Breakdown by reason
    from collections import Counter
    reasons = Counter(r for _, _, r in flagged)
    for reason, count in reasons.most_common():
        print(f"    {reason}: {count}")

    reviewed = 0
    overrides = 0
    skipped_cache = 0

    for idx, (i, entry, reason) in enumerate(flagged):
        key = get_entry_key(entry)
        cache_key = f"skeptic:{key}"

        # Check cache
        if cache_key in cache:
            _apply_skeptic(entry, cache[cache_key])
            if cache[cache_key].get("override_flag"):
                overrides += 1
            skipped_cache += 1
            reviewed += 1
            continue

        result = review_entry(entry, api_key, reason, dry_run=dry_run)
        if result is None:
            title = entry.get("title", "")
            if isinstance(title, list):
                title = title[0] if title else ""
            print(f"    [{idx+1}/{len(flagged)}] FAILED — {title[:50]}")
            continue

        cache[cache_key] = result
        _apply_skeptic(entry, result)
        reviewed += 1
        if result["override_flag"]:
            overrides += 1

        title = entry.get("title", "")
        if isinstance(title, list):
            title = title[0] if title else ""
        flag = " ** OVERRIDE **" if result["override_flag"] else ""
        print(f"    [{idx+1}/{len(flagged)}] agreement={result['skeptic_agreement']}{flag} — {title[:50]}")

    print(f"  Done: {reviewed} reviewed ({skipped_cache} from cache), {overrides} overrides flagged")

    if not dry_run:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  Written to {file_path}")
        save_cache(cache)

    return reviewed, overrides


def _apply_skeptic(entry, result):
    """Apply skeptic review to an entry's uncertainty block."""
    if "uncertainty" not in entry:
        entry["uncertainty"] = {}
    entry["uncertainty"]["skeptic_review"] = result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Phase 3: Skeptic agent for adversarial review"
    )
    parser.add_argument("--model", type=str, help="Process a specific model (e.g. RAPID)")
    parser.add_argument("--all", action="store_true", help="Process all models")
    parser.add_argument("--dry-run", action="store_true", help="Preview without API calls or file writes")
    args = parser.parse_args()

    if not args.model and not args.all:
        parser.print_help()
        sys.exit(1)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key and not args.dry_run:
        print("ERROR: GEMINI_API_KEY environment variable not set.")
        print("Set it with: export GEMINI_API_KEY=your_key_here")
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

    print(f"Phase 3: Skeptic Agent {'(DRY RUN)' if args.dry_run else ''}")
    print(f"Model: {GEMINI_MODEL}")
    print(f"Data directory: {data_dir}")
    print(f"Cache: {len(cache)} entries loaded")
    print()

    total_reviewed = 0
    total_overrides = 0
    for model in models:
        print(f"[{model}]")
        rev, ovr = process_model(model, data_dir, api_key, cache, dry_run=args.dry_run)
        total_reviewed += rev
        total_overrides += ovr
        print()

    print(f"Total: {total_reviewed} entries reviewed, {total_overrides} overrides flagged")


if __name__ == "__main__":
    main()
