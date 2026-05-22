# SpeedLayer Chrome Web Store Readiness

Last updated: 2026-05-22

## Current State

Local:

- Chromium MV3 build exists in `dist-chromium`.
- Chrome Web Store upload package exists at `dist-chromium.zip`.
- Manifest name is `SpeedLayer`.
- Version is `0.1.0`.
- Permissions are `storage`, `scripting`, and broad `http://*/*`, `https://*/*` host access.
- Store listing copy exists in `docs/speedlayer/chrome-web-store-listing.md`.
- Privacy policy copy exists in `PRIVACY.md` and `docs/speedlayer/privacy-policy.md`.
- Store assets exist under `docs/screenshots/` and `src/icons/`.

Pushed/PR:

- Branch `speedlayer-v2` is pushed to `KalnuErelis/speedlayer`, but the latest local launch-prep diff has not been pushed yet.
- No release tag exists.
- No PR exists.

Deployed:

- Not submitted to Chrome Web Store.
- No store listing exists.

Runtime:

- Local verifier checks required files, MV3, service worker, content scripts, name, and version.
- Chromium smoke test verifies extension load, video acceleration, and return to normal playback speed on the local fixture.

Blocked proof:

- No final name/trademark clearance.
- No public privacy policy URL until `PRIVACY.md` is pushed and visible on GitHub.
- No Chrome Web Store developer-account submission proof.
- No Web Store review decision.

## Release Candidate

- Package: `dist-chromium.zip`
- Size: 361 KB
- SHA-256: `36d76e8d563d5a90b4cd2b8e5d5161589fc6f8b9c08a82f299c6a8087cb7c1e4`
- Manifest: MV3, `SpeedLayer`, version `0.1.0`
- Build command: `corepack yarn build-and-package:chromium`
- Verification command: `corepack yarn verify:chromium`
- Runtime smoke command: `corepack yarn smoke:chromium`

## Store Assets Needed

- Extension name: `SpeedLayer`
- Short description, 132 characters or less.
- Full description.
- 128x128 icon and store promotional images.
- At least one screenshot of the popup on a real video page.
- At least one screenshot showing settings/options if they remain public.
- Support URL or support email.
- Privacy policy URL: `https://github.com/KalnuErelis/speedlayer/blob/speedlayer-v2/PRIVACY.md` after push.
- Source code URL: `https://github.com/KalnuErelis/speedlayer`

Current asset files:

- Store icon: `src/icons/icon-big-padded.svg-128.png` (`128x128`)
- Small promo tile: `docs/screenshots/promo-small-440x280.png` (`440x280`)
- Primary popup screenshot: `docs/screenshots/popup-1-1280x800.png` (`1280x800`)
- Options screenshots: `docs/screenshots/options-1-1280x800.png`, `docs/screenshots/options-2-1280x800.png` (`1280x800`)
- Alternate popup screenshots: `docs/screenshots/popup-2-640x400.png`, `docs/screenshots/popup-3-640x400.png` (`640x400`)

## Permissions Rationale

Current permissions:

- `storage`: saves SpeedLayer settings and local time-saved state.
- `scripting`: required by the current MV3 implementation to dynamically register and unregister the media-source cloning content script for the cloning controller.
- `http://*/*`, `https://*/*`: lets SpeedLayer detect and control web video across sites.

Store risk:

- Broad host permissions are expected for a general video-speed extension, but the listing and privacy policy must explain that video processing happens locally.

## Privacy Position

Intended v1 position:

- SpeedLayer should not collect personal data.
- SpeedLayer should not transmit browsing history, video URLs, video metadata, or settings to the developer.
- Settings and time-saved data should remain local unless the user explicitly enables browser sync.

Needs proof:

- Publish the privacy policy at a public URL.
- Confirm the Chrome Web Store privacy questionnaire matches the local-only data model.

## Release Checklist

P0 before submission:

- [x] Confirm final repo URL and source link in built extension.
- [x] Decide to ship current app icons for v0.1.0 with inherited AGPL attribution.
- [x] Replace visible inherited project links where they are user-facing in options/about.
- [x] Confirm support link points to `https://github.com/KalnuErelis/speedlayer/issues`.
- [x] Write privacy policy.
- [x] Write store listing copy.
- [x] Create release zip with `corepack yarn build-and-package:chromium`.
- [x] Run `corepack yarn lint` through the package command.
- [x] Run `corepack yarn tsc --noEmit`.
- [x] Run `corepack yarn svelte-check --tsconfig ./tsconfig.json`.
- [x] Run `corepack yarn verify:chromium`.
- [x] Run `corepack yarn smoke:chromium`.
- [x] Run `codex review --uncommitted` on the release diff.
- [ ] Push launch-prep diff to GitHub.
- [ ] Push `PRIVACY.md` so the privacy policy URL is publicly reachable.
- [ ] Upload `dist-chromium.zip` in the Chrome Web Store developer dashboard.
- [ ] Complete Chrome Web Store privacy and permission questionnaire.
- [ ] Submit for Chrome Web Store review.

P1 before wider launch:

- Automated extension behavior test for the manual fixture.
- Automated YouTube navigation smoke test or documented manual replay.
- Smaller popup/options UX for lecture/course users.
- Public roadmap and contribution guide.
- GitHub Issues enabled and labeled.
