import { describe, expect, it } from "vitest";
import {
  createCurrentVideoSavedSecondsReader,
  createSavedSecondsTickerState,
  getSavedSecondsForCurrentVideo,
} from "@/entry-points/content/savedSecondsTicker";
import type { VideoTimeSavedEntry, VideoTimeSavedIdentity } from "@/helpers/videoTimeSavedLeaderboard";

describe("createSavedSecondsTickerState", () => {
  it("shows saved seconds with millisecond precision while time is increasing", () => {
    expect(createSavedSecondsTickerState({
      savedSeconds: 12.3456,
    })).toEqual({
      label: "+12.346s",
      visible: true,
    });
  });

  it("keeps the ticker visible when saved time is not increasing", () => {
    expect(createSavedSecondsTickerState({
      savedSeconds: 12.3,
    })).toEqual({
      label: "+12.300s",
      visible: true,
    });
  });

  it("combines the stored video total with the current session", () => {
    expect(getSavedSecondsForCurrentVideo({
      entries: [
        {
          id: "youtube:other",
          title: "Other",
          url: "https://www.youtube.com/watch?v=other",
          savedSeconds: 99,
          lastSavedAt: 1,
        },
        {
          id: "youtube:lecture",
          title: "Lecture",
          url: "https://www.youtube.com/watch?v=lecture",
          savedSeconds: 15.25,
          lastSavedAt: 2,
        },
      ],
      identity: {
        id: "youtube:lecture",
        title: "Lecture",
        url: "https://www.youtube.com/watch?v=lecture",
      },
      currentSessionSavedSeconds: 2.125,
      savedSecondsAtVideoStart: 15.25,
      sessionSavedSecondsAtVideoStart: 0,
    })).toBe(17.375);
  });

  it("does not double count current session time after it is persisted", () => {
    expect(getSavedSecondsForCurrentVideo({
      entries: [{
        id: "youtube:lecture",
        title: "Lecture",
        url: "https://www.youtube.com/watch?v=lecture",
        savedSeconds: 25,
        lastSavedAt: 2,
      }],
      identity: {
        id: "youtube:lecture",
        title: "Lecture",
        url: "https://www.youtube.com/watch?v=lecture",
      },
      currentSessionSavedSeconds: 10,
      savedSecondsAtVideoStart: 15,
      sessionSavedSecondsAtVideoStart: 0,
    })).toBe(25);
  });

  it("resets the current-session baseline when the current video changes", () => {
    let entries: VideoTimeSavedEntry[] = [{
      id: "youtube:first",
      title: "First",
      url: "https://www.youtube.com/watch?v=first",
      savedSeconds: 20,
      lastSavedAt: 1,
    }, {
      id: "youtube:second",
      title: "Second",
      url: "https://www.youtube.com/watch?v=second",
      savedSeconds: 5,
      lastSavedAt: 2,
    }];
    let identity: VideoTimeSavedIdentity = {
      id: "youtube:first",
      title: "First",
      url: "https://www.youtube.com/watch?v=first",
    };
    let currentSessionSavedSeconds = 3;
    const readSavedSeconds = createCurrentVideoSavedSecondsReader({
      getEntries: () => entries,
      getIdentity: () => identity,
      getCurrentSessionSavedSeconds: () => currentSessionSavedSeconds,
    });

    expect(readSavedSeconds()).toBe(20);

    identity = {
      id: "youtube:second",
      title: "Second",
      url: "https://www.youtube.com/watch?v=second",
    };
    currentSessionSavedSeconds = 4.5;
    expect(readSavedSeconds()).toBe(5);

    currentSessionSavedSeconds = 6;
    expect(readSavedSeconds()).toBe(6.5);

    entries = [{
      id: "youtube:second",
      title: "Second",
      url: "https://www.youtube.com/watch?v=second",
      savedSeconds: 6.5,
      lastSavedAt: 3,
    }];
    expect(readSavedSeconds()).toBe(6.5);
  });
});
