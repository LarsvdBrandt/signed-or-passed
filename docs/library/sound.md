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

## Adding a sound
Write a function `s_<name>()` in `pipeline/sfxlib.py` that returns a numpy array at `SR` and register it in `SOUNDS`
with a category and description. Keep it deterministic (fixed seeds). Use `mix()` when adding arrays of different
lengths and `place()` to position events in time.
