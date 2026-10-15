"""Fetch the recorded CC0 / Public Domain sound effects listed in brand/sfx/manifest.csv.

  python pipeline/fetch_sfx.py --out build/sfx-lib

For every row the licence is checked LIVE against the Wikimedia Commons MediaWiki API
(prop=imageinfo&iiprop=extmetadata): only CC0 and Public Domain are accepted; anything else is rejected and
skipped. Accepted files are downloaded (cached in build/sfx-cache), trimmed to start/duration, converted to
mono at the sfx library rate, peak-normalised to -3 dBFS with short fades and written to <out>/recorded/<file>.
Writes <out>/recorded-catalogue.json {sounds, rejected} and <out>/recorded/CREDITS.txt.
Never fails the build: problems are logged as warnings (the procedural library works on its own).
"""
import argparse
import csv
import json
import re
import subprocess
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import soundfile as sf

import sfxlib
from common import ROOT, USER_AGENT, log, write_json

API = "https://commons.wikimedia.org/w/api.php"
MANIFEST = ROOT / "brand" / "sfx" / "manifest.csv"
ACCEPT = {"cc0", "cc0 1.0", "cc-zero", "pd", "public domain", "public domain mark"}
PEAK_DB = -3.0


def _abs(p):
    p = Path(p)
    return p if p.is_absolute() else ROOT / p


def _get(url, timeout=120):
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 + attempt * 3)
    raise RuntimeError(f"download failed: {url}: {last}")


def _strip(html):
    return re.sub(r"<[^>]+>", "", html or "").strip()


def commons_title(source_page):
    m = re.search(r"/wiki/(File:[^?#]+)", source_page or "")
    if not m:
        return None
    return urllib.parse.unquote(m.group(1)).replace("_", " ")


def licence_ok(name):
    n = (name or "").strip().lower()
    return n in ACCEPT or n.startswith("pd-") or n.startswith("public domain")


def verify(title):
    """Return (download_url, licence, artist) when Commons says CC0 / PD; raise ValueError otherwise."""
    q = urllib.parse.urlencode({
        "action": "query",
        "format": "json",
        "titles": title,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "iiextmetadatafilter": "LicenseShortName|License|Artist|NonFree",
    })
    data = json.loads(_get(f"{API}?{q}", 60).decode("utf-8"))
    pages = (data.get("query") or {}).get("pages") or {}
    for page in pages.values():
        infos = page.get("imageinfo") or []
        if not infos:
            raise ValueError("file not found on Wikimedia Commons")
        info = infos[0]
        em = info.get("extmetadata") or {}
        short = _strip((em.get("LicenseShortName") or {}).get("value", ""))
        lic = _strip((em.get("License") or {}).get("value", ""))
        nonfree = _strip((em.get("NonFree") or {}).get("value", "")).lower()
        if nonfree in ("true", "1", "yes"):
            raise ValueError(f"marked non-free on Commons ({short})")
        if not (licence_ok(short) or licence_ok(lic)):
            raise ValueError(f"licence '{short or lic or 'unknown'}' is not CC0 / Public Domain")
        return info["url"], (short or lic), _strip((em.get("Artist") or {}).get("value", ""))
    raise ValueError("no page in the API answer")


def _basename(url):
    return urllib.parse.unquote(urllib.parse.urlsplit(url).path.rsplit("/", 1)[-1])


