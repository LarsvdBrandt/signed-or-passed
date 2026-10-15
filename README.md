# Signed or Passed: video factory

Turns `productions/<slug>/spec.json` into a finished YouTube video (MP4 + Shorts + thumbnail + captions + metadata)
on free GitHub-hosted runners. Everything is open source: **Remotion** (React video), **Kokoro** TTS (voice
`bm_george`, default speed 1.15; licence-checked **Piper** voices for other languages), **ffmpeg** + numpy (sound
effects, generated music, mix, loudness). No paid APIs, no API keys.

## How it works
1. Another agent (or you) commits `productions/<slug>/spec.json` (contract: `schema/spec.schema.json`, v1).
2. `.github/workflows/render.yml` starts automatically and runs, per production:
   `validate_spec` > `fetch_assets` (fonts + images, Wikimedia licences verified) > `tts` (one clip per sentence,
   `timing.json`) > `captions` > `sfx` > `mix` (music bed with ducking, -14 LUFS / -1 dBTP) > `build_props` >
   `remotion render` (LongVideo / ShortVideo, muted) > ffmpeg mux > `remotion still` (Thumbnail) > `metadata` > `qa`.
3. The results are published as a **GitHub Release** with tag = slug (`sample` for the test production):
   `video.mp4`, `short-*.mp4`, `thumbnail.png`, `captions.srt`, `short-*.srt`, `metadata.json`, `render-report.json`.
   Every production renders in its own job (concurrency group `render-<slug>`), so productions run in parallel
   and never wait for the test production or the library. A production whose spec.json is newer than its
   render-report.json (and whose render has not started since, see `ci/runs/<slug>.json`) is caught up on the
   next render run; so is a production that has no GitHub release yet (once). Per-production status: `ci/runs/<slug>.json`; the latest finished job: `ci/last-run.json`.
4. The library is rendered separately by `.github/workflows/library.yml` (`ci/render-library.sh`; Actions tab or
   push `ci/library-trigger.txt`) into the release **`library`**:
   - **`preview.mp4`**: contact sheets of the whole illustration library + a demo of every scene kind and brand component (silent)
   - **`preview-themes.mp4`**: the same mini-story in every theme, each followed by a contact sheet of every component in that theme (silent)
   - **`preview-eras.mp4`**: every era pack: backdrop, all props and a small composed scene (silent)
   - **`preview-characters.mp4`**: the character rig: poses, costumes, hats, held props and Crowd2 (silent)
   - **`preview-moods.mp4`**: every mood shot with its id and mood (silent)
   - **`preview-effects.mp4`**: every effect, look preset and particle overlay (silent)
   - **`preview-transitions.mp4`**: every transition and the parallax rig (silent)
   - **`preview-infographics.mp4`**: every infographic and diagram type with placeholder data (silent)
   - **`preview-typography.mp4`**: every kinetic-text preset, lower thirds, chapter card, Shorts caption styles (silent)
   - **`preview-templates.mp4`**: every scene template in its default era + two others (silent)
   - **`library-reel.mp4`**: a 2.5 minute showcase of the whole library (a title card + 3 excerpts per preview) on a generated CC0 music bed (`LibraryReel` composition); catalogue: `docs/library/README.md`
   - **`sound-board.mp4`**: every sound of the sound library, with its name and category (with audio)
   - **`sfx-library.zip`**: all sound-effect WAVs + `catalogue.json` + licence information
   - **`music-board.mp4`** / **`music-library.zip`**: every generated mood bed, era flavour and stinger (CC0)
   - **`voice-samples.mp4`** / **`voice-samples.zip`**: one sample sentence per voice of `brand/voices.json`
5. The workflow always commits `ci/last-run.json`, `ci/last-run.log` and `productions/<slug>/render-report.json`
   (via `ci/push-results.sh`: a plumbing commit on top of the current `main`, so concurrent pushes never conflict).
6. Uploading to YouTube is **manual**: Actions > `upload` > Run workflow (slug, privacy, optional publishAt).

