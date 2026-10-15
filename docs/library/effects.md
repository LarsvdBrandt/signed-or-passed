# Effects library

Code: `render/src/effects/` (registry `EFFECTS` in `index.tsx`, wrappers in `wrappers.tsx`, overlays in `overlays.tsx`).
Everything is self-made code (SVG filters, CSS, seeded randomness): no external files, no licences needed.
Effects are deterministic (seeded by scene id + effect id), so re-renders are identical.

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
Effects sit inside the paper sheet, so the paper-slide transition still works; the date tag, watermark and captions
are not affected.

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

## Performance

Wrappers that copy the scene (zoom-blur during its burst, glitch / vhs on glitch frames) render the scene content
more than once on those frames only. SVG-filter effects (chromatic-aberration, glitch, vhs, ink-bleed) cost the most;
use them on single scenes or as a look for short videos.
