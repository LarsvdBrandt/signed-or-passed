# Mood shots (render/src/moods)

A **mood shot** is a short, self-contained animated beat (2-5 s) that sets an emotion between story scenes:
a laugh, a sigh, suspense, a win, a mystery. All shots are self-drawn SVG in the active theme's colours and fonts
(no stock, no AI imagery, faceless figures only), deterministic (same frame = same picture) and loop-safe where noted.

## Use in a spec
```json
{"id": "s7", "kind": "shot", "narration": "Nobody came.",
 "visual": {"shot": "Tumbleweed", "props": {"text": "GRAND OPENING"}, "label": "Opening day"}}
```
- `visual.shot`: one of the ids below (validated by `schema/spec.schema.json`, `$defs.vShot`).
- `visual.props`: free props per shot (table). Colours are brand names (`ink`, `stamp`, `board`, `paper`, `grey`,
  `greyLight`) or hex.
- `visual.label`: optional small caption at the top (IBM Plex Mono).
- The narration decides the real length; the recommended length is a guide. Add `minDurationSec` to hold a shot.
- Sounds are not automatic: add `sfx` / `sfxCues` (see `docs/library/sound-usage.md`); `sfxHint` in
  `render/src/moods/index.ts` suggests one.

## Preview
`MoodPreview` composition -> `preview-moods.mp4` in the `sample` release: every shot with its id and mood.

## Catalogue (28 shots)
| shot | mood | sec | what you see | props |
|---|---|---|---|---|
| CartoonBonk | funny | 2.5 | an anvil or book drops on a head: squash, stars, BONK! | object anvil\|book, text, colour |
| SweatDrop | funny | 3 | trembling faceless head with sliding sweat drops | colour |
| QuestionMarks | funny | 2.5 | head-scratching figure, three wobbling question marks | colour |
| DotsBubble | funny | 3 | typing indicator, optionally replaced by a reply | text, revealSec, colour |
| BananaSlip | funny | 3 | walks in, slips on a peel, lands flat with stars | text (WHOOPS!), colour |
| RecordScratch | funny | 3 | freeze-frame, figure mid-air, caption | text (Yep. That's me.), colour |
| ExaggeratedZoom | funny | 2.5 | two crash-zooms onto a word, speed lines, shake | text, colour |
| Tumbleweed | funny | 4 | empty desert, tumbleweed bounces through | text (signpost) |
| Crickets | funny | 4 | night, empty stage and microphone | text (stage edge) |
| RainCloud | sad | 4 | personal rain cloud over a slumped figure | text, colour (figure) |
| WiltingPlant | sad | 4 | potted flower droops, petals drop | text, colour (pot) |
| ClosedSign | sad | 3.5 | door sign flips OPEN -> CLOSED, lights go out | text (CLOSED), front (OPEN), shop, colour |
| LightsOut | sad | 4.5 | office tower windows go dark one by one | text, colour (last window) |
| EmptyOffice | sad | 4 | spinning chair, flickering light, packed box, dust | text |
| FallingLeaf | sad | 4.5 | a single leaf drifts down and settles | text, colour (leaf) |
| TickingClockCloseUp | tension | 4 | clock at 11:59, second hand ticks to twelve | startSec (50), text, colour |
| HeartbeatLine | tension | 4 | ECG monitor, pulse climbs | bpmFrom (72), bpmTo (150), text, colour |
| InterrogationSpotlight | tension | 4 | swinging lamp over a figure at a table | text (WHERE WERE YOU?), colour |
| SlowPushIn | tension | 5 | push-in on a small figure facing a huge document | text (THE OFFER), colour, figureColour |
| RedAlert | tension | 3 | hazard stripes, beacon, pulsing wash, ALERT | text (ALERT), sub |
| Confetti | triumph | 3 | figure jumps for joy under looping confetti, pop word | text (DEAL!), caption, colour |
| Fireworks | triumph | 4 | night skyline, line-fireworks (loops) | text (caption) |
| RisingRocket | triumph | 4 | rocket climbs an exponential curve, value rides along | text (TO THE MOON), value, colour (curve) |
| TrophyShine | triumph | 3.5 | trophy on a plinth, turning rays, sparkles | text (#1), caption, colour (cup) |
| CheeringCrowd | triumph | 3.5 | two rows of cheering figures, confetti, YES! | text (HOORAY!), caption |
| Fog | mystery | 4.5 | fog banks hide a figure under a street lamp, then thin | text (caption) |
| SilhouetteReveal | mystery | 4 | grey silhouette + ?, flash reveals figure + name card | text (THE BUYER), colour |
| MagnifierSweep | mystery | 4.5 | magnifier sweeps a document, stops on the key words | text (CLAUSE 7), title (AGREEMENT), caption |

## Adding a shot
1. Write a `React.FC<ShotProps>` (`{t, dur, p}`: scene-local seconds, scene length, props) in the mood file,
   drawing on the 1920x1080 `ShotSvg`; reuse `Figure`, `PopText`, `pop`, `snap`, `starPath` (`kit.tsx`) and
   `Floor`, `Caption`, `Cloud` (`parts.tsx`). Use only theme colours from `C`, no gradients, 3px outlines (`STROKE`).
2. Register it in `index.ts` with `reg({...})` (mood, durationSec, bg, description, props, demo).
3. Add the id to `$defs.vShot.properties.shot.enum` in `schema/spec.schema.json` and to this table.
