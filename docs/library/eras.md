# Era packs

Code: `render/src/eras/` (registry in `index.ts`, one file per pack). Preview: `preview-eras.mp4` in the
`sample` release (rendered by the `EraPreview` composition: per era the backdrop, a grid of all props and a small
composed scene).

An era pack = a **backdrop** + **props** (illustration components) + hints (example date tag, suggested theme,
music era). Era components are normal illustration components:

```json
{"kind": "illustration", "visual": {"background": "DinerBackdrop", "layers": [
  {"component": "Jukebox", "props": {"label": "A1  B2"}, "x": 22, "y": 62},
  {"component": "Typewriter", "props": {"label": "OFFER: 2 MILLION"}, "x": 66, "y": 64, "delaySec": 0.4}
]}}
```

Rules (same as the core library): flat shapes, Board outlines with the live theme stroke, brand colours only, no
gradients, faceless people, names as typography, never logos, never real rulers, coins, seals, flags, coats of
arms, car makes, games, browsers, operating systems or brands. All components follow the active theme (`spec.theme`).

| era id | years | backdrop | props |
|---|---|---|---|
| `ancient` | 3000 BC - 500 AD | `AncientBackdrop` | ColumnTemple (label = inscription), Pyramid, Galley (label on sail), Chariot, Amphora, Scroll (label = heading, unrolls), Laurel (label in the middle, grows), OilLamp (flickers), AncientCoin (label = 1-4 letters, spins), WaxTablet (stylus writes) |
| `medieval` | 500 - 1500 | `MedievalBackdrop` (castle, waving flags) | CastleGate (label = banner, portcullis rises), MarketStall (label = sign, awning flaps), QuillParchment (label = heading, quill writes), WaxSeal (label = 1-3 letters, pressed), SwordShield (plain chevron), Cart (wheel turns), Lantern (flickers, swings), GuildSign (label = guild name, swings) + core Scales, MoneyBag |
| `golden-age` | 1500 - 1700 | `GoldenAgeBackdrop` (canal houses, windmill, bridge, passing boat) | Fluyt (label on hull band, sails billow), CanalHouse (pose = step / bell / point gable, label = shop sign), Tulip (grows and opens, label = price tag), SpiceSacks (label on the middle sack), Globe (land drifts past), Compass (needle settles), Ledger (label = heading, props.lines = up to 6 figures) + core Warehouse, Scales, ShareCertificate |
| `industrial` | 1850 - 1910 | `IndustrialBackdrop` (smokestacks, smoke) | SteamEngine (flywheel turns, steam), FactoryGate (label = arch sign), PennyFarthing (wheels turn), TelegraphKey (taps), TopHat, PocketWatch (hands move), GasLamp (flame flickers) + core Train, Telegram, ShareCertificate |
| `twenties` | 1919 - 1939 | `DecoBackdrop` (art-deco towers at night, searchlights) | TickerTape (label = tape text, streams fictional quotes), Gramophone (record turns, notes), VintageCar (label = number plate), Breadline (label = sign, default FREE SOUP), CathedralRadio (label = dial text, broadcast waves), CocktailGlass (pose = clink), NewsboyCap + core OldTelephone, SpinningNewspaper, FallingChart |
| `fifties` | 1945 - 1969 | `DinerBackdrop` (label = blinking sign, default DINER; counter, stools, checkerboard floor) | Jukebox (label = selection panel, cycling lights, notes), TVSet (label = caption over colour bars, flicker), FinCar (label = number plate, tail fins, whitewalls), RotaryPhone (pose = ring / dial), Typewriter (label is typed onto the sheet), RocketToy (label on the band, hovers), Milkshake (level drops, cherry bounces) + core VinylRecord, StoreFront, Newspaper |
| `eighties` | 1970 - 1989 | `NeonBackdrop` (label = flickering neon sign, default OPEN 24H; synth grid floor, block skyline, sunset) | ArcadeCabinet (label = marquee, generic falling blocks, joystick), Cassette (label = tape label, reels turn), CRTTV (label = on-screen text, scanlines, static bursts), Boombox (speakers pump), Calculator (label = number it counts up to), Mainframe (label = cabinet plate, tape reels, blinking lights), PersonalStereo (headphones, sound waves) + core VHSTape, FloppyDisk, StockBoard |
| `nineties` | 1990 - 2001 | `CubicleBackdrop` (label = motivational poster, default SYNERGY; cubicle farm, flickering fluorescent light, wall clock) | BeigePC (label is typed into a window), DialUpModem (label on the front, default 56K; LEDs, handshake noise), CDROM (label on the disc, spins), Pager (label scrolls on the LCD, buzzes), EarlyWebsite (label = address, default http://www.example.com; UNDER CONSTRUCTION band, hit counter, loading bar), ServerRack (label = plate, blinking LEDs), ComputerMouse (clicks) + core FloppyDisk, DVD, StockBoard |
| `modern` | 2000 - today | `OfficeBackdrop` | core components for now (Smartphone, Laptop, Computer, DigitalCamera, StockBoard, ContainerShip, Airplane, Rocket) |

Planned (factory todo ERAS-6): 2000s, future.

Adding an era: write `render/src/eras/<Era>.tsx` (components read `STROKE` and `C` at render time, never in a
module-level constant; clipPath ids prefixed `era-`), register the components in `ERA_ILLUSTRATIONS`
(+ `ERA_BACKDROPS`), add an `ERA_LIST` entry, and add the component names to the layer `component` enum in
`schema/spec.schema.json`.
