"""ffprobe-based QA -> render-report.json (build/<slug>/out and productions/<slug>). --gate exits 1 if not ok.

RETENTION-6 (docs/library/retention.md): per cut a low-res frame-difference scan (64x36 grey, 4 fps) checks the
first visual change (<= 1.5 s), the longest static stretch outside question holds / the reveal silence / the end
card (FAIL > 6 s, WARN 4-6 s), the brand sting after the hook, an on-screen number/keyword in the first 8 s and the
silence before the reveal; measured visual changes/min (target >= 20), planned beats/min and sfx/min go to
report.retention. Checks with level 'warn'
are listed but do not fail the gate.
"""
import json
import re
import subprocess
import sys
from datetime import datetime, timezone

from common import (ROOT, SIZES, cut_dir, cuts, is_test, load_spec, log, out_dir, read_json, slug_arg, warnings,
                    write_json)
from retention import NO_AUTO_KEYWORD_KINDS

SCAN_W, SCAN_H, SCAN_FPS = 64, 36, 4
STATIC_DIFF = 0.15          # mean abs grey difference over 0.5 s below this = nothing moves (slow pans score >= 0.15)
FIRST_CHANGE_DIFF = 2.0     # a real cut / pop within the first 1.5 s
FIRST_CHANGE_SEC = 1.5
CHANGE_GAP_SEC = 0.75       # visual changes closer together than this (continuous motion) count as one
STATIC_WARN_SEC, STATIC_FAIL_SEC = 4.0, 6.0
HOOK_KEYWORD_SEC = 8.0
CHANGES_PER_MIN_TARGET = 20  # measured visual changes (cuts, beats, pops, keywords, camera punches) per minute
REVEAL_SILENCE_DB = -35.0
HOOK_TEXT_KINDS = (NO_AUTO_KEYWORD_KINDS - {"question", "verdict"}) | {"reveal"}
HOOK_TEXT_BEATS = {"kinetic", "counter", "pop"}


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


