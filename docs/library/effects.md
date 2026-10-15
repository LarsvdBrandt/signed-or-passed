# Effects library: effects, particles, transitions, parallax

Code: `render/src/effects/` (registry `EFFECTS` in `index.tsx`, wrappers in `wrappers.tsx`, overlays in `overlays.tsx`,
particles in `particles.tsx`) and `render/src/transitions/` (registry `TRANSITIONS` in `index.tsx`, components in
`library.tsx`, parallax rig in `parallax.tsx`).
Everything is self-made code (SVG, CSS, seeded randomness): no external files, no licences needed.
Everything is deterministic (seeded by scene id + effect id), so re-renders are identical.

Previews in the release `sample`: `preview-effects.mp4` (every effect, particle, paper variant and look) and
`preview-transitions.mp4` (every transition A -> B, param variants, every parallax move).

## Using effects

Per scene:

```json
{"id": "s3", "kind": "illustration", "effects": ["film-grain", {"id": "camera-shake", "intensity": 1.5, "params": {"durSec": 0.6}}], ...}
```

For the whole video (`spec.look`): a preset name, an array of effects, or `{preset, effects}`:

```json
"look": "archival"
"look": {"preset": "cinematic", "effects": [{"id": "light-leaks", "intensity": 0}]}
```

Scene effects are merged over the look (same id = override, params merged); `{"id": "vignette", "intensity": 0}`
switches a look effect off for one scene. `intensity` is 0-3 (default 1). The default house style uses no look.
Effects sit inside the paper sheet, so transitions still work; the date tag, watermark and captions are not affected.

## Effects

| id | kind | what | params |
|---|---|---|---|
| film-grain | overlay | animated photographic grain | size fine/coarse, animated |
| old-film | wrap + overlay | sepia/mono grade, gate weave, frame jumps, flicker, scratches, dust, hairs, burnt edges | sepia 0-1, mono |
| vignette | overlay | dark edges (flat blurred inner shadow) | colour |
| light-leaks | overlay | flat brand-coloured blurred shapes drifting at the edges (screen) | colours[], speed |
| vhs | wrap + overlay | soft + saturated, RGB split, tracking slips, scanlines, rolling tracking band, PLAY / SP counter OSD | osd, label, counterStartSec, trackingSpeed |
| glitch | wrap | slices jump sideways with a strong RGB split on random frames | rate (0.12) |
| chromatic-aberration | wrap | red / blue channel offset | offsetPx (4), pulse |
| ink-bleed | wrap | boiling, spreading ink lines | boil, spread |
| paper-texture | overlay | paper surface | variant grain / fibre / crumpled / newsprint / kraft / watercolour |
| camera-shake | wrap | hand-held or impact shake | freq (6), startSec, durSec, decay |
| gate-weave | wrap | slow film-gate wobble | freq (1.6) |
| depth-of-field | wrap | soft focus or rack focus | blurPx (6), rack none/in/out, rackSec (1) |
| zoom-blur | wrap | radial ghost burst | at start/end/always, burstSec (0.6), copies (3), cx, cy |

## Particles (overlays)

Common params: `density` (count multiplier, default 1), `speed` (multiplier, default 1), `colour` or `colours[]`
(brand colour names or hex). `intensity` scales the count (and opacity for soft particles).

| id | what | extra params |
|---|---|---|
| confetti | brand-coloured confetti, flipping and swaying; loops | burst (true = one shower from the scene start) |
| dust | floating, twinkling dust motes | - |
| smoke | soft flat smoke puffs rising from the bottom | x (origin 0-100; default spread over the width) |
| rain | slanted rain streaks | slant (0.2) |
| snow | outlined paper snowflakes drifting down | - |
| embers | rising, flickering sparks | fire (true = flat flames with outline along the bottom) |
| sparkles | 4-point stars popping up at random places | - |
| money-rain | fluttering banknotes with a currency mark | symbol ("$", "€", "£" ...) |
| paper-scraps | torn paper scraps blowing across | wind (0.18 screens/s) |

## Looks (spec.look)

