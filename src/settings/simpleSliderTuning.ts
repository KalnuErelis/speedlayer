export const simpleSliderDefaultValue = 50;

export type IntensitySettings = {
  volumeThreshold: number;
  silenceSpeedRaw: number;
  marginAfter: number;
};

export function simpleSliderToSettings(rawSimpleSlider: number): IntensitySettings {
  const simpleSlider = clamp(rawSimpleSlider, 0, 100);

  return {
    volumeThreshold: roundSetting(0.0015 + 0.000025 * simpleSlider),
    silenceSpeedRaw: roundSetting(1.3 + 0.011 * simpleSlider),
    marginAfter: roundSetting(0.2 - 0.0012 * simpleSlider),
  };
}

function roundSetting(value: number): number {
  return Math.round(value * 100_000) / 100_000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
