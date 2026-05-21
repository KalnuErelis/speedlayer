import { describe, expect, it } from "vitest";
import { filterOutLocalStorageOnlySettings } from "@/settings/filterOutLocalStorageOnlySettings";

describe("settings storage scope", () => {
  it("keeps per-video saved-time history out of sync exports", () => {
    expect(filterOutLocalStorageOnlySettings({
      enabled: true,
      videoTimeSavedLeaderboard: [{
        id: "url:https://example.com/course/lesson",
        title: "Lesson",
        url: "https://example.com/course/lesson",
        savedSeconds: 12,
        lastSavedAt: 100,
      }],
    })).toEqual({
      enabled: true,
    });
  });
});
