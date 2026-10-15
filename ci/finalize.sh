#!/usr/bin/env bash
# Always runs at the end of render.yml: writes ci/last-run.json + ci/last-run.log and commits them [skip ci]
# (via ci/push-results.sh: a plumbing commit on top of the current origin/main, no rebase conflicts).
set -uo pipefail
job_status="${1:-unknown}"
mkdir -p build ci
step=$(cat build/current_step 2>/dev/null || echo "setup")
slug=$(cat build/current_slug 2>/dev/null || echo "")
if [ "$job_status" = "success" ]; then step=""; fi
if [ -f build/ci.log ]; then tail -n 300 build/ci.log > ci/last-run.log; else echo "no log captured" > ci/last-run.log; fi

python3 - "$job_status" "$step" "$slug" <<'EOF'
import datetime, json, os, sys
job_status, step, slug = sys.argv[1], sys.argv[2], sys.argv[3]
data = {
    "status": "success" if job_status == "success" else "failure",
    "jobStatus": job_status,
    "triggerSha": os.environ.get("GITHUB_SHA"),
    "slug": slug or None,
    "slugs": os.environ.get("SLUGS", "").split(),
    "finishedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
    "failedStep": step or None,
    "runUrl": "%s/%s/actions/runs/%s" % (os.environ.get("GITHUB_SERVER_URL"), os.environ.get("GITHUB_REPOSITORY"), os.environ.get("GITHUB_RUN_ID")),
}
with open("ci/last-run.json", "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
EOF

files=(ci/last-run.json ci/last-run.log)
for s in ${SLUGS:-}; do
  if [ -f "productions/$s/render-report.json" ]; then files+=("productions/$s/render-report.json"); fi
done
bash ci/push-results.sh "ci: render ${job_status} for ${SLUGS:-nothing} [skip ci]" "${files[@]}"
