export interface SilenceRange {
  startSeconds: number;
  endSeconds: number;
}

export interface FixtureSegment {
  label: "speech" | "silence";
  durationSeconds: number;
  amplitude: number;
}

export interface SegmentedFixtureInput {
  sampleRate: number;
  segments: FixtureSegment[];
}

export interface SegmentedFixture {
  sampleRate: number;
  samples: Float32Array;
  expectedSilenceRanges: SilenceRange[];
}

export interface DetectorProfile {
  volumeThreshold: number;
  maxSilenceVolumeThreshold?: number;
  minimumSilenceSeconds: number;
  marginBeforeSeconds: number;
  marginAfterSeconds: number;
  smoothingWindowSeconds?: number;
}

export interface SilenceDetectionMetrics {
  expectedSilenceSeconds: number;
  detectedSilenceSeconds: number;
  correctlyDetectedSilenceSeconds: number;
  missedSilenceSeconds: number;
  clippedSpeechSeconds: number;
}

const roundSeconds = (value: number): number =>
  Math.round(value * 1_000_000) / 1_000_000;

export function synthesizeSegmentedFixture(
  input: SegmentedFixtureInput
): SegmentedFixture {
  const samples: number[] = [];
  const expectedSilenceRanges: SilenceRange[] = [];

  for (const segment of input.segments) {
    const segmentStartSample = samples.length;
    const segmentSampleCount = Math.round(
      segment.durationSeconds * input.sampleRate
    );

    for (let i = 0; i < segmentSampleCount; i += 1) {
      samples.push(segment.amplitude);
    }

    if (segment.label === "silence") {
      expectedSilenceRanges.push({
        startSeconds: roundSeconds(segmentStartSample / input.sampleRate),
        endSeconds: roundSeconds(samples.length / input.sampleRate),
      });
    }
  }

  return {
    sampleRate: input.sampleRate,
    samples: Float32Array.from(samples),
    expectedSilenceRanges,
  };
}

export function detectSilenceRanges(
  samples: Float32Array,
  sampleRate: number,
  profile: DetectorProfile
): SilenceRange[] {
  const minimumSilenceSamples = Math.max(
    1,
    Math.round(profile.minimumSilenceSeconds * sampleRate)
  );
  const volumes = getVolumes(
    samples,
    sampleRate,
    profile.smoothingWindowSeconds ?? 0
  );
  const maxSilenceVolumeThreshold =
    profile.maxSilenceVolumeThreshold ?? profile.volumeThreshold;
  const ranges: SilenceRange[] = [];
  let quietRunStartSample: number | undefined;
  let activeSilenceStartSeconds: number | undefined;

  for (let sampleIndex = 0; sampleIndex < volumes.length; sampleIndex += 1) {
    const isLoud = volumes[sampleIndex] >= maxSilenceVolumeThreshold;

    if (isLoud) {
      if (activeSilenceStartSeconds != undefined) {
        pushMarginAdjustedRange(
          ranges,
          activeSilenceStartSeconds,
          sampleIndex / sampleRate,
          profile
        );
        activeSilenceStartSeconds = undefined;
      }

      quietRunStartSample = undefined;
      continue;
    }

    quietRunStartSample ??= sampleIndex;

    if (
      activeSilenceStartSeconds == undefined &&
      sampleIndex - quietRunStartSample + 1 >= minimumSilenceSamples
    ) {
      activeSilenceStartSeconds = quietRunStartSample / sampleRate;
    }
  }

  if (activeSilenceStartSeconds != undefined) {
    pushMarginAdjustedRange(
      ranges,
      activeSilenceStartSeconds,
      samples.length / sampleRate,
      profile
    );
  }

  return ranges;
}

