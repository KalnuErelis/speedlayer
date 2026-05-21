# SpeedLayer Alpha QA Tracker

Last updated: 2026-05-21

## Current Evidence

Local:

- Branch: `speedlayer-v2`
- Commit: `334b1b5`
- Build output: `dist-chromium`
- User-installed Chrome alpha: reported working by Jaunius on 2026-05-21.

Pushed/PR:

- Repo: `https://github.com/KalnuErelis/speedlayer`
- Branch: `speedlayer-v2`
- PR: not created.

Deployed:

- Chrome Web Store: not published.

Runtime:

- `corepack yarn verify:chromium` passes.
- Headless Chrome loaded the HTTP manual fixture with the unpacked extension.
- Manual human check exists only as a first smoke report: "it seems to work."

Blocked proof:

- No full interactive popup walkthrough has been recorded.
- No automated assertion proves silence sections are skipped.
- No YouTube single-page-app navigation regression test exists.
- No Chrome Web Store review/approval exists.

## QA Matrix

P0 before Chrome Web Store alpha:

- Manual fixture: popup attaches to video and shows controls.
- Manual fixture: silence sections speed up audibly with conservative settings.
- Manual fixture: disabling SpeedLayer restores normal playback.
- YouTube lecture: popup attaches on first page load.
- YouTube lecture: popup still attaches after navigating to another video without a full page reload.
- YouTube lecture: changing YouTube playback speed and SpeedLayer sounded speed does not fight forever.
- Generic HTML video page: popup attaches and detaches cleanly.
- Multiple videos on one page: active video selection is understandable.
- Background tab: no runaway CPU or playback-rate ownership bug after tab switch.
- Options page: changed settings persist after reload.
- Extension reload: existing tabs recover without requiring a browser restart.

P1 before wider public announcement:

- Coursera/Udemy-style player check.
- Vimeo check.
- Local file player check.
- Captions/subtitles unaffected check.
- Muted video behavior check.
- Cross-origin media behavior check.
- Keyboard shortcut check.
- Incognito behavior decision and check.
- Settings sync/local storage decision and migration check.

## Known Product Gaps

- Remaining UI still feels like inherited Jump Cutter rather than SpeedLayer.
- Icons are inherited and should not be treated as final branding.
- Popup has advanced controls and labels that may be too dense for lecture/course users.
- Options page has many inherited settings; v1 needs a smaller public surface.
- Runtime architecture is still upstream-first; lifecycle and tests should be hardened before heavy promotion.

## Next QA Work

1. Record one manual QA session on the fixture and one YouTube lecture.
2. Turn confirmed failures into GitHub issues with browser version, page URL, steps, expected result, and actual result.
3. Add automated extension tests against `docs/speedlayer/manual-test.html`.
4. Add a synthetic multi-video fixture and a dynamic-video fixture for lifecycle checks.
