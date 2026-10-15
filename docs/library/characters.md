# Characters

The animated, faceless character rig (`render/src/characters`). House style: flat silhouette, 3px outlines, brand
colours only, **no faces, no likeness of real people, no logos**. Real people are shown as a silhouette + NameCard.

Preview: `preview-characters.mp4` in the `library` release (every pose, costume, hat, held prop, Crowd2 examples).

## Character (illustration layer component)

```json
{"component": "Character", "x": 30, "y": 60, "scale": 1.2,
 "props": {"pose": "talk", "costume": "fifties", "colour": "ink", "hat": "auto", "hold": "briefcase",
           "label": "THE FOUNDER", "flip": false, "speed": 1, "phase": 0}}
```

| prop | values |
|---|---|
| pose | stand, walk, run, sit, type, point, shrug, facepalm, celebrate, slump, arms-crossed, handshake, applause, thinking, shock, wave, talk, phone, protest (aliases: standing, sitting, typing, pointing, jump, sad, clap, think, surprised, on-phone, call, sign, hold-sign) |
| costume | see below, or an era alias |
| era | era alias used when costume is empty (ancient, medieval, golden-age, industrial, deco, diner, neon, cubicle, open-plan, modern, future ...) |
| hat | `auto` (default: the costume's hat), `none`, or a hat id |
| hold / holdLeft | briefcase, phone, smartphone, newspaper, coffee, moneybag, pen, contract, placard, none |
| holdText | text on the placard (stays readable when flipped) |
| colour | ink, stamp, board, grey, greyLight, paper or hex |
| flip | mirror (use for the second person of a handshake / conversation) |
| speed / phase | animation speed (0 = frozen) and time offset in seconds |
| blendSec | blend from standing into the pose at the start (default 0.4) |
| joints | advanced: explicit joint angles (see Rig.tsx) |

Walk and run cycles play in place: move the layer (or use camera motion) for travel.

## Costumes

| id | look | default hat | era aliases |
|---|---|---|---|
| plain | plain house silhouette | - | |
| suit | shirt collar + tie | - | modern-office, cubicle, 1990s, business |
| toga | toga over one shoulder | laurel | ancient, antiquity, roman, rome, greek, egypt |
| tunic | belted medieval tunic, laced neck | medieval-cap | medieval, middle-ages, 1300s, 1400s |
| merchant | ruff collar, doublet, breeches | capotain | golden-age, 1600s, 17th-century, renaissance, voc |
| victorian | suit + watch chain | top-hat | industrial, victorian, 1800s, 1850s, 1890s, 1900s, gilded-age |
| twenties | bow tie, vest buttons | boater | deco, 1920s, 1930s, roaring-20s, art-deco |
| fifties | skinny tie, pocket square | fedora | diner, 1950s, 1960s, mid-century |
| dress | 1950s polka-dot dress | - | 1950s-dress, retro, housewife |
| eighties | power suit, shoulder pads, wide tie | - | neon, 1980s, 80s, wall-street |
| casual | polo shirt | - | 2000s, open-plan, dotcom, casual |
| hoodie | hood, kangaroo pocket, drawstrings | - | modern, 2010s, 2020s, startup, tech |
| future | high collar, accent stripe, badge | - | future, near-future, future-skyline, 2030s, sci-fi |
| worker | overalls bib | hard-hat | factory, industry, construction, worker |
| labcoat | open white coat | - | lab, science, pharma, research |
| royal | cape, ermine collar | crown | royal, king, queen, empire, monarchy |
| trenchcoat | belted trench coat | fedora | noir, detective, spy, 1940s, wartime |

## Hats

top-hat, bowler, fedora, boater, flat-cap, baseball-cap, hard-hat, crown, laurel, capotain, medieval-cap, beret,
cowboy, headphones (aliases: tophat, derby, newsboy, cap, helmet, wreath, chaperon, puritan).

## Crowd2 (illustration layer component, 1200x520)

A seeded crowd of animated Characters: the same seed always gives the same crowd.

```json
{"component": "Crowd2", "x": 50, "y": 70,
 "props": {"count": 12, "seed": 4, "costumes": ["tunic", "merchant"], "colours": ["ink", "stamp", "grey"],
           "poses": ["talk", "applause"], "rows": 2, "animate": true, "label": "MARKET DAY"}}
```

count 1-24 (default 8), seed, costumes (ids or era aliases, array or comma separated; default suit/casual/plain),
era (used when costumes is empty), colours, poses, rows 1-3 (default 2 when count > 6), animate (false = frozen),
label. Back rows are smaller (depth). The older `Crowd` component (static silhouettes) still exists.

## Adding a costume / hat / prop

`render/src/characters/Costumes.tsx`: add an entry to COSTUMES (painters `behind`, `torso`, `headBack` get the rig
geometry), HATS (head-local coordinates, head radius 36) or HOLDS + a case in HeldProp. Then add the id to this
file and the schema description. CharacterPreview picks new ids up automatically.
