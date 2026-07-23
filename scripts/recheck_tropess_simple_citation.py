#!/usr/bin/env python3
"""
Second-pass review of TROPESS Simple Citation entries to catch false negatives.

The original llm_reclassify_engagement.py asks "is this Data Usage / Simple Citation /
Review Paper" with a conservative default toward Simple Citation. This script asks
the inverse: "given that we labelled this Simple Citation, is there evidence we missed
that this paper actually uses TROPESS data?". The prompt enumerates downstream
TROPESS-related products (MUSES, SiFSAP, TCR-2, etc.) explicitly so the LLM doesn't
miss them.

Output: scripts/tropess_sc_recheck.json — one record per Simple Citation entry with
the LLM's verdict (correct_simple_citation | should_be_data_usage | should_be_review)
and a quoted justification. We do NOT modify TROPESS_analyzed.json automatically;
the user reviews and decides.
"""

import json, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from llm_client import call_llm

ROOT = Path(__file__).parent.parent
DATA = ROOT / 'public' / 'data' / 'TROPESS_analyzed.json'
OUT  = ROOT / 'scripts' / 'tropess_sc_recheck.json'

WORKERS = 10

PROMPT = """You are auditing whether a paper labelled "Simple Citation" w.r.t. the TROPESS mission was misclassified.

ABOUT TROPESS:
TROPESS (TROPospheric Emission Spectrometer System) is a JPL multi-instrument retrieval suite using the MUSES optimal-estimation algorithm to produce vertical profiles of tropospheric trace gases (CO, CH4, NH3, O3, PAN, HDO/H2O) from infrared sounders (CrIS on Suomi-NPP/JPSS, AIRS on Aqua, and historically TES on Aura).

TROPESS-RELATED DATA PRODUCTS that count as DATA USAGE (be liberal — include downstream products):
- TROPESS / MUSES / TROPESS-CrIS / TROPESS-AIRS / TROPESS-TES retrievals or profiles
- SiFSAP (Single Field-of-view Sounder Atmospheric Products) — the JPL single-footprint product family
- TCR-1 / TCR-2 (Tropospheric Chemistry Reanalysis) — these reanalyses ingest TES/CrIS/MLS observations and so a paper *using TCR-2 outputs* counts as Data Usage of TROPESS-derived data
- AIRS / CrIS / TES vertical profile retrievals of CO, CH4, NH3, O3, PAN, HDO — even if the paper calls them by the instrument name only
- MOMO-CHEM chemical reanalysis products (closely related to TROPESS)

WHAT STILL COUNTS AS SIMPLE CITATION:
- The paper only mentions TROPESS / TES / CrIS / AIRS / MUSES as background or related work
- The paper uses *radiances* of CrIS/AIRS but not TROPESS retrieved products (e.g. CLIMCAPS, NUCAPS, ROCR, SiFSAP if it's developed independently)
- The paper uses different satellite missions (TROPOMI, OMI, MOPITT, GOSAT, OCO-2, IASI alone, GOME, GEMS) without TROPESS/TES/CrIS/AIRS
- The abstract gives no evidence of TROPESS-related data use

Verdict choices:
- "correct_simple_citation" — keep as Simple Citation (no TROPESS data use)
- "should_be_data_usage" — change to Data Usage (TROPESS or TCR-2 / SiFSAP / MUSES / CrIS/AIRS/TES retrievals are used)
- "should_be_review" — change to Review Paper (review, survey, perspective, assessment, or synthesis)

Paper:
- Title: {title}
- Venue: {venue}
- Cited team paper: {cited}
- Abstract: {abstract}

Respond with ONLY valid JSON (no markdown):
{{"verdict": "correct_simple_citation|should_be_data_usage|should_be_review", "justification": "<short quote/paraphrase from the abstract or title that supports the verdict, max 220 chars>", "confidence": 1-5}}"""


def review_one(p):
    title = p.get('title', '')
    if isinstance(title, list): title = title[0] if title else ''
    venue = p.get('venue', '') or ''
    if isinstance(venue, list): venue = venue[0] if venue else ''
    abstract = (p.get('abstract', '') or '').strip() or '(no abstract available)'
    cited = p.get('citing_team_paper', '') or '(unknown)'
    prompt = PROMPT.format(title=title or '(no title)', venue=venue or '(unknown)',
                            cited=cited, abstract=abstract)
    try:
        return call_llm(prompt, temperature=0.1)
    except RuntimeError:
        return None


def main():
    with open(DATA) as f:
        data = json.load(f)
    sc = [p for p in data if p.get('engagement_level') == 'Simple Citation']
    print(f'Reviewing {len(sc)} Simple Citation entries...')

    results = []
    start = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as exe:
        futs = {exe.submit(review_one, p): p for p in sc}
        done = 0
        for fut in as_completed(futs):
            p = futs[fut]
            verdict = fut.result()
            done += 1
            title = p.get('title', '')
            if isinstance(title, list): title = title[0] if title else ''
            results.append({
                'doi': p.get('doi'),
                'paper_id': p.get('paper_id'),
                'title': title,
                'venue': (p.get('venue') if not isinstance(p.get('venue'), list) else (p.get('venue')[0] if p.get('venue') else '')),
                'has_abstract': bool((p.get('abstract') or '').strip()),
                'verdict': verdict,
            })
            if done % 50 == 0:
                rate = done / (time.time() - start)
                print(f'  {done}/{len(sc)}  ({rate:.1f}/s)', flush=True)

    flagged = [r for r in results if r['verdict'] and r['verdict'].get('verdict') != 'correct_simple_citation']
    print(f'\nDone in {time.time()-start:.0f}s. Flagged {len(flagged)} potential misclassifications.')
    with open(OUT, 'w') as f:
        json.dump({'all': results, 'flagged': flagged}, f, indent=2, ensure_ascii=False)
    print(f'Wrote {OUT}')


if __name__ == '__main__':
    main()
