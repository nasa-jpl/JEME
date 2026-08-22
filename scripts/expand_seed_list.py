#!/usr/bin/env python3
"""
Expand a model's team-paper (seed) list using the CMS-Flux methodology.

Pipeline (all cached + rate-limit-safe):
  1. Load public/data/{model}_team_papers.json, normalize to a list.
  2. Resolve each seed paper to a Semantic Scholar (S2) record via DOI and
     collect author IDs. Authors recurring across >= MIN_SEED_APPEARANCES seed
     papers are the "team" (falls back to top-frequency for tiny seeds).
  3. Verify each team author's JPL affiliation via OpenAlex. Only JPL-confirmed
     authors are crawled -- this is the guard that kept TCCON/Debra-Wunch-style
     non-JPL co-authors out of the CMS-Flux seed.
  4. Crawl each JPL-confirmed author's papers via S2.
  5. Score candidates for model relevance against a keyword profile built from
     the existing seed titles/abstracts; tier recommend / review / exclude.
  6. Write seed_lists/{model}/{model}_seed_current.csv and
     _seed_proposed_expanded.csv. Unless --csv-only, merge the top --max-add
     "recommend" candidates into the seed file (backing up to .bak first).

Usage:
  python scripts/expand_seed_list.py --model CARDAMOM --dry-run
  python scripts/expand_seed_list.py --model CARDAMOM --max-add 30
  python scripts/expand_seed_list.py --model RAPID --csv-only
"""
import argparse, csv, json, os, re, sys, time
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import quote

import requests

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "public" / "data"
SEED_DIR = PROJECT_DIR / "seed_lists"
CACHE_PATH = Path(__file__).resolve().parent / "seed_expand_cache.json"

S2 = "https://api.semanticscholar.org/graph/v1"
OPENALEX = "https://api.openalex.org"
JPL_ROR = "https://ror.org/027k65916"
JPL_NAME_RE = re.compile(r"jet propulsion laborator|caltech.*jpl|\bJPL\b", re.I)
MAILTO = "research@nasa.gov"

# Seed file per model (values under a single top-level key or a bare list).
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

MIN_SEED_APPEARANCES = 2      # author must appear in >= this many seed papers
MAX_TEAM_AUTHORS = 25         # cap crawl breadth
MAX_PAPERS_PER_AUTHOR = 300
RECOMMEND_THRESHOLD = 0.16    # relevance score for "recommend"
REVIEW_THRESHOLD = 0.08       # relevance score for "review"

STOP = set("""the a an and or of for to in on with without from into over under
by at as is are was were be been being this that these those we our their its
using use used based study results model models data analysis approach method
methods new toward towards via across between during within global regional""".split())

# ---------------------------------------------------------------------------
# HTTP with backoff + persistent cache
# ---------------------------------------------------------------------------
_session = requests.Session()
_session.headers.update({"User-Agent": f"SeedExpander/1.0 ({MAILTO})"})
_cache = {}


def load_cache():
    global _cache
    if CACHE_PATH.exists():
        try:
            _cache = json.loads(CACHE_PATH.read_text())
        except Exception:
            _cache = {}
    return _cache


def save_cache():
    CACHE_PATH.write_text(json.dumps(_cache, indent=0))


def _get(url, params=None, tries=6, base_sleep=2.0):
    key = url + "?" + json.dumps(params or {}, sort_keys=True)
    if key in _cache:
        return _cache[key]
    for attempt in range(tries):
        try:
            r = _session.get(url, params=params, timeout=40)
            if r.status_code == 200:
                data = r.json()
                _cache[key] = data
                return data
            if r.status_code in (429, 500, 502, 503, 504):
                time.sleep(base_sleep * (2 ** attempt))
                continue
            if r.status_code == 404:
                _cache[key] = None
                return None
        except requests.RequestException:
            time.sleep(base_sleep * (2 ** attempt))
    return None


# ---------------------------------------------------------------------------
# Seed loading / normalization
# ---------------------------------------------------------------------------
def norm_title(t):
    if isinstance(t, list):
        t = t[0] if t else ""
    return re.sub(r"[^\w\s]", "", (t or "").lower()).strip()


def norm_doi(d):
    return (d or "").strip().lower().replace("https://doi.org/", "")


def load_seed(model):
    path = DATA_DIR / MODEL_FILES[model]
    raw = json.loads(path.read_text())
    if isinstance(raw, dict):
        if "papers" in raw:
            arr = raw["papers"]
            wrapper = ("papers", raw)
        else:
            k = list(raw.keys())[0]
            arr = raw[k]
            wrapper = (k, raw)
    else:
        arr = raw
        wrapper = (None, None)
    return path, arr, wrapper


