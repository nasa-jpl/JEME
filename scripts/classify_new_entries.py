#!/usr/bin/env python3
"""
Classify NEW citing-paper entries with Bedrock (Opus 5), matching the existing
{MODEL}_analyzed.json taxonomy. Replaces the legacy Gemini classification step.

For each entry lacking classification it assigns, in ONE LLM call:
  - engagement_level     (one of the 4 controlled values)
  - research_domain      (singular, from the model's controlled domain list)
  - research_domains     (list of general topic tags)
  - missions_instruments (list of {name, agency, type, product, data_level, usage_context})

Only entries where `engagement_level` is missing/None are processed; existing
enriched entries are left untouched (idempotent, cache-backed).

Usage:
  python scripts/classify_new_entries.py --model CMS-Flux [--limit N] [--dry-run]
"""
import argparse, json, os, sys, time, threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from llm_client import call_llm  # Bedrock

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "public" / "data"
CACHE_PATH = Path(__file__).resolve().parent / "classify_new_cache.json"

ENGAGEMENT_LEVELS = [
    "Citation",
    "Level 1: Data Usage",
    "Level 2: Model Adaptation",
    "Level 3: Foundational Method",
]

# Controlled singular-domain vocabulary per model, mirroring the labels the
# existing (Gemini-classified) entries use, so new Opus-5 labels stay aligned.
DOMAINS = {
    "CMS-Flux": [
        "CO2 Flux & Carbon Budget", "Atmospheric CO2 Inversions",
        "Methane & Trace Gases", "Carbon Cycle Modeling",
        "Land-Atmosphere Exchange", "Fossil Fuel & Urban Emissions",
        "Satellite Carbon Observations", "Biomass & Fire Emissions",
        "Ocean Carbon Uptake",
    ],
    "CARDAMOM": [
        "Terrestrial Carbon Cycle", "Vegetation & Forest Dynamics",
        "Arctic & Permafrost Carbon", "Soil & Peatland Carbon",
        "Carbon Data Assimilation", "Climate Projections & Feedbacks",
        "Remote Sensing of Ecosystems", "Fire & Disturbance Ecology",
        "Land Use & Land Cover Change", "Forest Ecology", "Ecological Modeling",
    ],
    "LES": [
        "Boundary Layer Turbulence", "Methane Detection & Plumes",
        "Cloud & Stratocumulus Simulation", "Remote Sensing & AI Methods",
        "Numerical Methods", "Wind & Urban Applications",
        "Nonlinear Dynamics", "Fluid Dynamics", "Machine Learning",
    ],
    "EDMF": [
        "Convection & Cloud Processes", "Boundary Layer Turbulence",
        "General Atmospheric Science", "Weather Prediction & NWP",
        "Parameterization Development", "Aerosol & Radiation",
        "Air Quality & Pollution", "Tropical Cyclones & Storms",
    ],
    "RAPID": [
        "River Routing & Discharge", "Flood Modeling & Prediction",
        "Watershed & Catchment Hydrology", "General Hydrologic Science",
        "Remote Sensing Applications", "Water Resource Management",
        "Groundwater & Aquifer", "Climate & Water Cycle",
        "Machine Learning for Hydrology",
    ],
    "TROPESS": [
        "Trace Gas Products", "Air Quality & Megacity Studies",
        "Wildfire & Biomass Burning Emissions", "Carbon Cycle & Flux Inversions",
        "Atmospheric Chemistry & Reanalysis", "Tropospheric Composition Retrievals",
        "Validation & Intercomparison", "Radiative Transfer & Forward Modeling",
        "Climate Science",
    ],
    "MOMO-CHEM": [
        "Air Quality & Health", "Chemical Transport Modeling",
        "Methane & Trace Gases", "Satellite Atmospheric Observations",
        "Climate-Chemistry Interactions", "Ozone & Stratospheric Chemistry",
        "Aerosol Processes & Effects", "Wildfire & Biomass Burning",
        "Atmospheric Chemistry",
    ],
}

# One-line context per model to ground the classifier's SYSTEM prompt.
MODEL_CONTEXT = {
    "CMS-Flux": "the CMS-Flux carbon-flux inversion modeling group",
    "CARDAMOM": "the CARDAMOM terrestrial-carbon data-assimilation group",
    "LES": "the Large-Eddy Simulation (turbulence/boundary-layer) modeling group",
    "EDMF": "the EDMF (eddy-diffusivity/mass-flux) convection parameterization group",
    "RAPID": "the RAPID river-routing / hydrologic modeling group",
    "TROPESS": "the TROPESS tropospheric atmospheric-composition retrieval group",
    "MOMO-CHEM": "the MOMO-Chem global atmospheric-chemistry reanalysis group",
}

DOMAIN_TAGS = [
    "Carbon Cycle", "Remote Sensing", "Atmospheric Science", "Biogeochemistry",
    "Ecosystem Science", "Data Assimilation", "Atmospheric Chemistry",
    "Climate Change", "Climate Modeling", "Numerical Methods",
    "Hydrology & Water Resources", "Chemical Transport", "Air Quality",
    "Fire & Smoke Modeling", "Inverse Modeling", "Machine Learning",
    "Environmental Monitoring", "Oceanography", "Greenhouse Gas Emissions",
    "Greenhouse Gas Monitoring", "Atmospheric Modeling", "Soil Science",
]

def build_system(model):
    ctx = MODEL_CONTEXT.get(model, f"NASA JPL's {model} modeling group")
    return (
        f"You are a scientific-literature classifier for {ctx}. You classify how a "
        "*citing* paper engages with the team's work and its scientific topic. "
        "Respond ONLY with valid JSON."
    )

