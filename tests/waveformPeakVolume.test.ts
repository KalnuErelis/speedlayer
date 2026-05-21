import { describe, expect, it } from "vitest";

import { getWaveformPeakVolume } from "@/entry-points/content/helpers/getWaveformPeakVolume";

describe("getWaveformPeakVolume", () => {
  it("uses the loudest absolute sample instead of the final sample", () => {
    expect(getWaveformPeakVolume(new Float32Array([0.02, -0.75, 0.1, 0]))).toBe(0.75);
  });

  it("returns zero for silent buffers", () => {
    expect(getWaveformPeakVolume(new Float32Array([0, -0, 0]))).toBe(0);
  });
});
