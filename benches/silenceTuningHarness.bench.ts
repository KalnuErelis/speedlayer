import { bench, describe } from "vitest";
import {
  detectSilenceRanges,
  synthesizeSegmentedFixture,
  type DetectorProfile,
} from "../src/helpers/silenceTuningHarness";
import { getMusicAwareSilenceVolumeThreshold } from "../src/helpers/musicAwareSilenceThreshold";
import { simpleSliderDefaultValue, simpleSliderToSettings } from "../src/settings/simpleSliderTuning";

const tunedSettings = simpleSliderToSettings(simpleSliderDefaultValue);

const profile: DetectorProfile = {
  volumeThreshold: tunedSettings.volumeThreshold,
  maxSilenceVolumeThreshold: getMusicAwareSilenceVolumeThreshold(tunedSettings.volumeThreshold),
  minimumSilenceSeconds: tunedSettings.marginAfter,
  marginBeforeSeconds: 0,
  marginAfterSeconds: tunedSettings.marginAfter,
  smoothingWindowSeconds: 0.02,
};

const fixtures = [
  synthesizeSegmentedFixture({
    sampleRate: 8_000,
    segments: [
      { label: "speech", durationSeconds: 12, amplitude: 0.16 },
      { label: "silence", durationSeconds: 1.1, amplitude: 0.0005 },
      { label: "speech", durationSeconds: 10, amplitude: 0.14 },
      { label: "silence", durationSeconds: 0.8, amplitude: 0.0035 },
      { label: "speech", durationSeconds: 14, amplitude: 0.12 },
    ],
  }),
  synthesizeSegmentedFixture({
    sampleRate: 8_000,
    segments: [
      { label: "speech", durationSeconds: 8, amplitude: 0.009 },
      { label: "silence", durationSeconds: 0.75, amplitude: 0.001 },
      { label: "speech", durationSeconds: 9, amplitude: 0.0085 },
      { label: "silence", durationSeconds: 0.55, amplitude: 0.0015 },
      { label: "speech", durationSeconds: 11, amplitude: 0.011 },
    ],
  }),
];

describe("silence tuning harness", () => {
  bench("detect synthetic lecture silence", () => {
    for (const fixture of fixtures) {
      detectSilenceRanges(fixture.samples, fixture.sampleRate, profile);
    }
  });
});
