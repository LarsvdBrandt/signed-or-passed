"""spec + timing (+ words, assets) -> Remotion input props per cut (build/<slug>/<cut>/props.json)."""
from common import (FPS, SIZES, add_warning, cut_dir, cuts, fail, load_spec, log, read_json, slug_arg, strip_emphasis,
                    work_dir, write_json)
from retention import resolve_beats, scene_keywords, space_keywords

DEFAULT_THEME = "signed-or-passed"


def frame(t):
    return int(round(t * FPS))


def breath_beats(beats, breaths, start, end):
    """VOICE-12: a punch-in in the middle of every intentional pause >= 1 s inside a scene (no visual cut in it), unless
    a beat already lands within 0.8 s, so a long pause feels intentional instead of dead."""
    out = list(beats)
    for b in breaths:
        f = frame(float(b["at"]) + float(b["sec"]) / 2.0) - start
        if 0 < f < end - start - 6 and not any(abs(x["frame"] - f) < int(0.8 * FPS) for x in out):
            out.append({"do": "punch-in", "frame": f, "auto": "breath"})
    return sorted(out, key=lambda x: x["frame"])


RHYTHM_EVERY_SEC = 2.0   # Shorts: a camera punch at most every 2 s in a stretch without a beat
RHYTHM_MARGIN_SEC = 1.0  # ... never closer than 1 s to the scene start / end or another beat
RHYTHM_SCALE = 1.12
NO_RHYTHM_KINDS = {"question", "verdict"}


def rhythm_beats(beats, scene, start, end):
    """RETENTION-8: in a Short every stretch longer than ~2 s without a beat gets snappy, silent camera punches
    (punch-in 1.12x / punch-out, alternating), so the vertical cut keeps >= 20 visual changes per minute. Question and
    verdict scenes keep their hold; scenes[].autoBeats false turns it off. Explicit beats stay as they are."""
    if scene.get("kind") in NO_RHYTHM_KINDS or scene.get("autoBeats") is False:
        return beats
    every, margin, dur = int(RHYTHM_EVERY_SEC * FPS), int(RHYTHM_MARGIN_SEC * FPS), end - start
    out, marks, zoomed = list(beats), [0] + [b["frame"] for b in beats] + [dur], False
    for a, b in zip(marks, marks[1:]):
        f = a + every
        while f <= b - margin and f <= dur - margin:
            zoomed = not zoomed
            out.append({"do": "punch-in", "scale": RHYTHM_SCALE, "frame": f, "auto": "rhythm", "sfx": None} if zoomed
                       else {"do": "punch-out", "frame": f, "auto": "rhythm", "sfx": None})
            f += every
    return sorted(out, key=lambda x: x["frame"])


