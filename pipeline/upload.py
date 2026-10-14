"""Upload a rendered production to YouTube (Data API v3). Manual only: run via .github/workflows/upload.yml.

Env: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN. Expects build/<slug>/out/ to contain the release files.
"""
import os
import sys

from common import fail, log, out_dir, read_json, slug_arg

SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.force-ssl"]


def youtube():
    missing = [k for k in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN") if not os.environ.get(k)]
    if missing:
        fail(f"missing secrets: {', '.join(missing)}. Add them under Settings > Secrets and variables > Actions.")
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    creds = Credentials(
        None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"], scopes=SCOPES)
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def insert_video(yt, path, title, description, tags, category, privacy, publish_at, synthetic):
    from googleapiclient.http import MediaFileUpload

    status = {"privacyStatus": privacy, "selfDeclaredMadeForKids": False, "containsSyntheticMedia": synthetic}
    if publish_at:
        status["privacyStatus"] = "private"
        status["publishAt"] = publish_at
    body = {
        "snippet": {"title": title, "description": description, "tags": tags, "categoryId": category,
                    "defaultLanguage": "en", "defaultAudioLanguage": "en"},
        "status": status,
    }
    media = MediaFileUpload(str(path), mimetype="video/mp4", chunksize=8 * 1024 * 1024, resumable=True)
    req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    resp = None
    while resp is None:
        prog, resp = req.next_chunk()
        if prog:
            log(f"  upload {int(prog.progress() * 100)}%")
    vid = resp["id"]
    log(f"uploaded {path.name}: https://youtu.be/{vid} ({status['privacyStatus']})")
    return vid


def insert_captions(yt, vid, srt):
    from googleapiclient.http import MediaFileUpload

    if not srt.exists():
        log(f"no captions file {srt.name}; skipped")
        return
    body = {"snippet": {"videoId": vid, "language": "en", "name": "English", "isDraft": False}}
    yt.captions().insert(part="snippet", body=body,
                         media_body=MediaFileUpload(str(srt), mimetype="application/octet-stream")).execute()
    log("captions uploaded")


def set_thumbnail(yt, vid, png):
    from googleapiclient.http import MediaFileUpload

    try:
        yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(str(png), mimetype="image/png")).execute()
        log("thumbnail set")
    except Exception as e:  # custom thumbnails need a verified channel
        log(f"WARNING: thumbnail not set ({e}). Is the channel verified (phone) for custom thumbnails?")


def main():
    args = slug_arg(lambda p: (p.add_argument("--privacy", default="private", choices=["private", "unlisted", "public"]),
                               p.add_argument("--publish-at", default=""),
                               p.add_argument("--shorts", action="store_true")))
    out = out_dir(args.slug)
    meta = read_json(out / "metadata.json")
    report = read_json(out / "render-report.json")
    if not report.get("ok"):
        fail("render-report.json is not ok: fix QA before uploading")
    if meta.get("test"):
        log("NOTE: this is a TEST production")
    yt = youtube()
    vid = insert_video(yt, out / "video.mp4", meta["title"], meta["description"], meta["tags"], meta["categoryId"],
                       args.privacy, args.publish_at or None, meta["containsSyntheticMedia"])
    insert_captions(yt, vid, out / "captions.srt")
    set_thumbnail(yt, vid, out / "thumbnail.png")
    if args.shorts:
        for s in meta.get("shorts") or []:
            sid = insert_video(yt, out / s["file"], s["title"], s["description"], meta["tags"], meta["categoryId"],
                               args.privacy, args.publish_at or None, meta["containsSyntheticMedia"])
            insert_captions(yt, sid, out / s["captions"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
