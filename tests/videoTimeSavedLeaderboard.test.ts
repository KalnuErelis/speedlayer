import { describe, expect, it } from "vitest";
import {
  getCurrentVideoTimeSavedIdentity,
  updateVideoTimeSavedLeaderboard,
} from "@/helpers/videoTimeSavedLeaderboard";

describe("video time saved leaderboard", () => {
  it("canonicalizes YouTube videos by video id", () => {
    expect(getCurrentVideoTimeSavedIdentity({
      href: "https://www.youtube.com/watch?v=abc123&t=34s",
      title: "A Very Useful Lecture - YouTube",
    })).toEqual({
      id: "youtube:abc123",
      title: "A Very Useful Lecture",
      url: "https://www.youtube.com/watch?v=abc123",
    });
  });

  it("adds positive saved time deltas to the matching video", () => {
    const first = updateVideoTimeSavedLeaderboard([], {
      id: "youtube:abc123",
      title: "Lecture",
      url: "https://www.youtube.com/watch?v=abc123",
    }, 1.25, 100);

    expect(updateVideoTimeSavedLeaderboard(first, {
      id: "youtube:abc123",
      title: "Lecture, renamed",
      url: "https://www.youtube.com/watch?v=abc123",
    }, 2.5, 200)).toEqual([{
      id: "youtube:abc123",
      title: "Lecture, renamed",
      url: "https://www.youtube.com/watch?v=abc123",
      savedSeconds: 3.75,
      lastSavedAt: 200,
    }]);
  });

  it("ignores non-positive deltas", () => {
    const previous = [{
      id: "url:https://example.com/course/1",
      title: "Course",
      url: "https://example.com/course/1",
      savedSeconds: 3,
      lastSavedAt: 100,
    }];

    expect(updateVideoTimeSavedLeaderboard(previous, {
      id: "url:https://example.com/course/1",
      title: "Course",
      url: "https://example.com/course/1",
    }, 0)).toEqual(previous);
  });

  it("sorts by saved seconds and keeps the top ten", () => {
    const entries = Array.from({ length: 12 }, (_, index) => ({
      id: `video:${index}`,
      title: `Video ${index}`,
      url: `https://example.com/${index}`,
      savedSeconds: index,
      lastSavedAt: index,
    }));

    const updated = updateVideoTimeSavedLeaderboard(entries, {
      id: "video:new",
      title: "New winner",
      url: "https://example.com/new",
    }, 20, 20);

    expect(updated).toHaveLength(10);
    expect(updated[0]).toMatchObject({
      id: "video:new",
      savedSeconds: 20,
    });
    expect(updated.at(-1)?.savedSeconds).toBe(3);
  });
});
