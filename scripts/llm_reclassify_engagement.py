#!/usr/bin/env python3
"""
LLM-based engagement_level re-classifier.

Reads each citation's title + abstract + venue + cited team paper, and asks
the LLM to decide HOW the citing paper engages with the model/mission. Replaces
the keyword-substring classifier (which produces false positives like
"Data Usage" for "ppm denoTES parts per million" matching the TES instrument
abbreviation).

Per-model engagement schemes:

  Missions (GRACE, SWOT, TROPESS) — 3 categories:
    - "Review Paper"     — review/survey/perspective; not original research
    - "Data Usage"       — actually uses mission data/products in analysis
    - "Citation"  — only cites/mentions the mission as background

  Models (CARDAMOM, CMS-Flux, ECCO, EDMF, ISSM, LES, MOMO-CHEM, RAPID) — 4 categories:
    - "Level 3: Foundational Method" — the model is the core methodology
    - "Level 2: Model Adaptation"    — modifies/extends/couples the model
    - "Level 1: Data Usage"          — uses model output/data products
    - "Citation"              — only cites as background

For each entry we record:
  entry["engagement_level"] = <new label>
  entry["uncertainty"]["classification_provenance"]["llm_reclassification"] = {
      "previous_label":  <old label>,
      "new_label":       <new label>,
      "justification":   <quoted abstract sentence>,
      "abstract_used":   true|false,
      "model":           <Bedrock model id, e.g. us.anthropic.claude-sonnet-4-5-...>,
      "timestamp":       "2026-04-22T..."
  }

Caching: per-DOI / per-paper_id in scripts/llm_reclassify_cache.json.
Use --refresh to ignore cache. --no-write to dry-run without modifying JSON.

Usage:
    python scripts/llm_reclassify_engagement.py --model TROPESS --sample 20
    python scripts/llm_reclassify_engagement.py --models TROPESS,GRACE,SWOT
    python scripts/llm_reclassify_engagement.py --all
"""

import argparse
import datetime
import json
import sys
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock

from llm_client import call_llm, DEFAULT_MODEL_ID

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

CONCURRENT_PAPERS = 8
SAVE_EVERY = 100

ALL_MODELS = [
    "CARDAMOM", "CMS-Flux", "ECCO", "EDMF", "GRACE",
    "ISSM", "LES", "MOMO-CHEM", "RAPID", "SWOT", "TROPESS",
]
MISSIONS = {"GRACE", "SWOT", "TROPESS"}

CACHE_FILE = Path(__file__).parent / "llm_reclassify_cache.json"

# ---------------------------------------------------------------------------
# Per-model context (what the LLM needs to know to judge "uses" vs "cites")
# ---------------------------------------------------------------------------

