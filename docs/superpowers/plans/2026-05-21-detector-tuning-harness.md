# Detector Tuning Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, deterministic harness for scoring silence-detection changes before modifying the playback engine.

**Architecture:** Add a pure TypeScript helper that creates synthetic audio-volume fixtures, runs a simplified detector equivalent to the current RMS-volume plus silence-start/end logic, and scores detected ranges against expected silent ranges. Keep browser/worklet behavior unchanged in this first slice.

**Tech Stack:** TypeScript, Vitest, existing Yarn scripts, existing CodSpeed/Vitest benchmark setup.

---

### Task 1: Test The Harness Contract

**Files:**
- Create: `tests/silenceTuningHarness.test.ts`
- Modify: `package.json`
- Modify: `vitest.config.mts`

- [x] Add tests that require fixture synthesis, margin-aware range detection, and overlap scoring.
- [x] Add `corepack yarn test` as the focused unit-test gate.
- [x] Verify the test fails before implementation because `src/helpers/silenceTuningHarness.ts` does not exist.

### Task 2: Implement The Pure Harness

**Files:**
- Create: `src/helpers/silenceTuningHarness.ts`

- [x] Implement segmented fixture synthesis.
- [x] Implement silence range detection with threshold, minimum silence duration, and margins.
- [x] Implement range scoring for correct silence, missed silence, and false-positive speech clipping.
- [x] Verify `corepack yarn test tests/silenceTuningHarness.test.ts` passes.

### Task 3: Add Repeatable Evaluation Output

**Files:**
- Create: `scripts/evaluate-detector-fixtures.mjs`
- Create: `benches/silenceTuningHarness.bench.ts`
- Modify: `package.json`

- [x] Add a local script that prints compact fixture metrics for the baseline detector profile.
- [x] Add a CodSpeed-compatible benchmark for fixture detection throughput.
- [x] Verify `corepack yarn tune:detector` and `corepack yarn bench` pass.

### Task 4: Closeout

**Files:**
- Modify: none expected.

- [x] Run lint, TypeScript, Svelte check, Chromium build, Chromium verifier, and Codex review.
- [ ] Commit and push the tuning harness.
