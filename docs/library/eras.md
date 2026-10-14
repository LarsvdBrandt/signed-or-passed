# Era packs

Code: `render/src/eras/` (registry in `index.ts`, one file per pack). Preview: `preview-eras.mp4` in the
`sample` release (rendered by the `EraPreview` composition: per era the backdrop, a grid of all props and a small
composed scene).

An era pack = a **backdrop** + **props** (illustration components) + hints (example date tag, suggested theme,
music era). Era components are normal illustration components:

```json
{"kind": "illustration", "visual": {"background": "GoldenAgeBackdrop", "layers": [
  {"component": "Fluyt", "props": {"label": "TEST"}, "x": 30, "y": 64},
  {"component": "Ledger", "props": {"label": "ACCOUNTS", "lines": ["100", "250"]}, "x": 72, "y": 62, "delaySec": 0.4}
]}}
```

Rules (same as the core library): flat shapes, Board outlines with the live theme stroke, brand colours only, no
gradients, faceless people, names as typography, never logos, never real rulers, coins, seals, flags or coats of
arms. All components follow the active theme (`spec.theme`).

| era id | years | backdrop | props |
|---|---|---|---|
| `ancient` | 3000 BC - 500 AD | `AncientBackdrop` | ColumnTemple (label = inscription), Pyramid, Galley (label on sail), Chariot, Amphora, Scroll (label = heading, unrolls), Laurel (label in the middle, grows), OilLamp (flickers), AncientCoin (label = 1-4 letters, spins), WaxTablet (stylus writes) |
| `medieval` | 500 - 1500 | `MedievalBackdrop` (castle, waving flags) | CastleGate (label = banner, portcullis rises), MarketStall (label = sign, awning flaps), QuillParchment (label = heading, quill writes), WaxSeal (label = 1-3 letters, pressed), SwordShield (plain chevron), Cart (wheel turns), Lantern (flickers, swings), GuildSign (label = guild name, swings) + core Scales, MoneyBag |
| `golden-age` | 1500 - 1700 | `GoldenAgeBackdrop` (canal houses, windmill, bridge, passing boat) | Fluyt (label on hull band, sails billow), CanalHouse (pose = step / bell / point gable, label = shop sign), Tulip (grows and opens, label = price tag), SpiceSacks (label on the middle sack), Globe (land drifts past), Compass (needle settles), Ledger (label = heading, props.lines = up to 6 figures) + core Warehouse, Scales, ShareCertificate |
| `industrial` | 1850 - 1910 | `CityBackdrop` | core components for now (Factory, Train, Ship, Telegram, OldTelephone, Newspaper, Bank, MoneyStack) |
| `modern` | 2000 - today | `OfficeBackdrop` | core components for now (Smartphone, Laptop, Computer, DigitalCamera, StockBoard, ContainerShip, Airplane, Rocket) |

Planned (factory todo ERAS-3b..6): Industrial pack, Roaring 20s / Depression, 1950s-60s, 1970s-80s, 1990s
dotcom, 2000s, future.

Adding an era: write `render/src/eras/<Era>.tsx` (components read `STROKE` and `C` at render time, never in a
module-level constant; clipPath ids prefixed `era-`), register the components in `ERA_ILLUSTRATIONS`
(+ `ERA_BACKDROPS`), add an `ERA_LIST` entry, and add the component names to the layer `component` enum in
`schema/spec.schema.json`.