MODEL_CONTEXT = {
    "RAPID": {
        "kind": "model",
        "full_name": "RAPID (Routing Application for Parallel computatIon of Discharge)",
        "description": (
            "RAPID is a river-network routing model. It takes runoff inputs (e.g. from a land-surface "
            "model) and routes them through river reaches to produce streamflow / discharge time series."
        ),
        "data_usage_examples": (
            "running RAPID, using RAPID-derived discharge time series, using the RAPID river-network "
            "graph (NHDPlus/MERIT-based connectivity) as input to another analysis."
        ),
        "model_adaptation_examples": (
            "modifying RAPID's Muskingum routing scheme, coupling RAPID with a hydrologic or land-surface model, "
            "extending RAPID to include reservoirs/lakes, porting RAPID to a new region."
        ),
        "foundational_examples": (
            "the paper IS a RAPID development paper: introducing RAPID, presenting the original numerical method, "
            "or a study where RAPID is the central methodological subject."
        ),
    },
    "CARDAMOM": {
        "kind": "model",
        "full_name": "CARDAMOM (CARbon DAta MOdel fraMework)",
        "description": (
            "CARDAMOM is a Bayesian model-data fusion framework that retrieves ensembles of parameters "
            "for terrestrial carbon-cycle models (e.g. DALEC) constrained by observations."
        ),
        "data_usage_examples": (
            "using CARDAMOM-derived posterior carbon flux/pool estimates, NEE/NBE/NPP/biomass time series "
            "produced by a CARDAMOM run, or CARDAMOM uncertainty fields."
        ),
        "model_adaptation_examples": (
            "modifying CARDAMOM's likelihood, adding observation streams, extending CARDAMOM to a new biome "
            "or coupling with a different ecosystem model."
        ),
        "foundational_examples": (
            "the paper IS a CARDAMOM development paper, or runs CARDAMOM as the central methodology."
        ),
    },
    "CMS-Flux": {
        "kind": "model",
        "full_name": "CMS-Flux (NASA Carbon Monitoring System — Flux)",
        "description": (
            "CMS-Flux is a global atmospheric inverse / 4D-Var data-assimilation system built on the GEOS-Chem "
            "adjoint that produces top-down estimates of CO2, CH4, and CO surface fluxes from satellite (e.g. OCO-2, "
            "GOSAT, MOPITT) and in-situ atmospheric measurements."
        ),
        "data_usage_examples": (
            "using CMS-Flux posterior flux maps (CO2, CH4, CO), CMS-Flux NEE/NBE/biomass-burning flux products."
        ),
        "model_adaptation_examples": (
            "modifying CMS-Flux's adjoint or observation operator, coupling new observation streams, "
            "running CMS-Flux at new resolution or for a new species."
        ),
        "foundational_examples": (
            "the paper IS a CMS-Flux development paper, or runs CMS-Flux as the central methodology."
        ),
    },
    "ECCO": {
        "kind": "model",
        "full_name": "ECCO (Estimating the Circulation and Climate of the Ocean)",
        "description": (
            "ECCO is a global ocean state-estimation framework based on MITgcm + its adjoint, producing "
            "physically-consistent reconstructions of ocean circulation, temperature, salinity, sea level, etc. "
            "Common products: ECCO V4r4, LLC4320, ECCO Central Estimate."
        ),
        "data_usage_examples": (
            "using ECCO state estimates (T/S/u/v/SSH/MOC) as boundary conditions, for diagnosing trends, "
            "computing budgets, comparing to observations, training ML models, etc."
        ),
        "model_adaptation_examples": (
            "modifying the ECCO setup (resolution, observations assimilated, adjoint), coupling ECCO outputs "
            "into a regional model, performing new ECCO sensitivity experiments."
        ),
        "foundational_examples": (
            "the paper IS an ECCO development paper, or the study's core methodology IS running/extending ECCO."
        ),
    },
    "ISSM": {
        "kind": "model",
        "full_name": "ISSM (Ice-sheet and Sea-level System Model)",
        "description": (
            "ISSM is a finite-element ice-sheet model (Stokes / higher-order / SSA) used to simulate ice-sheet "
            "and glacier evolution, with adjoint capabilities for inversion and sea-level projections."
        ),
        "data_usage_examples": (
            "using ISSM-simulated mass-loss / SLR projections / velocity / friction inversion fields produced by ISSM."
        ),
        "model_adaptation_examples": (
            "modifying ISSM's solver/physics, coupling ISSM to an ocean or solid-Earth model, "
            "running new ISSM experiments for a new region."
        ),
        "foundational_examples": (
            "the paper IS an ISSM development paper, or runs ISSM as the central methodology."
        ),
    },
    "MOMO-CHEM": {
        "kind": "model",
        "full_name": "MOMO-CHEM (Multi-mOdel Multi-cOnstituent Chemical data assimilation)",
        "description": (
            "MOMO-CHEM is a multi-model multi-species chemical reanalysis framework (TCR-2 product family) that "
            "assimilates satellite retrievals of trace gases (O3, NO2, CO, HNO3, SO2, etc.) into chemistry-transport models."
        ),
        "data_usage_examples": (
            "using TCR-2 chemical reanalysis fields (O3, NO2, CO, NOx emissions), MOMO-CHEM-derived emission "
            "inventories or surface concentrations."
        ),
        "model_adaptation_examples": (
            "modifying MOMO-CHEM's assimilation scheme, adding new species or observation streams, "
            "coupling with other chemistry models."
        ),
        "foundational_examples": (
            "the paper IS a MOMO-CHEM / TCR-2 development paper or the study's core methodology IS MOMO-CHEM."
        ),
    },
    "LES": {
        "kind": "model",
        "full_name": "LES (Large Eddy Simulation, JPL atmospheric LES)",
        "description": (
            "LES refers here to the JPL group's Large-Eddy-Simulation work: high-resolution turbulence-resolving "
            "atmospheric simulations of clouds, boundary-layer turbulence, methane plumes, etc."
        ),
        "data_usage_examples": (
            "using LES-derived statistics (cloud fields, fluxes, plume dispersion) as training data or benchmark."
        ),
        "model_adaptation_examples": (
            "modifying the LES code, coupling LES with a new SGS scheme, running new LES experiments."
        ),
        "foundational_examples": (
            "the paper IS the LES development/methodology paper, or the central methodology IS running LES."
        ),
    },
    "EDMF": {
        "kind": "model",
        "full_name": "EDMF (Eddy-Diffusivity Mass-Flux scheme)",
        "description": (
            "EDMF is a parameterization that combines eddy-diffusivity (turbulent mixing) with a mass-flux "
            "convective scheme to represent boundary-layer turbulence and shallow convection in atmospheric models."
        ),
        "data_usage_examples": (
            "using output from a model that runs EDMF (e.g. EDMF-based reanalysis or forecast fields)."
        ),
        "model_adaptation_examples": (
            "modifying EDMF closures (entrainment, mass-flux), retuning EDMF, coupling EDMF with a new host model."
        ),
        "foundational_examples": (
            "the paper IS an EDMF development paper or the central methodology IS implementing/running EDMF."
        ),
    },
    "GRACE": {
        "kind": "mission",
        "full_name": "GRACE / GRACE-FO (Gravity Recovery And Climate Experiment)",
        "description": (
            "GRACE (2002-2017) and GRACE-FO (2018-) are NASA/DLR satellite missions that measure Earth's "
            "time-variable gravity field. Common data products: monthly mascon solutions (CSR, JPL, GFZ), "
            "spherical-harmonic Stokes coefficients, terrestrial water storage (TWS) anomalies, ice-mass change."
        ),
        "data_usage_examples": (
            "ingesting GRACE/GRACE-FO mascon or spherical-harmonic solutions for analysis: TWS time series, "
            "ice-mass loss, ocean-mass / sea-level budgets, GIA, drought monitoring, groundwater depletion, "
            "validating models against GRACE."
        ),
    },
    "SWOT": {
        "kind": "mission",
        "full_name": "SWOT (Surface Water and Ocean Topography mission)",
        "description": (
            "SWOT is a NASA/CNES satellite mission (launched Dec 2022) using Ka-band radar interferometry "
            "(KaRIn) to measure water surface elevation of oceans and inland waters at high resolution. "
            "Common data products: L2 SSH, L2 river single-pass, L2 raster, pixel cloud."
        ),
        "data_usage_examples": (
            "using SWOT KaRIn observations / L2 products (SSH, river discharge, water surface elevation, "
            "raster, pixel cloud) for science analysis or validation."
        ),
    },
    "TROPESS": {
        "kind": "mission",
        "full_name": "TROPESS (TROPospheric Emission Spectrometer System)",
        "description": (
            "TROPESS is a JPL multi-instrument retrieval suite using the MUSES optimal-estimation algorithm "
            "to produce vertical profiles of tropospheric trace gases (CO, CH4, NH3, O3, PAN, HDO/H2O) from "
            "infrared sounders (CrIS on Suomi-NPP/JPSS, AIRS on Aqua, and historically TES on Aura). The legacy "
            "TES instrument retrievals predate but are continuous with TROPESS."
        ),
        "data_usage_examples": (
            "ingesting TROPESS or legacy TES single-footprint vertical profile retrievals (CO/CH4/NH3/O3/PAN/HDO) "
            "for science analysis: assimilation, trend studies, satellite-vs-model comparison, emission inversion."
        ),
        "data_usage_caveats": (
            "Mentioning the *gas itself* (e.g. ozone, methane, CO) does NOT count as TROPESS data usage. "
            "Mentioning generic 'satellite retrievals' or other instruments (OMI, MOPITT, IASI, GOME, TROPOMI, GEMS, "
            "GOSAT, OCO-2) does NOT count. The paper must specifically use TROPESS / MUSES / CrIS / AIRS / TES "
            "retrievals (or a chemical reanalysis that ingests them)."
        ),
    },
}

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

