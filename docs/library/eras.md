# Era packs

Code: `render/src/eras/` (registry in `index.ts`, one file per pack). Preview: `preview-eras.mp4` in the
`sample` release (rendered by the `EraPreview` composition).

An era pack = a **backdrop** + **props** (illustration components) + hints (example date tag, suggested theme,
music era). Era components are normal illustration components:

```json
{"kind": "illustration", "visual": {"background": "AncientBackdrop", "layers": [
  {"component": "Galley", "props": {"label": "TEST"}, "x": 30, "y": 64},
  {"component": "Scroll", "props": {"label": "THE OFFER"}, "x": 70, "y": 60, "delaySec": 0.4}
]}}
```

Rules (same as the core library): flat shapes, Board outlines with the live theme stroke, brand colours only, no
gradients, faceless people, names as typography, never logos, never real rulers, coins, seals or coats of arms.
All components follow the active theme (`spec.theme`).

| era id | years | backdrop | props |
|---|---|---|---|
| `ancient` | 3000 BC - 500 AD | `AncientBackdrop` | ColumnTemple (label = inscription), Pyramid, Galley (label on sail), Chariot, Amphora, Scroll (label = heading, unrolls), Laurel (label in the middle, grows), OilLamp (flickers), AncientCoin (label = 1-4 letters, spins), WaxTablet (stylus writes) |
| `industrial` | 1850 - 1910 | `CityBackdrop` | core components for now (Factory, Train, Ship, Telegram, OldTelephone, Newspaper, Bank, MoneyStack) |
| `modern` | 2000 - today | `OfficeBackdrop` | core components for now (Smartphone, Laptop, Computer, DigitalCamera, StockBoard, ContainerShip, Airplane, Rocket) |

Planned (factory backlog ERAS-2..6): Medieval, Age of Exploration / Dutch Golden Age, Industrial pack, Roaring
20s / Depression, 1950s-60s, 1970s-80s, 1990s dotcom, 2000s, future.

Adding an era: write `render/src/eras/<Era>.tsx` (components read `STROKE` and `C` at render time, never in a
module-level constant), register the components in `ERA_ILLUSTRATIONS` (+ `ERA_BACKDROPS`), add an `ERA_LIST`
entry, and add the component names to the layer `component` enum in `schema/spec.schema.json`.