def seed_get(e, *names):
    for n in names:
        if e.get(n):
            return e[n]
    return ""


# ---------------------------------------------------------------------------
# Steps
# ---------------------------------------------------------------------------
def resolve_seed_authors(seed):
    """Return (author_freq: authorId->count, author_name: authorId->name,
    seed_dois:set, seed_titles:set)."""
    author_freq = Counter()
    author_name = {}
    seed_dois, seed_titles = set(), set()
    for e in seed:
        doi = norm_doi(seed_get(e, "doi", "DOI"))
        title = norm_title(seed_get(e, "title"))
        if doi:
            seed_dois.add(doi)
        if title:
            seed_titles.add(title)
        rec = None
        if doi:
            rec = _get(f"{S2}/paper/DOI:{doi}",
                       {"fields": "authors,title,externalIds"})
        if not rec and title:
            sr = _get(f"{S2}/paper/search",
                      {"query": title[:200], "limit": 1,
                       "fields": "authors,title,externalIds"})
            if sr and sr.get("data"):
                rec = sr["data"][0]
        if not rec:
            continue
        seen = set()
        for a in rec.get("authors", []):
            aid = a.get("authorId")
            if aid and aid not in seen:
                seen.add(aid)
                author_freq[aid] += 1
                author_name[aid] = a.get("name", "")
    return author_freq, author_name, seed_dois, seed_titles


def pick_team(author_freq, author_name):
    team = [aid for aid, c in author_freq.items() if c >= MIN_SEED_APPEARANCES]
    if len(team) < 5:  # tiny seed -> take the most frequent authors
        team = [aid for aid, _ in author_freq.most_common(max(10, len(team)))]
    team = sorted(team, key=lambda a: -author_freq[a])[:MAX_TEAM_AUTHORS]
    return team


def is_jpl_author(name):
    """Verify a name maps to a JPL-affiliated OpenAlex author."""
    if not name:
        return False
    data = _get(f"{OPENALEX}/authors",
                {"search": name, "mailto": MAILTO, "per_page": 5})
    if not data or not data.get("results"):
        return False
    for au in data["results"]:
        insts = []
        for aff in au.get("affiliations", []) or []:
            inst = aff.get("institution", {}) or {}
            insts.append((inst.get("ror", ""), inst.get("display_name", "")))
        li = au.get("last_known_institutions") or au.get("last_known_institution") or []
        if isinstance(li, dict):
            li = [li]
        for inst in li:
            insts.append((inst.get("ror", ""), inst.get("display_name", "")))
        for ror, dn in insts:
            if ror == JPL_ROR or JPL_NAME_RE.search(dn or ""):
                return True
    return False


def crawl_author_papers(aid):
    out = []
    offset = 0
    while offset < MAX_PAPERS_PER_AUTHOR:
        data = _get(f"{S2}/author/{aid}/papers",
                    {"fields": "title,year,externalIds,venue,abstract,citationCount,authors",
                     "limit": 100, "offset": offset})
        if not data or not data.get("data"):
            break
        out.extend(data["data"])
        if len(data["data"]) < 100:
            break
        offset += 100
    return out


def build_profile(seed):
    terms = Counter()
    for e in seed:
        text = norm_title(seed_get(e, "title")) + " " + (seed_get(e, "abstract") or "").lower()
        for w in re.findall(r"[a-z][a-z\-]{3,}", text):
            if w not in STOP:
                terms[w] += 1
    # keep terms appearing in the seed corpus at least twice
    return {w for w, c in terms.most_common(120) if c >= 2} or set(terms)


