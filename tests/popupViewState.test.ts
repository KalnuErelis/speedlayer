import { describe, expect, it } from "vitest";
import { createPopupViewState } from "@/entry-points/popup/state/popupViewState";

describe("createPopupViewState", () => {
  it("shows a loading state before the connection resolves", () => {
    expect(createPopupViewState({
      settings: {
        enabled: true,
        simpleSlider: 50,
        soundedSpeed: 1.5,
        weeklyTimeSavedComparedToSoundedSpeed: 0,
        lifetimeTimeSavedComparedToSoundedSpeed: 60,
        timeSavedLastSeenLifetimeMilestoneSeconds: 0,
        videoTimeSavedLeaderboard: [],
      },
      latestTelemetryRecord: undefined,
      connected: false,
      connectionFailed: false,
    })).toMatchObject({
      enabled: true,
      mediaStatus: "loading",
      speedLabel: "1.5x",
      savedTime: {
        savedLabel: "60.000s",
        weeklyBoostLabel: "+0.000s",
        lifetimeLabel: "60.000s",
        currentVideoLabel: "0.000s",
        levelLabel: "Level 2",
        nextLevelLabel: "Level 3",
        nextMilestoneLabel: "300.000s",
        progressPercent: 0,
        toNextLevelLabel: "240.000s to Level 3",
      },
    });
  });

  it("shows active video state when telemetry is connected", () => {
    expect(createPopupViewState({
      settings: {
        enabled: true,
        simpleSlider: 80,
        soundedSpeed: 1.75,
        weeklyTimeSavedComparedToSoundedSpeed: 125,
        lifetimeTimeSavedComparedToSoundedSpeed: 3661,
        timeSavedLastSeenLifetimeMilestoneSeconds: 3600,
        videoTimeSavedLeaderboard: [],
      },
      latestTelemetryRecord: {
        elementVolume: 0.2,
        inputVolume: 0.2,
        soundedSpeed: 1.75,
        sessionTimeSaved: {
          timeSavedComparedToSoundedSpeed: 42.813,
        },
      },
      connected: true,
      connectionFailed: false,
    })).toMatchObject({
      mediaStatus: "active",
      speedLabel: "1.75x",
      savedTime: {
        savedLabel: "3661.000s",
        currentVideoLabel: "42.813s",
        weeklyBoostLabel: "+125.000s",
        lifetimeLabel: "3661.000s",
        levelLabel: "Level 6",
        nextLevelLabel: "Level 7",
        nextMilestoneLabel: "86400.000s",
        progressPercent: 0.07,
        toNextLevelLabel: "82739.000s to Level 7",
      },
    });
  });

  it("uses live lifetime telemetry for the realtime saved counter", () => {
    expect(createPopupViewState({
      settings: {
        enabled: true,
        simpleSlider: 80,
        soundedSpeed: 1.75,
        weeklyTimeSavedComparedToSoundedSpeed: 125,
        lifetimeTimeSavedComparedToSoundedSpeed: 3600,
        timeSavedLastSeenLifetimeMilestoneSeconds: 3600,
        videoTimeSavedLeaderboard: [],
      },
      latestTelemetryRecord: {
        elementVolume: 0.2,
        inputVolume: 0.2,
        soundedSpeed: 1.75,
        sessionTimeSaved: {
          timeSavedComparedToSoundedSpeed: 12.345,
        },
        lifetimeTimeSaved: {
          timeSavedComparedToSoundedSpeed: 3661.234,
        },
      },
      connected: true,
      connectionFailed: false,
    })).toMatchObject({
      savedTime: {
        savedLabel: "3661.234s",
        currentVideoLabel: "12.345s",
        lifetimeLabel: "3661.234s",
        toNextLevelLabel: "82738.766s to Level 7",
      },
    });
  });

  it("shows the top saved videos", () => {
    expect(createPopupViewState({
      settings: {
        enabled: true,
        simpleSlider: 80,
        soundedSpeed: 1.75,
        weeklyTimeSavedComparedToSoundedSpeed: 125,
        lifetimeTimeSavedComparedToSoundedSpeed: 3600,
        timeSavedLastSeenLifetimeMilestoneSeconds: 3600,
        videoTimeSavedLeaderboard: [
          {
            id: "youtube:lecture",
            title: "Lecture",
            url: "https://www.youtube.com/watch?v=lecture",
            savedSeconds: 91.234,
            lastSavedAt: 100,
          },
          {
            id: "url:https://example.com/course",
            title: "Course lesson",
            url: "https://example.com/course",
            savedSeconds: 15,
            lastSavedAt: 90,
          },
        ],
      },
      latestTelemetryRecord: undefined,
      connected: false,
      connectionFailed: false,
    })).toMatchObject({
      savedTime: {
        topVideos: [
          {
            title: "Lecture",
            savedLabel: "91.234s",
          },
          {
            title: "Course lesson",
            savedLabel: "15.000s",
          },
        ],
      },
    });
  });

  it("shows unavailable state when connection fails", () => {
    expect(createPopupViewState({
      settings: {
        enabled: true,
        simpleSlider: 50,
        soundedSpeed: 1.5,
        weeklyTimeSavedComparedToSoundedSpeed: 0,
        lifetimeTimeSavedComparedToSoundedSpeed: 0,
        timeSavedLastSeenLifetimeMilestoneSeconds: 0,
        videoTimeSavedLeaderboard: [],
      },
      latestTelemetryRecord: undefined,
      connected: false,
      connectionFailed: true,
    })).toMatchObject({
      mediaStatus: "unavailable",
    });
  });

  it("gives connection failure precedence over stale telemetry", () => {
    expect(createPopupViewState({
      settings: {
        enabled: true,
        simpleSlider: 50,
        soundedSpeed: 1.5,
        weeklyTimeSavedComparedToSoundedSpeed: 0,
        lifetimeTimeSavedComparedToSoundedSpeed: 0,
        timeSavedLastSeenLifetimeMilestoneSeconds: 0,
        videoTimeSavedLeaderboard: [],
      },
      latestTelemetryRecord: {
        elementVolume: 0.2,
        inputVolume: 0.2,
        soundedSpeed: 1.2,
      },
      connected: true,
      connectionFailed: true,
    })).toMatchObject({
      mediaStatus: "unavailable",
      speedLabel: "1.2x",
    });
  });

  it("shows loading while connected before telemetry arrives", () => {
    expect(createPopupViewState({
      settings: {
        enabled: true,
        simpleSlider: 50,
        soundedSpeed: 2,
        weeklyTimeSavedComparedToSoundedSpeed: 0,
        lifetimeTimeSavedComparedToSoundedSpeed: 0,
        timeSavedLastSeenLifetimeMilestoneSeconds: 0,
        videoTimeSavedLeaderboard: [],
      },
      latestTelemetryRecord: undefined,
      connected: true,
      connectionFailed: false,
    })).toMatchObject({
      mediaStatus: "loading",
      speedLabel: "2x",
    });
  });
});
