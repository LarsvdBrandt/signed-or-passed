# Recorded sound effects (CC0 / Public Domain)

`manifest.csv` lists real recordings that complement the procedural library (`pipeline/sfxlib.py`).
Columns: `file,url,source_page,licence,author,attribution,category,start,duration,description`.

Rules (from the factory backlog, strictly enforced):

- Only **CC0** or **Public Domain** recordings from Wikimedia Commons. No CC BY, no BY-SA, no NC, no ND, nothing unclear.
- No binaries in git: the workflow downloads the files at render time (`pipeline/fetch_sfx.py`).
- `fetch_sfx.py` re-checks every licence **live** via the MediaWiki API (`prop=imageinfo&iiprop=extmetadata`,
  fields `LicenseShortName`, `License`, `NonFree`). A row whose Commons licence is not CC0 / PD is rejected and skipped.
- Each file is trimmed (`start`, `duration` in seconds), converted to 48 kHz mono 16-bit, peak-normalised to -3 dBFS
  and given short fades. Output: `build/sfx-lib/recorded/<file>` + `recorded-catalogue.json` + `recorded/CREDITS.txt`.
- The recorded sounds are appended to `sound-board.mp4` and packed into `sfx-library.zip` (folder `recorded/`).

Adding a sound: find a file on Commons, open its page, check the licence box says CC0 or Public domain, add a row
(lower_snake `.wav` name, the `upload.wikimedia.org` URL without query string, the `File:` page URL, author).
Credits are not legally required for CC0/PD but are kept in CREDITS.txt as good practice.
