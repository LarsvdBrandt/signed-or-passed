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
done

$S "thumbnail:$slug" bash -c "cd render && npx remotion still src/index.ts Thumbnail ../$OUT/thumbnail.png --props=../build/$slug/main/props.json --frame=89"

# The test production also ships the library previews:
#   preview.mp4         the whole illustration library + a demo of every scene kind (silent)
#   preview-themes.mp4  the same mini-story + a contact sheet of every component in every theme (silent)
#   preview-eras.mp4    every era pack: backdrop, all props, a small composed scene (silent)
#   sound-board.mp4     every sound of the procedural sfx library (pipeline/sfxlib.py) + the CC0/PD recordings
#                       of brand/sfx/manifest.csv (pipeline/fetch_sfx.py, licence verified live), with audio
#   sfx-library.zip     all sfx WAVs (wav/ procedural, recorded/ CC0/PD) + catalogues + LICENCE.txt + CREDITS
if [ "$slug" = "0000-sample" ]; then
  $S "preview:$slug" bash -c "cd render && npx remotion render src/index.ts Preview ../$OUT/preview.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "preview-themes:$slug" bash -c "cd render && npx remotion render src/index.ts ThemePreview ../$OUT/preview-themes.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "preview-eras:$slug" bash -c "cd render && npx remotion render src/index.ts EraPreview ../$OUT/preview-eras.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "sound-fetch:$slug" python pipeline/fetch_sfx.py --out build/sfx-lib --cache build/sfx-cache
  $S "sound-library:$slug" python pipeline/soundboard.py --out build/sfx-lib --zip "$OUT/sfx-library.zip" --recorded build/sfx-lib/recorded-catalogue.json
  $S "sound-board:$slug" bash -c "cd render && npx remotion render src/index.ts SoundBoard ../build/sfx-lib/board-silent.mp4 --props=../build/sfx-lib/soundboard-props.json --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "sound-board-mux:$slug" ffmpeg -y -hide_banner -loglevel error -i build/sfx-lib/board-silent.mp4 -i build/sfx-lib/soundboard.wav \
    -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT/sound-board.mp4"
fi

$S "metadata:$slug" python pipeline/metadata.py --slug "$slug"
$S "qa:$slug" python pipeline/qa.py --slug "$slug"

if [ -n "${GITHUB_ACTIONS:-}" ]; then
  tag="$slug"
  if [ "$slug" = "0000-sample" ]; then tag="sample"; fi
  shopt -s nullglob
  files=("$OUT"/video.mp4 "$OUT"/short-*.mp4 "$OUT"/preview*.mp4 "$OUT"/sound-board.mp4 "$OUT"/sfx-library.zip "$OUT"/thumbnail.png "$OUT"/captions.srt "$OUT"/short-*.srt "$OUT"/metadata.json "$OUT"/render-report.json)
  shopt -u nullglob
  $S "release:$slug" bash -c "gh release delete '$tag' --yes --cleanup-tag >/dev/null 2>&1 || true; sleep 2; gh release create '$tag' ${files[*]} --title '$slug' --notes 'Rendered by the factory from commit ${GITHUB_SHA:-local}. See render-report.json.' --target '${GITHUB_SHA:-main}'"
fi

$S "qa-gate:$slug" python pipeline/qa.py --slug "$slug" --gate
