#!/usr/bin/env python3
"""
DAS (Data Availability Statement) + Methods enrichment for any model/mission.

For each Simple Citation entry of a given model:
  1. Fetch article HTML via DOI (Copernicus direct -> Unpaywall repo -> DOI redirect).
  2. Extract Data Availability Statement and any paragraphs containing
     model/mission-specific markers.
  3. If markers found, append to abstract and re-classify via Gemini using the
     same prompt as llm_reclassify_engagement.py.
  4. For entries that flip away from Simple Citation:
       - update entry.engagement_level
       - record provenance under entry.uncertainty.classification_provenance.das_enrichment
  5. Write per-model CSV of flips and update <MODEL>_analyzed.json in place.

Usage:
  python scripts/das_enrich.py --model CARDAMOM
  python scripts/das_enrich.py --models CARDAMOM,CMS-Flux,ECCO
  python scripts/das_enrich.py --all
"""

import json, os, sys, time, datetime, re, csv, html as html_mod, argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock

import requests

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / 'public' / 'data'
SCRIPTS = Path(__file__).parent
CACHE = SCRIPTS / 'das_fetch_cache_all.json'

GEMINI_MODEL = 'gemini-2.5-flash'
WORKERS = 6
HTTP_TIMEOUT = 25
USER_AGENT_BROWSER = (
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) '
    'Chrome/120.0.0.0 Safari/537.36'
)
UNPAYWALL_EMAIL = 'yunkss@gmail.com'

# Publisher TDM tokens (read from env at runtime; never hard-coded)
WILEY_TDM_TOKEN = os.environ.get('WILEY_TDM_TOKEN', '')
ELSEVIER_TDM_TOKEN = os.environ.get('ELSEVIER_TDM_TOKEN', '')

# ---------------------------------------------------------------------------
# Per-model marker patterns
# These are intentionally specific (full names + acronyms in well-defined contexts)
# to avoid false positives. Used only to decide *whether to call the LLM*; the
# final yes/no decision is the LLM's, with the model-specific prompt.
# ---------------------------------------------------------------------------

