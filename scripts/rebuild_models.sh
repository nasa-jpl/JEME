#!/usr/bin/env bash
# Full rebuild chain for the given models, run sequentially so Bedrock
# concurrency stays at one model x 12 workers (avoids cross-model throttling).
#
#   merge -> verify_peer_review -> classify_new_entries ->
#   compute_uncertainty -> phase2 -> compute_uncertainty -> phase3
#
# Usage: scripts/rebuild_models.sh CARDAMOM LES EDMF RAPID TROPESS
set -uo pipefail
cd "$(dirname "$0")/.."

run() { echo; echo ">>> $*"; "$@" || echo "!!! FAILED: $* (continuing)"; }

for M in "$@"; do
  echo "==================================================================="
  echo "############## REBUILD $M ##############"
  echo "==================================================================="
  SCRAPE="citation_scraper/output/${M}_citations_citations_only.json"
  run python3 scripts/merge_citations.py --model "$M" --scrape "$SCRAPE"
  run python3 scripts/verify_peer_review.py --model "$M"
  run python3 scripts/classify_new_entries.py --model "$M" --workers 12
  run python3 scripts/compute_uncertainty.py --model "$M"
  run python3 scripts/phase2_llm_confidence.py --model "$M" --workers 12
  run python3 scripts/compute_uncertainty.py --model "$M"
  run python3 scripts/phase3_skeptic_agent.py --model "$M" --workers 12
  echo "############## DONE $M ##############"
done
echo "ALL REBUILDS COMPLETE"
