# Brand: Signed or Passed

## Colours (brand/palette.json)
| Name | Hex | Use |
|---|---|---|
| Ink blue | #2457E6 | SIGNED, signature |
| Stamp orange | #D9530B | PASSED, stamp, DISPUTED |
| Board black | #141414 | 3px outlines, text, dark backgrounds |
| Paper | #F3F1EC | default background |
| Grey | #8A8780 | secondary text |
| Light grey | #CFCBC2 | fills, grid lines |

No gradients. No stock photos, no AI imagery, no logos (company names are set as type).
People are faceless silhouettes with a NameCard; never a likeness of a real person.

## Fonts (brand/fonts.json, all SIL OFL 1.1, downloaded at render time from github.com/google/fonts)
- Bricolage Grotesque: headings
- Mrs Saint Delafield: the "Signed" signature
- IBM Plex Mono: dates, figures, source lines

## Music (brand/music/licenses.csv)
One row per track: `file,url,title,artist,source,license,attribution_text,mood`.
Only add tracks whose licence allows YouTube monetisation (CC0, CC BY, or an explicit royalty-free licence).
`mix.py` picks a track whose `mood` matches `spec.music.mood` (else any track). If the list is empty the video is
rendered without music and a warning is written to render-report.json.

## Sound effects
Pen, stamp, paper and whoosh are generated procedurally with ffmpeg (`pipeline/sfx.py`), so no licences are needed.