MISSION_PROMPT = """You are a careful scientific-citation classifier. Your job is to decide HOW a citing paper engages with the {full_name} mission.

ABOUT {short_name}:
{description}

WHAT COUNTS AS DATA USAGE for {short_name}:
{data_usage_examples}
{caveats}

CLASSIFY the citing paper into ONE of:

- "Review Paper" — the citing paper is a review, survey, perspective, synthesis, assessment report (e.g. IPCC, UNEP, WMO), or "state of the art" overview. Original research papers are NOT reviews even if they discuss prior work.

- "Data Usage" — the citing paper actually uses {short_name} data/products in its analysis, validation, assimilation, or methodology. Look for explicit signals: "we used", "based on", "data from", "obtained from", or methodology descriptions that name {short_name}/its instruments/its products. The mention must be substantive, not a passing reference.

- "Citation" — the citing paper only cites or mentions {short_name} as background, motivation, or in a list of related work. The paper does not actually use {short_name} data.

How to handle missing abstracts: use the TITLE to make your best judgment. If the title explicitly names {short_name} or its instruments/products/algorithms (see "WHAT COUNTS AS DATA USAGE" above), that is strong evidence of Data Usage. If the title is generic, names only OTHER instruments/missions, or is clearly off-topic, default to "Citation". Only use "Citation" as a pure fallback when the title is also too vague to judge.

Citing paper:
- Title: {title}
- Venue: {venue}
- Cited team paper context: {citing_team_paper}
- Abstract: {abstract}

Respond with ONLY valid JSON (no markdown fences, no commentary):
{{"engagement_level": "Review Paper|Data Usage|Citation", "justification": "<short quote or paraphrase from the abstract that supports the label, max 200 chars>", "confidence": 1-5}}"""