## Re-render
- Edit and push a spec, or
- Actions > `render` > Run workflow with a slug, or
- change `ci/trigger.txt` to re-render the test production `0000-sample`, or
- change `ci/rerender.txt` (one slug per line, `#` comments) to re-render real productions without touching
  their files (used by the factory after a factory fix; add a new dated comment line to trigger again).

A `plan` job picks the productions (changed specs, `0000-sample` for `ci/trigger.txt`, the slugs in
`ci/rerender.txt` when it changed, plus catch-ups) and starts one `render <slug>` job per production (max 4 in
parallel, `fail-fast: false`). Per production only one job waits
in the queue: a newer push of the same production replaces its pending job, which then renders the newest spec.
Every push run also renders each real production whose `spec.json` was committed after its `render-report.json`
(or that has none yet) or that has no release yet, unless a render of it already started after its spec was
committed (`ci/runs/<slug>.json`): a lost render is caught up automatically, a failed one is not looped.

## Repo layout
| Path | What |
|---|---|
| `brand/` | palette, fonts (URLs, OFL), music licences (`music/licenses.csv`), recorded sound manifest (`sfx/manifest.csv`), voice catalogue (`voices.json`) |
| `schema/spec.schema.json` | JSON Schema of spec.json v1 |
| `productions/<slug>/` | `spec.json` (input) and `render-report.json` (output) |
| `pipeline/` | Python 3.11 scripts (see above) + `upload.py`; `sfxlib.py`, `fetch_sfx.py` + `soundboard.py` = sound library; `musicgen.py` = generated music (`musicdyn.py` = music energy per scene); `voice_samples.py` = voice board; `retention.py` = beats, keywords, beat sounds |
| `render/` | Remotion 4 project: compositions `LongVideo` 1920x1080, `ShortVideo` 1080x1920, `Thumbnail` 1280x720, `Preview`, `ThemePreview`, `EraPreview`, `CharacterPreview`, `MoodPreview`, `EffectsPreview`, `TransitionPreview`, `InfographicPreview`, `TypographyPreview`, `TemplatePreview`, `SoundBoard` |
| `render/src/components/brand.tsx` | brand intro sting, end card, watermark, logo lockup, title card |
| `render/src/illustrations/` | the house-style illustration library (flat SVG, 3px outlines, faceless people) |
| `render/src/characters/` | the character rig: poses, era costumes, hats, held props, Crowd2 |
| `render/src/eras/` | era packs (backdrop + props per period, see Eras) |
| `render/src/moods/` | mood shots (scene kind `shot`, see Mood shots) |
| `render/src/effects/` | overlay effects, look presets and seeded particles (see Effects) |
| `render/src/transitions/` | scene transitions and the parallax rig (see Effects) |
| `render/src/infographics/` | animated infographics (scene kind `infographic`, see Infographics) |
| `render/src/typography/` | kinetic text presets, lower thirds, chapter cards, Shorts caption styles (see Typography) |
| `render/src/templates/` | era-aware scene templates (scene kind `template`, see Scene templates) |
| `render/src/retention/` | visual beats, auto camera beats, kinetic keywords (see Retention) |
| `render/src/geo/` | shared Natural Earth helpers (country lookup, region boxes) |
| `render/src/scenes/` | one component per scene kind (`MotionScenes.tsx`: versus, growth, split-flap, document, photo-wall, money counter, line chart) |
| `render/src/themes/` | theme engine and presets (see Themes) |
| `ci/` | step runner, `render-all.sh` (order + catch-up), per-production render script, start marker, finalize script, result push, last-run files, trigger |
| `docs/` | privacy policy and terms (for the YouTube API audit); `docs/library/` = library catalogues |