def relevance(paper, profile):
    text = norm_title(paper.get("title")) + " " + (paper.get("abstract") or "").lower()
    words = {w for w in re.findall(r"[a-z][a-z\-]{3,}", text) if w not in STOP}
    if not words or not profile:
        return 0.0
    return len(words & profile) / len(profile)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True, choices=sorted(MODEL_FILES))
    ap.add_argument("--max-add", type=int, default=30, help="max recommended papers to merge")
    ap.add_argument("--min-year", type=int, default=0)
    ap.add_argument("--csv-only", action="store_true", help="write CSVs, do not merge")
    ap.add_argument("--dry-run", action="store_true", help="no writes at all")
    args = ap.parse_args()
    model = args.model

    load_cache()
    path, seed, (wrap_key, wrap_obj) = load_seed(model)
    print(f"[{model}] seed papers: {len(seed)}")

    author_freq, author_name, seed_dois, seed_titles = resolve_seed_authors(seed)
    save_cache()
    print(f"  resolved authors across seed: {len(author_freq)} unique")

    team = pick_team(author_freq, author_name)
    print(f"  candidate team authors (>= {MIN_SEED_APPEARANCES} papers or top): {len(team)}")

    jpl_team = []
    for aid in team:
        nm = author_name.get(aid, "")
        if is_jpl_author(nm):
            jpl_team.append(aid)
            print(f"    JPL: {nm} ({author_freq[aid]} seed papers)")
        else:
            print(f"    skip (not JPL-verified): {nm}")
    save_cache()
    print(f"  JPL-confirmed team authors: {len(jpl_team)}")

    profile = build_profile(seed)

    # Gather + dedup candidates
    cands = {}
    for aid in jpl_team:
        for p in crawl_author_papers(aid):
            doi = norm_doi((p.get("externalIds") or {}).get("DOI"))
            title = norm_title(p.get("title"))
            if not title:
                continue
            if doi and doi in seed_dois:
                continue
            if title in seed_titles:
                continue
            if args.min_year and (p.get("year") or 0) < args.min_year:
                continue
            key = doi or title
            if key in cands:
                continue
            rel = relevance(p, profile)
            tier = ("recommend" if rel >= RECOMMEND_THRESHOLD
                    else "review" if rel >= REVIEW_THRESHOLD else "exclude")
            authors = "; ".join(a.get("name", "") for a in p.get("authors", []))
            cands[key] = {
                "suggested_action": tier,
                "relevance": round(rel, 3),
                "title": (p.get("title") or ""),
                "venue": p.get("venue", ""),
                "year": p.get("year", ""),
                "doi": doi,
                "citations_s2": p.get("citationCount", 0),
                "authors": authors,
            }
    save_cache()

    rows = sorted(cands.values(),
                  key=lambda r: (r["suggested_action"] != "recommend",
                                 -r["relevance"], -(r["citations_s2"] or 0)))
    n_rec = sum(1 for r in rows if r["suggested_action"] == "recommend")
    n_rev = sum(1 for r in rows if r["suggested_action"] == "review")
    print(f"  candidates: {len(rows)}  (recommend={n_rec}, review={n_rev}, "
          f"exclude={len(rows)-n_rec-n_rev})")

    if args.dry_run:
        print("  DRY RUN — top recommended:")
        for r in rows[:15]:
            print(f"    [{r['relevance']}] {r['year']} {r['title'][:70]}  ({r['citations_s2']} cites)")
        return

    # Write CSVs
    outdir = SEED_DIR / model.lower().replace("-", "_")
    outdir.mkdir(parents=True, exist_ok=True)
    with open(outdir / f"{model.lower().replace('-','_')}_seed_current.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["#", "title", "authors", "journal", "year", "doi", "link"])
        for i, e in enumerate(seed, 1):
            w.writerow([i, seed_get(e, "title"), seed_get(e, "authors"),
                        seed_get(e, "journal", "venue"), seed_get(e, "year"),
                        seed_get(e, "doi", "DOI"), seed_get(e, "link", "url")])
    exp_csv = outdir / f"{model.lower().replace('-','_')}_seed_proposed_expanded.csv"
    with open(exp_csv, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["suggested_action", "relevance", "title",
                                          "venue", "year", "doi", "citations_s2", "authors"])
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"  wrote {exp_csv}")

    if args.csv_only:
        print("  --csv-only: not merging.")
        return

    # Merge top recommended into seed (backup first)
    to_add = [r for r in rows if r["suggested_action"] == "recommend"][:args.max_add]
    if not to_add:
        print("  nothing to merge.")
        return
    backup = path.with_suffix(path.suffix + ".bak")
    if not backup.exists():
        backup.write_text(path.read_text())
        print(f"  backup -> {backup.name}")
    for r in to_add:
        seed.append({
            "authors": r["authors"],
            "title": r["title"],
            "journal": r["venue"],
            "year": r["year"],
            "doi": r["doi"],
            "link": f"https://doi.org/{r['doi']}" if r["doi"] else "",
        })
    if wrap_key is not None:
        wrap_obj[wrap_key] = seed
        path.write_text(json.dumps(wrap_obj, indent=2, ensure_ascii=False))
    else:
        path.write_text(json.dumps(seed, indent=2, ensure_ascii=False))
    print(f"  merged {len(to_add)} papers -> {path.name} (now {len(seed)} seeds)")


if __name__ == "__main__":
    main()
