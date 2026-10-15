"""spec + timing (+ words, assets) -> Remotion input props per cut (build/<slug>/<cut>/props.json)."""
from common import FPS, SIZES, cut_dir, cuts, fail, load_spec, log, read_json, slug_arg, work_dir, write_json

DEFAULT_THEME = "signed-or-passed"


def frame(t):
    return int(round(t * FPS))


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
    for cut in cuts(spec):
        d = cut_dir(args.slug, cut["name"])
        timing = read_json(d / "timing.json")
        words = read_json(d / "words.json") if (d / "words.json").exists() else []
        by_id = {s["id"]: s for s in timing["scenes"]}
        scenes = []
        for sc in cut["scenes"]:
            t = by_id.get(sc["id"])
            if not t:
                fail(f"no timing for scene {sc['id']} in {cut['name']}")
            start, end = frame(t["start"]), frame(t["end"])
            scenes.append({
                **sc,
                "startFrame": start,
                "durationFrames": max(1, end - start),
                "sentences": [{"text": s["text"], "startFrame": frame(s["start"]) - start,
                               "endFrame": frame(s["end"]) - start} for s in t["sentences"]],
            })
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
            "fps": FPS,
            "width": w,
            "height": h,
            "totalFrames": max(1, frame(timing["totalSec"])),
            "introFrames": frame(float(timing.get("introSec") or 0)),
            "outroFrames": frame(float(timing.get("outroSec") or 0)),
            "scenes": scenes,
            "words": [{"text": x["text"], "startFrame": frame(x["start"]), "endFrame": frame(x["end"])} for x in words],
            "assets": {k: {"src": v["src"], "attribution": v.get("attribution", "")} for k, v in assets.items()},
            "sources": sources,
            "thumbnail": spec.get("thumbnail") or {},
            "title": spec["metadata"]["title"],
        }
        write_json(d / "props.json", props)
        n_fx = sum(1 for s in scenes if s.get("effects"))
        n_tr = sum(1 for s in scenes if s.get("transition"))
        n_lt = sum(1 for s in scenes if s.get("lowerThird"))
        tr_name = transition if isinstance(transition, str) else (transition or {}).get("id", "paper-slide") if isinstance(transition, dict) else "paper-slide"
        log(f"props {cut['name']}: {len(scenes)} scenes, {props['totalFrames']} frames ({w}x{h}), theme {theme}, "
            f"look {look if isinstance(look, str) else ('custom' if look else 'none')}, {n_fx} scenes with effects, "
            f"transition {tr_name} ({n_tr} scene overrides), {n_lt} lower thirds, captions {caption_style or 'theme'}, "
            f"intro {props['introFrames']} / outro {props['outroFrames']} frames")


if __name__ == "__main__":
    main()
