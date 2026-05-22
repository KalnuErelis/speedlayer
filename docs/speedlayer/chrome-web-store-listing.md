# SpeedLayer Chrome Web Store Listing

Last updated: 2026-05-22

## Product Details

Name:

```text
SpeedLayer
```

Short description:

```text
Skip silence and see saved seconds add up while watching lectures, courses, and long-form videos.
```

Category:

```text
Productivity
```

Language:

```text
English
```

Detailed description:

```text
SpeedLayer helps you watch long videos faster by speeding through quiet parts and keeping speech understandable.

It is built for lectures, courses, interviews, tutorials, and other long-form videos where pauses add up. Open a video, enable SpeedLayer, and the popup shows your current speed plus saved seconds as they accumulate.

Features:
- Speeds through silence in web videos.
- Shows time saved in seconds.
- Keeps simple controls in the popup.
- Includes advanced controls for threshold, speeds, margins, and hotkeys.
- Stores settings and time-saved stats locally in Chrome.
- Runs video analysis locally in your browser.

SpeedLayer is open source and derived from Jump Cutter under the AGPL license.

Source code:
https://github.com/KalnuErelis/speedlayer
```

## Privacy Fields

Single purpose:

```text
SpeedLayer speeds up web video playback by detecting quiet parts locally and adjusting playback speed so users can save time while watching long-form videos.
```

Permission justification, `storage`:

```text
Used to save SpeedLayer settings, local time-saved totals, hotkeys, and user preferences in Chrome storage.
```

Permission justification, `scripting`:

```text
Used to register the extension's content scripts so SpeedLayer can support media elements in web pages and frames.
```

Host permission justification, `http://*/*`, `https://*/*`:

```text
Required because SpeedLayer is a general-purpose video speed extension. It needs to find and control media elements on user-visited web pages where the user chooses to use the extension.
```

Remote code:

```text
No remote code is used. Extension JavaScript is bundled in the submitted package and loaded from the extension itself.
```

Data usage disclosure:

```text
SpeedLayer does not sell or transfer user data. It does not transmit browsing history, video URLs, video metadata, settings, or time-saved stats to the developer.
```

## Support

Support URL:

```text
https://github.com/KalnuErelis/speedlayer/issues
```

Privacy policy URL:

```text
https://github.com/KalnuErelis/speedlayer/blob/speedlayer-v2/PRIVACY.md
```

Homepage:

```text
https://github.com/KalnuErelis/speedlayer
```

## Assets

Required files available in repo:

- Store icon: `src/icons/icon-big-padded.svg-128.png`
- Small promo tile: `docs/screenshots/promo-small-440x280.png`
- Small promo source: `src/icons/promo-small.svg`
- Screenshots:
  - `docs/screenshots/popup-1-1280x800.png`
  - `docs/screenshots/options-1-1280x800.png`
  - `docs/screenshots/options-2-1280x800.png`
  - `docs/screenshots/popup-2-640x400.png`
  - `docs/screenshots/popup-3-640x400.png`

Upload at least one screenshot. Prefer the 1280x800 popup screenshot first.
