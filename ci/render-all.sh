#!/usr/bin/env bash
# Usage: SLUGS="a b c" bash ci/render-all.sh
# Renders every slug in $SLUGS: real productions first, the test production 0000-sample last
# (its library previews take long). A failing production does not stop the others; the
# first failure is recorded in build/failed_step + build/failed_slug (read by ci/finalize.sh),
# every failure in build/failed_slugs, and the step exits 1 at the end if anything failed.
set -uo pipefail
mkdir -p build
: > build/failed_slugs
rm -f build/failed_step build/failed_slug
ordered=""
for s in ${SLUGS:-}; do [ "$s" = "0000-sample" ] || ordered="$ordered $s"; done
case " ${SLUGS:-} " in *" 0000-sample "*) ordered="$ordered 0000-sample" ;; esac
echo "Render order:${ordered:- none}" | tee -a build/ci.log
rc=0
for slug in $ordered; do
  if ! bash ci/render-slug.sh "$slug"; then
    rc=1
    step=$(cat build/current_step 2>/dev/null || echo unknown)
    echo "$slug $step" >> build/failed_slugs
    [ -f build/failed_step ] || echo "$step" > build/failed_step
    [ -f build/failed_slug ] || echo "$slug" > build/failed_slug
    echo "===== [render-all] $slug FAILED at $step; continuing with the next production =====" | tee -a build/ci.log
  fi
done
exit $rc
