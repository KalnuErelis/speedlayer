import { describe, expect, it } from "vitest";
import { simpleSliderToSettings } from "../src/entry-points/popup/state/intensitySettings";

describe("simpleSliderToSettings", () => {
  it("maps the least aggressive slider value", () => {
    expect(simpleSliderToSettings(0)).toEqual({
      volumeThreshold: 0.001,
      silenceSpeedRaw: 1.5,
      marginAfter: 0.23,
    });
  });

  it("maps the most aggressive slider value", () => {
    expect(simpleSliderToSettings(100)).toEqual({
      volumeThreshold: 0.016,
      silenceSpeedRaw: 3.5,
      marginAfter: 0.03,
    });
  });

  it("clamps impossible slider values", () => {
    expect(simpleSliderToSettings(-50)).toEqual(simpleSliderToSettings(0));
    expect(simpleSliderToSettings(150)).toEqual(simpleSliderToSettings(100));
  });
});
