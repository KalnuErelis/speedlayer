# SpeedLayer Project Direction

## Decision

SpeedLayer is a Chrome-first, AGPL-compatible fork direction based on Jump Cutter.

The goal is not to upstream a large rewrite into Jump Cutter. The goal is to build a credible open-source product with a clean runtime, public roadmap, and Chrome Web Store distribution under Jaunius' account.

## Positioning

Name: SpeedLayer

Tagline: Smart playback for web video

Description: An open-source Chrome extension for watching long-form web video faster with silence skipping and smarter playback controls.

First audience: YouTube lectures and course videos.

Broader audience: people who want to speed up long-form web video across sites.

## Constraints

- Keep AGPL-compatible licensing and attribution.
- Start Chrome-only.
- Do not optimize for Firefox/Gecko until Chrome v1 is stable.
- Prefer a clean v2 architecture over a giant upstream PR.
- Keep runtime behavior verifiable with synthetic media fixtures and browser tests.
- Treat Chrome Web Store publication as a product gate, not just a build artifact.

## Recommended Path

1. Keep the Jump Cutter fork history for attribution and provenance.
2. Create a clean SpeedLayer v2 branch.
3. Replace build/runtime structure incrementally instead of preserving the legacy architecture by default.
4. Preserve useful algorithm lessons from Jump Cutter, but rework lifecycle, storage, UI, and tests around SpeedLayer's product scope.

## Milestone 1

Reliable Chrome v1:

- Chrome MV3 only.
- Vite or equivalent modern build flow.
- One robust media attachment lifecycle with cancellable attach and detach.
- Per-tab enable and disable.
- Basic site/profile settings.
- YouTube and generic video support.
- Silence skipping with conservative defaults.
- Minimal popup with clear state and controls.
- Synthetic media test pages.
- Automated tests for attachment, playback-rate ownership, settings precedence, and silence skip behavior.

## Naming Risk

Do not publish as Smart Speed. SMART SPEED appears to be a live Overcast Radio, LLC trademark in a close software category.

Use SpeedLayer as the working product name, pending final availability checks before Chrome Web Store publication.

## Proof State

Local: this direction is recorded on a local branch only.

Pushed/PR: no fork, branch, or PR has been pushed.

Deployed: nothing published to Chrome Web Store.

Runtime: no SpeedLayer runtime exists yet.

Blocked proof: name availability, trademark clearance, Chrome Web Store approval, and production runtime behavior remain unverified.
