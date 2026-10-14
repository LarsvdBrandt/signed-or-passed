#!/usr/bin/env bash
# Usage: bash ci/run-step.sh <step-name> <command...>
# Records the current step (for ci/last-run.json) and tees all output into build/ci.log.
set -o pipefail
name="$1"; shift
mkdir -p build
echo "$name" > build/current_step
echo "===== [$name] $(date -u +%H:%M:%S) =====" | tee -a build/ci.log
"$@" 2>&1 | tee -a build/ci.log
rc=${PIPESTATUS[0]}
if [ "$rc" -ne 0 ]; then
  echo "===== [$name] FAILED with exit code $rc =====" | tee -a build/ci.log
fi
exit "$rc"
