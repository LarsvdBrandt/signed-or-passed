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
bash ci/push-results.sh "ci: render started for ${GITHUB_SHA:0:7} [skip ci]" ci/last-run.json || true
exit 0
