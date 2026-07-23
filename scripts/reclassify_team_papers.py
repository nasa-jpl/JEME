#!/usr/bin/env python3
"""
Re-classify team papers for any JEME/JEOE model using full abstract + DAS.

For each team paper (entry whose title appears as a `citing_team_paper`
in the same JSON), pulls Crossref abstract, optionally enriches with
DAS/Methods text via das_enrich.fetch_html, then runs the LLM
engagement-level classifier with the rich evidence.

Usage:
  python scripts/reclassify_team_papers.py --model CARDAMOM
  python scripts/reclassify_team_papers.py --models CARDAMOM,ECCO
  python scripts/reclassify_team_papers.py --all
  python scripts/reclassify_team_papers.py --all --dry-run
"""

import argparse, csv, datetime, html as html_mod, json, re, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

ROOT = Path(__file__).parent.parent
SCRIPTS = Path(__file__).parent
DATA_DIR = ROOT / 'public' / 'data'

WORKERS = 6
UA = 'das_enrich/1.0 (mailto:yunkss@gmail.com)'

sys.path.insert(0, str(SCRIPTS))
from llm_client import call_llm, DEFAULT_MODEL_ID  # noqa: E402
from das_enrich import (  # noqa: E402
    fetch_html, build_enrichment, html_to_text, extract_data_availability,
    MARKERS as DAS_MARKERS,
)
from llm_reclassify_engagement import (  # noqa: E402
    build_prompt, MODEL_CONTEXT, VALID_LABELS,
)

# TROPESS isn't in das_enrich.MARKERS; provide its pattern locally.
TROPESS_MARKERS = re.compile(
    r'\b(TROPESS|MUSES|CrIS|AIRS|TES|MOMO-?CHEM|TCR-?[12]|'
    r'Tropospheric\s+Emission\s+Spectrometer|tes\.jpl\.nasa\.gov)\b',
    re.IGNORECASE,
)


def get_marker(model):
    return DAS_MARKERS.get(model) or (TROPESS_MARKERS if model == 'TROPESS' else None)


def crossref_abstract(doi):
    try:
        r = requests.get(f'https://api.crossref.org/works/{doi}',
                         headers={'User-Agent': UA}, timeout=20)
        if r.status_code != 200:
            return ''
        a = (r.json().get('message') or {}).get('abstract') or ''
        a = re.sub(r'<[^>]+>', ' ', a)
        a = html_mod.unescape(a)
        return re.sub(r'\s+', ' ', a).strip()
    except Exception:
        return ''


def enriched_evidence(doi, abstract, marker_re):
    parts = [abstract] if abstract else []
    html = fetch_html(doi) if doi else None
    fetched = bool(html)
    if html and marker_re:
        enrichment = build_enrichment(html, marker_re)
        if enrichment:
            parts.append(enrichment)
        elif abstract:
            das = extract_data_availability(html_to_text(html))
            if das:
                parts.append('Data Availability: ' + das[:1500])
    return '\n\n'.join(parts).strip(), fetched


def classify_one(model, entry, valid):
    doi = (entry.get('doi') or '').strip()
    abstract = crossref_abstract(doi) if doi else ''
    marker = get_marker(model)
    evidence, fetched = enriched_evidence(doi, abstract, marker)
    ent = dict(entry)
    if evidence:
        ent['abstract'] = evidence
    prompt = build_prompt(model, ent)
    try:
        result = call_llm(prompt, temperature=0.1)
    except RuntimeError:
        return None
    if not result or result.get('engagement_level') not in valid:
        return None
    result['_evidence'] = evidence
    result['_fetched'] = fetched
    result['_has_abstract'] = bool(abstract)
    return result


def find_team_entries(data):
    team_titles = {p.get('citing_team_paper') for p in data if p.get('citing_team_paper')}
    team_titles.discard(None)
    seen = set(); team = []
    for p in data:
        title = p.get('title')
        if isinstance(title, list): title = title[0] if title else ''
        if title in team_titles and title not in seen:
            seen.add(title); team.append(p)
    return team