## Brand: intro and outro
Every long video gets a short logo sting (`BrandIntro`, 1.2 s) right AFTER the hook, never before it, and ends with a
6 s end card (`EndCard`, optional "next story" teaser via `spec.nextTeaser`). `spec.brandIntro` = `{after, durationSec}`
or `false` (docs/library/retention.md). `tts.py` writes `introSec` / `introAtSec` / `outroSec` into `timing.json`;
`build_props.py` turns them into `introFrames` / `introAtFrame` / `outroFrames`; `mix.py` keeps the voice silent during
both. Previews show the full 3 s sting. A small watermark sits bottom-right during the story and
the date tag (`scene.dateTag`, IBM Plex Mono) bottom-left.

## Themes (spec.theme)
The factory is reusable for other channels: `spec.theme` switches the whole look (colours, fonts, outline width,
corner radius, texture overlay, content filter, vignette, entrance easing, Shorts caption style). Omit it for the
approved Signed or Passed house style.

| theme | look | good for |
|---|---|---|
| `signed-or-passed` (default) | flat editorial vector, 3px outlines, paper grain | business stories |
| `paper-cutout` | kraft paper layers, hard drop shadows, stop-motion easing | crafts, kids history |
| `engraving` | sepia parchment, hatching, IM Fell English | ancient/medieval history, Golden Age |
| `blueprint` | white lines on blue, grid | engineering, inventions |
| `chalkboard` | slate board, rough chalk, Caveat | education, science |
| `retro-comic` | bold outlines, halftone, Bangers, speech-bubble captions | funny stories, pop culture |
| `synthwave` | neon on purple, glow, scanlines | 1980s, gaming, tech |
| `pastel-kids` | pastels, round corners, Fredoka, bouncy motion | kids, simple explainers |
| `documentary-dark` | dark, condensed type, heavy vignette | true crime, serious history |

Details: `docs/library/themes.md`. `render/src/boot.ts` applies the theme from the input props before any module
is evaluated, so the outline width follows the theme in productions. (In the multi-theme `preview-themes.mp4` all
themes are drawn with the default 3px outline; colours, fonts and textures are exact.)

## Eras
Eleven era packs, each a backdrop + animated props in the house style (they follow the active theme). Use the
backdrop as `visual.background` and the props as illustration layers.

| era | years | backdrop | props |
|---|---|---|---|
| ancient | 3000 BC - 500 AD | AncientBackdrop | ColumnTemple, Pyramid, Galley, Chariot, Amphora, Scroll, Laurel, OilLamp, AncientCoin, WaxTablet |
| medieval | 500 - 1500 | MedievalBackdrop | CastleGate, MarketStall, QuillParchment, WaxSeal, SwordShield, Cart, Lantern, GuildSign |
| golden-age | 1500 - 1700 | GoldenAgeBackdrop | Fluyt, CanalHouse, Tulip, SpiceSacks, Globe, Compass, Ledger |
| industrial | 1850 - 1910 | IndustrialBackdrop | SteamEngine, FactoryGate, PennyFarthing, TelegraphKey, TopHat, PocketWatch, GasLamp |
| twenties | 1919 - 1939 | DecoBackdrop | TickerTape, Gramophone, VintageCar, Breadline, CathedralRadio, CocktailGlass, NewsboyCap |
| fifties | 1945 - 1969 | DinerBackdrop | Jukebox, TVSet, FinCar, RotaryPhone, Typewriter, RocketToy, Milkshake |
| eighties | 1970 - 1989 | NeonBackdrop | ArcadeCabinet, Cassette, CRTTV, Boombox, Calculator, Mainframe, PersonalStereo |
| nineties | 1990 - 2001 | CubicleBackdrop | BeigePC, DialUpModem, CDROM, Pager, EarlyWebsite, ServerRack, ComputerMouse |
| noughties | 2001 - 2012 | OpenPlanBackdrop | FlipPhone, MP3Player, FlatScreen, LaptopBag, WifiRouter, USBStick, CompactCamera |
| modern | 2013 - today | OfficeBackdrop | core components |
| future | 2025 - 2050 | FutureSkylineBackdrop | SmartphoneGrid, Drone, EV, DataCentre, VRHeadset, RobotArm, SolarPanel |

