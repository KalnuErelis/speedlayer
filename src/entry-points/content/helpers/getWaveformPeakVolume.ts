export function getWaveformPeakVolume(samples: Float32Array): number {
  let peak = 0;

  for (let i = 0; i < samples.length; i += 1) {
    peak = Math.max(peak, Math.abs(samples[i]));
  }

  return peak;
}