def run_model(model, dry_run=False):
    data_path = DATA_DIR / f'{model}_analyzed.json'
    if not data_path.exists():
        print(f'  WARN: {data_path.name} not found'); return None
    data = json.load(open(data_path))
    team = find_team_entries(data)
    if not team:
        print(f'  {model}: no team papers found'); return None

    valid = VALID_LABELS[MODEL_CONTEXT[model]['kind']]
    rows = []
    print(f'\n=== {model}: {len(team)} team papers ===')

    with ThreadPoolExecutor(max_workers=WORKERS) as exe:
        futs = {exe.submit(classify_one, model, p, valid): p for p in team}
        for fut in as_completed(futs):
            entry = futs[fut]
            doi = (entry.get('doi') or '').lower()
            title = entry.get('title') or ''
            if isinstance(title, list): title = title[0] if title else ''
            r = fut.result()
            if not r:
                print(f'  classify_failed: {doi}'); continue
            prev = entry.get('engagement_level')
            new = r['engagement_level']
            rows.append({
                'doi': doi, 'title': title, 'previous': prev, 'new': new,
                'confidence': r.get('confidence'),
                'has_abstract': r['_has_abstract'],
                'fetched_full_text': r['_fetched'],
                'venue': (entry.get('venue') if isinstance(entry.get('venue'), str)
                          else (entry.get('venue') or [''])[0]),
                'year': entry.get('year'),
                'url': entry.get('url') or (f'https://doi.org/{doi}' if doi else ''),
                'justification': (r.get('justification') or '')[:500],
            })

    flips_to_sc = sum(1 for r in rows if r['new'] == 'Simple Citation' and r['previous'] != 'Simple Citation')
    any_flips = sum(1 for r in rows if r['previous'] != r['new'])
    print(f'  {model}: {any_flips} reclassified, {flips_to_sc} -> Simple Citation')

    csv_path = DATA_DIR / f'{model.lower()}_team_reclassification.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['doi','title','year','venue','url',
                                          'previous','new','confidence',
                                          'has_abstract','fetched_full_text',
                                          'justification'])
        w.writeheader()
        for r in rows: w.writerow(r)
    print(f'  Wrote {csv_path.name}')

    if not dry_run:
        ts = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
        rows_by_doi = {r['doi']: r for r in rows}
        for entry in data:
            doi = (entry.get('doi') or '').lower()
            if doi not in rows_by_doi: continue
            r = rows_by_doi[doi]
            entry['engagement_level'] = r['new']
            unc = entry.setdefault('uncertainty', {})
            prov = unc.setdefault('classification_provenance', {})
            prov['team_paper_reclassification'] = {
                'previous_label': r['previous'], 'new_label': r['new'],
                'justification': r['justification'],
                'confidence': r['confidence'],
                'has_abstract': r['has_abstract'],
                'fetched_full_text': r['fetched_full_text'],
                'model': DEFAULT_MODEL_ID, 'timestamp': ts,
            }
            if isinstance(r['confidence'], (int, float)):
                unc['composite_confidence'] = round(min(1.0, r['confidence']/5.0), 3)
                unc['reasoning_confidence'] = round(min(1.0, r['confidence']/5.0), 3)
        with open(data_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f'  Updated {data_path.name}')

    return {'model': model, 'team_papers': len(team),
            'reclassified': any_flips, 'flipped_to_sc': flips_to_sc}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', help='single model')
    ap.add_argument('--models', help='comma-separated list')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    if args.all:
        # Match any model that has both an analyzed.json + a MODEL_CONTEXT entry
        models = [m for m in MODEL_CONTEXT
                  if (DATA_DIR / f'{m}_analyzed.json').exists()]
    elif args.models:
        models = [m.strip() for m in args.models.split(',')]
    elif args.model:
        models = [args.model]
    else:
        ap.print_help(); sys.exit(1)

    summary = []
    for m in models:
        s = run_model(m, dry_run=args.dry_run)
        if s: summary.append(s)

    print('\n' + '='*70)
    print(f'SUMMARY ({"dry-run" if args.dry_run else "applied"})')
    print('='*70)
    print(f'{"Model":12} {"Team":>5} {"Reclassif":>10} {"->SimpleCit":>12}')
    for s in summary:
        print(f'{s["model"]:12} {s["team_papers"]:5d} {s["reclassified"]:10d} {s["flipped_to_sc"]:12d}')


if __name__ == '__main__':
    main()