Props per component (labels, poses, animations) and the rules for adding an era: `docs/library/eras.md`.

## Characters
The `Character` illustration layer is a faceless rig with 19 animated poses (stand, walk, run, sit, type, point,
shrug, facepalm, celebrate, slump, arms-crossed, handshake, applause, thinking, shock, wave, talk, phone, protest),
era costumes (17, or an era alias such as `1920s`), hats (14) and held props (briefcase, phone, smartphone,
newspaper, coffee, moneybag, pen, contract, placard with `holdText`). `Crowd2` generates a seeded crowd
(`count`, `seed`, `costumes`, `era`, `colours`, `poses`, `rows`). No likeness of real people: identity comes from a
NameCard and typography only. Full prop list: `docs/library/characters.md`; preview: `preview-characters.mp4`.

## Effects, looks and transitions
All overlays are code (SVG filters, seeded particles): no stock footage, nothing to license. Catalogue with params:
`docs/library/effects.md`; previews: `preview-effects.mp4` and `preview-transitions.mp4`.
- **Effects** (`scenes[].effects`, or globally via `spec.look`): film-grain, old-film, vignette, light-leaks, vhs,
  glitch, chromatic-aberration, ink-bleed, paper-texture, camera-shake, gate-weave, depth-of-field, zoom-blur.
  Each takes `{id, intensity 0-3, params}`; intensity 0 switches a look effect off for one scene.
- **Particles** (same field): confetti, dust, smoke, rain, snow, embers (+ fire), sparkles, money-rain,
  paper-scraps. Seeded, so every render is identical.
- **Looks** (`spec.look`): clean, archival, newsreel, documentary, cinematic, vhs, glitchy, print, handmade, dreamy,
  winter, rainy, celebration, smoky (presets of the effects above).
- **Transitions** (`spec.transition` default, `scenes[].transition` into one scene; string or
  `{id, durationSec, params}`): paper-slide (house default), cut, fade, push, page-curl, whip-pan, iris-in, iris-out,
  wipe-left/right/up/down, diagonal-wipe, clock-wipe, barn-door, ink-splash, stamp-cut, film-burn, glitch-cut,
  zoom-through, flash.
- **Parallax rig** (`scene.motion` on illustration scenes): parallax, parallax-left/right/up/down, parallax-dolly,
  parallax-orbit; each layer moves by its `depth`.

## Infographics (scene kind `infographic`)
17 types. 14 animated data graphics: bar-race, line-annotated, pie, donut, stacked-area, ranking, ticker (odometer),
percent-ring, bubble, comparison-table, calendar-heatmap, map-choropleth (Natural Earth, public domain), money-stacks
and what-could-buy. `visual = {type, title?, unit?, sourceId, data}`; every data type needs a `sourceId` and shows
"Source: ...". Plus 3 diagrams without `sourceId`: `org-chart`, `family-tree` and `flow` (steps with box / decision /
start / end shapes; without `links` the steps are chained in order). Data per type and how to add one:
`docs/library/infographics.md`; preview: `preview-infographics.mp4`.

## Typography
- Scene kind `kinetic-text`: `{preset, text | lines, accent?, background?, colour?, accentColour?, sourceId?}` with
  11 presets: typewriter, word-pop, highlighter-marker, strike-then-correct, stamp-text, neon-flicker,
  handwritten-reveal, newspaper-spin, split-flap, scrolling-ticker, quote-card.
- `scenes[].lowerThird` on any scene: `{style, title, subtitle?, atSec?, durationSec?}`.
- Scene kind `chapter`: `{number, title}` chapter card.
- `spec.captionStyle` picks the burned-in Shorts caption style: `bold-pop`, `karaoke-highlight`, `boxed`, `minimal`;
  default = the theme's own style.

Everything follows the active theme. Catalogue: `docs/library/typography.md`; preview: `preview-typography.mp4`.