export function evaluateSilenceDetection(input: {
  expectedSilenceRanges: SilenceRange[];
  detectedSilenceRanges: SilenceRange[];
}): SilenceDetectionMetrics {
  const expected = normalizeRanges(input.expectedSilenceRanges);
  const detected = normalizeRanges(input.detectedSilenceRanges);
  const expectedSilenceSeconds = sumRanges(expected);
  const detectedSilenceSeconds = sumRanges(detected);
  const correctlyDetectedSilenceSeconds = getIntersectionDuration(
    expected,
    detected
  );

  return {
    expectedSilenceSeconds: roundSeconds(expectedSilenceSeconds),
    detectedSilenceSeconds: roundSeconds(detectedSilenceSeconds),
    correctlyDetectedSilenceSeconds: roundSeconds(correctlyDetectedSilenceSeconds),
    missedSilenceSeconds: roundSeconds(
      expectedSilenceSeconds - correctlyDetectedSilenceSeconds
    ),
    clippedSpeechSeconds: roundSeconds(
      detectedSilenceSeconds - correctlyDetectedSilenceSeconds
    ),
  };
}

function getVolumes(
  samples: Float32Array,
  sampleRate: number,
  smoothingWindowSeconds: number
): Float32Array {
  const smoothingWindowSamples = Math.max(
    1,
    Math.round(smoothingWindowSeconds * sampleRate)
  );

  if (smoothingWindowSamples === 1) {
    return Float32Array.from(samples, (sample) => Math.abs(sample));
  }

  const volumes = new Float32Array(samples.length);
  let windowSquaresSum = 0;

  for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
    const sample = samples[sampleIndex];
    windowSquaresSum += sample * sample;

    const sampleLeavingWindowIndex = sampleIndex - smoothingWindowSamples;
    if (sampleLeavingWindowIndex >= 0) {
      const sampleLeavingWindow = samples[sampleLeavingWindowIndex];
      windowSquaresSum -= sampleLeavingWindow * sampleLeavingWindow;
    }

    const divisor = Math.min(sampleIndex + 1, smoothingWindowSamples);
    volumes[sampleIndex] = Math.sqrt(Math.max(0, windowSquaresSum) / divisor);
  }

  return volumes;
}

function pushMarginAdjustedRange(
  ranges: SilenceRange[],
  rawStartSeconds: number,
  rawEndSeconds: number,
  profile: DetectorProfile
) {
  const startSeconds = roundSeconds(rawStartSeconds + profile.marginAfterSeconds);
  const endSeconds = roundSeconds(rawEndSeconds - profile.marginBeforeSeconds);

  if (endSeconds > startSeconds) {
    ranges.push({ startSeconds, endSeconds });
  }
}

function normalizeRanges(ranges: SilenceRange[]): SilenceRange[] {
  const sortedRanges = ranges
    .filter((range) => range.endSeconds > range.startSeconds)
    .map((range) => ({
      startSeconds: range.startSeconds,
      endSeconds: range.endSeconds,
    }))
    .sort((a, b) => a.startSeconds - b.startSeconds);
  const normalized: SilenceRange[] = [];

  for (const range of sortedRanges) {
    const previousRange = normalized[normalized.length - 1];

    if (!previousRange || range.startSeconds > previousRange.endSeconds) {
      normalized.push(range);
      continue;
    }

    previousRange.endSeconds = Math.max(
      previousRange.endSeconds,
      range.endSeconds
    );
  }

  return normalized;
}

function sumRanges(ranges: SilenceRange[]): number {
  return ranges.reduce(
    (sum, range) => sum + range.endSeconds - range.startSeconds,
    0
  );
}

function getIntersectionDuration(
  leftRanges: SilenceRange[],
  rightRanges: SilenceRange[]
): number {
  let leftIndex = 0;
  let rightIndex = 0;
  let intersectionSeconds = 0;

  while (leftIndex < leftRanges.length && rightIndex < rightRanges.length) {
    const leftRange = leftRanges[leftIndex];
    const rightRange = rightRanges[rightIndex];
    const intersectionStart = Math.max(
      leftRange.startSeconds,
      rightRange.startSeconds
    );
    const intersectionEnd = Math.min(
      leftRange.endSeconds,
      rightRange.endSeconds
    );

    if (intersectionEnd > intersectionStart) {
      intersectionSeconds += intersectionEnd - intersectionStart;
    }

    if (leftRange.endSeconds < rightRange.endSeconds) {
      leftIndex += 1;
    } else {
      rightIndex += 1;
    }
  }

  return intersectionSeconds;
}