def frame_diffs(path):
    """Mean abs grey difference between frames 0.5 s apart, one value per 1/SCAN_FPS s (index i = time i/SCAN_FPS)."""
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vf",
                        f"fps={SCAN_FPS},scale={SCAN_W}:{SCAN_H},format=gray", "-f", "rawvideo", "-"], capture_output=True)
    if p.returncode != 0 or not p.stdout:
        return None
    try:
        import numpy as np
        a = np.frombuffer(p.stdout, np.uint8)
        a = a[: len(a) // (SCAN_W * SCAN_H) * SCAN_W * SCAN_H].reshape(-1, SCAN_W * SCAN_H).astype(np.float32)
        half = np.abs(a[2:] - a[:-2]).mean(axis=1).tolist()
        step = np.abs(a[1:] - a[:-1]).mean(axis=1).tolist()
    except ImportError:
        n = SCAN_W * SCAN_H
        fr = [p.stdout[i:i + n] for i in range(0, len(p.stdout) - n + 1, n)]
        diff = lambda x, y: sum(abs(u - v) for u, v in zip(x, y)) / n  # noqa: E731
        half = [diff(fr[i], fr[i + 2]) for i in range(len(fr) - 2)]
        step = [diff(fr[i], fr[i + 1]) for i in range(len(fr) - 1)]
    return half, step


def mean_volume(path, start, dur):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-ss", f"{start:.3f}", "-t", f"{dur:.3f}", "-i", str(path),
                        "-vn", "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True)
    m = re.search(r"mean_volume: (-?[0-9.]+|-inf) dB", p.stderr)
    return None if not m else (-120.0 if m.group(1) == "-inf" else float(m.group(1)))


def retention_checks(slug, cut, path, timing, dur, check):
    """RETENTION-6 checks for one cut; returns the numbers for report.retention."""
    fname = path.name
    scenes = timing.get("scenes") or []
    d = cut_dir(slug, cut["name"])
    beats = read_json(d / "beats.json") if (d / "beats.json").exists() else []
    sfx = read_json(d / "sfx-events.json") if (d / "sfx-events.json").exists() else None
    minutes = max(dur, 1.0) / 60.0
    stats = {"beats": len(beats), "beatsPerMin": round(len(beats) / minutes, 1),
             "sfx": None if sfx is None else len(sfx), "sfxPerMin": None if sfx is None else round(len(sfx) / minutes, 1)}

    # holds that may be static: question scenes, the silence before the reveal, the end card
    holds = [(float(sc["start"]), float(sc["end"])) for sc in scenes if sc.get("kind") == "question"]
    if timing.get("revealAtSec") and timing.get("revealPauseSec"):
        r = float(timing["revealAtSec"])
        holds.append((r - float(timing["revealPauseSec"]) - 0.5, r))
    if timing.get("outroSec"):
        holds.append((dur - float(timing["outroSec"]), dur + 1))

    scan = frame_diffs(path)
    if scan is None:
        check(f"{fname}: retention frame scan", False, "ffmpeg frame scan failed", level="warn")
    else:
        half, step = scan
        first = next((i / SCAN_FPS for i, v in enumerate(step) if v >= FIRST_CHANGE_DIFF), None)
        stats["firstVisualChangeSec"] = first
        changes, last = 0, -9.0
        for i, v in enumerate(step):
            if v >= FIRST_CHANGE_DIFF:
                if i / SCAN_FPS - last >= CHANGE_GAP_SEC:
                    changes += 1
                last = i / SCAN_FPS
        stats["visualChanges"] = changes
        stats["visualChangesPerMin"] = round(changes / minutes, 1)
        check(f"{fname}: visual changes/min >= {CHANGES_PER_MIN_TARGET}", stats["visualChangesPerMin"] >= CHANGES_PER_MIN_TARGET,
              f"{stats['visualChangesPerMin']} changes/min (measured), {stats['beatsPerMin']} planned beats/min, "
              + ("sfx n/a" if sfx is None else f"{stats['sfxPerMin']} sfx/min"), level="warn")
        check(f"{fname}: first visual change <= {FIRST_CHANGE_SEC} s", first is not None and first <= FIRST_CHANGE_SEC,
              "none" if first is None else f"{first:.2f}s")
        longest, at, run_start = 0.0, None, None
        for i, v in enumerate(half + [STATIC_DIFF + 1]):
            t = i / SCAN_FPS
            in_hold = any(a <= t and t + 0.5 <= b for a, b in holds)
            if v < STATIC_DIFF and not in_hold:
                run_start = t if run_start is None else run_start
            elif run_start is not None:
                length = t + 0.5 - run_start  # frames run_start .. t+0.5 are identical
                if length > longest:
                    longest, at = length, run_start
                run_start = None
        stats["longestStaticSec"] = round(longest, 2)
        stats["longestStaticAtSec"] = at
        where = f"{longest:.1f}s at {at:.1f}s" if at is not None else "none"
        check(f"{fname}: no static picture > {STATIC_FAIL_SEC:.0f} s (outside question holds)", longest <= STATIC_FAIL_SEC,
              where)
        if longest > STATIC_WARN_SEC:
            check(f"{fname}: static picture <= {STATIC_WARN_SEC:.0f} s (outside question holds)",
                  longest <= STATIC_WARN_SEC, where, level="warn")

    if cut["format"] == "long" and float(timing.get("introSec") or 0) > 0:
        ia = float(timing.get("introAtSec") or 0)
        check(f"{fname}: brand sting after the hook", ia > 0, f"sting at {ia:.1f}s")

    early = [b for b in beats if float(b.get("sec", 99)) <= HOOK_KEYWORD_SEC and (
        str(b.get("do", "")).startswith("keyword") or b.get("do") in HOOK_TEXT_BEATS)]
    early_sc = [sc for sc in scenes if float(sc["start"]) < HOOK_KEYWORD_SEC and sc.get("kind") in HOOK_TEXT_KINDS]
    check(f"{fname}: on-screen number/keyword in the first {HOOK_KEYWORD_SEC:.0f} s", early or early_sc,
          ", ".join([f"{b['do']}@{float(b['sec']):.1f}s" for b in early][:3] +
                    [f"{sc['kind']} {sc['id']}@{float(sc['start']):.1f}s" for sc in early_sc][:3]) or "none",
          level="warn")

    if timing.get("revealAtSec") and timing.get("revealPauseSec"):
        r, pz = float(timing["revealAtSec"]), float(timing["revealPauseSec"])
        mv = mean_volume(path, max(0.0, r - pz + 0.05), max(0.1, pz - 0.1))
        stats["revealSilenceDb"] = mv
        check(f"{fname}: silence before the reveal ({pz:.1f} s, < {REVEAL_SILENCE_DB:.0f} dB)",
              mv is not None and mv < REVEAL_SILENCE_DB, "unmeasurable" if mv is None else f"{mv:.1f} dB at {r - pz:.1f}s",
              level="warn")
    return stats


def main():
    args = slug_arg(lambda p: p.add_argument("--gate", action="store_true"))
    slug = args.slug
    out = out_dir(slug)
    if args.gate:
        report = read_json(out / "render-report.json")
        bad = [c for c in report["checks"] if not c["ok"] and c.get("level", "fail") == "fail"]
        for c in bad:
            log(f"QA FAILED: {c['name']}: {c['detail']}")
        sys.exit(0 if report["ok"] else 1)

    spec = load_spec(slug)
    test = is_test(slug)
    checks, durations, audio_stats, retention = [], {}, {}, {}

    def check(name, ok, detail="", level="fail"):
        c = {"name": name, "ok": bool(ok), "detail": str(detail)}
        if level != "fail":
            c["level"] = level
        checks.append(c)

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
        elif cut["format"] != "long" and 30 <= dur < lo:  # a 30-45 s Short is publishable: warn, the Director adjusts
            check(f"{fname}: duration {lo}-{hi}s", False, f"{dur:.1f}s (short but publishable, >= 30 s)", level="warn")
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
        if v:
            retention[cut["name"]] = retention_checks(slug, cut, path, timing, dur, check)

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

    # VOICE-4: ASR + liveliness of the voice track (build/<slug>/voice-qa.json, written by tts.py)
    voice_qa = {}
    vq_path = ROOT / "build" / slug / "voice-qa.json"
    if vq_path.exists():
        voice_qa = read_json(vq_path)
        if voice_qa.get("wer") is not None:
            check("voice: ASR word error rate <= 8 %", voice_qa["wer"] <= 0.08,
                  f"{voice_qa['wer'] * 100:.1f} % ({voice_qa.get('asrModel', 'base.en')}, {voice_qa.get('words')} words)")
        if voice_qa.get("engine") == "chatterbox":
            bad = voice_qa.get("badSentences") or []
            check("voice: no sentence with WER > 30 %", not bad,
                  "; ".join(f"{b['wer']:.2f} '{b['text']}' heard '{b.get('asr')}'" for b in bad)[:900] or "all clips ok")
            fb = voice_qa.get("fallbackSentences") or []
            check("voice: no Kokoro fallback sentences", not fb, f"{len(fb)}: " + " | ".join(fb)[:600], level="warn")
        wpm = (voice_qa.get("pace") or {}).get("wpm")
        if wpm is not None:  # VOICE-8: target 145-155 spoken words per minute (warn outside 135-165)
            check("voice: pace 145-155 words/min", 135 <= wpm <= 165,
                  f"{wpm} wpm (articulation {voice_qa['pace'].get('articulationWpm')}, pace {voice_qa['pace'].get('pace')}, "
                  f"pauses x{voice_qa['pace'].get('pauseScale')})", level="warn")
        lv = (voice_qa.get("liveliness") or {}).get("mean")
        if lv is not None:
            check("voice: liveliness (F0 std, semitones)", True, f"{lv} st (per minute {voice_qa['liveliness'].get('perMinute')})",
                  level="info")

    meta_path = out / "metadata.json"
    if meta_path.exists():
        meta = read_json(meta_path)
        n = len(meta.get("chapters") or [])
        check("description: >= 3 chapters", n >= 3 or test, f"{n} chapters" + (" (TEST: exempt)" if test and n < 3 else ""))
        check("description: synthetic voice disclosed", "Narrated with a synthetic voice." in meta["description"])
    else:
        check("metadata.json: present", False, "missing")

    report = {
        "ok": all(c["ok"] for c in checks if c.get("level", "fail") == "fail"),
        "slug": slug,
        "test": test,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "checks": checks,
        "durations": durations,
        "audio": audio_stats,
        "retention": retention,
        "voice": voice_qa,
        "warnings": warnings(slug),
    }
    write_json(out / "render-report.json", report)
    write_json(ROOT / "productions" / slug / "render-report.json", report)
    for c in checks:
        log(f"  [{'ok' if c['ok'] else c.get('level', 'fail').upper()}] {c['name']}: {c['detail']}")
    log(f"QA {'passed' if report['ok'] else 'FAILED'} for {slug}")


if __name__ == "__main__":
    main()
