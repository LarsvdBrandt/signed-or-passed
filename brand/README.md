# Brand: Signed or Passed

Lars's own brand files live in this folder and win over everything else (never edit, rename or delete them):
`Logo & merkbord.png`, `Kanaalbanner 2560×1440.png`, `Thumbnail-template 1280×720.png`, `Profielfoto 800×800.png`.
See **BRAND-ANALYSIS.md** for what they contain and how the factory uses them (intro sting, end card,
watermark, title card, thumbnail).

Tagline: "One decision. Then history happened."

## Colours (brand/palette.json)
| Name | Hex | Use |
|---|---|---|
| Ink blue | #2457E6 | SIGNED, signature |
| Stamp orange | #D9530B | PASSED, stamp, DISPUTED |
| Board black | #141414 | 3px outlines, text, dark backgrounds |
| Paper | #F3F1EC | default background |
| Grey | #8A8780 | secondary text |
| Light grey | #CFCBC2 | fills, grid lines, dashed banner rules |

No gradients. No stock photos, no AI imagery, no logos (company names are set as type).
People are faceless silhouettes with a NameCard; never a likeness of a real person.

## Fonts (brand/fonts.json, all SIL OFL 1.1, downloaded at render time from github.com/google/fonts)
- Bricolage Grotesque (ExtraBold 800): headings, the word PASSED in the stamp
- Mrs Saint Delafield: the "Signed" signature
- IBM Plex Mono: dates, figures, source lines, the small "or"

## Music (brand/music/licenses.csv)
One row per track: `file,url,title,artist,source,license,attribution_text,mood`.
Only add tracks whose licence allows YouTube monetisation (CC0, CC BY, or an explicit royalty-free licence).
`mix.py` picks a track whose `mood` matches `spec.music.mood` (else any track). If the list is empty the video is
rendered without music and a warning is written to render-report.json.

## Sound effects
Pen, stamp, paper and whoosh are generated procedurally with ffmpeg (`pipeline/sfx.py`), so no licences are needed.
