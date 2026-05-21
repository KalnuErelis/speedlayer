import { describe, expect, test } from "vitest";
import {
  detectSilenceRanges,
  evaluateSilenceDetection,
  synthesizeSegmentedFixture,
} from "../src/helpers/silenceTuningHarness";
import { getMusicAwareSilenceVolumeThreshold } from "../src/helpers/musicAwareSilenceThreshold";

describe("silence tuning harness", () => {
  test("synthesizes expected silence ranges from labeled segments", () => {
    const fixture = synthesizeSegmentedFixture({
      sampleRate: 1000,
      segments: [
        { label: "speech", durationSeconds: 1, amplitude: 0.20 },
        { label: "silence", durationSeconds: 0.8, amplitude: 0 },
        { label: "speech", durationSeconds: 1.2, amplitude: 0.18 },
      ],
    });

    expect(fixture.samples).toHaveLength(3000);
    expect(fixture.expectedSilenceRanges).toEqual([
      { startSeconds: 1, endSeconds: 1.8 },
    ]);
  });

  test("detects silence ranges with minimum duration and margins", () => {
    const fixture = synthesizeSegmentedFixture({
      sampleRate: 1000,
      segments: [
        { label: "speech", durationSeconds: 1, amplitude: 0.20 },
        { label: "silence", durationSeconds: 1, amplitude: 0 },
        { label: "speech", durationSeconds: 1, amplitude: 0.20 },
      ],
    });

    const ranges = detectSilenceRanges(fixture.samples, fixture.sampleRate, {
      volumeThreshold: 0.05,
      minimumSilenceSeconds: 0.1,
      marginBeforeSeconds: 0.07,
      marginAfterSeconds: 0.05,
    });

    expect(ranges).toEqual([
      { startSeconds: 1.05, endSeconds: 1.93 },
    ]);
  });

  test("treats quiet music beds as sounded when a silence floor is configured", () => {
    const fixture = synthesizeSegmentedFixture({
      sampleRate: 1000,
      segments: [
        { label: "speech", durationSeconds: 1, amplitude: 0.20 },
        { label: "silence", durationSeconds: 1, amplitude: 0.006 },
        { label: "speech", durationSeconds: 1, amplitude: 0.20 },
      ],
    });

    const ranges = detectSilenceRanges(fixture.samples, fixture.sampleRate, {
      volumeThreshold: 0.01,
      maxSilenceVolumeThreshold: getMusicAwareSilenceVolumeThreshold(0.01),
      minimumSilenceSeconds: 0.1,
      marginBeforeSeconds: 0,
      marginAfterSeconds: 0,
    });

    expect(ranges).toEqual([]);
  });

  test("still detects true near-silence below the silence floor", () => {
    const fixture = synthesizeSegmentedFixture({
      sampleRate: 1000,
      segments: [
        { label: "speech", durationSeconds: 1, amplitude: 0.20 },
        { label: "silence", durationSeconds: 1, amplitude: 0.001 },
        { label: "speech", durationSeconds: 1, amplitude: 0.20 },
      ],
    });

    const ranges = detectSilenceRanges(fixture.samples, fixture.sampleRate, {
      volumeThreshold: 0.01,
      maxSilenceVolumeThreshold: getMusicAwareSilenceVolumeThreshold(0.01),
      minimumSilenceSeconds: 0.1,
      marginBeforeSeconds: 0,
      marginAfterSeconds: 0,
    });

    expect(ranges).toEqual([
      { startSeconds: 1, endSeconds: 2 },
    ]);
  });

  test("does not end silence on isolated loud clicks", () => {
    const fixture = synthesizeSegmentedFixture({
      sampleRate: 1000,
      segments: [
        { label: "speech", durationSeconds: 1, amplitude: 0.20 },
        { label: "silence", durationSeconds: 0.5, amplitude: 0.001 },
        { label: "silence", durationSeconds: 0.01, amplitude: 0.10 },
        { label: "silence", durationSeconds: 0.5, amplitude: 0.001 },
        { label: "speech", durationSeconds: 1, amplitude: 0.20 },
      ],
    });

    const ranges = detectSilenceRanges(fixture.samples, fixture.sampleRate, {
      volumeThreshold: 0.01,
      maxSilenceVolumeThreshold: getMusicAwareSilenceVolumeThreshold(0.01),
      loudDurationThresholdSeconds: 0.015,
      minimumSilenceSeconds: 0.1,
      marginBeforeSeconds: 0,
      marginAfterSeconds: 0,
    });

    expect(ranges).toEqual([
      { startSeconds: 1, endSeconds: 2.01 },
    ]);
  });

  test("scores missed silence and clipped speech", () => {
    const metrics = evaluateSilenceDetection({
      expectedSilenceRanges: [
        { startSeconds: 1, endSeconds: 2 },
      ],
      detectedSilenceRanges: [
        { startSeconds: 0.8, endSeconds: 1.7 },
      ],
    });

    expect(metrics).toEqual({
      expectedSilenceSeconds: 1,
      detectedSilenceSeconds: 0.9,
      correctlyDetectedSilenceSeconds: 0.7,
      missedSilenceSeconds: 0.3,
      clippedSpeechSeconds: 0.2,
    });
  });
});
