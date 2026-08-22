#!/usr/bin/env python3
"""
Merge freshly-scraped citing papers into a model's {MODEL}_analyzed.json,
deduplicating against existing entries (DOI first, then normalized title).

New entries are appended verbatim from the scraper's citations-only output
(they already carry citing_team_paper / team_paper_id and the standard
schema); enrichment (classification, uncertainty) is added by later stages.

Usage:
  python scripts/merge_citations.py --model CARDAMOM \
      --scrape citation_scraper/output/CARDAMOM_citations_citations_only.json
"""
import argparse, json, re
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "public" / "data"


def norm_title(t):
    if isinstance(t, list):
        t = t[0] if t else ""
    return re.sub(r"[^\w\s]", "", (t or "").lower()).strip()


def norm_doi(d):
    return (d or "").strip().lower().replace("https://doi.org/", "")


def get(e, *names):
    for n in names:
        if e.get(n):
            return e[n]
    return ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--scrape", required=True)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    path = DATA_DIR / f"{args.model}_analyzed.json"
    data = json.loads(path.read_text())
    scrape = json.loads(Path(args.scrape).read_text())
    if isinstance(scrape, dict):
        scrape = scrape.get("citations", scrape.get("papers", []))

    dois = {norm_doi(get(e, "doi", "DOI")) for e in data if get(e, "doi", "DOI")}
    titles = {norm_title(get(e, "title")) for e in data if get(e, "title")}

    added, dup = [], 0
    for c in scrape:
        d = norm_doi(get(c, "doi", "DOI"))
        t = norm_title(get(c, "title"))
        if not t and not d:
            continue
        if (d and d in dois) or (t and t in titles):
            dup += 1
            continue
        added.append(c)
        if d:
            dois.add(d)
        if t:
            titles.add(t)

    print(f"[{args.model}] existing={len(data)} scraped={len(scrape)} "
          f"new={len(added)} dup={dup} -> total={len(data)+len(added)}")
    if args.dry_run:
        return

    backup = path.with_suffix(path.suffix + ".prerebuild")
    if not backup.exists():
        backup.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        print(f"  backup -> {backup.name}")
    data.extend(added)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"  wrote {path.name} ({len(data)} entries)")


if __name__ == "__main__":
    main()
