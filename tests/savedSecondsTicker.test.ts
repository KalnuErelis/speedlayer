import { describe, expect, it } from "vitest";
import { createSavedSecondsTickerState } from "@/entry-points/content/savedSecondsTicker";

describe("createSavedSecondsTickerState", () => {
  it("shows saved seconds with millisecond precision while time is increasing", () => {
    expect(createSavedSecondsTickerState({
      savedSeconds: 12.3456,
      previousSavedSeconds: 12.3,
    })).toEqual({
      label: "+12.346s",
      visible: true,
    });
  });

  it("hides the ticker when saved time is not increasing", () => {
    expect(createSavedSecondsTickerState({
      savedSeconds: 12.3,
      previousSavedSeconds: 12.3,
    })).toEqual({
      label: "+12.300s",
      visible: false,
    });
  });
});
