#!/usr/bin/env python3
"""
Rename engagement levels in all data files:
  Level 2: Data Usage        -> Level 1: Data Usage
  Level 3: Model Adaptation  -> Level 2: Model Adaptation
  Level 4: Foundational Method -> Level 3: Foundational Method

Also updates phase2 provenance fields that store old level names.

Usage:
    python scripts/rename_engagement_levels.py --dry-run
    python scripts/rename_engagement_levels.py
"""

import argparse
import json
import glob
import os

RENAME_MAP = {
    "Level 4: Foundational Method": "Level 3: Foundational Method",
    "Level 4: Foundational or Core Influence": "Level 3: Foundational Method",
    "Level 3: Model Adaptation": "Level 2: Model Adaptation",
    "Level 3: Extension or Adaptation": "Level 2: Model Adaptation",
    "Level 2: Data Usage": "Level 1: Data Usage",
    "Level 2: Direct Use": "Level 1: Data Usage",
}

def rename_level(value):
    if not value or not isinstance(value, str):
        return value
    for old, new in RENAME_MAP.items():
        if value == old or value.startswith(old):
            return new
    return value


def process_file(filepath, dry_run=False):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    model = os.path.basename(filepath).replace("_analyzed.json", "")
    changes = 0

    for entry in data:
        # Rename engagement_level
        old_el = entry.get("engagement_level", "")
        new_el = rename_level(old_el)
        if new_el != old_el:
            entry["engagement_level"] = new_el
            changes += 1

        # Rename phase2 provenance majority engagement
        prov = entry.get("uncertainty", {}).get("classification_provenance", {})
        old_p2 = prov.get("phase2_majority_engagement", "")
        new_p2 = rename_level(old_p2)
        if new_p2 != old_p2:
            prov["phase2_majority_engagement"] = new_p2

    print(f"  {model}: {len(data)} papers, {changes} engagement levels renamed")

    if not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    return changes


def main():
    parser = argparse.ArgumentParser(description="Rename engagement levels L2->L1, L3->L2, L4->L3")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()

    data_dir = os.path.join(os.path.dirname(__file__), "..", "public", "data")
    files = sorted(glob.glob(os.path.join(data_dir, "*_analyzed.json")))

    print(f"Renaming engagement levels {'(DRY RUN)' if args.dry_run else ''}")
    print(f"  L2: Data Usage -> L1: Data Usage")
    print(f"  L3: Model Adaptation -> L2: Model Adaptation")
    print(f"  L4: Foundational Method -> L3: Foundational Method")
    print()

    total = 0
    for f in files:
        total += process_file(f, dry_run=args.dry_run)

    print(f"\nTotal: {total} entries renamed")


if __name__ == "__main__":
    main()
