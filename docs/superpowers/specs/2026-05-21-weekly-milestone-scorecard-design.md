# Weekly Milestone Scorecard Design

Date: 2026-05-21
Project: SpeedLayer
Status: Approved direction, pending implementation plan

## Goal

Add a calm, playful-productivity layer to SpeedLayer that makes saved time feel visible and satisfying without interrupting video watching.

The first gamification feature is a weekly time-saved scorecard with lifetime milestones. It should feel useful first and fun second.

## Non-Goals

- No XP system.
- No leaderboards.
- No streaks.
- No social sharing.
- No page overlay celebration.
- No autoplay animation over the video.
- No milestone types other than time saved in v1.

## User Experience

The scorecard appears inside the SpeedLayer popup.

Primary fields:

- This week: total time saved during the current weekly window.
- Best day: weekday with the most saved time in the current weekly window.
- Lifetime: total time saved across all tracked usage.
- Next milestone: the next lifetime saved-time milestone.

Example:

```text
This week
43 min saved

Best day: Tuesday, 18 min
Lifetime: 1h 12m
Next milestone: 2h saved
```

The feature must not interrupt playback. If a milestone is crossed while the user is watching a video, the popup can show the unlocked state next time it is opened.

## Milestones

Milestones are based only on lifetime time saved.

Initial thresholds:

- 15 minutes
- 1 hour
- 2 hours
- 5 hours
- 10 hours
- 24 hours
- Every additional 24 hours after that

The UI should show the next threshold, not a full achievement list in v1.

## Weekly Window

The weekly score resets each Monday.

Implementation should define week boundaries using the user's local browser timezone. The stored data should be robust enough that changing timezone does not corrupt lifetime totals.

## Data Model

Existing lifetime time-saved tracking should remain the source for lifetime totals where possible.

New weekly recap state should track enough daily aggregates to compute:

- saved seconds for the current week
- saved seconds per day in the current week
- best day label and amount
- current next milestone
- whether a milestone was newly crossed since the last popup view

Store only local extension state. Do not transmit recap or milestone data.

## Display Rules

The scorecard should be visible in the popup without requiring a separate settings page.

If there is no meaningful saved time yet, show an empty state with a concrete next step:

```text
No saved time yet
Play a video with SpeedLayer enabled.
```

When weekly saved time is non-zero, show the scorecard.

When a lifetime milestone is newly crossed, show a compact "Milestone reached" marker in the popup scorecard. It should be dismissible or become normal after the user has seen it once.

## Tone

Tone should be concise and adult:

- Good: `43 min saved`, `Next milestone: 2h saved`
- Good: `Best day: Tuesday, 18 min`
- Avoid: XP, coins, ranks, competitive copy, guilt, fake urgency
- Avoid: jokey labels in v1

The feature should make the extension feel rewarding, not needy.

## Error And Edge Cases

- If weekly aggregate data is missing but lifetime data exists, show lifetime and next milestone, and start weekly tracking from the current week.
- If time-saved data is unavailable, hide the scorecard rather than showing broken values.
- Clamp or ignore impossible values using the existing sanity checks around time-saved tracking.
- If the user clears extension data, both weekly and lifetime scorecard data reset.

## Testing

Minimum verification for implementation:

- Unit test milestone threshold selection.
- Unit test weekly aggregate reset at Monday boundary.
- Unit test best-day calculation.
- Unit test formatting for minutes and hours.
- Browser/manual test: saved time appears in popup after fixture playback.
- Browser/manual test: no page overlay appears when a milestone is crossed.
- Regression test or manual proof that existing time-saved values still update.

## Open Decisions

No product decisions remain open for v1.

Implementation may choose the exact internal storage shape, but it must preserve the behavior described above.
