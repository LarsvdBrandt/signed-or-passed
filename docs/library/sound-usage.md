# Using the sound library in a production

Every sound of the procedural library (`pipeline/sfxlib.py`, listen to `sound-board.mp4` in the `sample`
release; list with `python pipeline/sfxlib.py --list`) can be used in a spec. Everything is generated in CI, so
there are no licences to track (CC0 by construction).

* `scenes[].sfx`: one sound at the scene start. The house sounds `pen`, `stamp`, `paper`, `whoosh` keep their
  fixed offsets (synchronised with the verdict animations); any library name (e.g. `cash_register`,
  `reveal_stinger`, `train_whistle`) plays at the scene start.
* `scenes[].sfxCues`: extra sounds at exact moments, relative to the scene start:

```json
"sfxCues": [{"sfx": "camera_shutter", "atSec": 0.4}, {"sfx": "crowd_murmur", "atSec": 1.0, "gainDb": -8}]
```

`gainDb` (-30 to +12, default 0) changes the level of one cue. `validate_spec.py` rejects unknown names;
`sfx.py --slug <slug>` renders only the sounds a spec uses; `mix.py` places them, ducks the music under the voice
and normalises the whole mix to -14 LUFS / -1 dBTP.
