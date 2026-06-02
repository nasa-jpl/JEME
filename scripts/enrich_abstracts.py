#!/usr/bin/env python3
"""
Enrich TROPESS citation data with missing abstracts.
Pipeline: Crossref → OpenAlex → skip

Usage: python scripts/enrich_abstracts.py [--model MODEL] [--dry-run]
"""

import json
import time
import argparse
import re
import sys
import os

import requests

USER_AGENT = "science-model-dashboard/1.0 (mailto:yunkss@gmail.com)"
CROSSREF_URL = "https://api.crossref.org/works/{doi}"
OPENALEX_URL = "https://api.openalex.org/works/https://doi.org/{doi}"

DATA_PATHS = {
    "TROPESS": "public/data/TROPESS_analyzed.json",
    "GRACE":   "public/data/GRACE_analyzed.json",
    "SWOT":    "public/data/SWOT_analyzed.json",
    "RAPID":   "public/data/RAPID_analyzed.json",
    "ECCO":    "public/data/ECCO_analyzed.json",
    "CARDAMOM":"public/data/CARDAMOM_analyzed.json",
    "CMS-Flux":"public/data/CMS-Flux_analyzed.json",
    "ISSM":    "public/data/ISSM_analyzed.json",
    "LES":     "public/data/LES_analyzed.json",
    "EDMF":    "public/data/EDMF_analyzed.json",
    "MOMO-CHEM":"public/data/MOMO-CHEM_analyzed.json",
}


def clean_abstract(text):
    """Strip JATS XML tags sometimes returned by Crossref."""
    if not text:
        return None
    cleaned = re.sub(r'<[^>]+>', ' ', text)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned if len(cleaned) > 30 else None


def reconstruct_openalex_abstract(inverted_index):
    """OpenAlex stores abstract as word→[positions] map. Reconstruct to string."""
    if not inverted_index:
        return None
    word_positions = []
    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))
    word_positions.sort(key=lambda x: x[0])
    text = ' '.join(w for _, w in word_positions)
    return text if len(text) > 30 else None


def fetch_crossref_abstract(doi):
    try:
        url = CROSSREF_URL.format(doi=doi)
        r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=15)
        if r.status_code == 200:
            msg = r.json().get("message", {})
            abstract = msg.get("abstract")
            return clean_abstract(abstract)
        elif r.status_code == 404:
            return None
        elif r.status_code == 429:
            print("  [Crossref] rate-limited, sleeping 10s")
            time.sleep(10)
            return None
    except Exception as e:
        print(f"  [Crossref] error: {e}")
    return None


def fetch_openalex_abstract(doi):
    try:
        url = OPENALEX_URL.format(doi=doi)
        r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=15)
        if r.status_code == 200:
            data = r.json()
            inv = data.get("abstract_inverted_index")
            return reconstruct_openalex_abstract(inv)
        elif r.status_code == 404:
            return None
        elif r.status_code == 429:
            print("  [OpenAlex] rate-limited, sleeping 10s")
            time.sleep(10)
            return None
    except Exception as e:
        print(f"  [OpenAlex] error: {e}")
    return None


def enrich(model, dry_run=False):
    data_path = DATA_PATHS.get(model)
    if not data_path or not os.path.exists(data_path):
        print(f"Data file not found for model: {model}")
        return

    with open(data_path) as f:
        data = json.load(f)

    missing = [i for i, p in enumerate(data)
               if not p.get("abstract") or len(str(p.get("abstract") or "")) <= 20]

    print(f"{model}: {len(data)} papers, {len(missing)} missing abstracts")
    if not missing:
        print("Nothing to enrich.")
        return

    enriched = 0
    crossref_hits = 0
    openalex_hits = 0

    for idx, i in enumerate(missing):
        paper = data[i]
        doi = paper.get("doi") or paper.get("DOI")
        if not doi:
            continue

        title = paper.get("title", "")
        if isinstance(title, list):
            title = title[0] if title else ""
        print(f"  [{idx+1}/{len(missing)}] DOI={doi}")
        print(f"    Title: {title[:70]}")

        # Try Crossref first
        abstract = fetch_crossref_abstract(doi)
        if abstract:
            source = "crossref"
            crossref_hits += 1
        else:
            time.sleep(0.3)
            abstract = fetch_openalex_abstract(doi)
            if abstract:
                source = "openalex"
                openalex_hits += 1

        if abstract:
            print(f"    -> {source}: {abstract[:80]}...")
            if not dry_run:
                data[i]["abstract"] = abstract
            enriched += 1
        else:
            print("    -> not found")

        time.sleep(0.2)

    print(f"\nResults: {enriched}/{len(missing)} abstracts found "
          f"(crossref={crossref_hits}, openalex={openalex_hits})")

    if not dry_run and enriched > 0:
        with open(data_path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"Saved to {data_path}")
    elif dry_run:
        print("[dry-run] No changes written.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="TROPESS", help="Model name (default: TROPESS)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    enrich(args.model, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
