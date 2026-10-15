# Infographics library (scene kind `infographic`)

Animated data graphics and diagrams in the house style (3px Board-black outlines, brand colours only, no gradients,
figures in IBM Plex Mono). They follow the active theme (`spec.theme`). Code: `render/src/infographics/`
(`charts.tsx`, `charts2.tsx`, `charts3.tsx`, registry in `index.tsx`). All 17 types are shown in
`preview-infographics.mp4` (InfographicPreview composition, 6 s per type).

```json
{"id": "s07", "kind": "infographic", "narration": "...",
 "visual": {"type": "donut", "title": "Where the money went", "unit": "$", "sourceId": "src1",
            "data": {"slices": [{"label": "Rent", "value": 40}, {"label": "Staff", "value": 35}, {"label": "Other", "value": 25}]}}}
```

Common fields: `type`, `title` (kicker top-left; default `scene.onScreenText`), `unit` (`$`, `€`, `£`, `¥` = prefix,
`%`, or a word = suffix), `sourceId` (required for every data type: `validate_spec.py`; shows "Source: ..."),
`data` (per type, below). Colours: `colour` = brand name (`ink`, `stamp`, `board`, `grey`, `greyLight`) or hex;
default palette order ink, stamp, board, grey, greyLight. Give data scenes `minDurationSec` 5-7 so the animation can
finish.

## Data types (need `sourceId`)

| type | data | animation |
|---|---|---|
| `bar-race` | `{periods: ["2000", ...], series: [{label, values: [...], colour?}], top?: 8}` | bars grow and re-rank smoothly per period; big period counter |
| `line-annotated` | `{points: [{label, value}], annotations?: [{at: index or label, text}]}` | line draws itself, value at its head; callouts pop in |
| `pie` | `{slices: [{label, value, colour?}], highlight?: index, showValues?}` | clockwise sweep, highlighted slice moves out |
| `donut` | as pie + `centerText?`, `centerLabel?` | sweep; centre total counts up |
| `stacked-area` | `{labels: [...], series: [{label, values: [...], colour?}]}` | revealed left to right |
| `ranking` | `{items: [{label, value?, note?}], order?: top-down \| countdown}` (max 10) | rows slide in; #1 in ink |
| `ticker` | `{from, to, decimals?: 0-3, label?}` | odometer digits roll |
| `percent-ring` | `{rings: [{label, value 0-100, colour?}]}` (max 4) or `{value, label}` | rings fill |
| `bubble` | `{bubbles: [{label, value, colour?}]}` (max 14) | area = value; packed, largest first, springs in |
| `comparison-table` | `{columns: ["A", "B"] (max 4), rows: [{label, values: [number \| text \| true \| false \| null]}] (max 8), highlight?: column}` | rows slide in; true/false = tick/cross; highlighted column gets a frame |
| `calendar-heatmap` | `{start: "YYYY-MM-DD", values: [per day]}` or `{days: [{date, value}]}` (max 371 days), `colour?`, `showTotal?` | weeks appear left to right; 4 tint levels |
| `map-choropleth` | `{values: [{country: ISO3 or name, value}], region?: world \| europe \| north-america \| united-states \| south-america \| asia \| africa \| oceania, bins?: 2-6, colour?, legend?, showValues?}` | Equal Earth map (Natural Earth 1:110m, public domain); countries fill from low to high; value tags on the 8 highest |
| `money-stacks` | `{items: [{label, value, colour?}]}` (max 6) | banknote piles grow to scale; amounts count up |
| `what-could-buy` | `{amount, price, item, icon?: box \| house \| car \| person \| coin \| bag, max?: 100, colour?}` | "$1M = 40 cars" counts up; icon grid pops in (1 icon = N items above `max`) |

## Diagrams (no `sourceId` needed)

| type | data | animation |
|---|---|---|
| `org-chart` | `{root: {label, title?, highlight?, colour?, children: [...]}}` or flat `{nodes: [{id, label, title?, parent?}]}` | boxes drop in level by level, connectors draw; highlighted node in stamp orange |
| `family-tree` | `{root: {label, years?, partner?: {label, years?} \| "name", highlight?, children: [...]}}` or flat `{nodes: [{id, label, years?, parent?, partner?}]}` | generations appear top-down; partners joined with a double line |
| `flow` | `{steps: [{id?, label, note?, shape?: box \| decision \| start \| end, colour?, highlight?}], links?: [{from, to, label?}], direction?: horizontal \| vertical, numbered?}` | steps pop in one by one, arrows draw between them; without `links` the steps are chained in order |

Example:

```json
{"kind": "infographic", "visual": {"type": "flow", "title": "How the deal worked",
  "data": {"steps": [{"label": "Offer", "shape": "start"}, {"label": "Due diligence"},
                     {"label": "Sign?", "shape": "decision", "highlight": true}, {"label": "Closed", "shape": "end"}]}}}
```

## Add a type
1. Write a `React.FC<InfoProps>` (`{v, scene, ctx}`) in `render/src/infographics/` (use `usePlot`, `ease`, `fmt`,
   `colourAt` from `shared.ts`; read `C`, `FONT_*`, `STROKE` at render time so themes apply).
2. Register it in `INFOGRAPHICS` (`index.tsx`), add it to `$defs/infographicType` in `schema/spec.schema.json` and
   describe `data` here. Diagrams without data: add the type to `NO_SOURCE_INFOGRAPHICS` in `pipeline/validate_spec.py`.
3. Add demo data to the InfographicPreview composition so it shows up in `preview-infographics.mp4`.