## Scene templates (scene kind `template`)
12 ready-made, era-aware scenes built from the illustration library: boardroom-meeting, phone-call-split-screen,
signing-ceremony, rejection-letter, factory-floor, stock-market-crash, store-opening-queue, garage-startup,
press-conference, courtroom, ship-departure, city-at-night-thinking. `visual = {template, era?, labels?, colours?,
props?: {background?, layers?, overlays?}}`; the era (11 era kits) swaps backdrop, costumes and props. Example and
slots per template: `docs/library/templates.md`; preview: `preview-templates.mp4`.

## Sound library
- **Procedural**: 52 sound effects synthesised with numpy/ffmpeg (office, money, transitions, UI, impacts, crowd,
  tech, ambience, transport, cartoon, music), CC0 by construction, loudness-normalised (`pipeline/sfxlib.py`).
- **Recorded**: 17 CC0 / public-domain field recordings from Wikimedia Commons, listed in
  `brand/sfx/manifest.csv` (file, url, source page, licence, author, attribution). `pipeline/fetch_sfx.py`
  downloads them in CI and verifies every licence via the MediaWiki API (extmetadata); anything that is not CC0 /
  Public Domain is rejected and logged (`recorded sfx: N accepted`).
- Catalogue and usage in specs (`scenes[].sfx`, `scenes[].sfxCues`): `docs/library/sound.md`,
  `docs/library/sound-usage.md`; listen to everything in `sound-board.mp4`, download it as `sfx-library.zip`.

## Mood shots (scene kind `shot`)
28 short animated beats (2-5 s) that set an emotion between story scenes, in five moods: funny (9), sad (6),
tension (5), triumph (5), mystery (3). Example:
`{"kind": "shot", "visual": {"shot": "Tumbleweed", "props": {"text": "GRAND OPENING"}, "label": "Opening day"}}`.
Catalogue with props per shot and how to add one: `docs/library/moods.md`; preview: `preview-moods.mp4`.

## Thumbnail rules
1280x720. Dark left half: `thumbnail.bigText` (max 16 chars, IBM Plex Mono) + a 3-5 word `headline` + the verdict
(ink signature for SIGNED, orange stamp for PASSED); `thumbnail.illustration` (a library component) on the right.
No faces, no logos, company names as typography only.

## Scene kinds (spec.scenes[].kind)
| kind | visual |
|---|---|
| `title` | `{title, subtitle?}` |
| `illustration` | `{background, layers[]}` (see below) |
| `evidence` | `{assetId, caption}` public-domain image in a file frame, Ken Burns |
| `chart` | `{type: bar\|line, series[{label,value}], unit, sourceId}`; `line` draws itself with a moving value label |
| `counter` | `{from, to, unit, sourceId, style?: plain\|money, label?}`; `money` piles up banknotes |
| `infographic` | `{type, title?, unit?, sourceId, data}` (see Infographics) |
| `timeline` | `{events[{date,label}]}` |
| `map` | WorldZoom v2: `{focus (ISO3), focusLabel, zoomTo: country\|city\|none, city{name,lat,lon}, highlight[], globe, pins[], arrows[{from,to}]}` - globe spin, zoom to country/city, great-circle arrows |
| `city` | `{era: 1900s\|1950s\|modern, density: low\|medium\|high, label?, night?}` - skyline builds itself |
| `versus` | `{left{label,value,unit,colour,component,props}, right{...}, unit?, sourceId?}` - split screen, scores count, loser dims |
| `growth` | `{from, to, unit?, label?, sourceId?}` - shop pins multiply across a land mass |
| `split-flap` | `{rows[] (max 5 x 18 chars), accentRow?}` - departure board for dates and amounts |
| `document` | `{title, lines[], verdict: SIGNED\|PASSED, party?, signature?}` - contract writes itself, then signed or stamped |
| `photo-wall` | `{cards[{label, component?, props?}], links?[[i,j]]}` - evidence cards with red string |
| `shot` | `{shot, props?, label?}` - mood shot (see Mood shots) |
| `kinetic-text` | `{preset, text\|lines, accent?, ...}` - animated typography (see Typography) |
| `chapter` | `{number, title}` - chapter card |
| `template` | `{template, era?, labels?, colours?, props?}` - staged scene (see Scene templates) |
| `quote` | `{text, speaker, sourceId, status: verified\|disputed}` |
| `question` | `{question, options: [SIGN, PASS], holdSec}` - freeze + desaturate + 3-2-1 |
| `reveal`, `lesson` | `{text}` |
| `verdict` | `{verdict}` - SIGNED signature (pen sfx) or PASSED stamp (stamp sfx) |

