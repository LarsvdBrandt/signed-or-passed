# Local use (Linux/macOS with python3.11, node 20, ffmpeg, espeak-ng). CI does the same in .github/workflows/render.yml.
SLUG ?= 0000-sample

.PHONY: install validate render studio clean

install:
	python -m pip install --index-url https://download.pytorch.org/whl/cpu torch==2.5.1
	python -m pip install -r pipeline/requirements.txt
	cd render && npm install && npx remotion browser ensure

validate:
	python pipeline/validate_spec.py --slug $(SLUG)

render:
	bash ci/render-slug.sh $(SLUG)

studio:
	python pipeline/fetch_assets.py --slug $(SLUG)
	cd render && npx remotion studio src/index.ts

clean:
	rm -rf build render/out render/public/assets render/public/work
