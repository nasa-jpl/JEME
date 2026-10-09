#!/usr/bin/env python3
"""
Compute each model's h-index over its TEAM PAPERS.

A model has an h-index of h when h of its team papers have each been cited at
least h times, so the value can never exceed the number of team papers. The
dashboard used to apply the h rule to the citing papers' own citation counts,
which measures how influential the papers citing a model are and can exceed
the team-paper count many times over (RAPID showed 72 with 32 team papers).

Citation counts come from Crossref `is-referenced-by-count`:
  - team papers with a DOI are looked up in batches of 40 DOIs per request
  - team papers without a DOI are looked up by title, one request each, and
    accepted only when the returned title matches after normalization

Crossref allows one request per second, so the title lookups dominate the run
time (ECCO has ~900 team papers without a DOI, about 20 minutes on a cold
cache). Crossref counts only references deposited by publishers, so they run
lower than Google Scholar or OpenAlex; the h-index here is conservative.

A team paper that cannot be resolved counts as 0 citations, so the h-index is a
lower bound; `resolved` in the output says how many were found.

Writes public/data/team_paper_hindex.json, read by src/utils/teamPapers.js.
Every lookup, misses included, is cached in scripts/team_paper_citation_cache.json.

Usage:
    python scripts/compute_team_paper_hindex.py            # all models
    python scripts/compute_team_paper_hindex.py --model RAPID
    python scripts/compute_team_paper_hindex.py --rerun    # ignore the cache
"""
import argparse, datetime, json, re, sys, time
import urllib.parse, urllib.request
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "public" / "data"
OUT_PATH = DATA_DIR / "team_paper_hindex.json"
CACHE_PATH = Path(__file__).resolve().parent / "team_paper_citation_cache.json"

CROSSREF = "https://api.crossref.org/works"
USER_AGENT = "jeme-dashboard/1.0 (https://nasa-jpl.github.io/JEME)"
BATCH = 40
# Crossref's public pool allows one request per second.
DELAY = 1.1

MODEL_FILES = {
    "CARDAMOM": "cardamom_team_papers.json",
    "CMS-Flux": "cms_flux_team_papers.json",
    "ECCO": "ecco_team_papers.json",
    "EDMF": "EDMF_team_papers.json",
    "GRACE": "grace_team_papers.json",
    "ISSM": "issm_team_papers.json",
    "LES": "LES_team_papers.json",
    "MOMO-CHEM": "momo_chem_team_papers.json",
    "RAPID": "rapid_team_papers.json",
    "SWOT": "swot_team_papers.json",
    "TROPESS": "tropess_team_papers.json",
}


def load_papers(path):
    raw = json.loads(path.read_text())
    if isinstance(raw, list):
        return raw
    return next((v for v in raw.values() if isinstance(v, list)), [])


def norm_doi(d):
    d = (d or "").strip().lower()
    return re.sub(r"^https?://(dx\.)?doi\.org/", "", d)


def norm_title(t):
    if isinstance(t, list):
        t = t[0] if t else ""
    t = re.sub(r"<[^>]+>", "", t or "")
    return re.sub(r"[^a-z0-9]", "", t.lower())


def dedupe(papers):
    """Mirror dedupeTeamPapers() in src/utils/teamPapers.js exactly, so the
    team-paper count here equals the one shown on the dashboard."""
    def ui_norm(v):
        if isinstance(v, list):
            v = v[0] if v else ""
        return re.sub(r"\.$", "", str(v or "").strip().lower())

    seen, out = set(), []
    for p in papers:
        doi = ui_norm(p.get("doi"))
        if doi:
            key = f"{doi}|{re.sub(r'[^a-z0-9]', '', ui_norm(p.get('title')))}"
            if key in seen:
                continue
            seen.add(key)
        out.append(p)
    return out


def get_json(url, tries=5):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as exc:  # throttling and transient network errors
            wait = 2 + 4 * attempt
            print(f"   retry in {wait}s ({exc})", file=sys.stderr)
            time.sleep(wait)
    return None


def save_cache(cache):
    CACHE_PATH.write_text(json.dumps(cache, indent=1, sort_keys=True))


