#!/usr/bin/env bash
# VOICE-5: voice A/B test (.github/workflows/voice-test.yml, trigger ci/voice-test.txt).
# Renders the first ~45 s of a real production three times with a different voice (ci/voice-ab.py: 1 Kokoro,
# 2 Chatterbox narrator reference, 3 Chatterbox default voice) into build/voice-test/out:
#   voice-ab-1.mp4 voice-ab-2.mp4 voice-ab-3.mp4 + voice-ab-report.json (WER, liveliness, TTS speed)
# The temporary specs live in productions/0000-voice-ab-<n>/ of the CI workspace only (never committed).
# Doubles as the CPU speed benchmark of Chatterbox on a GitHub runner (ttsSecPerAudioSec in the report).
set -euo pipefail
OUT="${1:-build/voice-test/out}"
mkdir -p "$OUT" build
OUT="$(cd "$OUT" && pwd)"
S="bash ci/run-step.sh"

$S "voice-ab:specs" python ci/voice-ab.py specs
for n in 2 3 1; do
  slug="0000-voice-ab-$n"
  echo "$slug" > build/current_slug
  $S "validate:$slug" python pipeline/validate_spec.py --slug "$slug"
  $S "assets:$slug" python pipeline/fetch_assets.py --slug "$slug"
  t0=$(date +%s)
  # a failing variant must not stop the others: record it and continue
  if ! $S "tts:$slug" python pipeline/tts.py --slug "$slug"; then
    echo "$slug tts" >> build/failed_slugs; continue
  fi
  echo $(( $(date +%s) - t0 )) > "build/voice-ab-$n.tts-sec"
  grep -Eo 'chatterbox: generated in [0-9]+s' build/ci.log | tail -1 | grep -Eo '[0-9]+' > "build/voice-ab-$n.gen-sec" || true
  if [ "$n" = "1" ]; then : > "build/voice-ab-$n.gen-sec"; fi
  $S "captions:$slug" python pipeline/captions.py --slug "$slug"
  $S "sfx:$slug" python pipeline/sfx.py --slug "$slug"
  $S "mix:$slug" python pipeline/mix.py --slug "$slug"
  $S "props:$slug" python pipeline/build_props.py --slug "$slug"
  $S "render:$slug" bash -c "cd render && npx remotion render src/index.ts LongVideo ../build/$slug/main/silent.mp4 --props=../build/$slug/main/props.json --concurrency=2 --image-format=jpeg --jpeg-quality=88 --crf=21 --codec=h264 --log=error"
  $S "mux:$slug" ffmpeg -y -hide_banner -loglevel error -i "build/$slug/main/silent.mp4" -i "build/$slug/main/mix.wav" \
    -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT/voice-ab-$n.mp4"
  $S "peakfix:$slug" python pipeline/peakfix.py "$OUT/voice-ab-$n.mp4" "build/$slug/main/mix.wav"
  cp "build/$slug/main/voice.wav" "build/voice-ab-$n-voice.wav" || true
done
echo voice-test > build/current_slug
$S "voice-ab:report" python ci/voice-ab.py report --out "$OUT"
ls -la "$OUT"
