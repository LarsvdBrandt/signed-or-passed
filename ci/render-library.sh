#!/usr/bin/env bash
# Renders the whole motion-graphics + audio library into <out dir> (default build/library/out):
# every preview video, the sound / music / voice boards and their zips. Used by .github/workflows/library.yml
# (release 'library'); needs the same setup as a production render (Remotion, Python packages, ffmpeg).
set -euo pipefail
OUT="${1:-build/library/out}"
OUT="$(mkdir -p "$OUT" && cd "$OUT" && pwd)"
S="bash ci/run-step.sh"
mkdir -p build
# Outputs:
#   preview.mp4              the whole illustration library + a demo of every scene kind (silent)
#   preview-themes.mp4       the same mini-story + a contact sheet of every component in every theme (silent)
#   preview-eras.mp4         every era pack: backdrop, all props, a small composed scene (silent)
#   preview-moods.mp4        every mood shot (scene kind 'shot', render/src/moods) with id, mood and props (silent)
#   preview-characters.mp4   every pose, costume, hat and held prop of the Character rig + Crowd2 examples (silent)
#   preview-effects.mp4      every overlay effect, particle, paper variant and look (render/src/effects) on a demo scene (silent)
#   preview-transitions.mp4  every transition A -> B, param variants and the parallax rig moves (render/src/transitions) (silent)
#   preview-infographics.mp4 every infographic type (render/src/infographics) with placeholder data, 6 s each (silent)
#   preview-typography.mp4   every kinetic-text preset in 2 themes, lower thirds, chapter card, Shorts caption styles (silent)
#   preview-templates.mp4    every scene template (render/src/templates) in its default era + two others, 4 s each (silent)
#   sound-board.mp4          every sound of the procedural sfx library (pipeline/sfxlib.py) + the CC0/PD recordings
#                            of brand/sfx/manifest.csv (pipeline/fetch_sfx.py, licence verified live), with audio
#   sfx-library.zip          all sfx WAVs (wav/ procedural, recorded/ CC0/PD) + catalogues + LICENCE.txt + CREDITS
#   music-board.mp4          every procedural mood bed, era flavour and stinger (pipeline/musicgen.py), with audio
#   music-library.zip        all music WAVs + catalogue.json + LICENCE.txt (CC0)
#   voice-samples.mp4        one sample sentence per voice of brand/voices.json (Kokoro + licence-checked Piper)
#   voice-samples.zip        the voice sample WAVs + catalogue + voices.json + LICENCES.txt
  $S "preview:library" bash -c "cd render && npx remotion render src/index.ts Preview $OUT/preview.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "preview-themes:library" bash -c "cd render && npx remotion render src/index.ts ThemePreview $OUT/preview-themes.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "preview-eras:library" bash -c "cd render && npx remotion render src/index.ts EraPreview $OUT/preview-eras.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "preview-moods:library" bash -c "cd render && npx remotion render src/index.ts MoodPreview $OUT/preview-moods.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "preview-characters:library" bash -c "cd render && npx remotion render src/index.ts CharacterPreview $OUT/preview-characters.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "preview-effects:library" bash -c "cd render && npx remotion render src/index.ts EffectsPreview $OUT/preview-effects.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "preview-transitions:library" bash -c "cd render && npx remotion render src/index.ts TransitionPreview $OUT/preview-transitions.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "preview-infographics:library" bash -c "cd render && npx remotion render src/index.ts InfographicPreview $OUT/preview-infographics.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "preview-typography:library" bash -c "cd render && npx remotion render src/index.ts TypographyPreview $OUT/preview-typography.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "preview-templates:library" bash -c "cd render && npx remotion render src/index.ts TemplatePreview $OUT/preview-templates.mp4 --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "sound-fetch:library" python pipeline/fetch_sfx.py --out build/sfx-lib --cache build/sfx-cache
  $S "sound-library:library" python pipeline/soundboard.py --out build/sfx-lib --zip "$OUT/sfx-library.zip" --recorded build/sfx-lib/recorded-catalogue.json
  $S "sound-board:library" bash -c "cd render && npx remotion render src/index.ts SoundBoard ../build/sfx-lib/board-silent.mp4 --props=../build/sfx-lib/soundboard-props.json --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "sound-board-mux:library" ffmpeg -y -hide_banner -loglevel error -i build/sfx-lib/board-silent.mp4 -i build/sfx-lib/soundboard.wav \
    -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT/sound-board.mp4"
  $S "music-library:library" python pipeline/musicgen.py library --out build/music-lib --zip "$OUT/music-library.zip"
  $S "music-board:library" bash -c "cd render && npx remotion render src/index.ts SoundBoard ../build/music-lib/board-silent.mp4 --props=../build/music-lib/board-props.json --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "music-board-mux:library" ffmpeg -y -hide_banner -loglevel error -i build/music-lib/board-silent.mp4 -i build/music-lib/board.wav \
    -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT/music-board.mp4"
  $S "voice-library:library" python pipeline/voice_samples.py --out build/voice-lib --zip "$OUT/voice-samples.zip"
  $S "voice-board:library" bash -c "cd render && npx remotion render src/index.ts SoundBoard ../build/voice-lib/board-silent.mp4 --props=../build/voice-lib/board-props.json --concurrency=2 --image-format=jpeg --jpeg-quality=85 --crf=23 --codec=h264 --log=error"
  $S "voice-board-mux:library" ffmpeg -y -hide_banner -loglevel error -i build/voice-lib/board-silent.mp4 -i build/voice-lib/board.wav \
    -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT/voice-samples.mp4"