| id | effects |
|---|---|
| clean | none |
| archival | old-film, film-grain 0.8 |
| newsreel | old-film 1.2 mono, coarse film-grain, vignette 1.2 |
| documentary | film-grain 0.5, vignette 0.6, gate-weave 0.4 |
| cinematic | film-grain 0.6, vignette 0.8, light-leaks 0.5 |
| vhs | vhs |
| glitchy | glitch, chromatic-aberration 0.5 |
| print | paper-texture newsprint |
| handmade | paper-texture crumpled, ink-bleed 0.6 |
| dreamy | light-leaks, vignette 0.5, depth-of-field 0.25 |
| winter | snow 0.8, vignette 0.4 |
| rainy | rain, vignette 0.6 |
| celebration | confetti, light-leaks 0.5 |
| smoky | smoke 0.8, vignette 0.6, film-grain 0.4 |

## Transitions

A transition plays at the START of a scene: the new scene is drawn over the tail of the previous one (the previous
scene stays on screen for exactly the transition length). Set a default for the whole video with `spec.transition`
and override per scene with `scenes[].transition`:

```json
"transition": "paper-slide",
"scenes": [ ..., {"id": "s7", "transition": {"id": "iris-out", "durationSec": 1.0, "params": {"cx": 40, "cy": 45}}, ...} ]
```

Form: an id, or `{id, durationSec (0.03-2), params}`. Without anything the house paper-slide (0.4 s) is used, exactly
as before. Transitions marked "out" also move the outgoing scene.

| id | default | what | params |
|---|---|---|---|
| paper-slide | 0.4 s | house style: a new paper sheet slides over the old one | from right/left/up/down |
| cut | 1 frame | hard cut | - |
| fade | 0.5 s | cross-fade | - |
| push | 0.5 s | the new scene pushes the old one out (out) | from |
| page-curl | 0.6 s | the new page swings in around its left edge with a shadow | - |
| whip-pan | 0.35 s | fast motion-blurred pan with speed streaks (out) | from |
| iris-in | 0.6 s | circle opens on the new scene, with a ring | cx, cy (percent), colour |
| iris-out | 0.9 s | cartoon iris: closes to black, opens on the new scene | cx, cy, colour |
| wipe-left / wipe-right / wipe-up / wipe-down | 0.5 s | straight wipe with an ink edge | colour, edge (true) |
| diagonal-wipe | 0.6 s | wipe from the top-left corner | - |
| clock-wipe | 0.7 s | radial sweep like a clock hand | - |
| barn-door | 0.5 s | opens from the centre line | vertical (false) |
| ink-splash | 0.7 s | revealed through a growing ink blot with an ink rim and drops | cx, cy, colour |
| stamp-cut | 0.6 s | a stamp slams down (scale 1.7 -> 1, -8 deg, shake); the cut happens under the impact | text, colour |
| film-burn | 0.8 s | flat orange burn holes with a paper core and a flash | - |
| glitch-cut | 0.4 s | the new scene arrives in jittering bands with colour bars | - |
| zoom-through | 0.5 s | the old scene zooms past, the new one zooms in (out) | - |
| flash | 0.4 s | flash to paper (or a colour) and back | colour |

Tip: pair transitions with sounds via `sfx` on the scene (`whoosh` for whip-pan / push, `stamp` for stamp-cut).

## Parallax rig

Illustration scenes: set `motion` to a parallax move; each layer moves by its `depth` (0 = far, 1 = near; default by
layer order) and the backdrop gets overscan so no edges show.

| motion | camera |
|---|---|
| parallax / parallax-right | trucks right (layers slide left) |
| parallax-left | trucks left |
| parallax-up / parallax-down | cranes up / down |
| parallax-dolly | dollies in: near layers grow faster than far ones |
| parallax-orbit | small arc around the subject |

```json
{"kind": "illustration", "motion": {"type": "parallax-dolly", "strength": 1.5},
 "visual": {"background": "CityBackdrop", "layers": [{"component": "Bank", "depth": 0.2}, {"component": "Character", "depth": 0.9}]}}
```

For templates and custom compositions: `<ParallaxRig move="parallax-dolly" strength={1} layers={[{depth: 0, backdrop: true, node: <CityBackdrop />}, {depth: 0.8, node: ...}]} />`
(`render/src/transitions/parallax.tsx`).

## Performance

Wrappers that copy the scene (zoom-blur during its burst, glitch / vhs on glitch frames) render the scene content
more than once on those frames only. SVG-filter effects (chromatic-aberration, glitch, vhs, ink-bleed) and the blur
of smoke cost the most; use them on single scenes or as a look for short videos. Particles are plain SVG shapes
(counts 16-110 at intensity 1) and cheap. Transitions only cost extra during their few frames (whip-pan blurs the
whole frame for ~10 frames).
