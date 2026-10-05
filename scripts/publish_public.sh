#!/usr/bin/env bash
# Build the sanitized public copy of this repository and publish it to
# nasa-jpl/JEME. `main` here is the complete internal history; the public repo
# gets the same commits with scripts/public_release/exclude_paths.txt filtered
# out and scripts/public_release/replace_text.txt applied. The rewrite is
# deterministic, so later runs fast-forward the public branch.
#
# Usage:
#   scripts/publish_public.sh                 # rewrite + verify only
#   scripts/publish_public.sh --push          # also push main
#   scripts/publish_public.sh --push --force  # push after the exclude list changed
#   scripts/publish_public.sh --deploy        # also build and publish the site
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RULES="$ROOT/scripts/public_release"
REMOTE_URL="https://github.com/nasa-jpl/JEME.git"
WORK="${PUBLIC_WORK_DIR:-${TMPDIR:-/tmp}/jeme-public}"

PUSH=0; FORCE=0; DEPLOY=0
for arg in "$@"; do
  case "$arg" in
    --push) PUSH=1 ;;
    --force) FORCE=1 ;;
    --deploy) DEPLOY=1 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

if [ -n "$(git -C "$ROOT" status --porcelain --untracked-files=no)" ]; then
  echo "Commit or stash tracked changes first: only committed work is published." >&2
  exit 1
fi

rm -rf "$WORK"
git clone --quiet --no-local --single-branch --branch main "$ROOT" "$WORK"
cd "$WORK"
git filter-repo --force --quiet \
  --invert-paths --paths-from-file "$RULES/exclude_paths.txt" \
  --replace-text "$RULES/replace_text.txt"

# Refuse to publish if anything internal survived the rewrite.
PATHS="$(git log --all --name-only --format= | sort -u)"
LEAKED="$(printf '%s\n' "$PATHS" | grep -iE '\.(pptx|docx|xlsx)$|(^|/)(CLAUDE\.md|NTR_[^/]*\.md|\.DS_Store)$|^(journal_paper|figures|model_capability_levels|model maturity capability level|pse)/|alumni|views/PSE/' || true)"
if [ -n "$LEAKED" ]; then
  echo "Internal paths remain in the public history:" >&2
  printf '%s\n' "$LEAKED" >&2
  exit 1
fi
if git log --all -p -G'AIza[0-9A-Za-z_-]{35}' --format=%h | grep -q .; then
  echo "An API key remains in the public history." >&2
  exit 1
fi
if grep -rqE "PSEPage|jpl_alumni" src public; then
  echo "The public tree still references the PSE page." >&2
  exit 1
fi
echo "Sanitized history ready in $WORK ($(git rev-list --count HEAD) commits, tip $(git rev-parse --short HEAD))"

if [ "$DEPLOY" = 1 ]; then
  ln -s "$ROOT/node_modules" node_modules
  cp "$ROOT/.env" .env
  CI=false PUBLIC_URL=/JEME npx react-scripts build
fi

if [ "$PUSH" = 1 ]; then
  if [ "$FORCE" = 1 ]; then
    git push --force "$REMOTE_URL" main:main
  else
    git push "$REMOTE_URL" main:main
  fi
fi

if [ "$DEPLOY" = 1 ]; then
  # --no-history keeps old builds (and whatever they contained) off the branch
  npx gh-pages -d build --nojekyll --dotfiles --no-history --repo "$REMOTE_URL"
fi
