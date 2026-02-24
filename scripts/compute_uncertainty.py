#!/usr/bin/env python3
"""
Compute uncertainty scores for citation entries.

Calculates per-entry evidence confidence, pipeline variance, and composite
confidence scores from existing metadata — no API calls required.

Usage:
    python scripts/compute_uncertainty.py --model ECCO
    python scripts/compute_uncertainty.py --all
    python scripts/compute_uncertainty.py --model RAPID --dry-run
"""

import argparse
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Reuse keyword dictionaries from classify_papers.py
# ---------------------------------------------------------------------------

DOMAIN_KEYWORDS = {
    "Hydrology & Water Resources": [
        "river", "streamflow", "discharge", "flood", "water resource", "watershed",
        "runoff", "precipitation", "rainfall", "groundwater", "aquifer", "irrigation",
        "dam", "reservoir", "hydrological", "hydrolog", "stream", "flow routing",
        "water management", "water quality", "freshwater", "lake", "wetland"
    ],
    "Ocean & Marine Science": [
        "ocean", "sea level", "marine", "coastal", "tide", "wave", "current",
        "salinity", "thermohaline", "bathymetry", "submarine", "seafloor",
        "oceanograph", "estuar", "coral", "fisheries", "maritime", "offshore"
    ],
    "Climate Science": [
        "climate", "global warming", "greenhouse", "carbon", "co2", "temperature",
        "radiative", "forcing", "ipcc", "projection", "scenario", "rcp", "ssp",
        "paleoclimate", "climate change", "anthropogenic", "emission"
    ],
    "Atmospheric Science": [
        "atmospher", "weather", "meteorolog", "aerosol", "ozone", "radiation",
        "cloud", "convection", "boundary layer", "wind", "cyclone", "hurricane",
        "monsoon", "jet stream", "troposphere", "stratosphere", "air quality"
    ],
    "Cryosphere & Glaciology": [
        "ice sheet", "glacier", "snow", "permafrost", "arctic", "antarctic",
        "cryosphere", "ice cap", "sea ice", "ice flow", "ice dynamics", "firn",
        "greenland", "ice mass", "glacial", "polar", "frost", "icesheet"
    ],
    "Remote Sensing & Satellite": [
        "satellite", "remote sensing", "lidar", "radar", "modis", "landsat",
        "sentinel", "grace", "altimetry", "swot", "gps", "insar", "sar",
        "imagery", "pixel", "spectral", "geospatial"
    ],
    "Ecosystem & Biogeochemistry": [
        "ecosystem", "vegetation", "forest", "carbon cycle", "biomass", "npp",
        "photosynthesis", "respiration", "soil", "nutrient", "nitrogen", "phosphorus",
        "biogeochemical", "land surface", "biosphere", "ecology", "habitat"
    ],
    "Machine Learning & Data Science": [
        "machine learning", "deep learning", "neural network", "artificial intelligence",
        "data assimilation", "data-driven", "ensemble", "prediction", "forecast",
        "random forest", "regression", "classification", "lstm", "cnn", "transformer"
    ],
    "Modeling & Simulation": [
        "model", "simulation", "numerical", "parameterization", "calibration",
        "validation", "uncertainty", "sensitivity", "coupled model", "gcm",
        "regional model", "downscaling", "resolution", "grid", "finite element"
    ],
    "Geophysics & Geodesy": [
        "gravity", "geodetic", "geoid", "mass balance", "crustal", "tectonic",
        "seismic", "isostatic", "mantle", "lithosphere", "geophysic"
    ]
}

ENGAGEMENT_KEYWORDS = {
    "Level 4: Foundational Method": [
        "based on", "built upon", "extends", "foundation", "core method",
        "fundamental", "underlying", "backbone", "integral part", "key component"
    ],
    "Level 3: Model Adaptation": [
        "modified", "adapted", "customized", "enhanced", "improved", "extended",
        "coupled with", "integrated with", "combined", "incorporated"
    ],
    "Level 2: Data Usage": [
        "data from", "output from", "results from", "using data", "utilized",
        "employed", "applied", "used", "dataset", "products"
    ],
    "Level 1: Simple Citation": [
        "cited", "referenced", "mentioned", "noted", "described", "reported",
        "previous study", "prior work", "earlier research"
    ]
}

