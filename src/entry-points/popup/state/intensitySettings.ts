import { clamp } from "../../../helpers/clamp";

export type IntensitySettings = {
  volumeThreshold: number;
  silenceSpeedRaw: number;
  marginAfter: number;
};

export function simpleSliderToSettings(rawSimpleSlider: number): IntensitySettings {
  const simpleSlider = clamp(rawSimpleSlider, 0, 100);

  return {
    volumeThreshold: roundSetting(0.001 + 0.00015 * simpleSlider),
    silenceSpeedRaw: roundSetting(1.5 + 0.02 * simpleSlider),
    marginAfter: roundSetting(0.03 + 0.002 * (100 - simpleSlider)),
  };
}

function roundSetting(value: number): number {
  return Math.round(value * 100_000) / 100_000;
}
