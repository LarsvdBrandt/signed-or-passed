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
arms, car makes, games, browsers, operating systems, devices or brands. All components follow the active theme
(`spec.theme`).

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
| `noughties` | 2001 - 2012 | `OpenPlanBackdrop` (label = whiteboard heading, default GROWTH; a rising arrow draws itself; window wall with skyline, swinging pendant lamps, bench desks with flat screens, beanbag) | FlipPhone (flips open; label on the outer screen, default NEW MESSAGE), MP3Player (label = track name; equaliser, progress bar, 4-way pad, earbuds, notes), FlatScreen (label scrolls in the ticker band; bar chart grows), LaptopBag (label on the swinging luggage tag), WifiRouter (label on the front; pulsing signal arcs), USBStick (label on the body, default 2GB; cap slides off), CompactCamera (label on the body; lens zooms, flash fires) + core Laptop, DVD, FallingChart |
| `modern` | 2013 - today | `OfficeBackdrop` | core components (Smartphone, Laptop, Computer, DigitalCamera, StockBoard, ContainerShip, Airplane, Rocket) |
| `future` | 2025 - 2050 (speculative) | `FutureSkylineBackdrop` (label = billboard, default TOMORROW; slender towers with roof gardens, wind turbines, gliding pod train, delivery drones) | SmartphoneGrid (app tiles pop in; label = notification banner), Drone (label on the swinging parcel; rotors blur), EV (label = number plate; charging post, battery fills), DataCentre (label = hall sign; racks blink, cooling air), VRHeadset (label on the visor; lens glow, orbiting pixels), RobotArm (label on the carried box; three joints move), SolarPanel (label = unit, default kWh; glint sweeps, counter) + core Rocket |

Every component also takes `colour` (main body colour: brand name or hex). Future scenes are speculation: label
forecasts clearly as forecasts in the narration or on screen.

Adding an era: write `render/src/eras/<Era>.tsx` (components read `STROKE` and `C` at render time, never in a
module-level constant; clipPath ids prefixed `era-`), register the components in `ERA_ILLUSTRATIONS`
(+ `ERA_BACKDROPS`), add an `ERA_LIST` entry, and add the component names to the layer `component` enum in
`schema/spec.schema.json`.
