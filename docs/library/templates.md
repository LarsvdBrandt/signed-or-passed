# Scene templates

Ready-made, era-aware compositions built from the illustration library (`render/src/templates`). One scene kind,
`template`, gives a complete staged scene with people, props, name cards and text overlays in the house style.
The **era** swaps the backdrop, the costumes and the props (contract -> scroll / parchment / ledger / telegram,
phone -> messenger / letter / telegraph / rotary phone / pager / flip phone / smartphone, ship -> galley / fluyt /
steamer / container ship ...).

Preview: `preview-templates.mp4` (every template in its default era + two others, 4 s each).

```json
{"id": "s07", "kind": "template", "narration": "...",
 "visual": {"template": "boardroom-meeting", "era": "fifties",
            "labels": {"left": "THE FOUNDER", "right": "THE BUYER", "document": "OFFER"},
            "colours": {"left": "ink", "right": "stamp"},
            "props": {"layers": [{"component": "MoneyStack", "x": 50, "y": 70, "scale": 0.6}],
                      "overlays": [{"text": "$1,000,000", "x": 50, "y": 20, "style": "sign", "delaySec": 1.5}]}}}
```

- `labels` fill the template's text slots; an empty string switches that name card / overlay off.
- `colours` take brand colour names (ink, stamp, board, grey, greyLight, paper) or hex.
- `props.background` replaces the background; `props.layers` adds illustration layers (same format as an
  illustration scene, plus the template parts below and `drift {dx, dy, startSec}` in % per second);
  `props.overlays` adds text overlays: `{text, x, y, style: stamp|sign|banner|caption|neon|flash, colour, rotate,
  delaySec, size}`.
- Camera `motion` (push-in, pull-out, pan ...), `effects`, `transition` and `lowerThird` work as on every scene.
- Real people stay faceless silhouettes with a name card; companies are typography, never logos.

## Templates

| template | default era | slots (labels / colours) | what it shows |
|---|---|---|---|
| boardroom-meeting | modern | left, right, chair, document, banner | three people at a table, a document between them |
| phone-call-split-screen | fifties | left, right, line | two callers in split screen (stacked in Shorts); messenger / letter / telegram before the telephone |
| signing-ceremony | modern | left, right, document, stamp, banner | handshake over the document, applause, SIGNED stamp at 2.2 s |
| rejection-letter | modern | document, stamp, recipient, note | envelope, letter, REJECTED stamp, slumped recipient |
| factory-floor | industrial | company, boss, workers | workers at the era machine, a foreman, the shift clock |
| stock-market-crash | twenties | headline, index | price board + falling chart over a crowd in shock |
| store-opening-queue | fifties | store, sign, note | a shop with a queue waiting for opening |
| garage-startup | nineties | name, left, right, roof | two founders in an open garage at the era device, idea bulb |
| press-conference | modern | speaker, org, podium, banner | speaker at a podium, camera flashes (none before photography), reporters |
| courtroom | modern | court, left, right, case | judge behind the bench, plaintiff and defendant |
| ship-departure | golden-age | ship, destination, sea | the era ship leaves the quay (drifts from 1.5 s), people wave |
| city-at-night-thinking | modern | thought, person, windows | a lone figure at a window over the night skyline |

## Eras

`ancient, medieval, golden-age, industrial, twenties, fifties, eighties, nineties, noughties, modern, future`
(aliases: rome, middle-ages, 1600s, victorian, 1900s, 1920s, depression, 1950s, 1960s, 1980s, 1990s, dotcom,
2000s, today, 2020s, near-future ...). Each era kit (`render/src/templates/eras.ts`) names: backdrop, room,
costume, worker costume, document, seal/pen, communication device + call pose, money, market board, shop, device,
machine, ship, lamp and press camera.

## Template parts

Extra house-style pieces (usable in `props.layers` of a template): Garage (900x560, label, colour), Podium
(360x420, label, colour), Bench (900x360, label), Quay (760x140), Waves (1920x260, colour, speed), NightSkyline
(1920x1080, colour of lit windows, seed), WindowFrame (1400x860).

## Adding a template

Add an entry to `TEMPLATES` in `render/src/templates/index.tsx` (id, name, description, slots, defaultEra,
previewEras, build). `build(a)` returns `{layout?: 'full' | 'split', panels: [{background, layers}], overlays}`;
use `a.era.<field>` for anything that should change with the era. Add the id to `vTemplate.template` in
`schema/spec.schema.json` and to the table above; TemplatePreview picks it up automatically.
