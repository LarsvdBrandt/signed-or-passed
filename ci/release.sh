#!/usr/bin/env bash
# Publishes files to a GitHub release: bash ci/release.sh <tag> <title> <file>...
# An existing release is updated in place (assets replaced with --clobber, stale assets removed, notes edited), so the
# tag is never re-created: re-creating a tag at a commit whose .github/workflows differ from main needs the
# 'workflows' permission and failed with HTTP 403 (iteration 35). A new release targets the rendered commit and
# falls back to main when that is refused.
set -uo pipefail
tag="$1"; title="$2"; shift 2
files=()
for f in "$@"; do
  if [ -f "$f" ]; then files+=("$f"); else echo "release $tag: skipping missing file $f"; fi
done
[ "${#files[@]}" -gt 0 ] || { echo "release $tag: no files to publish"; exit 1; }
notes="Rendered by the factory from commit ${GITHUB_SHA:-local} (run ${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}). See render-report.json."
if gh release view "$tag" >/dev/null 2>&1; then
  keep=" "; for f in "${files[@]}"; do keep="$keep$(basename "$f") "; done
  while IFS= read -r a; do
    [ -z "$a" ] && continue
    case "$keep" in *" $a "*) ;; *) echo "release $tag: removing stale asset $a"; gh release delete-asset "$tag" "$a" --yes || true ;; esac
  done < <(gh release view "$tag" --json assets -q '.assets[].name')
  gh release upload "$tag" "${files[@]}" --clobber || exit 1
  gh release edit "$tag" --title "$title" --notes "$notes" >/dev/null || true
  echo "release $tag: updated (${#files[@]} files)"
else
  gh release create "$tag" "${files[@]}" --title "$title" --notes "$notes" --target "${GITHUB_SHA:-main}" \
    || { echo "release $tag: create at ${GITHUB_SHA:-main} refused, retrying at main"; sleep 3; \
         gh release create "$tag" "${files[@]}" --title "$title" --notes "$notes" --target main; } || exit 1
  echo "release $tag: created (${#files[@]} files)"
fi
