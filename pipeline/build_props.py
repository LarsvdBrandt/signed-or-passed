"""spec + timing (+ words, assets) -> Remotion input props per cut (build/<slug>/<cut>/props.json)."""
from common import FPS, SIZES, cut_dir, cuts, fail, load_spec, log, read_json, slug_arg, work_dir, write_json


def frame(t):
    return int(round(t * FPS))


def main():
    args = slug_arg()
    spec = load_spec(args.slug)
    assets_path = work_dir(args.slug) / "assets.json"
    assets = read_json(assets_path) if assets_path.exists() else {}
    sources = {s["id"]: {"title": s["title"], "url": s["url"]} for s in spec.get("sources") or []}
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
            "fps": FPS,
            "width": w,
            "height": h,
            "totalFrames": max(1, frame(timing["totalSec"])),
            "scenes": scenes,
            "words": [{"text": x["text"], "startFrame": frame(x["start"]), "endFrame": frame(x["end"])} for x in words],
            "assets": {k: {"src": v["src"], "attribution": v.get("attribution", "")} for k, v in assets.items()},
            "sources": sources,
            "thumbnail": spec.get("thumbnail") or {},
            "title": spec["metadata"]["title"],
        }
        write_json(d / "props.json", props)
        log(f"props {cut['name']}: {len(scenes)} scenes, {props['totalFrames']} frames ({w}x{h})")


if __name__ == "__main__":
    main()