MARKERS = {
    'CARDAMOM': re.compile(
        r'\b(CARDAMOM|CARbon\s+DAta(?:[\s\-]MOdel)?\s*fra?MEwork|'
        r'Carbon\s+Data(?:\s+Model)?\s+Framework|DALEC(?:[\s\-]?\d+)?|'
        r'cardamom-framework\.github\.io)\b',
        re.IGNORECASE,
    ),
    'CMS-Flux': re.compile(
        r'(\bCMS[\s\-]?Flux\b|Carbon\s+Monitoring\s+System(?:\s+Flux)?|'
        r'NASA\s+CMS|CMS\s+flux\s+(?:product|estimate|inversion)|'
        r'cmsflux\.jpl\.nasa\.gov)',
        re.IGNORECASE,
    ),
    'ECCO': re.compile(
        r'(\bECCO\b(?!\s*-\s*[A-Z])|ECCO[\s\-]?V?\d|ECCO2|ECCOv4|'
        r'Estimating\s+the\s+Circulation\s+and\s+Climate\s+of\s+the\s+Ocean|'
        r'LLC4320|ecco-group\.org|MITgcm.*ECCO|ECCO.*MITgcm)',
        re.IGNORECASE,
    ),
    'EDMF': re.compile(
        r'(\bEDMF\b|Eddy[\s\-]?Diffusivity[\s\-]Mass[\s\-]?Flux|'
        r'EDMF\s+(?:scheme|parameter[iz]ation|closure))',
        re.IGNORECASE,
    ),
    'ISSM': re.compile(
        r'(\bISSM\b|Ice[\s\-]?Sheet\s+System\s+Model|'
        r'Ice[\s\-]?sheet\s+and\s+Sea[\s\-]?level\s+System\s+Model|'
        r'issm\.jpl\.nasa\.gov|ISSMteam)',
        re.IGNORECASE,
    ),
    'LES': re.compile(
        # LES is too generic — require the spelled-out form OR a JPL-LES context
        r'(Large[\s\-]?Eddy\s+Simulation|JPL\s+LES|LES\s+(?:from\s+JPL|of\s+a\s+(?:methane|plume|stratocumulus)))',
        re.IGNORECASE,
    ),
    'MOMO-CHEM': re.compile(
        r'(\bMOMO[\s\-]?CHEM\b|Multi[\s\-]?(?:m|M)Odel[\s\-]?Multi[\s\-]?(?:c|C)Onstituent|'
        r'\bTCR-?[12]\b|Tropospheric\s+Chemistry\s+Reanalysis|'
        r'Miyazaki.*reanalysis)',
        re.IGNORECASE,
    ),
    'RAPID': re.compile(
        # RAPID is too generic; require capitalized RAPID with model context, or full name
        r'(Routing\s+Application\s+for\s+Parallel\s+computatIon\s+of\s+Discharge|'
        r'\bRAPID\s+(?:model|river|routing|discharge|hub|simulation|outputs?|run)\b|'
        r'rapid-hub\.org|c-h-david/rapid)',
    ),
    'GRACE': re.compile(
        r'(\bGRACE(?:[\s\-]FO)?\b|Gravity\s+Recovery\s+and\s+Climate\s+Experiment|'
        r'mascon\b|terrestrial\s+water\s+storage|TWS\s+(?:anomaly|anomalies|product)|'
        r'gracefo\.jpl\.nasa\.gov|CSR\s+mascon|JPL\s+mascon|GFZ\s+mascon)',
        re.IGNORECASE,
    ),
    'SWOT': re.compile(
        r'(\bSWOT\b|Surface\s+Water\s+and\s+Ocean\s+Topography|'
        r'\bKaRIn\b|swot\.jpl\.nasa\.gov|wide[\s\-]swath\s+altim|'
        r'SWOT\s+(?:L2|level[\s\-]2|pixel\s+cloud|raster|river\s+single))',
        re.IGNORECASE,
    ),
}

ALL_MODELS = list(MARKERS.keys())

# ---------------------------------------------------------------------------
# Cache + locks
# ---------------------------------------------------------------------------

cache_lock = Lock()


def load_cache():
    if CACHE.exists():
        with open(CACHE) as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with cache_lock:
        tmp = CACHE.with_suffix('.json.tmp')
        with open(tmp, 'w') as f:
            json.dump(cache, f, indent=2, ensure_ascii=False)
        tmp.replace(CACHE)


# ---------------------------------------------------------------------------
# HTTP fetch (multi-strategy)
# ---------------------------------------------------------------------------

def _parse_pdf_bytes(content):
    import io, contextlib, logging
    from pypdf import PdfReader
    # pypdf emits noisy warnings/prints for malformed PDFs; suppress them.
    logging.getLogger('pypdf').setLevel(logging.ERROR)
    with contextlib.redirect_stderr(io.StringIO()):
        try:
            reader = PdfReader(io.BytesIO(content))
            pages = []
            for p in reader.pages:
                try:
                    pages.append(p.extract_text() or '')
                except Exception:
                    continue
            text = ' '.join(pages)
            return text if text.strip() else None
        except Exception:
            return None


def _http_get(url):
    try:
        r = requests.get(
            url,
            headers={'User-Agent': USER_AGENT_BROWSER,
                     'Accept': 'text/html,application/xhtml+xml,application/pdf,*/*'},
            timeout=HTTP_TIMEOUT,
            allow_redirects=True,
        )
        if r.status_code != 200:
            return None
        ctype = (r.headers.get('content-type') or '').lower()
        if 'pdf' in ctype or url.lower().endswith('.pdf'):
            return _parse_pdf_bytes(r.content)
        return r.text if r.text else None
    except Exception:
        return None


