import { describe, expect, it } from "vitest";
import { isLikelyLiveMediaElement } from "@/entry-points/content/helpers/isLikelyLiveMediaElement";

describe("isLikelyLiveMediaElement", () => {
  it("treats infinite-duration media as live", () => {
    expect(isLikelyLiveMediaElement({ duration: Infinity })).toBe(true);
  });

  it("does not treat finite or not-yet-known duration as live", () => {
    expect(isLikelyLiveMediaElement({ duration: 3_600 })).toBe(false);
    expect(isLikelyLiveMediaElement({ duration: Number.NaN })).toBe(false);
  });
});
