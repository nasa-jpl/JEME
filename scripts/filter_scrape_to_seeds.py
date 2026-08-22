#!/usr/bin/env python3
"""
Filter a scrape's citing papers down to those reached from the CURRENT seed
list, after prune_seeds.py has removed off-topic team papers.

The scraper output records which team paper each citing paper came from
(`citing_team_paper`), so pruned seeds can be dropped without re-scraping.
A citing paper is kept if ANY kept seed cites it.

Usage:
  python scripts/filter_scrape_to_seeds.py --model RAPID
"""
import argparse, json, re, sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "public" / "data"
OUT_DIR = PROJECT_DIR / "citation_scraper" / "output"

SEED_FILES = {
    "CMS-Flux": "cms_flux_team_papers.json",
    "CARDAMOM": "cardamom_team_papers.json", "EDMF": "EDMF_team_papers.json",
    "LES": "LES_team_papers.json", "MOMO-CHEM": "momo_chem_team_papers.json",
    "RAPID": "rapid_team_papers.json", "TROPESS": "tropess_team_papers.json",
}


def norm(t):
    if isinstance(t, list):
        t = t[0] if t else ""
    return re.sub(r"[^\w\s]", "", (t or "")).lower().strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True, choices=sorted(SEED_FILES))
    args = ap.parse_args()
    m = args.model

    raw = json.loads((DATA_DIR / SEED_FILES[m]).read_text())
    if isinstance(raw, dict):
        raw = raw.get("papers") or list(raw.values())[0]
    kept = {norm(e.get("title")) for e in raw if norm(e.get("title"))}

    src = OUT_DIR / f"{m}_citations_citations_only.json"
    data = json.loads(src.read_text())
    if isinstance(data, dict):
        data = data.get("citations") or data.get("papers") or []

    out = [c for c in data if norm(c.get("citing_team_paper")) in kept]
    dst = OUT_DIR / f"{m}_citations_pruned.json"
    dst.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    uniq = len({(c.get("doi") or c.get("paper_id") or c.get("title") or "").lower() for c in out})
    print(f"[{m}] seeds kept={len(kept)}  scrape {len(data)} -> {len(out)} links "
          f"({uniq} unique citing papers)  -> {dst.name}")


if __name__ == "__main__":
    main()
