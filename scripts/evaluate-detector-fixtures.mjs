import {
  detectSilenceRanges,
  evaluateSilenceDetection,
  synthesizeSegmentedFixture,
} from "../src/helpers/silenceTuningHarness.ts";
import {
  simpleSliderDefaultValue,
  simpleSliderToSettings,
} from "../src/settings/simpleSliderTuning.ts";

const tunedSettings = simpleSliderToSettings(simpleSliderDefaultValue);

const baselineProfile = {
  volumeThreshold: tunedSettings.volumeThreshold,
  minimumSilenceSeconds: tunedSettings.marginAfter,
  marginBeforeSeconds: 0,
  marginAfterSeconds: tunedSettings.marginAfter,
  smoothingWindowSeconds: 0.02,
};

const fixtureInputs = [
  {
    name: "clean lecture pause",
    input: {
      sampleRate: 8_000,
      segments: [
        { label: "speech", durationSeconds: 2.2, amplitude: 0.16 },
        { label: "silence", durationSeconds: 1.1, amplitude: 0.0005 },
        { label: "speech", durationSeconds: 2.1, amplitude: 0.14 },
      ],
    },
  },
  {
    name: "room noise pause",
    input: {
      sampleRate: 8_000,
      segments: [
        { label: "speech", durationSeconds: 1.8, amplitude: 0.12 },
        { label: "silence", durationSeconds: 0.9, amplitude: 0.0035 },
        { label: "speech", durationSeconds: 1.7, amplitude: 0.10 },
      ],
    },
  },
  {
    name: "quiet speaker",
    input: {
      sampleRate: 8_000,
      segments: [
        { label: "speech", durationSeconds: 1.4, amplitude: 0.009 },
        { label: "silence", durationSeconds: 0.75, amplitude: 0.001 },
        { label: "speech", durationSeconds: 1.6, amplitude: 0.0085 },
      ],
    },
  },
  {
    name: "short hesitation",
    input: {
      sampleRate: 8_000,
      segments: [
        { label: "speech", durationSeconds: 1.2, amplitude: 0.14 },
        { label: "silence", durationSeconds: 0.06, amplitude: 0.0005 },
        { label: "speech", durationSeconds: 1.2, amplitude: 0.14 },
      ],
    },
  },
];

console.log("Detector tuning profile");
console.log(`simpleSlider=${simpleSliderDefaultValue}`);
console.log(`threshold=${baselineProfile.volumeThreshold}`);
console.log(
  `minimumSilence=${baselineProfile.minimumSilenceSeconds}s margins=${baselineProfile.marginAfterSeconds}s/${baselineProfile.marginBeforeSeconds}s`
);

for (const fixtureInput of fixtureInputs) {
  const fixture = synthesizeSegmentedFixture(fixtureInput.input);
  const detectedSilenceRanges = detectSilenceRanges(
    fixture.samples,
    fixture.sampleRate,
    baselineProfile
  );
  const metrics = evaluateSilenceDetection({
    expectedSilenceRanges: fixture.expectedSilenceRanges,
    detectedSilenceRanges,
  });

  console.log(
    [
      fixtureInput.name,
      `expected=${formatSeconds(metrics.expectedSilenceSeconds)}`,
      `detected=${formatSeconds(metrics.detectedSilenceSeconds)}`,
      `correct=${formatSeconds(metrics.correctlyDetectedSilenceSeconds)}`,
      `missed=${formatSeconds(metrics.missedSilenceSeconds)}`,
      `clipped=${formatSeconds(metrics.clippedSpeechSeconds)}`,
    ].join(" | ")
  );
}

function formatSeconds(seconds) {
  return `${seconds.toFixed(3)}s`;
}
