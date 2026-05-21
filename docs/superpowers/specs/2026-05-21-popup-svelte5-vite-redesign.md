# Popup Svelte 5 + Vite Redesign

Date: 2026-05-21
Project: SpeedLayer
Status: Approved direction, pending implementation plan

## Goal

Rebuild the SpeedLayer popup as a fast, polished Chrome extension control surface using Svelte 5, Vite, TypeScript, and a small internal UI layer.

The popup should feel like SpeedLayer, not inherited Jump Cutter. It should make the extension state obvious, keep the primary control simple, and show saved-time progress without turning the popup into a crowded dashboard.

## Non-Goals

- No public leaderboard implementation in this migration.
- No backend or account system.
- No rewrite of the silence-skipping engine.
- No full options-page redesign in the first pass.
- No shadcn, Radix, or general app component framework in the popup.
- No Next.js inside the extension build.
- No visual overhaul of content-script page overlays beyond what is needed to keep popup behavior working.

## Stack Decision

Use Svelte 5 and Vite for extension UI code.

Reasons:

- The popup needs fast cold starts and small bundles.
- The existing UI already uses Svelte, so the migration can improve architecture without adding framework churn.
- Svelte is well-suited for custom controls such as toggles, sliders, timelines, and compact stats.
- Vite gives a simpler modern build path than the inherited Webpack setup.

Use Next.js later for the public landing page and opt-in leaderboard, where SEO, sharing, routing, server data, and deployment infrastructure matter.

## Product Shape

The popup should become a quiet speed cockpit.

Primary layout:

- Top bar: enable toggle, SpeedLayer label, current speed, current attachment status.
- Main readout: active video state and current effective speed.
- Timeline: compact canvas timeline showing recent sound/silence activity and skip behavior.
- Primary control: intensity slider with clear low-to-high behavior.
- Saved-time scorecard: weekly saved time, lifetime saved time, next milestone.
- Footer actions: local file, settings, advanced panel entry.

The popup should not show a large debug-looking chart, dense advanced controls, or visible settings checkboxes by default.

## UI Components

Create small internal components for the popup:

- `PopupShell`: layout and visual frame.
- `EnableToggle`: master enabled state.
- `SpeedReadout`: current speed and active media status.
- `SavedTimeCard`: weekly, lifetime, and milestone values.
- `TimelineCanvas`: custom canvas replacement for SmoothieChart in the popup.
- `IntensitySlider`: simple control mapped to existing skip aggressiveness settings.
- `IconButton`: compact footer actions with accessible labels.
- `SettingsSheet`: advanced settings surface opened deliberately from the popup.

The component layer should be specific to SpeedLayer. Generic abstractions should be added only when two or more popup surfaces actually need them.

## Data Boundaries

Keep extension APIs out of visual components.

Recommended modules:

- `popupState`: normalized state consumed by Svelte components.
- `popupStorageAdapter`: reads and writes Chrome local storage settings.
- `popupTabAdapter`: queries active tab and handles tab messaging.
- `popupTelemetryAdapter`: connects to the active content script telemetry port.
- `popupActions`: maps UI actions to settings changes and content-script commands.

Visual components receive plain props and emit plain events. They should not call `chrome.*`, `browser.*`, or tab ports directly.

## Behavior Preservation

The migration must preserve:

- Popup enable and disable behavior.
- Existing settings writes for sounded speed, silence speed, margins, volume threshold, and simple slider behavior.
- Existing hotkey integration where the popup currently depends on it.
- Existing local file player entry point.
- Existing content-script telemetry display where useful.
- Weekly milestone scorecard behavior from the approved scorecard design.

If the first implementation cannot safely migrate every advanced setting into the new sheet, it may keep a temporary compatibility route to the existing options page.

## Timeline Canvas

Replace the popup's SmoothieChart dependency with a purpose-built canvas component.

The canvas should render only what the popup needs:

- recent volume or sound/silence state
- threshold line
- current playback/skip region marker
- stable empty/loading state

It should stop rendering when the popup unmounts and must not keep animation loops or tab ports alive after close.

## Copy And Tone

Visible popup copy should be concise and concrete.

Preferred examples:

- `Enabled`
- `1.5x`
- `Saved this week`
- `0s`
- `Lifetime`
- `Next: 15 min`
- `No video detected`
- `Open file`

Avoid:

- helper-heavy explanations
- technical implementation labels
- defensive copy
- fake urgency
- playful labels that obscure function

## Build Migration

Migrate extension UI build to Vite incrementally.

The first implementation should prioritize popup build output and Chromium loadability. If content scripts, background scripts, or options still require Webpack during the first pass, the implementation plan should explicitly define whether Vite replaces Webpack all at once or runs alongside it temporarily.

The final target is one maintainable extension build path for Chromium alpha builds.

## Error And Edge Cases

- If no active media is available, show a clean no-video state and keep settings accessible.
- If telemetry is delayed, show a stable loading state without layout jumps.
- If content-script connection fails, show a compact unavailable state and a retry action.
- If saved-time data is missing, show zeros and the next milestone without broken labels.
- If canvas data is unavailable, render an empty timeline state rather than throwing.
- If the popup closes during async import, storage, or port setup, cleanup must run without console errors.

## Testing And Verification

Minimum implementation gates:

- Unit tests for popup state derivation and intensity-to-settings mapping.
- Existing weekly scorecard tests still pass.
- Typecheck passes.
- Lint passes.
- Chromium extension build passes.
- `verify:chromium` passes.
- Manual load of `dist-chromium` in Chrome works.
- Manual fixture page opens and popup attaches to video.
- Popup can be opened and closed repeatedly without console errors.
- Previous Smoothie/preload console issue does not return.
- Screenshot review confirms no overlap, clipping, unreadable text, or debug-looking chart.

Follow-up gates after baseline parity:

- Browser automation for popup open state against `docs/speedlayer/manual-test.html`.
- Bundle-size comparison before and after Vite migration.
- CPU check while popup is open on the manual fixture.

## Implementation Order

1. Add Vite/Svelte 5 build path for popup UI.
2. Create adapter layer around storage, tabs, telemetry, and actions.
3. Build new popup component tree against mocked popup state.
4. Replace SmoothieChart with `TimelineCanvas`.
5. Wire components to real adapters.
6. Preserve or redirect advanced settings behavior.
7. Build Chromium output and manually verify in Chrome.
8. Remove obsolete popup-specific Webpack/Svelte 4 code after parity is confirmed.

## Open Decisions

No product direction remains open.

The implementation plan must decide whether Vite replaces the full extension build immediately or whether the first pass uses a temporary hybrid build. That decision should be based on build complexity discovered during implementation planning, not preference.
