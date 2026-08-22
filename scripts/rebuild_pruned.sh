#!/usr/bin/env bash
# Rebuild models from their pre-expansion baseline using only the citations
# reachable from the pruned (guard-filtered) seed list. No re-scraping: the
# scrape already records which team paper each citing paper came from.
set -uo pipefail
cd "$(dirname "$0")/.."

run() { echo; echo ">>> $*"; "$@" || echo "!!! FAILED: $* (continuing)"; }

for M in "$@"; do
  echo "==================================================================="
  echo "############## REBUILD (PRUNED) $M ##############"
  echo "==================================================================="
  cp "public/data/${M}_analyzed.json.prerebuild" "public/data/${M}_analyzed.json"
  echo "restored baseline: $(python3 -c "import json;print(len(json.load(open('public/data/${M}_analyzed.json'))))") entries"
  run python3 scripts/merge_citations.py --model "$M" --scrape "citation_scraper/output/${M}_citations_pruned.json"
  run python3 scripts/verify_peer_review.py --model "$M"
  run python3 scripts/classify_new_entries.py --model "$M" --workers 12
  run python3 scripts/compute_uncertainty.py --model "$M"
  run python3 scripts/phase2_llm_confidence.py --model "$M" --workers 12
  run python3 scripts/compute_uncertainty.py --model "$M"
  run python3 scripts/phase3_skeptic_agent.py --model "$M" --workers 12
  echo "############## DONE $M ##############"
done
echo "ALL PRUNED REBUILDS COMPLETE"