def process(row, out, cache):
    name = (row.get("file") or "").strip()
    if not re.match(r"^[a-z0-9_]+\.wav$", name):
        raise ValueError("file must be a lower_snake .wav name")
    if not licence_ok(row.get("licence", "")):
        raise ValueError("manifest licence column must say CC0 or Public Domain")
    title = commons_title(row.get("source_page", ""))
    if not title:
        raise ValueError("source_page is not a Wikimedia Commons File: page")
    url, licence, artist = verify(title)
    if _basename(row.get("url", "")) != _basename(url):
        log(f"  note: manifest url differs from Commons ({_basename(row.get('url', ''))} vs {_basename(url)}); using the Commons url")
    stem = Path(name).stem
    ext = Path(_basename(url)).suffix.lower() or ".bin"
    src = cache / f"{stem}{ext}"
    if not src.exists() or src.stat().st_size == 0:
        src.write_bytes(_get(url, 300))
    start = float(row.get("start") or 0)
    dur = float(row.get("duration") or 8)
    tmp = cache / f"{stem}.decoded.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{start:.3f}", "-t", f"{dur:.3f}", "-i", str(src),
         "-ac", "1", "-ar", str(sfxlib.SR), "-c:a", "pcm_f32le", str(tmp)],
        check=True,
    )
    x, sr = sf.read(str(tmp), dtype="float64")
    if x.ndim > 1:
        x = x.mean(axis=1)
    if len(x) < int(sr * 0.05):
        raise ValueError("decoded audio is empty")
    peak = float(np.max(np.abs(x)))
    if peak <= 1e-6:
        raise ValueError("decoded audio is silent")
    x = x * (10 ** (PEAK_DB / 20.0) / peak)
    fi = min(len(x) // 4, int(0.01 * sr))
    fo = min(len(x) // 4, int(0.12 * sr))
    if fi > 0:
        x[:fi] *= np.linspace(0.0, 1.0, fi)
    if fo > 0:
        x[-fo:] *= np.linspace(1.0, 0.0, fo)
    dst = out / "recorded" / name
    sf.write(str(dst), x.astype(np.float32), sr, subtype="PCM_16")
    try:
        tmp.unlink()
    except OSError:
        pass
    return {
        "name": stem,
        "file": f"recorded/{name}",
        "category": (row.get("category") or "recorded").strip(),
        "description": (row.get("description") or "").strip(),
        "licence": licence,
        "author": (row.get("author") or artist or "unknown").strip(),
        "commonsArtist": artist,
        "attribution": (row.get("attribution") or "").strip(),
        "sourcePage": row.get("source_page", ""),
        "url": url,
        "durationSec": round(len(x) / sr, 2),
        "verifiedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="build/sfx-lib")
    ap.add_argument("--cache", default="build/sfx-cache")
    ap.add_argument("--manifest", default=str(MANIFEST))
    a = ap.parse_args()
    out = _abs(a.out)
    cache = _abs(a.cache)
    (out / "recorded").mkdir(parents=True, exist_ok=True)
    cache.mkdir(parents=True, exist_ok=True)
    manifest = _abs(a.manifest)
    sounds, rejected = [], []
    if manifest.exists():
        with open(manifest, "r", encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f))
    else:
        rows = []
        log(f"WARNING: no manifest at {manifest}")
    for row in rows:
        name = (row.get("file") or "?").strip()
        try:
            e = process(row, out, cache)
            sounds.append(e)
            log(f"  ok   {name}: {e['licence']} by {e['author']} ({e['durationSec']} s)")
        except Exception as ex:  # noqa: BLE001
            rejected.append({"file": name, "sourcePage": row.get("source_page", ""), "reason": str(ex)})
            log(f"WARNING: skipped {name}: {ex}")
        time.sleep(0.3)
    write_json(out / "recorded-catalogue.json", {"sounds": sounds, "rejected": rejected})
    lines = [
        "Recorded sound effects - credits",
        "",
        "Every file below is CC0 or Public Domain on Wikimedia Commons (licence verified via the MediaWiki API at",
        "render time). Attribution is not required; it is listed as good practice.",
        "",
    ]
    for e in sounds:
        lines.append(f"{e['file']}: {e['attribution'] or e['name']} - {e['licence']} - {e['sourcePage']}")
    if rejected:
        lines += ["", "Rejected (not included):"]
        for r in rejected:
            lines.append(f"{r['file']}: {r['reason']}")
    (out / "recorded" / "CREDITS.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log(f"recorded sfx: {len(sounds)} accepted, {len(rejected)} rejected")


if __name__ == "__main__":
    main()