# Model-specific core terms for team_paper_relevance_tier
MODEL_CORE_KEYWORDS = {
    "RAPID": ["rapid", "routing", "river network", "nhd", "nhdplus", "discharge", "hydrodynamic"],
    "CMS-Flux": ["cms", "carbon monitoring", "co2 flux", "carbon flux", "inversion"],
    "ECCO": ["ecco", "ocean state estimation", "ocean circulation", "mit general circulation"],
    "ISSM": ["issm", "ice sheet system", "ice dynamics", "ice flow"],
    "MOMO-CHEM": ["momo", "chemical transport", "atmospheric chemistry", "air quality"],
    "CARDAMOM": ["cardamom", "carbon data model", "terrestrial carbon", "ecosystem carbon"],
    "LES": ["large eddy", "les ", "turbulence resolving", "boundary layer simulation"],
    "EDMF": ["edmf", "eddy diffusivity", "mass flux", "convective parameterization"],
}


# ---------------------------------------------------------------------------
# Classification helpers (mirror classify_papers.py logic)
# ---------------------------------------------------------------------------

def classify_domain(paper):
    """Classify paper into research domain based on title, abstract, venue."""
    text_parts = []
    title = paper.get("title", "")
    if isinstance(title, list):
        title = title[0] if title else ""
    text_parts.append(title.lower())
    text_parts.append((paper.get("abstract", "") or "").lower())
    venue = paper.get("venue", "") or paper.get("container-title", "")
    if isinstance(venue, list):
        venue = venue[0] if venue else ""
    text_parts.append(venue.lower())
    text = " ".join(text_parts)

    domain_scores = {}
    for domain, keywords in DOMAIN_KEYWORDS.items():
        score = sum(len(re.findall(r"\b" + re.escape(kw.lower()) + r"\b", text)) for kw in keywords)
        if score > 0:
            domain_scores[domain] = score
    return max(domain_scores, key=domain_scores.get) if domain_scores else "General Science"


def classify_engagement(paper):
    """Classify paper engagement level based on abstract + citing context."""
    text_parts = []
    text_parts.append((paper.get("abstract", "") or "").lower())
    text_parts.append((paper.get("citing_team_paper", "") or "").lower())
    text = " ".join(text_parts)

    for level in ["Level 4: Foundational Method", "Level 3: Model Adaptation",
                  "Level 2: Data Usage", "Level 1: Simple Citation"]:
        for kw in ENGAGEMENT_KEYWORDS[level]:
            if kw.lower() in text:
                return level

    citation_count = paper.get("citation_count", 0) or paper.get("is-referenced-by-count", 0) or 0
    if citation_count > 100:
        return "Level 3: Model Adaptation"
    elif citation_count > 20:
        return "Level 2: Data Usage"
    return "Level 1: Simple Citation"


# ---------------------------------------------------------------------------
# Evidence confidence computation
# ---------------------------------------------------------------------------

def compute_keyword_match_score(paper):
    """Score how well the paper's text matches domain keywords (0-1)."""
    text_parts = []
    title = paper.get("title", "")
    if isinstance(title, list):
        title = title[0] if title else ""
    text_parts.append(title.lower())
    text_parts.append((paper.get("abstract", "") or "").lower())
    venue = paper.get("venue", "") or paper.get("container-title", "")
    if isinstance(venue, list):
        venue = venue[0] if venue else ""
    text_parts.append(venue.lower())
    text = " ".join(text_parts)

    total_matches = 0
    total_keywords = 0
    for keywords in DOMAIN_KEYWORDS.values():
        for kw in keywords:
            total_keywords += 1
            if re.search(r"\b" + re.escape(kw.lower()) + r"\b", text):
                total_matches += 1

    # Normalize: typical paper matches 5-15 keywords out of ~170
    # Scale so 10+ matches = 1.0
    return min(total_matches / 10.0, 1.0)


