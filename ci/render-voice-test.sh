#!/usr/bin/env bash
# Voice listening tests (.github/workflows/voice-test.yml and voice-test-2.yml).
#   VOICE_SET=ab  (VOICE-5, trigger ci/voice-test.txt):   voice-ab-1/2/3.mp4 + voice-ab-report.json
#   VOICE_SET=vt2 (VOICE-10c, trigger ci/voice-test-2.txt): <letter>-<name>.mp3 (dry voice) + .mp4 (full video) for the
#                 variants A-E of ci/voice-ab.py + voice-test-2-report.json; every file starts with a 1 s gap (short
#                 beep + silence) so the variants are easy to compare.
# The variants render the same excerpt of a real production (ci/voice-ab.py specs); the temporary specs live in
# productions/0000-voice-ab-<n>/ of the CI workspace only (never committed). A failing variant never stops the others.
# Doubles as the CPU speed benchmark of Chatterbox on a GitHub runner (ttsSecPerAudioSec in the report).
set -euo pipefail
OUT="${1:-build/voice-test/out}"
SET="${VOICE_SET:-ab}"
mkdir -p "$OUT" build
OUT="$(cd "$OUT" && pwd)"
S="bash ci/run-step.sh"

$S "voice-ab:specs" bash -c "python ci/voice-ab.py specs --set $SET > build/voice-variants.txt"
cat build/voice-variants.txt
mapfile -t VARIANTS < <(awk '/^VARIANT /{print $2" "$3}' build/voice-variants.txt)
# Chatterbox variants first (slowest), Kokoro last
ORDERED=()
for v in "${VARIANTS[@]}"; do case "$v" in a\ *|1\ *) ;; *) ORDERED+=("$v") ;; esac; done
for v in "${VARIANTS[@]}"; do case "$v" in a\ *|1\ *) ORDERED+=("$v") ;; esac; done

gap1s() {  # gap1s <in> <out> <mp3|mp4>: prepend 1 s (0.12 s beep at -12 dB + silence)
  local sr=48000 beep
  [ "$3" = mp3 ] && sr=24000
  beep="sine=frequency=880:duration=0.12:sample_rate=$sr,volume=0.25,apad=whole_dur=1"
  if [ "$3" = mp3 ]; then
    ffmpeg -y -hide_banner -loglevel error -i "$1" -filter_complex \
      "$beep,aformat=sample_fmts=fltp:sample_rates=$sr:channel_layouts=mono[b];[0:a]aformat=sample_fmts=fltp:sample_rates=$sr:channel_layouts=mono[m];[b][m]concat=n=2:v=0:a=1[a]" \
      -map "[a]" -c:a libmp3lame -q:a 2 "$2"
  else
    ffmpeg -y -hide_banner -loglevel error -i "$1" -filter_complex \
      "[0:v]tpad=start_duration=1:start_mode=clone[v];$beep,aformat=sample_fmts=fltp:sample_rates=$sr:channel_layouts=stereo[b];[0:a]aformat=sample_fmts=fltp:sample_rates=$sr:channel_layouts=stereo[m];[b][m]concat=n=2:v=0:a=1[a]" \
      -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 21 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$2"
  fi
}

export -f gap1s
for v in "${ORDERED[@]}"; do
  n="${v%% *}"; name="${v#* }"
  slug="0000-voice-ab-$n"
  echo "$slug" > build/current_slug
  $S "validate:$slug" python pipeline/validate_spec.py --slug "$slug" || { echo "$slug validate" >> build/failed_slugs; continue; }
  $S "assets:$slug" python pipeline/fetch_assets.py --slug "$slug" || { echo "$slug assets" >> build/failed_slugs; continue; }
  t0=$(date +%s)
  if ! $S "tts:$slug" python pipeline/tts.py --slug "$slug"; then
    echo "$slug tts" >> build/failed_slugs; continue
  fi
  echo $(( $(date +%s) - t0 )) > "build/voice-ab-$n.tts-sec"
  grep -Eo 'chatterbox: generated in [0-9]+s' build/ci.log | tail -1 | grep -Eo '[0-9]+' > "build/voice-ab-$n.gen-sec" || true
  case "$n" in a|1) : > "build/voice-ab-$n.gen-sec" ;; esac
  if [ "$SET" != ab ]; then  # naturalness proxy (UTMOS) of the dry voice; optional
    cbpy="${SOP_CB_PYTHON:-${SOP_CB_VENV:-$HOME/.venvs/chatterbox}/bin/python}"  # created by tts.py (cb_python)
    $S "utmos:$slug" "$cbpy" pipeline/chatterbox_worker.py utmos --wav "build/$slug/main/voice.wav" \
      --out "build/$slug/utmos.json" || true
  fi
  if ! { $S "captions:$slug" python pipeline/captions.py --slug "$slug" &&
         $S "sfx:$slug" python pipeline/sfx.py --slug "$slug" &&
         $S "mix:$slug" python pipeline/mix.py --slug "$slug" &&
         $S "props:$slug" python pipeline/build_props.py --slug "$slug" &&
         $S "render:$slug" bash -c "cd render && npx remotion render src/index.ts LongVideo ../build/$slug/main/silent.mp4 --props=../build/$slug/main/props.json --concurrency=2 --image-format=jpeg --jpeg-quality=88 --crf=21 --codec=h264 --log=error"; }; then
    echo "$slug render" >> build/failed_slugs
  fi
  if [ "$SET" = ab ]; then
    [ -f "build/$slug/main/silent.mp4" ] || continue
    $S "mux:$slug" ffmpeg -y -hide_banner -loglevel error -i "build/$slug/main/silent.mp4" -i "build/$slug/main/mix.wav" \
      -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT/voice-ab-$n.mp4"
    $S "peakfix:$slug" python pipeline/peakfix.py "$OUT/voice-ab-$n.mp4" "build/$slug/main/mix.wav"
  else
    $S "mp3:$slug" gap1s "build/$slug/main/voice.wav" "$OUT/$name.mp3" mp3 || true
    [ -f "build/$slug/main/silent.mp4" ] || continue
    $S "mux:$slug" ffmpeg -y -hide_banner -loglevel error -i "build/$slug/main/silent.mp4" -i "build/$slug/main/mix.wav" \
      -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "build/$slug/main/ab.mp4" \
      || { echo "$slug mux" >> build/failed_slugs; continue; }
    $S "peakfix:$slug" python pipeline/peakfix.py "build/$slug/main/ab.mp4" "build/$slug/main/mix.wav" || true
    $S "gap:$slug" gap1s "build/$slug/main/ab.mp4" "$OUT/$name.mp4" mp4 || echo "$slug gap" >> build/failed_slugs
  fi
  cp "build/$slug/main/voice.wav" "build/voice-ab-$n-voice.wav" || true
done
echo "voice-test-$SET" > build/current_slug
$S "voice-ab:report" python ci/voice-ab.py report --set "$SET" --out "$OUT"
ls -la "$OUT"
