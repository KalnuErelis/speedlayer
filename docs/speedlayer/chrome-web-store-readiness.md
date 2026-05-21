# SpeedLayer Chrome Web Store Readiness

Last updated: 2026-05-21

## Current State

Local:

- Chromium MV3 build exists in `dist-chromium`.
- Manifest name is `SpeedLayer`.
- Version is `0.1.0`.
- Permissions are `storage`, `scripting`, and broad `http://*/*`, `https://*/*` host access.

Pushed/PR:

- Branch `speedlayer-v2` is pushed to `KalnuErelis/speedlayer`.
- No release tag exists.
- No PR exists.

Deployed:

- Not submitted to Chrome Web Store.
- No store listing exists.

Runtime:

- Local verifier checks required files, MV3, service worker, content scripts, name, and version.
- Manual fixture can be served over HTTP for Chrome content-script testing.

Blocked proof:

- No final name/trademark clearance.
- No final icon/screenshot assets.
- No privacy policy URL.
- No store listing copy.
- No user-facing support contact.
- No automated extension behavior tests.
- No Web Store review decision.

## Store Assets Needed

- Extension name: `SpeedLayer`
- Short description, 132 characters or less.
- Full description.
- 128x128 icon and store promotional images.
- At least one screenshot of the popup on a real video page.
- At least one screenshot showing settings/options if they remain public.
- Support URL or support email.
- Privacy policy URL.
- Source code URL: `https://github.com/KalnuErelis/speedlayer`

## Permissions Rationale

Current permissions:

- `storage`: saves SpeedLayer settings and local time-saved state.
- `scripting`: inherited from the current MV3 implementation; confirm whether it is actually required before submission.
- `http://*/*`, `https://*/*`: lets SpeedLayer detect and control web video across sites.

Store risk:

- Broad host permissions are expected for a general video-speed extension, but the listing and privacy policy must explain that video processing happens locally.
- If `scripting` is not required, remove it before submission.

## Privacy Position

Intended v1 position:

- SpeedLayer should not collect personal data.
- SpeedLayer should not transmit browsing history, video URLs, video metadata, or settings to the developer.
- Settings and time-saved data should remain local unless the user explicitly enables browser sync.

Needs proof:

- Audit runtime code for network requests.
- Audit dependencies for telemetry.
- Confirm Chrome storage usage and whether sync storage is user-triggered only.
- Write and publish a privacy policy matching the actual code.

## Release Checklist

P0 before submission:

- Confirm final repo URL and source link in built extension.
- Replace inherited app icons or explicitly decide to ship inherited icons with attribution.
- Replace visible Jump Cutter branding where it is user-facing.
- Confirm all support/contact links point to SpeedLayer-owned channels.
- Write privacy policy.
- Write store listing copy.
- Create release zip with `corepack yarn build-and-package:chromium`.
- Run `corepack yarn lint`.
- Run `corepack yarn tsc --noEmit`.
- Run `corepack yarn svelte-check --tsconfig ./tsconfig.json`.
- Run `corepack yarn verify:chromium`.
- Run `codex review` on the release diff.
- Manually test unpacked release zip in Chrome.

P1 before wider launch:

- Automated extension behavior test for the manual fixture.
- Automated YouTube navigation smoke test or documented manual replay.
- Smaller popup/options UX for lecture/course users.
- Public roadmap and contribution guide.
- GitHub Issues enabled and labeled.
