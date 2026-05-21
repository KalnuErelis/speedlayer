# SpeedLayer Chrome Alpha

This branch produces a local unpacked Chrome extension for testing SpeedLayer as an AGPL-compatible Jump Cutter fork.

## Build

```bash
git submodule update --init
corepack yarn install --frozen-lockfile
corepack yarn build:chromium -- --env noreport
corepack yarn verify:chromium
corepack yarn serve:manual-test
```

The unpacked extension directory is:

```text
dist-chromium
```

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the local `dist-chromium` directory from this repo.
5. Pin SpeedLayer from Chrome's extensions menu.

## Quick Manual Test

1. Open a YouTube lecture or course video.
2. Start playback.
3. Open the SpeedLayer popup.
4. Confirm the popup shows controls instead of "Could not find a suitable media element".
5. Set "Skip more" and listen for silent sections speeding up.

For a local fixture, start the server above and open:

```text
http://127.0.0.1:8765/docs/speedlayer/manual-test.html
```

The local fixture uses a generated video file with alternating tone and silence.
Use the HTTP URL instead of opening the file directly, because Chrome content scripts run on HTTP/HTTPS pages.
