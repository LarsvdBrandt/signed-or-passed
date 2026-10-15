"""ffprobe-based QA -> render-report.json (build/<slug>/out and productions/<slug>). --gate exits 1 if not ok."""
import json
import re
import subprocess
import sys
from datetime import datetime, timezone

from common import (ROOT, SIZES, cut_dir, cuts, is_test, load_spec, log, out_dir, read_json, slug_arg, warnings,
                    write_json)


def ffprobe(path):
    p = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
                       capture_output=True, text=True)
    return json.loads(p.stdout) if p.returncode == 0 else None


def loudness(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-vn", "-af",
                        "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr, re.S)
    return json.loads(m.group(0)) if m else None


def silences(path):
    """(starts, ends) of every stretch quieter than -50 dBFS for >= 2 s (ffmpeg silencedetect)."""
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-vn", "-af",
                        "silencedetect=noise=-50dB:d=2", "-f", "null", "-"], capture_output=True, text=True)
    starts = [float(x) for x in re.findall(r"silence_start: (-?[0-9.]+)", p.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: (-?[0-9.]+)", p.stderr)]
    return starts, ends


def main():
    args = slug_arg(lambda p: p.add_argument("--gate", action="store_true"))
    slug = args.slug
    out = out_dir(slug)
    if args.gate:
        report = read_json(out / "render-report.json")
        bad = [c for c in report["checks"] if not c["ok"]]
        for c in bad:
            log(f"QA FAILED: {c['name']}: {c['detail']}")
        sys.exit(0 if report["ok"] else 1)

    spec = load_spec(slug)
    test = is_test(slug)
    checks, durations, audio_stats = [], {}, {}

    def check(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": str(detail)})

    for cut in cuts(spec):
        fname = "video.mp4" if cut["name"] == "main" else f"{cut['name']}.mp4"
        path = out / fname
        if not path.exists():
            check(f"{fname}: exists", False, "missing")
            continue
        info = ffprobe(path)
        if not info:
            check(f"{fname}: readable", False, "ffprobe failed")
            continue
        v = [s for s in info["streams"] if s.get("codec_type") == "video"]
        a = [s for s in info["streams"] if s.get("codec_type") == "audio"]
        dur = float(info["format"].get("duration", 0))
        durations[cut["name"]] = round(dur, 2)
        w, h = SIZES[cut["format"]]
        check(f"{fname}: resolution {w}x{h}", bool(v) and v[0]["width"] == w and v[0]["height"] == h,
              f"{v[0]['width']}x{v[0]['height']}" if v else "no video stream")
        check(f"{fname}: audio present", bool(a), a[0].get("codec_name") if a else "no audio stream")
        lo, hi = (480, 720) if cut["format"] == "long" else (45, 60)
        if test:
            check(f"{fname}: duration", True, f"{dur:.1f}s (TEST production: exempt from {lo}-{hi}s)")
        else:
            check(f"{fname}: duration {lo}-{hi}s", lo <= dur <= hi, f"{dur:.1f}s")
        timing = read_json(cut_dir(slug, cut["name"]) / "timing.json")
        check(f"{fname}: duration matches audio timing", abs(dur - timing["totalSec"]) < 0.5,
              f"video {dur:.2f}s vs timing {timing['totalSec']:.2f}s")
        if a:
            L = loudness(path)
            if L:
                i, tp = float(L["input_i"]), float(L["input_tp"])
                check(f"{fname}: loudness -14 LUFS (+/-1)", abs(i + 14) <= 1.0, f"{i:.1f} LUFS")
                check(f"{fname}: true peak <= -1 dBTP (0.3 dB codec tolerance)", tp <= -0.7, f"{tp:.1f} dBTP")
                # AUDIO-1: a mix can hit -14 LUFS and still have dead air (a missing voice clip, a bed that stopped)
                starts, ends = silences(path)
                ends += [dur] * (len(starts) - len(ends))
                spans = [max(0.0, e - st) for st, e in zip(starts, ends)]
                longest, total_sil = (max(spans) if spans else 0.0), sum(spans)
                audio_stats[fname] = {"lufs": i, "truePeakDb": tp, "lra": float(L.get("input_lra") or 0),
                                      "silences": len(spans), "longestSilenceSec": round(longest, 2),
                                      "silentPct": round(100.0 * total_sil / dur, 1) if dur else 0.0}
                check(f"{fname}: no dead air (silence < -50 dBFS: longest < 4 s, total < 5%)",
                      longest < 4.0 and (total_sil / dur if dur else 1) < 0.05,
                      f"{len(spans)} silence(s), longest {longest:.1f}s, {100.0 * total_sil / dur if dur else 0:.1f}% silent")
            else:
                check(f"{fname}: loudness measurable", False, "loudnorm parse failed")

    thumb = out / "thumbnail.png"
    tinfo = ffprobe(thumb) if thumb.exists() else None
    if tinfo and tinfo.get("streams"):
        s = tinfo["streams"][0]
        check("thumbnail.png: 1280x720", s["width"] == 1280 and s["height"] == 720, f"{s['width']}x{s['height']}")
    else:
        check("thumbnail.png: exists", False, "missing")

    cap = out / "captions.srt"
    check("captions.srt: present", cap.exists() and cap.stat().st_size > 0, cap.name)

    source_ids = {s["id"] for s in spec.get("sources") or []}
    missing = []
    for cut in cuts(spec):
        for sc in cut["scenes"]:
            sid = sc["visual"].get("sourceId")
            if sid is not None and sid not in source_ids:
                missing.append(f"{cut['name']}/{sc['id']}:{sid}")
    check("every sourceId resolves", not missing, ", ".join(missing) or "ok")

    kinds = [s["kind"] for s in spec["scenes"]]
    check("question scene exists", "question" in kinds)
    check("verdict scene exists", "verdict" in kinds)

    meta_path = out / "metadata.json"
    if meta_path.exists():
        meta = read_json(meta_path)
        n = len(meta.get("chapters") or [])
        check("description: >= 3 chapters", n >= 3 or test, f"{n} chapters" + (" (TEST: exempt)" if test and n < 3 else ""))
        check("description: synthetic voice disclosed", "Narrated with a synthetic voice." in meta["description"])
    else:
        check("metadata.json: present", False, "missing")

    report = {
        "ok": all(c["ok"] for c in checks),
        "slug": slug,
        "test": test,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "checks": checks,
        "durations": durations,
        "audio": audio_stats,
        "warnings": warnings(slug),
    }
    write_json(out / "render-report.json", report)
    write_json(ROOT / "productions" / slug / "render-report.json", report)
    for c in checks:
        log(f"  [{'ok' if c['ok'] else 'FAIL'}] {c['name']}: {c['detail']}")
    log(f"QA {'passed' if report['ok'] else 'FAILED'} for {slug}")


if __name__ == "__main__":
    main()