def compute_evidence_confidence(paper):
    """
    Compute evidence confidence (0-1) from data completeness signals.

    Weights:
        has_abstract:       0.35
        has_doi:            0.15
        has_venue:          0.15
        has_full_authors:   0.10
        keyword_match_score: 0.25
    """
    flags = {}
    flags["has_abstract"] = bool(paper.get("abstract"))
    flags["has_doi"] = bool(paper.get("doi") or paper.get("DOI"))
    venue = paper.get("venue") or paper.get("container-title")
    if isinstance(venue, list):
        venue = venue[0] if venue else ""
    flags["has_venue"] = bool(venue)
    authors = paper.get("authors") or paper.get("author") or []
    flags["has_full_authors"] = len(authors) > 0
    flags["keyword_match_score"] = round(compute_keyword_match_score(paper), 3)

    score = (
        0.35 * float(flags["has_abstract"]) +
        0.15 * float(flags["has_doi"]) +
        0.15 * float(flags["has_venue"]) +
        0.10 * float(flags["has_full_authors"]) +
        0.25 * flags["keyword_match_score"]
    )
    return round(score, 3), flags


def compute_team_paper_relevance_tier(paper, model_name):
    """Categorize the citing_team_paper by relevance to the model."""
    citing = (paper.get("citing_team_paper", "") or "").lower()
    if not citing:
        return "Unknown"

    core_kws = MODEL_CORE_KEYWORDS.get(model_name, [])

    # Check for core match
    for kw in core_kws:
        if kw.lower() in citing:
            return "Core"

    # Infrastructure keywords
    infra_kws = ["framework", "system", "platform", "infrastructure", "pipeline", "software"]
    for kw in infra_kws:
        if kw in citing:
            return "Infrastructure"

    # Data/Methods keywords
    data_kws = ["data", "method", "algorithm", "technique", "approach", "estimation", "retrieval"]
    for kw in data_kws:
        if kw in citing:
            return "Data-Methods"

    # Domain science
    domain_kws = ["study", "analysis", "investigation", "assessment", "evaluation", "observation"]
    for kw in domain_kws:
        if kw in citing:
            return "Domain Science"

    return "Tangential"


def compute_pipeline_variance(paper):
    """
    Compute pipeline variance (0-1) by comparing keyword classifier
    against the existing LLM-assigned labels.

    If domain disagrees: +0.5
    If engagement disagrees: +0.5
    """
    variance = 0.0

    existing_domain = paper.get("research_domain", "")
    keyword_domain = classify_domain(paper)
    if existing_domain and existing_domain != keyword_domain:
        variance += 0.5

    existing_engagement = paper.get("engagement_level", "")
    keyword_engagement = classify_engagement(paper)
    if existing_engagement and existing_engagement != keyword_engagement:
        variance += 0.5

    # Track agreement for provenance
    domain_agreement = 1.0 if existing_domain == keyword_domain else 0.0
    engagement_agreement = 1.0 if existing_engagement == keyword_engagement else 0.0

    return round(variance, 2), domain_agreement, engagement_agreement


def compute_miscalibration_risk(has_abstract, pipeline_variance, composite):
    """Determine miscalibration risk level."""
    if not has_abstract and pipeline_variance > 0.5:
        return "high"
    if not has_abstract or composite < 0.4:
        return "medium"
    return "low"


def compute_composite_confidence(evidence_conf, reasoning_conf, pipeline_var):
    """
    Weighted heuristic combining evidence, reasoning, and pipeline penalty.
    Clamped to [0.05, 0.99].
    """
    # Weights: evidence 0.4, reasoning 0.4, pipeline penalty 0.2
    raw = 0.4 * evidence_conf + 0.4 * reasoning_conf - 0.2 * pipeline_var
    return round(max(0.05, min(0.99, raw)), 3)


# ---------------------------------------------------------------------------
# Main processing
# ---------------------------------------------------------------------------