def main():
    args = slug_arg()
    spec = load_spec(args.slug)
    assets_path = work_dir(args.slug) / "assets.json"
    assets = read_json(assets_path) if assets_path.exists() else {}
    sources = {s["id"]: {"title": s["title"], "url": s["url"]} for s in spec.get("sources") or []}
    theme = spec.get("theme") or DEFAULT_THEME
    look = spec.get("look")
    transition = spec.get("transition")
    caption_style = spec.get("captionStyle")
    captions = {"long": "keywords", **(spec.get("captions") or {})}
    auto_beats = spec.get("autoBeats", True) is not False
    for cut in cuts(spec):
        d = cut_dir(args.slug, cut["name"])
        timing = read_json(d / "timing.json")
        words = read_json(d / "words.json") if (d / "words.json").exists() else []
        by_id = {s["id"]: s for s in timing["scenes"]}
        breaths = {}
        for b in timing.get("breaths") or []:  # VOICE-12 intentional pauses inside a scene get a visual beat
            if not b.get("cut"):
                breaths.setdefault(b["sceneId"], []).append(b)
        scenes, keywords, beat_log = [], [], []
        warn = lambda m: add_warning(args.slug, f"{cut['name']}: {m}")  # noqa: E731
        for sc in cut["scenes"]:
            t = by_id.get(sc["id"])
            if not t:
                fail(f"no timing for scene {sc['id']} in {cut['name']}")
            start, end = frame(t["start"]), frame(t["end"])
            sw = [w for w in words if w.get("sceneId") == sc["id"]]
            beats = resolve_beats(sc, sw, frame, start, warn)
            if auto_beats:
                beats = breath_beats(beats, breaths.get(sc["id"]) or [], start, end)
                if cut["format"] != "long":
                    beats = rhythm_beats(beats, sc, start, end)
            keywords += scene_keywords(sc, sw, frame, end)
            beat_log += [{"sec": round((start + b["frame"]) / FPS, 3), "do": b.get("do"), "sceneId": sc["id"],
                          **({"sfx": b["sfx"]} if "sfx" in b else {}),
                          **({"auto": b["auto"]} if b.get("auto") else {})} for b in beats]
            scenes.append({
                **sc,
                "narration": strip_emphasis(sc.get("narration")),
                "beats": beats,
                "startFrame": start,
                "durationFrames": max(1, end - start),
                "sentences": [{"text": s["text"], "startFrame": frame(s["start"]) - start,
                               "endFrame": frame(s["end"]) - start} for s in t["sentences"]],
            })
        keywords = space_keywords(keywords) if cut["format"] == "long" and captions["long"] == "keywords" else []
        beat_log += [{"sec": round(k["startFrame"] / FPS, 3), "do": f"keyword-{k['kind']}", "sceneId": k["sceneId"]}
                     for k in keywords]
        w, h = SIZES[cut["format"]]
        props = {
            "slug": args.slug,
            "cut": cut["name"],
            "format": cut["format"],
            "verdict": spec["verdict"],
            "theme": theme,
            "look": look,
            "transition": transition,
            "captionStyle": caption_style,
            "captions": captions,
            "autoBeats": auto_beats,
            "keywords": keywords,
            "fps": FPS,
            "width": w,
            "height": h,
            "totalFrames": max(1, frame(timing["totalSec"])),
            "introFrames": frame(float(timing.get("introSec") or 0)),
            "introAtFrame": frame(float(timing.get("introAtSec") or 0)),
            "nextTeaser": (spec.get("nextTeaser") or None) if float(timing.get("outroSec") or 0) > 0 else None,
            "outroFrames": frame(float(timing.get("outroSec") or 0)),
            "scenes": scenes,
            "words": [{"text": x["text"], "startFrame": frame(x["start"]), "endFrame": frame(x["end"])} for x in words],
            "assets": {k: {"src": v["src"], "attribution": v.get("attribution", "")} for k, v in assets.items()},
            "sources": sources,
            "thumbnail": spec.get("thumbnail") or {},
            "title": spec["metadata"]["title"],
        }
        write_json(d / "props.json", props)
        write_json(d / "beats.json", sorted(beat_log, key=lambda b: b["sec"]))
        n_fx = sum(1 for s in scenes if s.get("effects"))
        n_tr = sum(1 for s in scenes if s.get("transition"))
        n_lt = sum(1 for s in scenes if s.get("lowerThird"))
        tr_name = transition if isinstance(transition, str) else (transition or {}).get("id", "paper-slide") if isinstance(transition, dict) else "paper-slide"
        log(f"props {cut['name']}: {len(scenes)} scenes, {props['totalFrames']} frames ({w}x{h}), theme {theme}, "
            f"look {look if isinstance(look, str) else ('custom' if look else 'none')}, {n_fx} scenes with effects, "
            f"transition {tr_name} ({n_tr} scene overrides), {n_lt} lower thirds, captions {caption_style or 'theme'}, "
            f"sting {props['introFrames']} at {props['introAtFrame']} / outro {props['outroFrames']} frames, {len(beat_log)} beats "
            f"(auto {'on' if auto_beats else 'off'}), {len(props['keywords'])} keywords (captions.long {captions['long']})")


if __name__ == "__main__":
    main()
