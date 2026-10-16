# Sound library

All sound effects are **synthesised from scratch** by `pipeline/sfxlib.py` (numpy oscillators and noise, fixed
seeds, deterministic). No recordings, no samples, no third-party material: the output is **CC0** and safe for
monetised YouTube (no Content ID risk).

- 48 kHz mono WAV, loudness-normalised to about -18 dBFS active RMS, peaks at or below -1 dBFS.
- `python pipeline/sfxlib.py --list` prints the catalogue; `--out build/sfx-lib` writes `wav/<name>.wav` + `catalogue.json`.
- `python pipeline/soundboard.py` also builds the sound board (`soundboard.wav` + Remotion props) and `sfx-library.zip`.
- The library workflow (`.github/workflows/library.yml`) publishes `sound-board.mp4` (every sound in a row with its
  name) and `sfx-library.zip` in the release `library`.

## Catalogue (52 sounds)
| category | sounds |
|---|---|
| office | pen_scribble, stamp_thud, paper_rustle, page_flip, typewriter_keys, typewriter_bell |
| money | cash_register, coin_drop |
| transition | whoosh_soft, whoosh_fast, whoosh_long, swoosh_up, swoosh_down |
| ui | pop, click, notification_ding, ui_success, error_buzz, countdown_beep |
| impact | riser, impact_boom, reveal_stinger, tension_drone |
| body | heartbeat |
| crowd | crowd_gasp, crowd_murmur, applause |
| time | clock_tick |
| tech | phone_ring_old, phone_ring_new, keyboard_typing, modem_dialup, camera_shutter, glitch |
| ambience | rain, wind, crickets, factory_hum |
| mechanical | door_creak, footsteps |
| transport | ship_horn, train_chug, train_whistle |
| cartoon | cartoon_bonk, boing, slide_whistle_up, slide_whistle_down, record_scratch, sad_trombone, sparkle |
| music | drum_roll, cymbal_crash |

## Production use
The four house sounds (`pen`, `stamp`, `paper`, `whoosh`) are made by `pipeline/sfx.py`; `scenes[].sfx` and
`scenes[].sfxCues` can also name any library sound above (see `docs/library/sound-usage.md`).

## Mix (MIX-1, channel default since 2026-10-16) {#mix}
"Voice is king" (Lars, after Blockbuster v6 / Nike v3: sfx good but too loud, music too loud). `pipeline/mix.py` builds
every cut from three stems and `pipeline/mixlevels.py` sets their levels **relative to the voice**, so the ratios
survive the final -14 LUFS loudnorm:

| stem | default | in a -14 LUFS mix |
|---|---|---|
| voice | untouched | about -14 LUFS |
| music, open (section pauses, intro, after the verdict) | voice - 10 dB | about -24 LUFS short-term |
| music under the voice | open - 8 dB (`mix.duckDb`), 150 ms look-ahead attack, 600 ms release, voice gaps < 0.8 s bridged | about -32 LUFS short-term |
| music integrated | closed loop to voice - 16 dB (`mix.voiceToMusicDb`) | about -30 LUFS |
| sfx | momentary max <= voice - 12 dB (`mix.sfxBelowVoiceDb`), transients (whoosh, pop, click, tick, shutter, paper ...) 4 dB lower, accents (impact_boom, stamp, pen) <= voice - 10 dB, never above the old level - 7 dB; the stem is ducked 3 dB under the voice | -30 LUFS integrated |
| stingers | musicgen stingers only with `music.style: classic` (the underscore plays its own hits), on the music stem at the open music level | |

**Thinning**: at most `mix.sfxPerMin` (7) sounds in any 60 s window and >= 1.2 s apart. The best ones win:
brand sting / end card (always kept) > verdict > reveal > question > risers > cold open > sfxCues > numbers
(counter, keyword-number) > scene sfx > section whooshes > other beats > punch-in / punch-out / swap / whip (last).
Measured on Blockbuster (local build, before -> after): voice-to-music 6.7 -> 16.0 dB, voice-to-sfx (integrated)
-1.6 -> 17.9 dB, sfx/min ~15 -> <= 7. CI sample (run 38876167431): voice-to-music 16.0 dB, voice-to-sfx 12.1 dB
short-term, 6.5 sfx/min (25 of 43 candidates thinned), -14.2 LUFS, -2.7 dBTP.

`build/<slug>/<cut>/mix-report.json` (copied to `render-report.json` `mix`) holds per stem the integrated LUFS at the
final scale, `voiceToMusicDb`, `voiceToSfxDb`, `voiceToSfxShortTermDb` / `MomentaryDb`, the music level under the
voice and in pauses, sfx count / candidates / thinned. QA fails below voice-to-music 14 dB (integrated) or
voice-to-sfx 10 dB (short-term) and warns above 8 sfx/min. The final stems (`stem-music.wav`, `stem-sfx.wav`) stay in the
build folder. Overrides per production: `spec.mix = {voiceToMusicDb, duckDb, sfxBelowVoiceDb, sfxPerMin}`.
Directors: place sfx only on real beats (numbers, reveal, verdict, section transitions); extra cues are thinned anyway.

## Adding a sound
Write a function `s_<name>()` in `pipeline/sfxlib.py` that returns a numpy array at `SR` and register it in `SOUNDS`
with a category and description. Keep it deterministic (fixed seeds). Use `mix()` when adding arrays of different
lengths and `place()` to position events in time.
