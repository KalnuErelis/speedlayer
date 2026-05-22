import { describe, expect, it } from "vitest";
import {
  simpleSliderDefaultValue,
  simpleSliderToSettings,
} from "@/entry-points/popup/state/intensitySettings";

describe("simpleSliderToSettings", () => {
  it("starts new users with the tuned middle profile", () => {
    expect(simpleSliderDefaultValue).toBe(50);
    expect(simpleSliderToSettings(simpleSliderDefaultValue)).toEqual({
      volumeThreshold: 0.004,
      silenceSpeedRaw: 2.075,
      marginAfter: 0.12,
    });
  });

  it("maps the least aggressive slider value", () => {
    expect(simpleSliderToSettings(0)).toEqual({
      volumeThreshold: 0.002,
      silenceSpeedRaw: 1.35,
      marginAfter: 0.18,
    });
  });

  it("maps the most aggressive slider value", () => {
    expect(simpleSliderToSettings(100)).toEqual({
      volumeThreshold: 0.006,
      silenceSpeedRaw: 2.8,
      marginAfter: 0.06,
    });
  });

  it("clamps impossible slider values", () => {
    expect(simpleSliderToSettings(-50)).toEqual(simpleSliderToSettings(0));
    expect(simpleSliderToSettings(150)).toEqual(simpleSliderToSettings(100));
  });

  it("rounds midpoint settings to stable storage values", () => {
    expect(simpleSliderToSettings(33.333)).toEqual({
      volumeThreshold: 0.00333,
      silenceSpeedRaw: 1.83333,
      marginAfter: 0.14,
    });
  });
});