Every chart, counter, infographic, versus, growth and quote shows "Source: <title>" in IBM Plex Mono when `sourceId`
is set. Every scene also accepts `transition`, `effects`, `motion`, `sfx`, `sfxCues`, `minDurationSec`, `dateTag`,
`lowerThird`, `voiceSpeed`, `beats`, `autoBeats`, `coldOpen` and `musicEnergy`.

### Illustration layers and motion
Layer: `{component, props: {colour, label, pose, ...}, x, y (percent, centre), scale, enter, delaySec, depth?}`;
`enter` = pop | fade | slide-up | slide-down | slide-left | slide-right | drop | none.
`scene.motion` = `push-in` | `pull-out` | `pan` | `pan-left` | `pan-right` | `parallax` (+ variants, see Effects), or
`{type, strength (0-3)}`. `parallax` (illustration scenes) moves each layer by its `depth` (0 = far, 1 = foreground;
default by layer order).

### Components (render/src/illustrations)
Every component has an entrance animation (via `enter`) and small idle animations. Colours: brand names
(`ink`, `stamp`, `board`, `paper`, `grey`, `greyLight`) or hex.
- Office: Desk, Contract, FountainPen, Stamp, DecisionChair, Phone, Newspaper, SpinningNewspaper, Briefcase
- People: Person (`pose` standing, sitting, arms-crossed, pointing, handshake; `flip`), Character (see Characters),
  NameCard, Crowd (`highlight`), Crowd2, Queue
- Places: Building (`type` office, factory, store), Factory (conveyor + smoke), StoreFront (door opens), Warehouse,
  Bank, CrumblingBuilding, AssemblyLine (`colour` = paint)
- Transport: Ship (VOC era), ContainerShip, Train, Truck, Airplane (`from`, `to`), Rocket (`launch: true`)
- Tech & culture: Computer (types `label`), Laptop, Smartphone (notification `label`), FloppyDisk, VHSTape, DVD,
  FilmCamera, DigitalCamera, OldTelephone (rings), Guitar, VinylRecord, Sneaker, Basketball, Microphone
- Money: MoneyStack, MoneyBag, CoinRain, PriceTag, StockBoard (`rows[{label,value}]`), ShareCertificate
  (`label`, `shares`, `number`), FallingChart (`direction` down\|up)
- Symbols & time: Arrow, Spotlight, Handshake (`leftColour`, `rightColour`), Gavel, Lightbulb, Envelope, Telegram
  (`label` = message), Scales (`tilt`, `left`, `right`), MagnifyingGlass, LockKey (`locked`), Trophy, Clock, Calendar,
  FlipCalendar (`pages[]`, `label` = month), Hourglass (`seconds`)
- Backdrops: CityBackdrop, OfficeBackdrop, BoardroomBackdrop (+ the era backdrops above)

## Retention: beats, keywords, pace (docs/library/retention.md)
Something changes on screen every 2-3 s: `scenes[].beats` (punch-in/out, shake, whip, flash, kinetic text, pop-in
illustration, counter, swap of the visual) at a second or at a spoken word; scenes without beats get subtle **auto
camera beats** every 2.5 s (`autoBeats: false` turns them off). `**word**` in a narration = emphasis: shown as a big
kinetic keyword on the word. `spec.captions.long` = `keywords` (default: emphasis + numbers, amounts and years as big
text) | `full` (word-by-word captions) | `off`. Beats get automatic sounds under the voice (`spec.sfxDensity`
low|mid|high, default mid). **Cold open**: `scenes[].coldOpen` (true or `{style, label, rampSec, desaturate, flash}`)
turns the first scene(s) into a flash-forward (speed-ramp, desaturated, flash frame + whoosh); the brand sting then
follows the hook.
**Sound dynamics**: `scenes[].musicEnergy` (low | mid | high | drop | stop, sticky) re-arranges the generated music
per act (layers in/out, filter sweeps, drop + slam back in; library tracks follow a gain curve). Automatic (`spec.sound
{autoRisers, revealPauseSec, verdictImpact}`): a 2 s riser into every question and into the reveal, 0.6 s of total
silence right before the reveal, an impact on the verdict.

