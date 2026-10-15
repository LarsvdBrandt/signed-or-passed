# Signed or Passed: video factory

Turns `productions/<slug>/spec.json` into a finished YouTube video (MP4 + Shorts + thumbnail + captions + metadata)
on free GitHub-hosted runners. Everything is open source: **Remotion** (React video), **Kokoro** TTS (voice
`bm_george`, default speed 1.1), **ffmpeg** (sound effects, mix, loudness). No paid APIs, no API keys.

## How it works
1. Another agent (or you) commits `productions/<slug>/spec.json` (contract: `schema/spec.schema.json`, v1).
2. `.github/workflows/render.yml` starts automatically and runs, per production:
   `validate_spec` > `fetch_assets` (fonts + images, Wikimedia licences verified) > `tts` (one clip per sentence,
   `timing.json`) > `captions` > `sfx` > `mix` (music bed with ducking, -14 LUFS / -1 dBTP) > `build_props` >
   `remotion render` (LongVideo / ShortVideo, muted) > ffmpeg mux > `remotion still` (Thumbnail) > `metadata` > `qa`.
3. The results are published as a **GitHub Release** with tag = slug (`sample` for the test production):
   `video.mp4`, `short-*.mp4`, `thumbnail.png`, `captions.srt`, `short-*.srt`, `metadata.json`, `render-report.json`.
   The test production also ships the library previews:
   - **`preview.mp4`**: contact sheets of the whole illustration library + a demo of every scene kind and brand component (silent)
   - **`preview-themes.mp4`**: the same mini-story in every theme, each followed by a contact sheet of every component in that theme (silent)
   - **`preview-eras.mp4`**: every era pack: backdrop, all props and a small composed scene (silent)
   - **`preview-characters.mp4`**: the character rig: poses, costumes, hats, held props and Crowd2 (silent)
   - **`preview-moods.mp4`**: every mood shot with its id and mood (silent)
   - **`sound-board.mp4`**: every sound of the sound library, with its name and category (with audio)
   - **`sfx-library.zip`**: all sound-effect WAVs + `catalogue.json` + licence information
4. The workflow always commits `ci/last-run.json`, `ci/last-run.log` and `productions/<slug>/render-report.json`
   (via `ci/push-results.sh`: a plumbing commit on top of the current `main`, so concurrent pushes never conflict).
5. Uploading to YouTube is **manual**: Actions > `upload` > Run workflow (slug, privacy, optional publishAt).

## Re-render
- Edit and push a spec, or
- Actions > `render` > Run workflow with a slug, or
- change `ci/trigger.txt` to re-render the test production `0000-sample`.

## Repo layout
| Path | What |
|---|---|
| `brand/` | palette, fonts (URLs, OFL), music licences (`licenses.csv`), recorded sound manifest (`sfx/manifest.csv`) |
| `schema/spec.schema.json` | JSON Schema of spec.json v1 |
| `productions/<slug>/` | `spec.json` (input) and `render-report.json` (output) |
| `pipeline/` | Python 3.11 scripts (see above) + `upload.py`; `sfxlib.py`, `fetch_sfx.py` + `soundboard.py` = sound library |
| `render/` | Remotion 4 project: compositions `LongVideo` 1920x1080, `ShortVideo` 1080x1920, `Thumbnail` 1280x720, `Preview`, `ThemePreview`, `EraPreview`, `CharacterPreview`, `MoodPreview`, `SoundBoard` |
| `render/src/components/brand.tsx` | brand intro sting, end card, watermark, logo lockup, title card |
| `render/src/illustrations/` | the house-style illustration library (flat SVG, 3px outlines, faceless people) |
| `render/src/characters/` | the character rig: poses, era costumes, hats, held props, Crowd2 |
| `render/src/eras/` | era packs (backdrop + props per period, see Eras) |
| `render/src/moods/` | mood shots (scene kind `shot`, see Mood shots) |
| `render/src/scenes/` | one component per scene kind (`MotionScenes.tsx`: versus, growth, split-flap, document, photo-wall, money counter, line chart) |
| `render/src/themes/` | theme engine and presets (see Themes) |
| `ci/` | step runner, per-production render script, start marker, finalize script, result push, last-run files, trigger |
| `docs/` | privacy policy and terms (for the YouTube API audit); `docs/library/` = library catalogues |

## Brand: intro and outro
Every long video starts with a 3 s logo sting (`BrandIntro`) and ends with a 6 s end card (`EndCard`).
`tts.py` writes `introSec` / `outroSec` into `timing.json`; `build_props.py` turns them into `introFrames` /
`outroFrames`; `mix.py` keeps the voice silent during both. A small watermark sits bottom-right during the story and
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
| `timeline` | `{events[{date,label}]}` |
| `map` | WorldZoom v2: `{focus (ISO3), focusLabel, zoomTo: country\|city\|none, city{name,lat,lon}, highlight[], globe, pins[], arrows[{from,to}]}` - globe spin, zoom to country/city, great-circle arrows |
| `city` | `{era: 1900s\|1950s\|modern, density: low\|medium\|high, label?, night?}` - skyline builds itself |
| `versus` | `{left{label,value,unit,colour,component,props}, right{...}, unit?, sourceId?}` - split screen, scores count, loser dims |
| `growth` | `{from, to, unit?, label?, sourceId?}` - shop pins multiply across a land mass |
| `split-flap` | `{rows[] (max 5 x 18 chars), accentRow?}` - departure board for dates and amounts |
| `document` | `{title, lines[], verdict: SIGNED\|PASSED, party?, signature?}` - contract writes itself, then signed or stamped |
| `photo-wall` | `{cards[{label, component?, props?}], links?[[i,j]]}` - evidence cards with red string |
| `shot` | `{shot, props?, label?}` - mood shot (see Mood shots) |
| `quote` | `{text, speaker, sourceId, status: verified\|disputed}` |
| `question` | `{question, options: [SIGN, PASS], holdSec}` - freeze + desaturate + 3-2-1 |
| `reveal`, `lesson` | `{text}` |
| `verdict` | `{verdict}` - SIGNED signature (pen sfx) or PASSED stamp (stamp sfx) |

Every chart, counter, versus, growth and quote shows "Source: <title>" in IBM Plex Mono when `sourceId` is set.

### Illustration layers and motion
Layer: `{component, props: {colour, label, pose, ...}, x, y (percent, centre), scale, enter, delaySec, depth?}`;
`enter` = pop | fade | slide-up | slide-down | slide-left | slide-right | drop | none.
`scene.motion` = `push-in` | `pull-out` | `pan` | `pan-left` | `pan-right` | `parallax`, or `{type, strength (0-3)}`.
`parallax` (illustration scenes) moves each layer by its `depth` (0 = far, 1 = foreground; default by layer order).

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

## Timing
Scene durations come from the synthesized audio (`timing.json`), never from guesses: lead-in 0.35 s, 0.25 s between
sentences, 0.45 s tail; question scenes add `holdSec` (3-2-1 countdown); verdict scenes last at least 2.8 s;
`minDurationSec` extends a scene (use it for map, city, growth, photo-wall and document scenes). Each new scene
slides in like a sheet of paper (12 frames).

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