MODEL_PROMPT = """You are a careful scientific-citation classifier. Your job is to decide HOW a citing paper engages with the {full_name}.

ABOUT {short_name}:
{description}

CLASSIFY the citing paper into ONE of:

- "Level 3: Foundational Method" — {short_name} is the central methodology of the citing paper: the paper IS a {short_name} development/extension paper, or the entire study is built around running {short_name}.
  Examples: {foundational_examples}

- "Level 2: Model Adaptation" — the citing paper modifies, extends, couples, or re-implements {short_name}.
  Examples: {model_adaptation_examples}

- "Level 1: Data Usage" — the citing paper actually USES {short_name}'s outputs, products, or runs the model to produce results, but does not modify it.
  Examples: {data_usage_examples}

- "Citation" — the citing paper only cites/mentions {short_name} as background, motivation, or related work. It does not actually use {short_name} data or run the model.

Important: a passing reference (e.g. "previous studies have used {short_name} (Author et al., 2020)") is "Citation", NOT "Data Usage". The paper must actually use {short_name} outputs/data to qualify as Data Usage.

How to handle missing abstracts: use the TITLE to make your best judgment. If the title explicitly names {short_name} as central methodology, prefer Foundational Method / Model Adaptation / Data Usage over Simple Citation. If the title is generic or clearly focused on a different topic, default to "Citation".

Citing paper:
- Title: {title}
- Venue: {venue}
- Cited team paper context: {citing_team_paper}
- Abstract: {abstract}

Respond with ONLY valid JSON (no markdown fences, no commentary):
{{"engagement_level": "Level 3: Foundational Method|Level 2: Model Adaptation|Level 1: Data Usage|Citation", "justification": "<short quote or paraphrase from the abstract that supports the label, max 200 chars>", "confidence": 1-5}}"""

