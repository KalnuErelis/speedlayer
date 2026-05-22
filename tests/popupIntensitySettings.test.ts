import { describe, expect, it } from "vitest";
import {
  simpleSliderDefaultValue,
  simpleSliderToSettings,
} from "@/entry-points/popup/state/intensitySettings";

describe("simpleSliderToSettings", () => {
  it("starts new users with the tuned middle profile", () => {
    expect(simpleSliderDefaultValue).toBe(50);
    expect(simpleSliderToSettings(simpleSliderDefaultValue)).toEqual({
      volumeThreshold: 0.00275,
      silenceSpeedRaw: 1.85,
      marginAfter: 0.14,
    });
  });

  it("maps the least aggressive slider value", () => {
    expect(simpleSliderToSettings(0)).toEqual({
      volumeThreshold: 0.0015,
      silenceSpeedRaw: 1.3,
      marginAfter: 0.2,
    });
  });

  it("maps the most aggressive slider value", () => {
    expect(simpleSliderToSettings(100)).toEqual({
      volumeThreshold: 0.004,
      silenceSpeedRaw: 2.4,
      marginAfter: 0.08,
    });
  });

  it("clamps impossible slider values", () => {
    expect(simpleSliderToSettings(-50)).toEqual(simpleSliderToSettings(0));
    expect(simpleSliderToSettings(150)).toEqual(simpleSliderToSettings(100));
  });

  it("rounds midpoint settings to stable storage values", () => {
    expect(simpleSliderToSettings(33.333)).toEqual({
      volumeThreshold: 0.00233,
      silenceSpeedRaw: 1.66666,
      marginAfter: 0.16,
    });
  });

  it("keeps the most aggressive threshold below quiet speech-risk territory", () => {
    expect(simpleSliderToSettings(100).volumeThreshold).toBeLessThanOrEqual(0.004);
  });
});
