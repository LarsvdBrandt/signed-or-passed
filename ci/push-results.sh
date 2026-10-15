#!/usr/bin/env bash
# Commits the given files on top of the CURRENT origin/main and pushes, using git plumbing only:
# the working tree, HEAD and any (failed) rebase state are never touched, so concurrent pushes
# (start marker, previous run's results, agent commits) can never cause a rebase conflict.
# usage: bash ci/push-results.sh "<commit message>" <file>...
set -uo pipefail
msg="$1"
shift
tmp="$(mktemp -d)"
files=()
for f in "$@"; do
  if [ -f "$f" ]; then
    mkdir -p "$tmp/files/$(dirname "$f")"
    cp "$f" "$tmp/files/$f"
    files+=("$f")
  fi
done
if [ ${#files[@]} -eq 0 ]; then
  echo "push-results: nothing to push"
  exit 0
fi
export GIT_AUTHOR_NAME="factory-bot"
export GIT_COMMITTER_NAME="factory-bot"
export GIT_AUTHOR_EMAIL="41898282+github-actions[bot]@users.noreply.github.com"
export GIT_COMMITTER_EMAIL="41898282+github-actions[bot]@users.noreply.github.com"
for i in 1 2 3 4 5; do
  if git fetch -q origin +refs/heads/main:refs/remotes/origin/main; then
    base="$(git rev-parse refs/remotes/origin/main)"
    idx="$tmp/index"
    rm -f "$idx"
    GIT_INDEX_FILE="$idx" git read-tree "$base"
    for f in "${files[@]}"; do
      blob="$(git hash-object -w "$tmp/files/$f")"
      GIT_INDEX_FILE="$idx" git update-index --add --cacheinfo "100644,$blob,$f"
    done
    tree="$(GIT_INDEX_FILE="$idx" git write-tree)"
    if [ "$tree" = "$(git rev-parse "$base^{tree}")" ]; then
      echo "push-results: no changes"
      exit 0
    fi
    commit="$(git commit-tree "$tree" -p "$base" -m "$msg")"
    if git push -q origin "$commit:refs/heads/main"; then
      echo "push-results: pushed ${commit:0:7} ($msg)"
      exit 0
    fi
  fi
  sleep $((i * 4))
done
echo "push-results: could not push (check Settings > Actions > General > Workflow permissions)"
exit 1