def _copernicus_url(doi):
    m = re.match(r'10\.5194/([a-z\-]+)-(\d+)-(\d+)-(\d+)$', doi.lower())
    if not m:
        return None
    j, vol, page, year = m.groups()
    return f'https://{j}.copernicus.org/articles/{vol}/{page}/{year}/'


def _wiley_tdm(doi):
    """Wiley TDM: returns PDF text or None. Most AGU/Wiley journals."""
    if not WILEY_TDM_TOKEN:
        return None
    try:
        r = requests.get(
            f'https://api.wiley.com/onlinelibrary/tdm/v1/articles/{doi}',
            headers={'Wiley-TDM-Client-Token': WILEY_TDM_TOKEN},
            timeout=HTTP_TIMEOUT, allow_redirects=True,
        )
        if r.status_code != 200:
            return None
        ctype = (r.headers.get('content-type') or '').lower()
        if 'pdf' in ctype:
            return _parse_pdf_bytes(r.content)
        return r.text if r.text else None
    except Exception:
        return None


def _elsevier_tdm(doi):
    """Elsevier TDM: returns XML text or None. Most ScienceDirect journals."""
    if not ELSEVIER_TDM_TOKEN:
        return None
    try:
        r = requests.get(
            f'https://api.elsevier.com/content/article/doi/{doi}',
            headers={'X-ELS-APIKey': ELSEVIER_TDM_TOKEN, 'Accept': 'text/xml'},
            timeout=HTTP_TIMEOUT,
        )
        if r.status_code != 200:
            return None
        return r.text
    except Exception:
        return None


def _openalex_urls(doi):
    """OpenAlex often surfaces institutional repository copies that Unpaywall misses."""
    try:
        r = requests.get(
            f'https://api.openalex.org/works/doi:{doi}',
            headers={'User-Agent': f'das_enrich/1.0 (mailto:{UNPAYWALL_EMAIL})'},
            timeout=HTTP_TIMEOUT,
        )
        if r.status_code != 200:
            return []
        d = r.json()
    except Exception:
        return []

    urls = []
    for loc in (d.get('locations') or []):
        for u in [loc.get('pdf_url'), loc.get('landing_page_url')]:
            if u:
                urls.append(u)
    # Deduplicate, preserve order
    seen = set(); out = []
    for u in urls:
        if u not in seen:
            seen.add(u); out.append(u)
    return out


def _semantic_scholar_url(doi):
    """Single-URL fallback from Semantic Scholar's openAccessPdf field."""
    try:
        r = requests.get(
            f'https://api.semanticscholar.org/graph/v1/paper/DOI:{doi}',
            params={'fields': 'openAccessPdf'},
            timeout=HTTP_TIMEOUT,
        )
        if r.status_code != 200:
            return None
        oa = (r.json().get('openAccessPdf') or {}).get('url')
        return oa or None
    except Exception:
        return None


def _unpaywall_urls(doi):
    """Return all OA URLs from Unpaywall, PDFs first, then HTML.
    Prioritises repository copies (often easier to fetch than publisher pages),
    but includes publisher OA locations too (gold-OA journals)."""
    try:
        r = requests.get(
            f'https://api.unpaywall.org/v2/{doi}',
            params={'email': UNPAYWALL_EMAIL},
            timeout=HTTP_TIMEOUT,
        )
        if r.status_code != 200:
            return []
        d = r.json()
    except Exception:
        return []

    locs = d.get('oa_locations') or []
    # Repository first (usually less gated than publisher pages)
    locs.sort(key=lambda l: 0 if l.get('host_type') == 'repository' else 1)

    urls = []
    for loc in locs:
        pdf = loc.get('url_for_pdf')
        if pdf:
            urls.append(pdf)
        html = loc.get('url') or loc.get('url_for_landing_page')
        if html and html != pdf:
            urls.append(html)
    # Deduplicate while preserving order
    seen = set(); out = []
    for u in urls:
        if u not in seen:
            seen.add(u); out.append(u)
    return out


