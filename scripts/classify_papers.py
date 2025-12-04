#!/usr/bin/env python3
"""
Script to classify papers by research domain and engagement level.
Processes citation data files and adds research_domain and engagement_level fields.
"""

import json
import os
import re
from pathlib import Path

# Research domain keywords mapping
DOMAIN_KEYWORDS = {
    # Hydrology and Water Resources
    "Hydrology & Water Resources": [
        "river", "streamflow", "discharge", "flood", "water resource", "watershed",
        "runoff", "precipitation", "rainfall", "groundwater", "aquifer", "irrigation",
        "dam", "reservoir", "hydrological", "hydrolog", "stream", "flow routing",
        "water management", "water quality", "freshwater", "lake", "wetland"
    ],
    # Ocean and Marine Science
    "Ocean & Marine Science": [
        "ocean", "sea level", "marine", "coastal", "tide", "wave", "current",
        "salinity", "thermohaline", "bathymetry", "submarine", "seafloor",
        "oceanograph", "estuar", "coral", "fisheries", "maritime", "offshore"
    ],
    # Climate Science
    "Climate Science": [
        "climate", "global warming", "greenhouse", "carbon", "co2", "temperature",
        "radiative", "forcing", "ipcc", "projection", "scenario", "rcp", "ssp",
        "paleoclimate", "climate change", "anthropogenic", "emission"
    ],
    # Atmospheric Science
    "Atmospheric Science": [
        "atmospher", "weather", "meteorolog", "aerosol", "ozone", "radiation",
        "cloud", "convection", "boundary layer", "wind", "cyclone", "hurricane",
        "monsoon", "jet stream", "troposphere", "stratosphere", "air quality"
    ],
    # Cryosphere & Glaciology
    "Cryosphere & Glaciology": [
        "ice sheet", "glacier", "snow", "permafrost", "arctic", "antarctic",
        "cryosphere", "ice cap", "sea ice", "ice flow", "ice dynamics", "firn",
        "greenland", "ice mass", "glacial", "polar", "frost", "icesheet"
    ],
    # Remote Sensing & Satellite
    "Remote Sensing & Satellite": [
        "satellite", "remote sensing", "lidar", "radar", "modis", "landsat",
        "sentinel", "grace", "altimetry", "swot", "gps", "insar", "sar",
        "imagery", "pixel", "spectral", "geospatial"
    ],
    # Ecosystem & Biogeochemistry
    "Ecosystem & Biogeochemistry": [
        "ecosystem", "vegetation", "forest", "carbon cycle", "biomass", "npp",
        "photosynthesis", "respiration", "soil", "nutrient", "nitrogen", "phosphorus",
        "biogeochemical", "land surface", "biosphere", "ecology", "habitat"
    ],
    # Machine Learning & Data Science
    "Machine Learning & Data Science": [
        "machine learning", "deep learning", "neural network", "artificial intelligence",
        "data assimilation", "data-driven", "ensemble", "prediction", "forecast",
        "random forest", "regression", "classification", "lstm", "cnn", "transformer"
    ],
    # Modeling & Simulation
    "Modeling & Simulation": [
        "model", "simulation", "numerical", "parameterization", "calibration",
        "validation", "uncertainty", "sensitivity", "coupled model", "gcm",
        "regional model", "downscaling", "resolution", "grid", "finite element"
    ],
    # Geophysics & Geodesy
    "Geophysics & Geodesy": [
        "gravity", "geodetic", "geoid", "mass balance", "crustal", "tectonic",
        "seismic", "isostatic", "mantle", "lithosphere", "geophysic"
    ]
}

# Engagement level keywords
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


