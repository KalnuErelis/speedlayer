# Weekly Milestone Scorecard Implementation Plan

Date: 2026-05-21
Status: Implemented locally

## Scope

Implement the approved local weekly milestone scorecard in the Chrome extension popup.

This plan intentionally does not implement the public opt-in leaderboard backend. The leaderboard is approved product direction, but it requires identity, publishing consent, abuse controls, storage, and privacy-policy work.

## Tasks

1. Add a pure scorecard helper.
   - Define local-week identifiers with Monday as the first day.
   - Update daily saved-time aggregates from stored deltas.
   - Compute weekly total, best day, lifetime milestone, and new milestone state.
   - Format saved-time labels for minutes and hours.

2. Persist weekly recap data locally.
   - Add typed settings fields for weekly saved-time state and last seen milestone.
   - Add default settings.
   - Update lifetime time-saved persistence so each sane saved-time delta also updates the current local week/day aggregate.

3. Render the popup scorecard.
   - Add the new settings to the popup required settings shape.
   - Add a compact scorecard under the existing time-saved readout.
   - Show an empty state when there is no saved time yet.
   - Mark a newly crossed milestone in the popup.

4. Add focused verification.
   - Add a script that verifies milestone threshold selection, Monday week reset, best-day calculation, and formatting.
   - Run lint, TypeScript, Svelte check, Chromium build, Chromium artifact verifier, focused scorecard verifier, Codex review, and rendered UI checks as practical.

## Acceptance Criteria

- Saved time continues to update existing lifetime counters.
- New weekly saved-time state is local-only.
- Popup shows weekly total, best day, lifetime, and next milestone.
- New milestone marker appears only when the stored lifetime crosses a new threshold not yet seen by the popup.
- The extension builds as a Chromium unpacked extension.