def fetch_html(doi):
    # 1. Copernicus journals: direct article HTML (always open)
    cu = _copernicus_url(doi)
    if cu:
        text = _http_get(cu)
        if text:
            return text
    # 2. Publisher TDM APIs (covers Wiley/AGU + Elsevier/ScienceDirect — most paywalled cases)
    doi_lower = doi.lower()
    # Wiley publishes AGU (10.1029) and many Wiley journals (10.1002, 10.1111)
    if doi_lower.startswith(('10.1002/', '10.1029/', '10.1111/')):
        text = _wiley_tdm(doi)
        if text:
            return text
    # Elsevier / ScienceDirect (10.1016)
    if doi_lower.startswith('10.1016/'):
        text = _elsevier_tdm(doi)
        if text:
            return text
    # 3. Unpaywall OA locations (repositories + publisher gold-OA, PDFs + HTML)
    for u in _unpaywall_urls(doi):
        text = _http_get(u)
        if text:
            return text
    # 4. OpenAlex (institutional repos Unpaywall misses — ORA, Soton, Reading, NOAA)
    for u in _openalex_urls(doi):
        text = _http_get(u)
        if text:
            return text
    # 5. Semantic Scholar openAccessPdf
    s2 = _semantic_scholar_url(doi)
    if s2:
        text = _http_get(s2)
        if text:
            return text
    # 6. Last resort: DOI redirect (often blocked)
    text = _http_get(f'https://doi.org/{doi}')
    return text


# ---------------------------------------------------------------------------
# HTML -> text + section extraction
# ---------------------------------------------------------------------------