VALID_LABELS = {
    "mission": {"Review Paper", "Data Usage", "Citation"},
    "model": {
        "Level 3: Foundational Method",
        "Level 2: Model Adaptation",
        "Level 1: Data Usage",
        "Citation",
    },
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

cache_lock = Lock()
file_lock = Lock()


def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with cache_lock:
        tmp = CACHE_FILE.with_suffix(".json.tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2, ensure_ascii=False)
        tmp.replace(CACHE_FILE)


def get_entry_key(entry, model_name):
    """Cache key. Includes model so the same paper cited from different models
    gets independent decisions."""
    doi = (entry.get("doi") or entry.get("DOI") or "").strip().lower()
    paper_id = entry.get("paper_id") or ""
    if doi:
        return f"{model_name}:doi:{doi}"
    if paper_id:
        return f"{model_name}:pid:{paper_id}"
    title = entry.get("title", "")
    if isinstance(title, list):
        title = title[0] if title else ""
    return f"{model_name}:title:{title[:100]}"


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


def build_prompt(model_name, entry):
    ctx = MODEL_CONTEXT[model_name]
    title, abstract, venue, citing = extract_text_fields(entry)

    common = dict(
        full_name=ctx["full_name"],
        short_name=model_name,
        description=ctx["description"],
        title=title or "(no title)",
        abstract=abstract.strip() or "(no abstract available)",
        venue=venue or "(unknown venue)",
        citing_team_paper=citing or "(unknown)",
    )

    if ctx["kind"] == "mission":
        caveats = ctx.get("data_usage_caveats", "")
        caveats_str = f"\nIMPORTANT: {caveats}" if caveats else ""
        return MISSION_PROMPT.format(
            data_usage_examples=ctx["data_usage_examples"],
            caveats=caveats_str,
            **common,
        )
    return MODEL_PROMPT.format(
        data_usage_examples=ctx["data_usage_examples"],
        model_adaptation_examples=ctx["model_adaptation_examples"],
        foundational_examples=ctx["foundational_examples"],
        **common,
    )


def classify_one(model_name, entry):
    """Returns dict with engagement_level/justification/confidence, or None."""
    ctx = MODEL_CONTEXT[model_name]
    valid = VALID_LABELS[ctx["kind"]]

    prompt = build_prompt(model_name, entry)
    try:
        result = call_llm(prompt, temperature=0.1)
    except RuntimeError:
        return None
    if not result:
        return None

    label = result.get("engagement_level", "")
    if label not in valid:
        # Try a tolerant remap
        canon = label.strip()
        if canon in valid:
            label = canon
        else:
            return None

    just = result.get("justification", "") or ""
    if isinstance(just, list):
        just = " ".join(str(j) for j in just)
    just = str(just)[:300]

    conf = result.get("confidence", None)
    try:
        conf = int(conf)
        if conf < 1 or conf > 5:
            conf = None
    except (TypeError, ValueError):
        conf = None

    abstract = entry.get("abstract") or ""
    return {
        "engagement_level": label,
        "justification": just,
        "confidence": conf,
        "abstract_used": bool(abstract.strip()),
    }


def apply_result(entry, result, dry_run=False):
    previous = entry.get("engagement_level")
    if not dry_run:
        entry["engagement_level"] = result["engagement_level"]
        entry.setdefault("uncertainty", {}).setdefault("classification_provenance", {})[
            "llm_reclassification"
        ] = {
            "previous_label": previous,
            "new_label": result["engagement_level"],
            "justification": result["justification"],
            "confidence": result["confidence"],
            "abstract_used": result["abstract_used"],
            "model": DEFAULT_MODEL_ID,
            "timestamp": datetime.datetime.utcnow().isoformat(timespec="seconds") + "Z",
        }
    return previous


# ---------------------------------------------------------------------------
# Per-model processing
# ---------------------------------------------------------------------------

def process_model(model_name, data_dir, cache, sample=None,
                  refresh=False, no_write=False):
    file_path = data_dir / f"{model_name}_analyzed.json"
    if not file_path.exists():
        print(f"  WARN: {file_path} not found, skipping")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data[:sample] if sample else data

    before_dist = Counter(e.get("engagement_level", "MISSING") for e in entries)

    cached_hits = 0
    to_call = []
    for idx, entry in enumerate(entries):
        key = get_entry_key(entry, model_name)
        if (not refresh) and key in cache:
            apply_result(entry, cache[key], dry_run=no_write)
            cached_hits += 1
        else:
            to_call.append((idx, entry, key))

    print(f"  {model_name}: {len(entries)} entries — {cached_hits} cached, {len(to_call)} to call")

    failed = 0
    processed = 0
    changed = 0
    start = time.time()

    def _do(item):
        idx, entry, key = item
        return idx, entry, key, classify_one(model_name, entry)

    save_counter = 0
    for batch_start in range(0, len(to_call), CONCURRENT_PAPERS):
        batch = to_call[batch_start:batch_start + CONCURRENT_PAPERS]
        with ThreadPoolExecutor(max_workers=CONCURRENT_PAPERS) as exe:
            futs = [exe.submit(_do, item) for item in batch]
            for fut in as_completed(futs):
                try:
                    idx, entry, key, result = fut.result()
                except Exception as e:
                    print(f"    ERROR: {e}")
                    failed += 1
                    continue
                if result is None:
                    failed += 1
                    continue
                with cache_lock:
                    cache[key] = result
                previous = apply_result(entry, result, dry_run=no_write)
                if previous != result["engagement_level"]:
                    changed += 1
                processed += 1
                save_counter += 1

        elapsed = time.time() - start
        rate = processed / elapsed if elapsed > 0 else 0
        eta = (len(to_call) - processed - failed) / rate if rate > 0 else 0
        print(f"    [{cached_hits + processed + failed}/{len(entries)}] "
              f"processed={processed} changed={changed} failed={failed} "
              f"({rate:.1f}/s, ETA {eta/60:.1f}m)")

        if save_counter >= SAVE_EVERY:
            save_cache(cache)
            if not no_write:
                with file_lock:
                    with open(file_path, "w", encoding="utf-8") as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
            save_counter = 0

    save_cache(cache)
    if not no_write:
        with file_lock:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

    after_dist = Counter(e.get("engagement_level", "MISSING") for e in entries)
    elapsed = time.time() - start
    print(f"  Done {model_name}: processed={processed} changed={changed} "
          f"failed={failed} cached={cached_hits} in {elapsed:.0f}s")
    print(f"    BEFORE: {dict(before_dist)}")
    print(f"    AFTER : {dict(after_dist)}")
    return {"before": dict(before_dist), "after": dict(after_dist),
            "processed": processed, "changed": changed, "failed": failed,
            "cached": cached_hits}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="LLM-based engagement re-classifier")
    parser.add_argument("--model", type=str, help="Process a single model")
    parser.add_argument("--models", type=str, help="Comma-separated list")
    parser.add_argument("--all", action="store_true", help="Process all models")
    parser.add_argument("--sample", type=int, help="Process first N per model (testing)")
    parser.add_argument("--refresh", action="store_true", help="Ignore cache; recompute")
    parser.add_argument("--no-write", action="store_true",
                        help="Do not write JSON files (still updates cache)")
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    if not (args.model or args.models or args.all):
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

    for m in models:
        if m not in MODEL_CONTEXT:
            print(f"ERROR: unknown model '{m}'")
            sys.exit(1)

    cache = load_cache()
    print(f"LLM re-classifier: {DEFAULT_MODEL_ID}, workers={CONCURRENT_PAPERS}, "
          f"cache={len(cache)} entries{' (DRY)' if args.no_write else ''}")
    print(f"Models: {', '.join(models)}")
    print()

    summary = {}
    for m in models:
        print(f"[{m}]")
        result = process_model(m, data_dir, cache,
                               sample=args.sample, refresh=args.refresh,
                               no_write=args.no_write)
        if result:
            summary[m] = result
        print()

    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    for m, r in summary.items():
        print(f"\n{m}:")
        print(f"  before: {r['before']}")
        print(f"  after : {r['after']}")
        print(f"  changed={r['changed']}/{r['processed']}, failed={r['failed']}")


if __name__ == "__main__":
    main()
