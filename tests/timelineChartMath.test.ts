import { describe, expect, it } from "vitest";

import {
  getTimelineMaxVolume,
  getTimelineStrokeY,
  getTimelineValueY,
} from "@/entry-points/popup/state/timelineChartMath";

describe("timeline chart math", () => {
  it("keeps the default threshold line at the target height", () => {
    const maxVolume = getTimelineMaxVolume(0.01, [0.001, 0.005, 0.01]);

    expect(getTimelineValueY({ value: 0.01, maxVolume, heightPx: 100 })).toBeCloseTo(72);
    expect(getTimelineStrokeY({ value: 0.01, maxVolume, heightPx: 100 })).toBe(72.5);
  });

  it("moves the threshold line onto the same scale as high-volume samples", () => {
    const maxVolume = getTimelineMaxVolume(0.01, [0.25]);

    expect(maxVolume).toBe(0.25);
    expect(getTimelineValueY({ value: 0.01, maxVolume, heightPx: 100 })).toBeCloseTo(96);
    expect(getTimelineStrokeY({ value: 0.01, maxVolume, heightPx: 100 })).toBe(96.5);
  });
});
