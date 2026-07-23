#!/usr/bin/env python3
"""
Re-classify the 33 TROPESS team papers using full abstract + DAS/Methods text.

Why: team papers in TROPESS_analyzed.json have no abstracts, so the LLM
classifier ran on title-only evidence and assigned every paper "Data Usage"
with composite_confidence ~0.30-0.36 (uniformly low). This script:

  1. Looks up each team paper by DOI in TROPESS_analyzed.json
  2. Pulls the abstract from Crossref
  3. Optionally appends DAS/Methods context via das_enrich.fetch_html
     (covers Copernicus, Wiley TDM, Elsevier TDM, Unpaywall PDFs/HTML,
     OpenAlex, Semantic Scholar)
  4. Runs the engagement-level LLM classifier with the enriched evidence
  5. Updates engagement_level, abstract, and uncertainty.composite_confidence
     in place; writes provenance under
     uncertainty.classification_provenance.team_paper_reclassification

Usage:
  python scripts/reclassify_tropess_team_papers.py [--dry-run]
"""

import argparse, datetime, html as html_mod, json, re, sys
from pathlib import Path

import requests

ROOT = Path(__file__).parent.parent
SCRIPTS = Path(__file__).parent
SEED = ROOT / 'public' / 'data' / 'tropess_team_papers.json'
DATA = ROOT / 'public' / 'data' / 'TROPESS_analyzed.json'
CSV_OUT = ROOT / 'public' / 'data' / 'tropess_team_reclassification.csv'

sys.path.insert(0, str(SCRIPTS))
from llm_client import call_llm, DEFAULT_MODEL_ID  # noqa: E402
from das_enrich import fetch_html, build_enrichment, html_to_text, extract_data_availability  # noqa: E402
from llm_reclassify_engagement import build_prompt, MODEL_CONTEXT, VALID_LABELS  # noqa: E402

UA = 'das_enrich/1.0 (mailto:yunkss@gmail.com)'
TROPESS_MARKERS = re.compile(
    r'\b(TROPESS|MUSES|CrIS|AIRS|TES|MOMO-?CHEM|TCR-?[12]|'
    r'Tropospheric\s+Emission\s+Spectrometer|tes\.jpl\.nasa\.gov)\b',
    re.IGNORECASE,
)


def crossref_abstract(doi):
    try:
        r = requests.get(f'https://api.crossref.org/works/{doi}',
                         headers={'User-Agent': UA}, timeout=20)
        if r.status_code != 200:
            return ''
        a = (r.json().get('message') or {}).get('abstract') or ''
        # Strip JATS XML tags + whitespace
        a = re.sub(r'<[^>]+>', ' ', a)
        a = html_mod.unescape(a)
        return re.sub(r'\s+', ' ', a).strip()
    except Exception:
        return ''


def enriched_evidence(doi, abstract):
    """Append DAS + Methods excerpt + marker contexts to abstract."""
    parts = [abstract] if abstract else []
    html = fetch_html(doi)
    if not html:
        return '\n\n'.join(parts).strip(), False
    enrichment = build_enrichment(html, TROPESS_MARKERS)
    if enrichment:
        parts.append(enrichment)
    elif abstract:
        # Fall back to DAS section even if no markers matched
        text = html_to_text(html)
        das = extract_data_availability(text)
        if das:
            parts.append('Data Availability: ' + das[:1500])
    return '\n\n'.join(parts).strip(), True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    seed = json.load(open(SEED))['TROPESS']
    seed_dois = {(s.get('doi') or '').lower(): s for s in seed}

    data = json.load(open(DATA))
    valid = VALID_LABELS[MODEL_CONTEXT['TROPESS']['kind']]

    rows = []
    updates = 0
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')

    for entry in data:
        doi = (entry.get('doi') or '').lower()
        if doi not in seed_dois:
            continue
        # Pull Crossref abstract
        abstract = crossref_abstract(doi)
        evidence, fetched = enriched_evidence(doi, abstract)
        title = entry.get('title') or ''
        if isinstance(title, list): title = title[0] if title else ''

        # Build classifier input
        ent_for_llm = dict(entry)
        ent_for_llm['abstract'] = evidence
        prompt = build_prompt('TROPESS', ent_for_llm)
        try:
            result = call_llm(prompt, temperature=0.1)
        except RuntimeError:
            result = None
        if not result or result.get('engagement_level') not in valid:
            print(f'  classify_failed: {doi}')
            continue

        prev = entry.get('engagement_level')
        new = result['engagement_level']
        conf = result.get('confidence')
        just = result.get('justification', '')

        rows.append({
            'doi': doi, 'title': title, 'previous': prev, 'new': new,
            'confidence': conf, 'has_abstract': bool(abstract),
            'fetched_full_text': fetched, 'justification': just[:500],
        })

        if not args.dry_run:
            entry['abstract'] = evidence
            entry['engagement_level'] = new
            unc = entry.setdefault('uncertainty', {})
            prov = unc.setdefault('classification_provenance', {})
            prov['team_paper_reclassification'] = {
                'previous_label': prev, 'new_label': new,
                'justification': just[:500],
                'confidence': conf, 'gemini_confidence_raw': conf,
                'has_abstract': bool(abstract),
                'fetched_full_text': fetched,
                'model': DEFAULT_MODEL_ID, 'timestamp': ts,
            }
            # Bump composite_confidence using gemini's 1-5 confidence
            if isinstance(conf, (int, float)):
                unc['composite_confidence'] = round(min(1.0, conf / 5.0), 3)
                unc['reasoning_confidence'] = round(min(1.0, conf / 5.0), 3)
            updates += 1
        flag = 'CHANGE' if prev != new else 'same  '
        print(f'  {flag} {doi:35} {prev:18} -> {new:18} c={conf} abs={bool(abstract)} fetched={fetched}')

    print(f'\n{updates} entries updated' + (' (dry-run, not written)' if args.dry_run else ''))

    # CSV
    import csv
    with open(CSV_OUT, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['doi', 'title', 'previous', 'new',
                                          'confidence', 'has_abstract',
                                          'fetched_full_text', 'justification'])
        w.writeheader()
        for r in rows: w.writerow(r)
    print(f'Wrote {CSV_OUT.name}')

    if not args.dry_run and updates:
        with open(DATA, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f'Wrote {DATA.name}')


if __name__ == '__main__':
    main()
