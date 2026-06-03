#!/usr/bin/env python3
"""
Promote team papers currently labelled "Citation" to "Data Usage" via a
by-author override.

Rationale: a team paper is by the model/mission group itself. With overwhelming
likelihood it uses the team's data — even when that data is not named in the
abstract. The keyword/LLM classifiers undercount these because team papers often
present new science using the team's tool as background machinery rather than
mentioning it by name.

For each team paper:
  - if engagement_level == "Citation":
        engagement_level = "Data Usage"  (mission)
        engagement_level = "Level 1: Data Usage"  (model)
        record manual_override provenance
  - otherwise: leave alone (already Data Usage / Model Adaptation / Foundational)

Usage:
  python scripts/promote_team_papers.py --all
  python scripts/promote_team_papers.py --model ECCO
  python scripts/promote_team_papers.py --all --dry-run
"""

import argparse, datetime, json, os, sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / 'public' / 'data'

# Model -> (team_papers_filename, kind, label)
MODELS = {
    'CARDAMOM':  ('cardamom_team_papers.json',  'model',   'Level 1: Data Usage'),
    'CMS-Flux':  ('cms_flux_team_papers.json',  'model',   'Level 1: Data Usage'),
    'ECCO':      ('ecco_team_papers.json',      'model',   'Level 1: Data Usage'),
    'EDMF':      ('EDMF_team_papers.json',      'model',   'Level 1: Data Usage'),
    'GRACE':     ('grace_team_papers.json',     'mission', 'Data Usage'),
    'ISSM':      ('issm_team_papers.json',      'model',   'Level 1: Data Usage'),
    'LES':       ('LES_team_papers.json',       'model',   'Level 1: Data Usage'),
    'MOMO-CHEM': ('momo_chem_team_papers.json', 'model',   'Level 1: Data Usage'),
    'RAPID':     ('rapid_team_papers.json',     'model',   'Level 1: Data Usage'),
    'SWOT':      ('swot_team_papers.json',      'mission', 'Data Usage'),
    'TROPESS':   ('tropess_team_papers.json',   'mission', 'Data Usage'),
}


def load_seed_dois(filename):
    path = DATA_DIR / filename
    if not path.exists():
        return set()
    with open(path) as f:
        d = json.load(f)
    seeds = []
    if isinstance(d, dict):
        # Some files: {"MODEL": [...]}; others: {"model_name": "...", "papers": [...], ...}
        if 'papers' in d and isinstance(d['papers'], list):
            seeds = d['papers']
        else:
            for v in d.values():
                if isinstance(v, list):
                    seeds = v
                    break
    elif isinstance(d, list):
        seeds = d
    return {(s.get('doi') or '').strip().lower()
            for s in seeds if isinstance(s, dict) and (s.get('doi') or '').strip()}


def process_model(model, seeds_filename, target_label, dry_run):
    seed_dois = load_seed_dois(seeds_filename)
    if not seed_dois:
        print(f'  {model}: no seed DOIs, skipping')
        return 0
    apath = DATA_DIR / f'{model}_analyzed.json'
    if not apath.exists():
        print(f'  {model}: {apath.name} missing, skipping')
        return 0
    with open(apath) as f:
        data = json.load(f)

    ts = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
    promoted = 0
    skipped_already = 0
    matched = 0
    for entry in data:
        doi = (entry.get('doi') or entry.get('DOI') or '').strip().lower()
        if not doi or doi not in seed_dois:
            continue
        matched += 1
        prev = entry.get('engagement_level')
        if prev != 'Simple Citation':
            skipped_already += 1
            continue
        if not dry_run:
            entry['engagement_level'] = target_label
            prov = entry.setdefault('uncertainty', {}).setdefault('classification_provenance', {})
            prov['team_paper_override'] = {
                'previous_label': prev,
                'new_label': target_label,
                'reason': 'Team paper (authored by the model/mission group); '
                          'minimum engagement level is Data Usage by the by-author rule.',
                'reviewer': 'rule',
                'timestamp': ts,
            }
        promoted += 1

    if not dry_run and promoted:
        with open(apath, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    print(f'  {model}: matched {matched}/{len(seed_dois)} team-paper DOIs, '
          f'promoted {promoted} (already higher: {skipped_already})')
    return promoted


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', type=str)
    parser.add_argument('--all', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    if not (args.model or args.all):
        parser.print_help(); sys.exit(1)

    models = list(MODELS) if args.all else [args.model]
    print(f'Team-paper promotion {"(DRY RUN)" if args.dry_run else ""} — {len(models)} models')
    total = 0
    for m in models:
        if m not in MODELS:
            print(f'  ERROR unknown model {m}'); continue
        seeds_fn, _kind, target = MODELS[m]
        total += process_model(m, seeds_fn, target, args.dry_run)
    print(f'\nTotal promotions: {total}')


if __name__ == '__main__':
    main()
