"""Download brand fonts and the spec's assets. Wikimedia Commons licences are verified via the MediaWiki API."""
import re
import time
from pathlib import Path
from urllib.parse import unquote, urlparse

import requests

from common import ROOT, USER_AGENT, fail, load_spec, log, read_json, slug_arg, work_dir, write_json

HEADERS = {"User-Agent": USER_AGENT}
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
PUBLIC = ROOT / "render" / "public"


def download(url, dest, tries=4):
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    last = None
    for i in range(tries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=60)
            if r.status_code == 200 and r.content:
                dest.write_bytes(r.content)
                return dest
            last = f"HTTP {r.status_code}"
        except requests.RequestException as e:
            last = str(e)
        time.sleep(2 * (i + 1))
    fail(f"download failed for {url}: {last}")


def license_ok(short_name, code):
    s = (short_name or "").strip().lower()
    c = (code or "").strip().lower()
    if "nc" in re.split(r"[-\s]", c) or "nd" in re.split(r"[-\s]", c):
        return False
    if c in ("pd", "cc0") or c.startswith("pd-") or c.startswith("cc0"):
        return True
    if re.match(r"^cc-by(-sa)?-[0-9.]+", c):
        return True
    if s.startswith("public domain") or s.startswith("cc0") or s == "pd":
        return True
    if re.match(r"^cc by(-sa)? [0-9.]+", s):
        return True
    return False


def commons_title(url):
    u = urlparse(url)
    parts = [p for p in u.path.split("/") if p]
    if u.netloc.endswith("upload.wikimedia.org"):
        if "thumb" in parts:
            i = parts.index("thumb")
            name = parts[i + 3]
        else:
            name = parts[-1]
        return "File:" + unquote(name)
    if u.netloc.endswith("wikimedia.org") or u.netloc.endswith("wikipedia.org"):
        last = unquote(parts[-1])
        if ":" in last:
            return "File:" + last.split(":", 1)[1]
    return None


def commons_lookup(title):
    params = {
        "action": "query", "format": "json", "prop": "imageinfo", "titles": title,
        "iiprop": "url|extmetadata", "iiurlwidth": "1920",
        "iiextmetadatafilter": "LicenseShortName|License|Artist|UsageTerms",
    }
    r = requests.get(COMMONS_API, params=params, headers=HEADERS, timeout=60)
    r.raise_for_status()
    pages = r.json().get("query", {}).get("pages", {})
    for page in pages.values():
        if "missing" in page or not page.get("imageinfo"):
            return None
        return page["imageinfo"][0]
    return None


def ext_from(url, default=".jpg"):
    path = urlparse(url).path.lower()
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        if path.endswith(ext):
            return ".jpg" if ext == ".jpeg" else ext
    return default


def fetch_fonts():
    fonts = read_json(ROOT / "brand" / "fonts.json")["fonts"]
    for f in fonts:
        dest = PUBLIC / "fonts" / f["file"]
        if dest.exists() and dest.stat().st_size > 10000:
            continue
        download(f["url"], dest)
        log(f"font: {f['family']} -> {dest.relative_to(ROOT)}")


def main():
    args = slug_arg()
    spec = load_spec(args.slug)
    fetch_fonts()
    result = {}
    for a in spec.get("assets") or []:
        url = a["url"]
        title = commons_title(url)
        verified = None
        if title:
            info = commons_lookup(title)
            if not info:
                fail(f"asset {a['id']}: {title} not found on Wikimedia Commons")
            meta = info.get("extmetadata", {})
            short = meta.get("LicenseShortName", {}).get("value", "")
            code = meta.get("License", {}).get("value", "")
            if not license_ok(short, code):
                fail(f"asset {a['id']}: licence '{short}' ({code}) is not allowed (only Public Domain, CC0, CC BY, CC BY-SA)")
            verified = short or code
            url = info.get("thumburl") or info["url"]
        else:
            if not license_ok(a.get("license"), a.get("license")):
                fail(f"asset {a['id']}: licence '{a.get('license')}' is not allowed")
        ext = ext_from(url)
        rel = f"assets/{args.slug}/{a['id']}{ext}"
        download(url, PUBLIC / rel)
        log(f"asset {a['id']}: {verified or a.get('license')} -> render/public/{rel}")
        result[a["id"]] = {
            "src": rel, "license": verified or a.get("license"), "attribution": a.get("attribution", ""),
            "sourcePage": a.get("sourcePage", ""), "verifiedViaCommons": bool(title),
        }
    write_json(work_dir(args.slug) / "assets.json", result)
    log(f"{len(result)} asset(s) ready")


if __name__ == "__main__":
    main()
