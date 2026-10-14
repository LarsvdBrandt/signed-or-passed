#!/usr/bin/env bash
# Runs right after checkout: writes ci/last-run.json with status "running" and pushes it [skip ci],
# so it is visible from outside that the workflow actually started (and where: runUrl).
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
git config user.name "factory-bot"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add ci/last-run.json
git commit -m "ci: render started for ${GITHUB_SHA:0:7} [skip ci]" || exit 0
for i in 1 2 3; do
  if git pull --rebase --autostash origin main && git push origin HEAD:main; then exit 0; fi
  sleep $((i * 5))
done
echo "could not push start marker (check Settings > Actions > General > Workflow permissions)"
exit 1