def fetch_by_doi(dois, cache):
    todo = [d for d in dois if f"doi:{d}" not in cache and not re.search(r"[,\s]", d)]
    for i in range(0, len(todo), BATCH):
        batch = todo[i:i + BATCH]
        flt = urllib.parse.quote(",".join(f"doi:{d}" for d in batch), safe=":,/().-_;")
        data = get_json(f"{CROSSREF}?rows={BATCH}&select=DOI,is-referenced-by-count&filter={flt}")
        time.sleep(DELAY)
        if data is None:
            # One malformed DOI fails the whole batch; retry them one by one.
            for d in batch:
                one = get_json(f"{CROSSREF}/{urllib.parse.quote(d, safe='/:().-_;')}", tries=1)
                time.sleep(DELAY)
                cache[f"doi:{d}"] = (one["message"].get("is-referenced-by-count") or 0) if one else None
            save_cache(cache)
            continue
        found = {norm_doi(w.get("DOI")): w.get("is-referenced-by-count") or 0
                 for w in data["message"]["items"]}
        for d in batch:
            cache[f"doi:{d}"] = found.get(d)
        save_cache(cache)


def fetch_by_title(titles, cache):
    todo = [t for t in titles if f"title:{norm_title(t)}" not in cache]
    for n, t in enumerate(todo, 1):
        q = urllib.parse.quote(re.sub(r"<[^>]+>", "", t))
        data = get_json(f"{CROSSREF}?rows=5&select=title,is-referenced-by-count&query.bibliographic={q}")
        time.sleep(DELAY)
        if data is None:
            continue
        hits = [w.get("is-referenced-by-count") or 0 for w in data["message"]["items"]
                if norm_title(w.get("title")) == norm_title(t)]
        cache[f"title:{norm_title(t)}"] = max(hits) if hits else None
        if n % 25 == 0 or n == len(todo):
            save_cache(cache)
            print(f"   title lookups {n}/{len(todo)}", flush=True)


def h_index(counts):
    counts = sorted(counts, reverse=True)
    return sum(1 for i, c in enumerate(counts) if c >= i + 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", choices=sorted(MODEL_FILES))
    ap.add_argument("--rerun", action="store_true", help="ignore cached lookups")
    args = ap.parse_args()

    cache = {} if args.rerun or not CACHE_PATH.exists() else json.loads(CACHE_PATH.read_text())
    out = json.loads(OUT_PATH.read_text()) if OUT_PATH.exists() else {}
    out.setdefault("models", {})

    for model in ([args.model] if args.model else sorted(MODEL_FILES)):
        papers = dedupe(load_papers(DATA_DIR / MODEL_FILES[model]))
        dois = [norm_doi(p.get("doi") or p.get("DOI")) for p in papers]
        fetch_by_doi([d for d in dois if d], cache)
        # Title lookup covers papers with no DOI and DOIs Crossref does not know.
        need_title = [p.get("title") for p, d in zip(papers, dois)
                      if (not d or cache.get(f"doi:{d}") is None) and norm_title(p.get("title"))]
        fetch_by_title(need_title, cache)
        save_cache(cache)

        counts, resolved = [], 0
        for p, d in zip(papers, dois):
            c = cache.get(f"doi:{d}") if d else None
            if c is None:
                c = cache.get(f"title:{norm_title(p.get('title'))}")
            if c is not None:
                resolved += 1
            counts.append(c or 0)

        out["models"][model] = {
            "h_index": h_index(counts),
            "team_papers": len(papers),
            "resolved": resolved,
            "total_citations": sum(counts),
        }
        print(f"[{model}] h-index {out['models'][model]['h_index']}  "
              f"team papers {len(papers)}  resolved {resolved}  "
              f"total citations {sum(counts):,}", flush=True)

    out["source"] = "Crossref is-referenced-by-count"
    out["generated"] = datetime.date.today().isoformat()
    out["models"] = dict(sorted(out["models"].items()))
    OUT_PATH.write_text(json.dumps(out, indent=2) + "\n")
    print(f"wrote {OUT_PATH.relative_to(PROJECT_DIR)}")


if __name__ == "__main__":
    main()
