#!/usr/bin/env python3
"""
Re-apply the seed_guards relevance guards to seeds already merged by
expand_seed_list.py, and drop the ones that fail.

Only papers ADDED by the expansion (present in the seed file but not in its
.bak) are judged; the original curated seed is left untouched.

Usage:
  python scripts/prune_seeds.py --model RAPID --dry-run
  python scripts/prune_seeds.py --all
"""
import argparse, json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import seed_guards as G

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "public" / "data"

MODEL_FILES = {
    "CMS-Flux": "cms_flux_team_papers.json",
    "CARDAMOM": "cardamom_team_papers.json",
    "EDMF": "EDMF_team_papers.json",
    "LES": "LES_team_papers.json",
    "MOMO-CHEM": "momo_chem_team_papers.json",
    "RAPID": "rapid_team_papers.json",
    "TROPESS": "tropess_team_papers.json",
}


def load(path):
    raw = json.loads(path.read_text())
    if isinstance(raw, dict):
        key = "papers" if "papers" in raw else list(raw.keys())[0]
        return raw[key], (key, raw)
    return raw, (None, None)


def norm(t):
    if isinstance(t, list):
        t = t[0] if t else ""
    return re.sub(r"[^\w\s]", "", (t or "")).lower().strip()


def authors_of(entry):
    a = entry.get("authors") or entry.get("author") or []
    if isinstance(a, str):
        # Curated seeds use "Full Name, Full Name"; expansion entries use
        # "A. B. Name; A. B. Name". Prefer semicolons when present.
        sep = ";" if ";" in a else ","
        a = [x.strip() for x in a.split(sep) if x.strip()]
    return [x if isinstance(x, str) else
            f"{x.get('given','')} {x.get('family','')}".strip() for x in a]


def team_names(original_seed):
    """Authors recurring across the ORIGINAL curated seed define the team."""
    from collections import Counter
    c = Counter()
    for e in original_seed:
        for a in set(authors_of(e)):
            c[a] += 1
    # Recurring authors, plus every author of a small curated seed.
    # Seeds that record authors as citation strings ("David et al. (2011)")
    # give one name per paper; every one of those names is a team lead.
    single = sum(1 for e in original_seed if len(authors_of(e)) == 1)
    if single > len(original_seed) / 2:
        return set(c)
    names = {a for a, n in c.items() if n >= 2}
    return names or set(c)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", choices=sorted(MODEL_FILES))
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    models = sorted(MODEL_FILES) if args.all else [args.model]
    if not models or models == [None]:
        ap.error("pass --model or --all")

    for m in models:
        path = DATA_DIR / MODEL_FILES[m]
        bak = path.with_suffix(path.suffix + ".bak")
        if not bak.exists():
            print(f"[{m}] no .bak (not expanded) - skipping")
            continue
        seed, (wkey, wobj) = load(path)
        orig, _ = load(bak)
        orig_titles = {norm(e.get("title")) for e in orig}
        team = team_names(orig)

        kept, dropped = [], []
        for e in seed:
            if norm(e.get("title")) in orig_titles:
                kept.append(e)      # original curated seed, never judged
                continue
            ok, why = G.evaluate(e, m, authors_of(e), team)
            (kept if ok else dropped).append(e)
            if not ok:
                dropped[-1] = dict(e, _reason=why)

        print(f"\n[{m}] seed {len(seed)} -> keep {len(kept)}, drop {len(dropped)}"
              f"  (team authors: {len(team)})")
        for e in dropped:
            print(f"   DROP {(e.get('title') or '')[:66]}")
            print(f"        {e['_reason']}")

        if args.dry_run or not dropped:
            continue
        for e in dropped:
            e.pop("_reason", None)
        pruned = path.with_suffix(path.suffix + ".prepruned")
        if not pruned.exists():
            pruned.write_text(path.read_text())
        if wkey is not None:
            wobj[wkey] = kept
            path.write_text(json.dumps(wobj, indent=2, ensure_ascii=False))
        else:
            path.write_text(json.dumps(kept, indent=2, ensure_ascii=False))
        print(f"   wrote {path.name} ({len(kept)} seeds)")


if __name__ == "__main__":
    main()