def build_prompt(model, entry):
    domains = DOMAINS.get(model, [])
    return f"""Classify this citing paper. It cites a {model} team paper titled: "{entry.get('citing_team_paper','')}".

CITING PAPER
Title: {entry.get('title','')}
Venue: {entry.get('venue','')}
Year: {entry.get('year','')}
Abstract: {(entry.get('abstract') or '')[:2500]}

Return a JSON object with EXACTLY these keys:

1. "engagement_level": how deeply this paper uses the {model} team's work. Choose ONE of:
   - "Citation"                     (mentions/cites in passing, background, or literature review)
   - "Level 1: Data Usage"          (directly uses {model} data products or outputs)
   - "Level 2: Model Adaptation"    (adapts, extends, couples, or modifies the {model} model/method)
   - "Level 3: Foundational Method" (builds a core methodology on {model}, or it is central to the work)

2. "research_domain": ONE label best describing the paper's topic. Prefer one of these controlled labels: {domains}. If none fit, give a concise 2-4 word domain.

3. "research_domains": a list of 3-6 general topic tags. Prefer tags from: {DOMAIN_TAGS}. Add others only if clearly warranted.

4. "missions_instruments": a list of satellite missions / instruments the paper actually USES or analyzes (not merely mentions). Each item = {{"name","agency","type","product","data_level","usage_context"}}. Use "Not specified" for unknown sub-fields. If none are used, return an empty list [].

Respond with ONLY the JSON object."""

def load_cache():
    if CACHE_PATH.exists():
        try: return json.loads(CACHE_PATH.read_text())
        except Exception: return {}
    return {}

def entry_key(e, model=""):
    base = (e.get("doi") or e.get("paper_id") or e.get("title") or "").strip().lower()
    # Namespace by model: the same citing paper gets a model-specific engagement
    # label (it can be Foundational for one team, a passing Citation for another).
    return f"{model}::{base}" if model else base

def coerce(result):
    lvl = result.get("engagement_level", "Citation")
    if lvl not in ENGAGEMENT_LEVELS:
        # tolerate short forms
        for L in ENGAGEMENT_LEVELS:
            if lvl and lvl.lower() in L.lower():
                lvl = L; break
        else:
            lvl = "Citation"
    rds = result.get("research_domains") or []
    if isinstance(rds, str): rds = [rds]
    mis = result.get("missions_instruments") or []
    if not isinstance(mis, list): mis = []
    clean_mis = []
    for m in mis:
        if isinstance(m, dict) and m.get("name"):
            clean_mis.append({
                "name": m.get("name","Not specified"),
                "agency": m.get("agency","Not specified"),
                "type": m.get("type","Not specified"),
                "product": m.get("product","Not specified"),
                "data_level": m.get("data_level","Not specified"),
                "usage_context": m.get("usage_context","Not specified"),
            })
    return {
        "engagement_level": lvl,
        "research_domain": (result.get("research_domain") or "General Science").strip(),
        "research_domains": [str(x) for x in rds][:8],
        "missions_instruments": clean_mis,
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=12)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    path = DATA_DIR / f"{args.model}_analyzed.json"
    data = json.loads(path.read_text())
    cache = load_cache()

    todo = [e for e in data if not e.get("engagement_level")]
    if args.limit: todo = todo[:args.limit]
    print(f"{args.model}: {len(data)} total entries, {len(todo)} need classification")
    if args.dry_run:
        for e in todo[:10]: print("  -", (e.get('title') or '')[:70])
        return

    system = build_system(args.model)
    lock = threading.Lock()
    done = {"n": 0}
    total = len(todo)

    def classify_one(e):
        """Return coerced result for entry e, using/refreshing the shared cache."""
        k = entry_key(e, args.model)
        with lock:
            if k in cache:
                return k, cache[k]
        try:
            res = coerce(call_llm(build_prompt(args.model, e), system=system, temperature=0.1))
        except Exception as ex:
            print("  ! LLM error, defaulting:", str(ex)[:80])
            res = coerce({})
        with lock:
            cache[k] = res
        return k, res

    def apply(e, res):
        e.update(res)
        unc = e.setdefault("uncertainty", {})
        prov = unc.setdefault("classification_provenance", {})
        prov["engagement_source"] = "bedrock:opus-5"
        prov["domain_source"] = "bedrock:opus-5"

    # Fast path: entries already cached, applied inline (no LLM).
    pending = []
    for e in todo:
        k = entry_key(e, args.model)
        if k in cache:
            apply(e, cache[k])
            done["n"] += 1
        else:
            pending.append(e)
    print(f"  {done['n']} from cache, {len(pending)} to fetch via {args.workers} workers")

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = {ex.submit(classify_one, e): e for e in pending}
        for fut in as_completed(futs):
            e = futs[fut]
            _, res = fut.result()
            apply(e, res)
            with lock:
                done["n"] += 1
                n = done["n"]
            if n % 25 == 0:
                print(f"  classified {n}/{total}")
                # Snapshot the cache under the lock: worker threads are still
                # inserting into it, so serializing the live dict races
                # ("dictionary changed size during iteration").
                with lock:
                    cache_snap = dict(cache)
                CACHE_PATH.write_text(json.dumps(cache_snap, indent=1))
                path.write_text(json.dumps(data, indent=2, ensure_ascii=False))

    with lock:
        cache_snap = dict(cache)
    CACHE_PATH.write_text(json.dumps(cache_snap, indent=1))
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"Done. Classified {done['n']} entries. Wrote {path}")

if __name__ == "__main__":
    main()
