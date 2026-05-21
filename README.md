# SpeedLayer

Smart playback for web video.

SpeedLayer is an open-source Chrome extension for watching long-form web video faster with silence skipping and playback controls.

This project is an AGPL-compatible fork direction based on [Jump Cutter](https://github.com/WofWca/jumpcutter). Attribution and license notices are preserved.

## Status

SpeedLayer is currently an alpha fork branch.

Working now:

- Chrome MV3 unpacked build.
- Existing Jump Cutter silence skipping engine.
- SpeedLayer extension name and Chrome manifest.
- Local manual test page with generated tone/silence video.
- Build artifact verifier for the Chromium extension output.

Not done yet:

- Chrome Web Store publication.
- Final brand/trademark clearance.
- Full v2 architecture cleanup.
- Automated browser E2E coverage for silence skipping behavior.
- New production UI.

## Build

```bash
git submodule update --init
corepack yarn install --frozen-lockfile
corepack yarn build:chromium -- --env noreport
corepack yarn verify:chromium
corepack yarn serve:manual-test
```

The unpacked extension is written to:

```text
dist-chromium
```

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this repo's `dist-chromium` directory.
5. Pin SpeedLayer from Chrome's extensions menu.

## Manual Test

Open:

```text
http://127.0.0.1:8765/docs/speedlayer/manual-test.html
```

Start the video, then open the SpeedLayer popup. The fixture alternates tone and silence so silence-speed behavior is easy to hear.
Use the local HTTP URL instead of opening the file directly, because Chrome content scripts run on HTTP/HTTPS pages.

You can also test on a YouTube lecture or course video.

## Development Notes

Project direction is tracked in:

```text
docs/speedlayer/project-direction.md
```

Chrome alpha instructions are tracked in:

```text
docs/speedlayer/chrome-alpha.md
```

QA and release readiness are tracked in:

```text
docs/speedlayer/qa-tracker.md
docs/speedlayer/chrome-web-store-readiness.md
```

## License

SpeedLayer is distributed under AGPL-3.0-or-later, following the upstream Jump Cutter license.

Jump Cutter Browser Extension copyright and attribution remain with WofWca and other upstream contributors.
