#!/usr/bin/env bash
# Render one production end to end: bash ci/render-slug.sh <slug>
set -euo pipefail
slug="$1"
S="bash ci/run-step.sh"
OUT="build/$slug/out"
mkdir -p "$OUT"
echo "$slug" > build/current_slug

$S "validate:$slug" python pipeline/validate_spec.py --slug "$slug"
$S "assets:$slug" python pipeline/fetch_assets.py --slug "$slug"
$S "tts:$slug" python pipeline/tts.py --slug "$slug"
$S "captions:$slug" python pipeline/captions.py --slug "$slug"
$S "sfx:$slug" python pipeline/sfx.py --slug "$slug"
$S "mix:$slug" python pipeline/mix.py --slug "$slug"
$S "props:$slug" python pipeline/build_props.py --slug "$slug"

for props in build/"$slug"/*/props.json; do
  cut=$(basename "$(dirname "$props")")
  fmt=$(python -c "import json,sys; print(json.load(open(sys.argv[1]))['format'])" "$props")
  if [ "$fmt" = "short" ]; then comp=ShortVideo; else comp=LongVideo; fi
  if [ "$cut" = "main" ]; then name=video; else name="$cut"; fi
  $S "render:$slug:$cut" bash -c "cd render && npx remotion render src/index.ts $comp ../build/$slug/$cut/silent.mp4 --props=../$props --concurrency=2 --image-format=jpeg --jpeg-quality=90 --crf=20 --codec=h264 --log=info"
  $S "mux:$slug:$cut" ffmpeg -y -hide_banner -loglevel error -i "build/$slug/$cut/silent.mp4" -i "build/$slug/$cut/mix.wav" \
    -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT/$name.mp4"
  # the AAC encode can push hard transients over -1 dBTP (varies per run): re-encode the audio with a stricter limiter
  $S "peakfix:$slug:$cut" python pipeline/peakfix.py "$OUT/$name.mp4" "build/$slug/$cut/mix.wav"
done

$S "thumbnail:$slug" bash -c "cd render && npx remotion still src/index.ts Thumbnail ../$OUT/thumbnail.png --props=../build/$slug/main/props.json --frame=89"

# The library previews and sound/music/voice boards are NOT part of a production render any more (they took
# ~45 min and starved real productions). They are rendered by .github/workflows/library.yml (ci/render-library.sh)
# into the release 'library'. Locally: RENDER_LIBRARY=1 bash ci/render-slug.sh 0000-sample renders them too.
if [ "$slug" = "0000-sample" ] && [ "${RENDER_LIBRARY:-0}" = "1" ]; then
  bash ci/render-library.sh "$OUT"
fi

$S "metadata:$slug" python pipeline/metadata.py --slug "$slug"
$S "qa:$slug" python pipeline/qa.py --slug "$slug"

if [ -n "${GITHUB_ACTIONS:-}" ]; then
  tag="$slug"
  if [ "$slug" = "0000-sample" ]; then tag="sample"; fi
  shopt -s nullglob
  files=("$OUT"/video.mp4 "$OUT"/short-*.mp4 "$OUT"/preview*.mp4 "$OUT"/sound-board.mp4 "$OUT"/sfx-library.zip "$OUT"/music-board.mp4 "$OUT"/music-library.zip "$OUT"/voice-samples.mp4 "$OUT"/voice-samples.zip "$OUT"/thumbnail.png "$OUT"/captions.srt "$OUT"/short-*.srt "$OUT"/metadata.json "$OUT"/render-report.json)
  shopt -u nullglob
  # nullglob only drops unmatched WILDCARD patterns: literal paths (sound-board.mp4 etc., now rendered by the
  # library workflow) stayed in the list and made 'gh release upload' fail. Keep only files that exist.
  existing=(); for f in "${files[@]}"; do if [ -f "$f" ]; then existing+=("$f"); fi; done
  $S "release:$slug" bash ci/release.sh "$tag" "$slug" "${existing[@]}"
fi

$S "qa-gate:$slug" python pipeline/qa.py --slug "$slug" --gate
