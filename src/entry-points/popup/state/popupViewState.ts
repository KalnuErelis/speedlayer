import { formatSavedTime, getNextMilestoneSeconds } from "../../../helpers/weeklyScorecard";

export type PopupMediaStatus = "active" | "loading" | "no-video" | "unavailable";

export type PopupViewStateInput = {
  settings: {
    enabled: boolean;
    simpleSlider: number;
    soundedSpeed: number;
    weeklyTimeSavedComparedToSoundedSpeed: number;
    lifetimeTimeSavedComparedToSoundedSpeed: number;
    timeSavedLastSeenLifetimeMilestoneSeconds: number;
  };
  latestTelemetryRecord: { soundedSpeed?: number; elementVolume?: number; inputVolume?: number } | undefined;
  connected: boolean;
  connectionFailed: boolean;
};

export type PopupViewState = {
  enabled: boolean;
  mediaStatus: PopupMediaStatus;
  speedLabel: string;
  simpleSlider: number;
  savedTime: {
    weeklyLabel: string;
    lifetimeLabel: string;
    nextMilestoneLabel: string;
  };
};

export function createPopupViewState(input: PopupViewStateInput): PopupViewState {
  const { settings } = input;
  const activeSpeed = input.latestTelemetryRecord?.soundedSpeed ?? settings.soundedSpeed;
  const nextMilestoneSeconds = getNextMilestoneSeconds(settings.lifetimeTimeSavedComparedToSoundedSpeed);

  return {
    enabled: settings.enabled,
    mediaStatus: getMediaStatus(input),
    speedLabel: `${formatSpeed(activeSpeed)}x`,
    simpleSlider: settings.simpleSlider,
    savedTime: {
      weeklyLabel: formatSavedTime(settings.weeklyTimeSavedComparedToSoundedSpeed),
      lifetimeLabel: formatSavedTime(settings.lifetimeTimeSavedComparedToSoundedSpeed),
      nextMilestoneLabel: formatSavedTime(nextMilestoneSeconds),
    },
  };
}

function getMediaStatus(input: PopupViewStateInput): PopupMediaStatus {
  if (input.connectionFailed) return "unavailable";
  if (input.connected && input.latestTelemetryRecord) return "active";
  if (input.connected) return "loading";
  return "loading";
}

function formatSpeed(speed: number): string {
  return Number.isInteger(speed) ? speed.toFixed(0) : speed.toFixed(2).replace(/0$/, "");
}
