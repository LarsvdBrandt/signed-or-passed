#!/usr/bin/env bash
# Runs right after checkout: writes ci/last-run.json with status "running" and pushes it [skip ci],
# so it is visible from outside that the workflow actually started (and where: runUrl).
# The push uses ci/push-results.sh (plumbing, no rebase), so it never leaves the checkout in a broken state.
set -uo pipefail
mkdir -p ci
cat > ci/last-run.json <<EOF
{
  "status": "running",
  "triggerSha": "${GITHUB_SHA:-}",
  "startedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "runUrl": "${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}"
}
EOF
# per production: ci/runs/<slug>.json (the catch-up in render.yml skips a production whose render started after
# its spec.json was committed)
mkdir -p ci/runs
files=(ci/last-run.json)
for s in ${SLUGS:-}; do
  sed "s/\"status\": \"running\",/\"status\": \"running\",\n  \"slug\": \"$s\",/" ci/last-run.json > "ci/runs/$s.json"
  files+=("ci/runs/$s.json")
done
bash ci/push-results.sh "ci: render started for ${GITHUB_SHA:0:7} ${SLUGS:-} [skip ci]" "${files[@]}" || true
exit 0
