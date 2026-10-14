# Signed or Passed: video factory

Turns `productions/<slug>/spec.json` into a finished YouTube video (MP4 + Shorts + thumbnail + captions + metadata)
on free GitHub-hosted runners. Everything is open source: **Remotion** (React video), **Kokoro** TTS (voice
`bm_george`), **ffmpeg** (sound effects, mix, loudness). No paid APIs, no API keys.

## How it works
1. Another agent (or you) commits `productions/<slug>/spec.json` (contract: `schema/spec.schema.json`, v1).
2. `.github/workflows/render.yml` starts automatically and runs, per production:
   `validate_spec` > `fetch_assets` (fonts + images, Wikimedia licences verified) > `tts` (one clip per sentence,
   `timing.json`) > `captions` > `sfx` > `mix` (music bed with ducking, -14 LUFS / -1 dBTP) > `build_props` >
   `remotion render` (LongVideo / ShortVideo, muted) > ffmpeg mux > `remotion still` (Thumbnail) > `metadata` > `qa`.
3. The results are published as a **GitHub Release** with tag = slug (`sample` for the test production):
   `video.mp4`, `short-*.mp4`, `thumbnail.png`, `captions.srt`, `short-*.srt`, `metadata.json`, `render-report.json`.
4. The workflow always commits `ci/last-run.json`, `ci/last-run.log` and `productions/<slug>/render-report.json`.
5. Uploading to YouTube is **manual**: Actions > `upload` > Run workflow (slug, privacy, optional publishAt).

## Re-render
- Edit and push a spec, or
- Actions > `render` > Run workflow with a slug, or
- change `ci/trigger.txt` to re-render the test production `0000-sample`.

## Repo layout
| Path | What |
|---|---|
| `brand/` | palette, fonts (URLs, OFL), music licences (`licenses.csv`) |
| `schema/spec.schema.json` | JSON Schema of spec.json v1 |
| `productions/<slug>/` | `spec.json` (input) and `render-report.json` (output) |
| `pipeline/` | Python 3.11 scripts (see above) + `upload.py` |
| `render/` | Remotion 4 project: compositions `LongVideo` 1920x1080, `ShortVideo` 1080x1920, `Thumbnail` 1280x720, `Preview` |
| `render/src/illustrations/` | the house-style illustration library (flat SVG, 3px outlines, faceless people) |
| `ci/` | step runner, per-production render script, finalize script, last-run files, trigger |
| `docs/` | privacy policy and terms (for the YouTube API audit) |

## Scene kinds (spec.scenes[].kind)
`title`, `illustration`, `evidence`, `chart`, `counter`, `timeline`, `map`, `quote`, `question`, `reveal`, `verdict`,
`lesson`. See the schema for each `visual`. Optional extension: `scene.dateTag` sets the date tag bottom-left.
Illustration layers: `{component, props: {colour, label, pose, ...}, x, y (percent, centre), scale, enter, delaySec}`;
`enter` = pop | fade | slide-up | slide-down | slide-left | slide-right | drop | none.
`motion` (camera) = push-in | pull-out | pan-left | pan-right.

Components: Desk, Contract, FountainPen, Stamp, DecisionChair, Person (standing, sitting, arms-crossed, pointing,
handshake; `flip`), NameCard, Building (`type`: office, factory, store), Phone, Newspaper, Briefcase, MoneyStack,
Clock, Calendar, Arrow, Spotlight, CityBackdrop, OfficeBackdrop, BoardroomBackdrop.

## Timing
Scene durations come from the synthesized audio (`timing.json`), never from guesses: lead-in 0.35 s, 0.25 s between
sentences, 0.45 s tail; question scenes add `holdSec` (3-2-1 countdown); verdict scenes last at least 2.8 s;
`minDurationSec` extends a scene. Each new scene slides in like a sheet of paper (12 frames).

## QA (render-report.json)
Duration (long 8-12 min, short 45-60 s; `0000-*` test productions are exempt), resolution, audio present,
loudness -14 LUFS +/-1, true peak <= -1 dBTP (0.3 dB codec tolerance), audio/video length match, thumbnail size,
captions, all sourceIds resolve, question + verdict scenes, >= 3 chapters, synthetic-voice disclosure.

## YouTube upload setup (once)
Add repository secrets `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN` (OAuth client of a Google Cloud project
with the YouTube Data API v3 enabled; scopes `youtube.upload` and `youtube.force-ssl`). Custom thumbnails require a
phone-verified channel.

## Music
Add tracks to `brand/music/licenses.csv` (`file,url,title,artist,source,license,attribution_text,mood`). Only use
licences that allow monetised YouTube use; credits are added to the description automatically. Without tracks, videos
are rendered without music (warning in render-report.json).

## Local use
`make install`, `make render SLUG=0000-sample`, `make studio` (Remotion Studio with the Preview composition).