## Timing
Scene durations come from the synthesized audio (`timing.json`), never from guesses: lead-in 0.2 s (first scene
0.3 s), 0.25 s between sentences, 0.15 s tail (0.35 s between scenes); question scenes add `holdSec` (3-2-1
countdown); the scene before the reveal holds 0.6 s longer (silence before the reveal, `spec.sound.revealPauseSec`);
verdict scenes last at least 2.8 s; `minDurationSec` extends a scene (use it for map, city, growth,
photo-wall, document and infographic scenes). Each new scene slides in like a sheet of paper (12 frames) unless a
`transition` is set. `[pause 0.6]` (or `[PAUSE]` = 0.5 s) adds a deliberate pause.

## QA (render-report.json)
Duration (long 8-12 min, short 45-60 s; `0000-*` test productions are exempt), resolution, audio present,
loudness -14 LUFS +/-1, true peak <= -1 dBTP (0.3 dB codec tolerance), no dead air (silence below -50 dBFS:
longest < 4 s, total < 5%), audio/video length match, thumbnail size, captions, all sourceIds resolve, question +
verdict scenes, >= 3 chapters, synthetic-voice disclosure.

## YouTube upload setup (once)
Add repository secrets `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN` (OAuth client of a Google Cloud project
with the YouTube Data API v3 enabled; scopes `youtube.upload` and `youtube.force-ssl`). Custom thumbnails require a
phone-verified channel.

## Music
`spec.music = {mood, era, source, track?, stingers}`. Default source `auto`: a library track with that mood if one exists,
otherwise a bed **generated** by `pipeline/musicgen.py` (numpy oscillators, fixed seed `<slug>:<cut>`, no samples:
CC0 by construction, cannot match Content ID, no credit needed). 8 moods (tense, curious, triumphant, somber, playful,
epic, mysterious, upbeat) x 6 era flavours (modern, baroque, jazz-age, fifties, eighties, future); stingers at
question and verdict scenes. Library tracks: `brand/music/licenses.csv`
(`file,url,title,artist,source,license,attribution_text,mood`), only CC0 / Public Domain; credits go into the
description automatically. `source: library` (or `track: <file or title>`) can also pick one of the verified CC0 / PD
recordings of `brand/music/manifest.csv`. `source: none` renders without music. Catalogue: `docs/library/music.md`; listen in
`music-board.mp4`.

## Voices
`spec.voice = {engine, voice, speaker?, speed?}`. Engines: `kokoro` (default, Apache-2.0, English + es/fr/hi/it/pt)
and `piper` (installed on first use; only voices in `brand/voices.json` whose training data is CC0 / PD / CC BY, e.g.
`nl_BE-rdh-medium`, `nl_NL-alex-medium`, `nl_NL-mls-medium`, `en_US-ljspeech-high`; CC BY voices are credited in the
description). `[pause 0.5]` in a narration inserts 0.5 s of silence (`[PAUSE]` = 0.5 s; not spoken, not in
captions); `**word**` marks an emphasised word (see Retention); `scenes[].voiceSpeed` (0.5-2.0) overrides the speed
for one scene. Catalogue and licence rule: `docs/library/voices.md`; listen in `voice-samples.mp4`.

## Local use
`make install`, `make render SLUG=0000-sample`, `make studio` (Remotion Studio with the Preview composition).