def classify_domain(paper):
    """Classify paper into research domain based on title, abstract, and venue."""
    # Combine text fields for analysis
    text_parts = []

    title = paper.get('title', '')
    if isinstance(title, list):
        title = title[0] if title else ''
    text_parts.append(title.lower())

    abstract = paper.get('abstract', '') or ''
    text_parts.append(abstract.lower())

    venue = paper.get('venue', '') or paper.get('container-title', '')
    if isinstance(venue, list):
        venue = venue[0] if venue else ''
    text_parts.append(venue.lower())

    text = ' '.join(text_parts)

    # Score each domain
    domain_scores = {}
    for domain, keywords in DOMAIN_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            # Count occurrences with word boundary awareness
            count = len(re.findall(r'\b' + re.escape(keyword.lower()) + r'\b', text))
            score += count
        if score > 0:
            domain_scores[domain] = score

    # Return domain with highest score, or "General Science" if no match
    if domain_scores:
        return max(domain_scores, key=domain_scores.get)
    return "General Science"


def classify_engagement(paper):
    """Classify paper engagement level based on citing context."""
    # Get text to analyze
    text_parts = []

    abstract = paper.get('abstract', '') or ''
    text_parts.append(abstract.lower())

    # Check for citing_team_paper field which indicates the relationship
    citing_context = paper.get('citing_team_paper', '') or ''
    text_parts.append(citing_context.lower())

    text = ' '.join(text_parts)

    # Score each engagement level (check from highest to lowest)
    for level in ["Level 4: Foundational Method", "Level 3: Model Adaptation",
                  "Level 2: Data Usage", "Level 1: Simple Citation"]:
        keywords = ENGAGEMENT_KEYWORDS[level]
        for keyword in keywords:
            if keyword.lower() in text:
                return level

    # Default based on citation count (higher citations often indicate deeper engagement)
    citation_count = paper.get('citation_count', 0) or paper.get('is-referenced-by-count', 0) or 0

    if citation_count > 100:
        return "Level 3: Model Adaptation"
    elif citation_count > 20:
        return "Level 2: Data Usage"
    else:
        return "Level 1: Simple Citation"


def process_file(input_path, output_path):
    """Process a single JSON file and add classifications."""
    print(f"Processing {input_path}...")

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Filter out papers with invalid years
    # Valid range: 1990 (reasonable start) to current year (2025)
    MIN_YEAR = 1990
    MAX_YEAR = 2025

    original_count = len(data)
    filtered_data = []
    removed_count = 0

    for paper in data:
        year = paper.get('year')
        if year is not None and (year < MIN_YEAR or year > MAX_YEAR):
            removed_count += 1
            continue
        filtered_data.append(paper)

    data = filtered_data
    if removed_count > 0:
        print(f"  Removed {removed_count} papers with invalid years (outside {MIN_YEAR}-{MAX_YEAR})")

    # Track statistics
    domain_counts = {}
    engagement_counts = {}

    for paper in data:
        # Add research domain
        domain = classify_domain(paper)
        paper['research_domain'] = domain
        domain_counts[domain] = domain_counts.get(domain, 0) + 1

        # Add engagement level
        engagement = classify_engagement(paper)
        paper['engagement_level'] = engagement
        engagement_counts[engagement] = engagement_counts.get(engagement, 0) + 1

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print(f"  Processed {len(data)} papers (from {original_count})")
    print(f"  Domain distribution: {domain_counts}")
    print(f"  Engagement distribution: {engagement_counts}")
    print(f"  Output: {output_path}")
    return len(data)


def main():
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / 'src' / 'data'

    # Process all model files
    models = ['CARDAMOM', 'CMS-Flux', 'ECCO', 'EDMF', 'ISSM', 'LES', 'MOMO-CHEM', 'RAPID']

    total_papers = 0
    for model in models:
        input_file = data_dir / f'{model}_analyzed.json'
        if input_file.exists():
            # Process in place (overwrite)
            total_papers += process_file(input_file, input_file)
        else:
            print(f"Warning: {input_file} not found")

    print(f"\nTotal papers processed: {total_papers}")


if __name__ == '__main__':
    main()
