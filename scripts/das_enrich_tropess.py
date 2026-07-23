#!/usr/bin/env python3
"""
DAS (Data Availability Statement) enrichment + LLM re-classification for the
TROPESS Simple Citation bucket.

Why: many citing papers list TROPESS data sources only in the Methods or Data
Availability sections, not in the abstract. The abstract-only LLM classifier
therefore misses these as Data Usage. This script:

  1. For each Simple Citation entry: fetch the article HTML via the DOI URL.
  2. Extract the Data Availability Statement and any paragraphs containing
     TROPESS-related markers (TROPESS, MUSES, CrIS, AIRS, TES, MOMO-CHEM,
     TCR-1/TCR-2, Tropospheric Emission Spectrometer, tes.jpl.nasa.gov).
  3. Append the extracted text to the abstract and re-classify via the
     existing LLM classifier.
  4. For entries that flip to Data Usage / Review Paper:
       - update entry.engagement_level
       - record provenance under entry.uncertainty.classification_provenance.das_enrichment
  5. Write a CSV of flips.

Output:
  - TROPESS_analyzed.json updated in-place
  - public/data/tropess_das_flips.csv  (audit trail of label changes)
  - scripts/das_fetch_cache.json  (HTML extracts cached per DOI)
"""

import json, os, sys, time, datetime, re, csv, html as html_mod
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock
import urllib.request, urllib.error

import requests

from llm_client import call_llm, DEFAULT_MODEL_ID

ROOT = Path(__file__).parent.parent
DATA = ROOT / 'public' / 'data' / 'TROPESS_analyzed.json'
CSV_OUT = ROOT / 'public' / 'data' / 'tropess_das_flips.csv'
CACHE = Path(__file__).parent / 'das_fetch_cache.json'

# Model id recorded in provenance (matches what llm_client resolves at runtime).
LLM_MODEL = os.environ.get('BEDROCK_MODEL_ID', DEFAULT_MODEL_ID)

WORKERS = 6
HTTP_TIMEOUT = 25
USER_AGENT_BROWSER = (
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) '
    'Chrome/120.0.0.0 Safari/537.36'
)
UNPAYWALL_EMAIL = 'yunkss@gmail.com'

# Tokens that strongly indicate TROPESS-related data use
TROPESS_MARKERS = re.compile(
    r'\b(TROPESS|MUSES|CrIS|AIRS|TES|MOMO-?CHEM|TCR-?[12]|'
    r'Tropospheric\s+Emission\s+Spectrometer|tes\.jpl\.nasa\.gov)\b',
    re.IGNORECASE,
)

cache_lock = Lock()
file_lock = Lock()


# ---------------------------------------------------------------------------
# HTML fetch + extraction
# ---------------------------------------------------------------------------

def _http_get(url):
    """GET url with browser UA, return text or None."""
    try:
        r = requests.get(
            url,
            headers={'User-Agent': USER_AGENT_BROWSER, 'Accept': 'text/html,application/xhtml+xml,*/*'},
            timeout=HTTP_TIMEOUT,
            allow_redirects=True,
        )
        if r.status_code == 200 and r.text:
            return r.text
    except Exception:
        pass
    return None


def _copernicus_url(doi):
    """Build the article HTML URL for a Copernicus DOI (open access)."""
    m = re.match(r'10\.5194/([a-z\-]+)-(\d+)-(\d+)-(\d+)$', doi.lower())
    if not m:
        return None
    j, vol, page, year = m.groups()
    return f'https://{j}.copernicus.org/articles/{vol}/{page}/{year}/'


def _unpaywall_repo_urls(doi):
    """Return repository (non-publisher) OA URLs from Unpaywall."""
    try:
        r = requests.get(
            f'https://api.unpaywall.org/v2/{doi}',
            params={'email': UNPAYWALL_EMAIL},
            timeout=HTTP_TIMEOUT,
        )
        if r.status_code != 200:
            return []
        d = r.json()
        urls = []
        for loc in d.get('oa_locations', []) or []:
            if loc.get('host_type') == 'repository':
                u = loc.get('url') or loc.get('url_for_landing_page')
                if u:
                    urls.append(u)
        return urls
    except Exception:
        return []