def html_to_text(html):
    if not html:
        return ''
    html = re.sub(r'<script[\s\S]*?</script>', ' ', html, flags=re.I)
    html = re.sub(r'<style[\s\S]*?</style>', ' ', html, flags=re.I)
    html = re.sub(r'<head[\s\S]*?</head>', ' ', html, flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', html)
    text = html_mod.unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def extract_section_around(text, marker_pattern, before=200, after=400, max_hits=4):
    if not text:
        return []
    hits = []
    seen = set()
    for m in marker_pattern.finditer(text):
        s = max(0, m.start() - before)
        e = min(len(text), m.end() + after)
        snip = text[s:e].strip()
        key = snip[:80]
        if key in seen:
            continue
        seen.add(key)
        hits.append(snip)
        if len(hits) >= max_hits:
            break
    return hits


def extract_data_availability(text):
    if not text:
        return ''
    headings = [
        r'Data\s+Availability\s+Statement',
        r'Data\s+Availability',
        r'Availability\s+of\s+Data\s+(?:and|&)\s+Materials',
        r'Code\s+and\s+Data\s+Availability',
        r'Data\s+and\s+Code\s+Availability',
        r'Code\s+availability',
    ]
    for h in headings:
        m = re.search(h, text, re.IGNORECASE)
        if m:
            window = text[m.end():m.end() + 2500]
            cut = re.search(
                r'\.\s+(?:Acknowledg(?:e?ment)?s?|Author\s+Contributions?|Competing\s+Interests?|'
                r'References|Funding|Conflict\s+of\s+Interest|Supplementary|Appendix|'
                r'Supporting\s+Information)\b',
                window, re.IGNORECASE,
            )
            if cut:
                window = window[:cut.start()]
            return window.strip()
    return ''


def extract_methods_excerpt(text, marker_pattern, max_chars=1500):
    """Extract a Methods section excerpt that contains the model marker."""
    if not text:
        return ''
    # Find Methods-like header
    m = re.search(
        r'\b(?:Methods?|Materials\s+and\s+Methods|Data\s+and\s+Methods|Methodology)\b',
        text, re.IGNORECASE,
    )
    if not m:
        return ''
    methods = text[m.end():m.end() + 8000]
    mh = marker_pattern.search(methods)
    if not mh:
        return ''
    s = max(0, mh.start() - 300)
    return methods[s:s + max_chars].strip()


def build_enrichment(html, marker_pattern):
    text = html_to_text(html)
    if not text:
        return ''
    parts = []
    das = extract_data_availability(text)
    if das:
        parts.append('Data Availability: ' + das[:2000])
    methods = extract_methods_excerpt(text, marker_pattern)
    if methods:
        parts.append('Methods excerpt: ' + methods)
    contexts = extract_section_around(text, marker_pattern, before=200, after=400, max_hits=3)
    if contexts:
        parts.append('Marker contexts: ' + ' || '.join(contexts))
    return '\n\n'.join(parts).strip()


# ---------------------------------------------------------------------------
# LLM classification via existing pipeline
# ---------------------------------------------------------------------------

sys.path.insert(0, str(SCRIPTS))
from llm_reclassify_engagement import build_prompt, call_gemini, MODEL_CONTEXT, VALID_LABELS  # noqa: E402


def classify(api_key, model_name, entry):
    prompt = build_prompt(model_name, entry)
    result = call_gemini(api_key, prompt, temperature=0.1)
    if not result:
        return None
    valid = VALID_LABELS[MODEL_CONTEXT[model_name]['kind']]
    if result.get('engagement_level') not in valid:
        return None
    return result


# ---------------------------------------------------------------------------
# Per-entry processing
# ---------------------------------------------------------------------------

def process(entry, api_key, cache, model_name, marker_pattern, retry_failed=False):
    doi = (entry.get('doi') or '').strip()
    if not doi:
        return {'doi': '', 'status': 'no_doi'}

    cache_key = f'{model_name}:{doi}'
    cached = cache.get(cache_key)
    use_cache = cached is not None and not (retry_failed and not cached.get('fetched', False))
    if use_cache:
        enrichment = cached.get('enrichment', '')
        fetched = cached.get('fetched', False)
    else:
        html = fetch_html(doi)
        enrichment = build_enrichment(html, marker_pattern) if html else ''
        with cache_lock:
            cache[cache_key] = {'fetched': html is not None, 'enrichment': enrichment[:8000]}
        fetched = html is not None

    if not enrichment:
        return {'doi': doi, 'status': 'fetched_no_signal' if fetched else 'fetch_failed'}

    if not marker_pattern.search(enrichment):
        return {'doi': doi, 'status': 'no_markers'}

    enriched_entry = dict(entry)
    abs_orig = (entry.get('abstract') or '').strip()
    enriched_entry['abstract'] = (abs_orig + '\n\n' + enrichment).strip()

    result = classify(api_key, model_name, enriched_entry)
    if not result:
        return {'doi': doi, 'status': 'classify_failed'}

    new_label = result['engagement_level']
    if new_label == entry.get('engagement_level'):
        return {'doi': doi, 'status': 'no_change', 'new_label': new_label,
                'confidence': result.get('confidence')}
    return {
        'doi': doi,
        'status': 'flip',
        'previous_label': entry.get('engagement_level'),
        'new_label': new_label,
        'confidence': result.get('confidence'),
        'justification': result.get('justification', ''),
    }


# ---------------------------------------------------------------------------
# Per-model driver
# ---------------------------------------------------------------------------

def run_model(model_name, api_key, cache, save_cache_every=200, retry_failed=False):
    data_path = DATA_DIR / f'{model_name}_analyzed.json'
    if not data_path.exists():
        print(f'  WARN: {data_path} not found, skipping')
        return

    with open(data_path) as f:
        data = json.load(f)

    sc = [p for p in data if p.get('engagement_level') == 'Simple Citation']
    print(f'\n=== {model_name}: {len(sc)} Simple Citation entries ===')
    if not sc:
        return

    marker_pattern = MARKERS[model_name]
    flips = []
    counters = {'flip': 0, 'no_change': 0, 'no_markers': 0,
                'fetched_no_signal': 0, 'fetch_failed': 0,
                'no_doi': 0, 'classify_failed': 0}
    start = time.time()

    with ThreadPoolExecutor(max_workers=WORKERS) as exe:
        futs = {exe.submit(process, p, api_key, cache, model_name, marker_pattern, retry_failed): p for p in sc}
        done = 0
        for fut in as_completed(futs):
            entry = futs[fut]
            r = fut.result()
            counters[r['status']] = counters.get(r['status'], 0) + 1
            done += 1
            if r['status'] == 'flip':
                flips.append((entry, r))
                title = entry.get('title','')
                if isinstance(title, list): title = title[0] if title else ''
                print(f'  FLIP {r["previous_label"]} -> {r["new_label"]} (c={r["confidence"]}) | {title[:70]}', flush=True)
            if done % save_cache_every == 0:
                rate = done / max(1, time.time() - start)
                eta = (len(sc) - done) / max(0.01, rate)
                print(f'  [{done}/{len(sc)}] flips={counters["flip"]} '
                      f'no_change={counters["no_change"]} no_markers={counters["no_markers"]} '
                      f'fetch_failed={counters["fetch_failed"]} '
                      f'({rate:.1f}/s ETA {eta/60:.1f}m)', flush=True)
                save_cache(cache)

    save_cache(cache)
    elapsed = time.time() - start
    print(f'  Done in {elapsed:.0f}s. Counters: {counters}')

    # Apply flips
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
    applied = 0
    for entry, r in flips:
        entry['engagement_level'] = r['new_label']
        prov = entry.setdefault('uncertainty', {}).setdefault('classification_provenance', {})
        prov['das_enrichment'] = {
            'previous_label': r['previous_label'],
            'new_label': r['new_label'],
            'justification': r['justification'][:300],
            'confidence': r['confidence'],
            'source': 'DAS / Methods text fetched from publisher HTML',
            'model': GEMINI_MODEL,
            'timestamp': ts,
        }
        applied += 1
    if applied:
        with open(data_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f'  Applied {applied} flips to {data_path.name}')

    # CSV
    csv_path = DATA_DIR / f'{model_name}_das_flips.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['doi', 'previous_label', 'new_label', 'confidence',
                    'title', 'venue', 'justification'])
        for entry, r in sorted(flips, key=lambda x: x[1]['new_label']):
            title = entry.get('title','')
            if isinstance(title, list): title = title[0] if title else ''
            venue = entry.get('venue','') or ''
            if isinstance(venue, list): venue = venue[0] if venue else ''
            w.writerow([r['doi'], r['previous_label'], r['new_label'],
                        r['confidence'], title, venue, r['justification']])
    print(f'  Wrote {csv_path.name}')

    return {'flips': len(flips), 'counters': counters}


