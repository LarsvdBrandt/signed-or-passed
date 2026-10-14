"""Final YouTube metadata: description with chapters, sources, credits and synthetic-voice disclosure."""
from common import (add_warning, cut_dir, cuts, fmt_ts, is_test, load_spec, log, out_dir, read_json, slug_arg,
                    work_dir, write_json)

KEY_KINDS = {"title", "question", "reveal", "verdict", "lesson", "evidence", "timeline", "map"}
MIN_CHAPTER = 10.0


def label_for(sc):
    v, k = sc["visual"], sc["kind"]
    if sc.get("onScreenText"):
        return sc["onScreenText"]
    if k == "title":
        return v.get("title") or "Intro"
    fixed = {"question": "Would you sign?", "reveal": "What happened", "verdict": "The verdict", "lesson": "The lesson"}
    if k in fixed:
        return fixed[k]
    return " ".join(sc["narration"].split()[:6]).rstrip(".,;:!?")


def chapters(scenes, timing):
    t_by = {s["id"]: s for s in timing["scenes"]}
    total = timing["totalSec"]

    def build(only_key):
        ch = [(0.0, label_for(scenes[0]))]
        for sc in scenes[1:]:
            if only_key and sc["kind"] not in KEY_KINDS:
                continue
            st = t_by[sc["id"]]["start"]
            if st - ch[-1][0] >= MIN_CHAPTER and total - st >= MIN_CHAPTER:
                ch.append((st, label_for(sc)))
        return ch

    ch = build(True)
    if len(ch) < 3:
        ch = build(False)
    return ch if len(ch) >= 3 else []


def main():
    args = slug_arg()
    spec = load_spec(args.slug)
    md = spec["metadata"]
    timing = read_json(cut_dir(args.slug, "main") / "timing.json")
    ch = chapters(spec["scenes"], timing)
    if not ch:
        add_warning(args.slug, "video too short for >= 3 chapters of >= 10 s: no chapters in description")

    parts = [md["description"].strip()]
    if ch:
        parts.append("Chapters\n" + "\n".join(f"{fmt_ts(t)} {label}" for t, label in ch))
    sources = spec.get("sources") or []
    if sources:
        parts.append("Sources\n" + "\n".join(f"- {s['title']}: {s['url']}" for s in sources))
    assets_path = work_dir(args.slug) / "assets.json"
    assets = read_json(assets_path) if assets_path.exists() else {}
    if assets:
        parts.append("Image credits\n" + "\n".join(
            f"- {a['attribution']} ({a['license']}) {a.get('sourcePage', '')}".rstrip() for a in assets.values()))
    music_path = work_dir(args.slug) / "music.json"
    if music_path.exists():
        m = read_json(music_path)
        credit = (m.get("attribution_text") or "").strip() or f"{m.get('title')} by {m.get('artist')} ({m.get('license')})"
        parts.append("Music\n" + credit)
    parts.append("Illustrations and sound effects: Signed or Passed. People are shown as faceless figures; "
                 "no real likenesses or logos are used.\nNarrated with a synthetic voice.")
    description = "\n\n".join(parts)
    if len(description) > 5000:
        add_warning(args.slug, f"description is {len(description)} chars; truncated to 5000")
        description = description[:4990] + "..."

    tags, used = [], 0
    for t in md.get("tags") or []:
        if used + len(t) + 1 > 480:
            break
        tags.append(t)
        used += len(t) + 1

    shorts = []
    for cut in cuts(spec)[1:]:
        shorts.append({
            "id": cut["name"].replace("short-", "", 1),
            "file": f"{cut['name']}.mp4",
            "captions": f"{cut['name']}.srt",
            "title": (md["title"][:90] + " #shorts"),
            "description": md["description"].strip() + "\n\nNarrated with a synthetic voice.\n#shorts",
        })

    meta = {
        "slug": args.slug,
        "test": is_test(args.slug),
        "title": md["title"],
        "titleAlternatives": md.get("titleAlternatives") or [],
        "description": description,
        "tags": tags,
        "categoryId": md.get("categoryId", "27"),
        "containsSyntheticMedia": bool(md.get("containsSyntheticMedia", False)),
        "madeForKids": False,
        "defaultLanguage": "en",
        "chapters": [{"start": round(t, 2), "timestamp": fmt_ts(t), "title": label} for t, label in ch],
        "durationSec": timing["totalSec"],
        "shorts": shorts,
    }
    write_json(out_dir(args.slug) / "metadata.json", meta)
    log(f"metadata: {len(ch)} chapters, {len(description)} chars description, {len(shorts)} short(s)")


if __name__ == "__main__":
    main()