def fetch_html(doi):
    """Multi-strategy text fetch. Returns text or None."""
    # 1. Copernicus journals: direct article HTML (always open)
    cu = _copernicus_url(doi)
    if cu:
        text = _http_get(cu)
        if text:
            return text
    # 2. Unpaywall repository copies (Caltech, arXiv, ESS Open Archive, etc.)
    for u in _unpaywall_repo_urls(doi):
        text = _http_get(u)
        if text:
            return text
    # 3. Last resort: DOI redirect (often blocked by Wiley/Elsevier)
    text = _http_get(f'https://doi.org/{doi}')
    return text


def html_to_text(html):
    """Strip HTML tags, decode entities, collapse whitespace."""
    if not html:
        return ''
    # Remove scripts, styles, head
    html = re.sub(r'<script[\s\S]*?</script>', ' ', html, flags=re.I)
    html = re.sub(r'<style[\s\S]*?</style>', ' ', html, flags=re.I)
    html = re.sub(r'<head[\s\S]*?</head>', ' ', html, flags=re.I)
    # Tags -> space
    text = re.sub(r'<[^>]+>', ' ', html)
    text = html_mod.unescape(text)
    # Whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def extract_section_around(text, marker_pattern, before=200, after=400, max_hits=3):
    """For each marker hit, extract a window of surrounding text."""
    if not text:
        return []
    hits = []
    seen = set()
    for m in marker_pattern.finditer(text):
        s = max(0, m.start() - before)
        e = min(len(text), m.end() + after)
        snip = text[s:e].strip()
        # de-dup on first 80 chars
        key = snip[:80]
        if key in seen:
            continue
        seen.add(key)
        hits.append(snip)
        if len(hits) >= max_hits:
            break
    return hits


def extract_data_availability(text):
    """Extract a Data Availability Statement section if present."""
    if not text:
        return ''
    # Find a heading-like phrase, take the text up to next likely heading
    headings = [
        r'Data\s+Availability\s+Statement',
        r'Data\s+Availability',
        r'Availability\s+of\s+Data\s+(?:and|&)\s+Materials',
        r'Code\s+and\s+Data\s+Availability',
        r'Data\s+and\s+Code\s+Availability',
    ]
    for h in headings:
        m = re.search(h, text, re.IGNORECASE)
        if m:
            start = m.end()
            # take next ~1500 chars or until a likely next-section header
            window = text[start:start + 2500]
            # Cut at the next header-like all-caps short word followed by capital letter
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


def build_enrichment(html):
    """Return a single 'enrichment' string with DAS + TROPESS-marker contexts."""
    text = html_to_text(html)
    if not text:
        return ''
    parts = []
    das = extract_data_availability(text)
    if das:
        parts.append('Data Availability: ' + das)
    contexts = extract_section_around(text, TROPESS_MARKERS, before=200, after=400, max_hits=4)
    if contexts:
        parts.append('TROPESS-related context: ' + ' || '.join(contexts))
    return '\n\n'.join(parts).strip()


# ---------------------------------------------------------------------------
# LLM classification (uses the same prompt as llm_reclassify_engagement.py
# with the enriched abstract)
# ---------------------------------------------------------------------------

sys.path.insert(0, str(Path(__file__).parent))
from llm_reclassify_engagement import build_prompt  # noqa: E402


def classify(entry):
    """Re-classify entry.engagement_level via the shared LLM client using current abstract."""
    prompt = build_prompt('TROPESS', entry)
    result = call_llm(prompt, temperature=0.1, json_mode=True)
    if not result:
        return None
    valid = {'Review Paper', 'Data Usage', 'Simple Citation'}
    if result.get('engagement_level') not in valid:
        return None
    return result


# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------

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
# Main
# ---------------------------------------------------------------------------

def process(entry, cache):
    """Returns dict describing what (if anything) should change for this entry."""
    doi = (entry.get('doi') or '').strip()
    if not doi:
        return {'doi': '', 'status': 'no_doi'}

    # Fetch (cached)
    if doi in cache:
        enrichment = cache[doi].get('enrichment', '')
        fetched = cache[doi].get('fetched', False)
    else:
        html = fetch_html(doi)
        enrichment = build_enrichment(html) if html else ''
        with cache_lock:
            cache[doi] = {'fetched': html is not None, 'enrichment': enrichment[:8000]}
        fetched = html is not None

    if not enrichment:
        return {'doi': doi, 'status': 'fetched_no_signal' if fetched else 'fetch_failed'}

    # Only re-classify if TROPESS-related markers appeared
    if not TROPESS_MARKERS.search(enrichment):
        return {'doi': doi, 'status': 'no_markers'}

    # Build a temporary entry with abstract + enrichment for LLM
    enriched_entry = dict(entry)
    abs_orig = (entry.get('abstract') or '').strip()
    enriched_entry['abstract'] = (abs_orig + '\n\n' + enrichment).strip()

    result = classify(enriched_entry)
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


def main():
    with open(DATA) as f:
        data = json.load(f)
    sc = [p for p in data if p.get('engagement_level') == 'Simple Citation']
    print(f'TROPESS Simple Citation entries to recheck: {len(sc)}')

    cache = load_cache()
    print(f'Cache: {len(cache)} entries')

    flips = []
    counters = {'flip': 0, 'no_change': 0, 'no_markers': 0,
                'fetched_no_signal': 0, 'fetch_failed': 0,
                'no_doi': 0, 'classify_failed': 0}
    start = time.time()

    # Index for quick lookup
    by_doi = {(p.get('doi') or '').strip().lower(): p for p in data if p.get('doi')}

    with ThreadPoolExecutor(max_workers=WORKERS) as exe:
        futs = {exe.submit(process, p, cache): p for p in sc}
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
                print(f'  FLIP {r["previous_label"]} -> {r["new_label"]} (conf={r["confidence"]}) | {title[:80]}')
            if done % 25 == 0:
                rate = done / max(1, time.time() - start)
                eta = (len(sc) - done) / max(0.01, rate)
                print(f'  [{done}/{len(sc)}] flips={counters["flip"]} '
                      f'no_change={counters["no_change"]} no_markers={counters["no_markers"]} '
                      f'fetch_failed={counters["fetch_failed"]} '
                      f'({rate:.1f}/s, ETA {eta/60:.1f}m)')
                save_cache(cache)

    save_cache(cache)
    print(f'\nDone in {time.time()-start:.0f}s')
    print(f'Counters: {counters}')

    # Apply flips to TROPESS_analyzed.json
    ts = datetime.datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    applied = 0
    for entry, r in flips:
        # locate in original list (entry obj is shared so modifying it works)
        entry['engagement_level'] = r['new_label']
        prov = entry.setdefault('uncertainty', {}).setdefault('classification_provenance', {})
        prov['das_enrichment'] = {
            'previous_label': r['previous_label'],
            'new_label': r['new_label'],
            'justification': r['justification'][:300],
            'confidence': r['confidence'],
            'source': 'DAS / Methods text fetched from publisher HTML',
            'model': LLM_MODEL,
            'timestamp': ts,
        }
        applied += 1

    if applied:
        with open(DATA, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f'Applied {applied} flips to {DATA}')

    # Write CSV
    with open(CSV_OUT, 'w', newline='', encoding='utf-8') as f:
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
    print(f'Wrote {CSV_OUT}')


if __name__ == '__main__':
    main()