def compute_entry_uncertainty(paper, model_name):
    """Compute full uncertainty object for a single entry."""
    # Evidence confidence
    evidence_conf, evidence_flags = compute_evidence_confidence(paper)

    # Team paper relevance tier
    tier = compute_team_paper_relevance_tier(paper, model_name)
    evidence_flags["team_paper_relevance_tier"] = tier

    # Reasoning confidence: heuristic default (Phase 1)
    # 0.7 with abstract, 0.4 without
    has_abstract = evidence_flags["has_abstract"]
    reasoning_conf = 0.7 if has_abstract else 0.4

    # Pipeline variance
    pipeline_var, domain_agreement, engagement_agreement = compute_pipeline_variance(paper)

    # Composite
    composite = compute_composite_confidence(evidence_conf, reasoning_conf, pipeline_var)

    # Miscalibration risk
    misc_risk = compute_miscalibration_risk(has_abstract, pipeline_var, composite)

    return {
        "reasoning_confidence": reasoning_conf,
        "evidence_confidence": evidence_conf,
        "composite_confidence": composite,
        "evidence_flags": evidence_flags,
        "classification_provenance": {
            "engagement_source": "gemini",
            "domain_source": "gemini",
            "engagement_agreement": engagement_agreement,
            "domain_agreement": domain_agreement
        },
        "error_estimates": {
            "stochastic_variance": None,
            "pipeline_variance": pipeline_var,
            "miscalibration_risk": misc_risk
        }
    }


def process_model(model_name, data_dir, dry_run=False):
    """Process a single model's JSON file."""
    file_path = data_dir / f"{model_name}_analyzed.json"
    if not file_path.exists():
        print(f"  WARNING: {file_path} not found, skipping")
        return None

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"  Processing {model_name}: {len(data)} entries")

    stats = {
        "total": len(data),
        "high_confidence": 0,
        "medium_confidence": 0,
        "low_confidence": 0,
        "with_abstract": 0,
        "misc_high": 0,
        "misc_medium": 0,
        "misc_low": 0,
    }

    for entry in data:
        uncertainty = compute_entry_uncertainty(entry, model_name)
        entry["uncertainty"] = uncertainty

        # Gather stats
        comp = uncertainty["composite_confidence"]
        if comp >= 0.7:
            stats["high_confidence"] += 1
        elif comp >= 0.4:
            stats["medium_confidence"] += 1
        else:
            stats["low_confidence"] += 1

        if uncertainty["evidence_flags"]["has_abstract"]:
            stats["with_abstract"] += 1

        risk = uncertainty["error_estimates"]["miscalibration_risk"]
        stats[f"misc_{risk}"] += 1

    # Print summary
    print(f"    Composite confidence distribution:")
    print(f"      High (>=0.7):   {stats['high_confidence']} ({100*stats['high_confidence']/stats['total']:.1f}%)")
    print(f"      Medium (0.4-0.7): {stats['medium_confidence']} ({100*stats['medium_confidence']/stats['total']:.1f}%)")
    print(f"      Low (<0.4):     {stats['low_confidence']} ({100*stats['low_confidence']/stats['total']:.1f}%)")
    print(f"    Abstract coverage: {stats['with_abstract']}/{stats['total']} ({100*stats['with_abstract']/stats['total']:.1f}%)")
    print(f"    Miscalibration risk: high={stats['misc_high']}, medium={stats['misc_medium']}, low={stats['misc_low']}")

    if dry_run:
        # Print sample entry
        sample = data[0]["uncertainty"]
        print(f"    Sample uncertainty (first entry):")
        print(f"      {json.dumps(sample, indent=6)}")
        print(f"    DRY RUN: no files written")
    else:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"    Written to {file_path}")

    return stats


def main():
    parser = argparse.ArgumentParser(description="Compute uncertainty scores for citation data")
    parser.add_argument("--model", type=str, help="Process a specific model (e.g. ECCO)")
    parser.add_argument("--all", action="store_true", help="Process all models")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing files")
    args = parser.parse_args()

    if not args.model and not args.all:
        parser.print_help()
        sys.exit(1)

    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / "public" / "data"

    models = ["CARDAMOM", "CMS-Flux", "ECCO", "EDMF", "ISSM", "LES", "MOMO-CHEM", "RAPID"]

    if args.model:
        if args.model not in models:
            print(f"ERROR: Unknown model '{args.model}'. Valid models: {', '.join(models)}")
            sys.exit(1)
        models = [args.model]

    print(f"Computing uncertainty scores {'(DRY RUN)' if args.dry_run else ''}")
    print(f"Data directory: {data_dir}")
    print()

    total_processed = 0
    for model in models:
        print(f"[{model}]")
        stats = process_model(model, data_dir, dry_run=args.dry_run)
        if stats:
            total_processed += stats["total"]
        print()

    print(f"Total entries processed: {total_processed}")


if __name__ == "__main__":
    main()