def main():
    global WORKERS
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', type=str, help='Single model')
    parser.add_argument('--models', type=str, help='Comma-separated list')
    parser.add_argument('--all', action='store_true')
    parser.add_argument('--workers', type=int, default=6)
    parser.add_argument('--retry-failed', action='store_true',
                        help='Re-fetch entries that previously failed (cached as fetched=False)')
    args = parser.parse_args()

    if not (args.model or args.models or args.all):
        parser.print_help(); sys.exit(1)

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print('ERROR: GEMINI_API_KEY not set'); sys.exit(1)

    WORKERS = args.workers

    if args.all:
        models = list(ALL_MODELS)
    elif args.models:
        models = [m.strip() for m in args.models.split(',')]
    else:
        models = [args.model]

    for m in models:
        if m not in MARKERS:
            print(f'ERROR: unknown model {m}. Valid: {list(MARKERS)}'); sys.exit(1)

    cache = load_cache()
    print(f'DAS enrichment: {len(models)} model(s), workers={WORKERS}, cache={len(cache)} entries')

    summary = {}
    for m in models:
        r = run_model(m, api_key, cache, retry_failed=args.retry_failed)
        if r:
            summary[m] = r

    print('\n' + '='*70)
    print('SUMMARY')
    print('='*70)
    for m, r in summary.items():
        print(f'  {m}: flips={r["flips"]}  counters={r["counters"]}')


if __name__ == '__main__':
    main()
