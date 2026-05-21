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
      },
      latestTelemetryRecord: undefined,
      connected: false,
      connectionFailed: false,
    })).toMatchObject({
      enabled: true,
      mediaStatus: "loading",
      speedLabel: "1.5x",
      savedTime: {
        weeklyLabel: "0.000s",
        lifetimeLabel: "60.000s",
        nextMilestoneLabel: "900.000s",
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
      },
      latestTelemetryRecord: {
        elementVolume: 0.2,
        inputVolume: 0.2,
        soundedSpeed: 1.75,
      },
      connected: true,
      connectionFailed: false,
    })).toMatchObject({
      mediaStatus: "active",
      speedLabel: "1.75x",
      savedTime: {
        weeklyLabel: "125.000s",
        lifetimeLabel: "3661.000s",
        nextMilestoneLabel: "7200.000s",
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
