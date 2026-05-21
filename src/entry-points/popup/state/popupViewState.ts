import {
  formatSavedTime,
  getNextMilestoneSeconds,
  getPreviousMilestoneSeconds,
  getSavedTimeLevel,
} from "../../../helpers/weeklyScorecard";

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
  latestTelemetryRecord: {
    soundedSpeed?: number;
    elementVolume?: number;
    inputVolume?: number;
    lifetimeTimeSaved?: {
      timeSavedComparedToSoundedSpeed: number;
    };
  } | undefined;
  connected: boolean;
  connectionFailed: boolean;
  newlyReachedMilestoneSeconds?: number | undefined;
};

export type PopupViewState = {
  enabled: boolean;
  mediaStatus: PopupMediaStatus;
  speedLabel: string;
  simpleSlider: number;
  savedTime: {
    savedLabel: string;
    weeklyLabel: string;
    weeklyBoostLabel: string;
    lifetimeLabel: string;
    levelLabel: string;
    nextLevelLabel: string;
    nextMilestoneLabel: string;
    progressPercent: number;
    toNextLevelLabel: string;
    isLevelUp: boolean;
  };
};

export function createPopupViewState(input: PopupViewStateInput): PopupViewState {
  const { settings } = input;
  const activeSpeed = input.latestTelemetryRecord?.soundedSpeed ?? settings.soundedSpeed;
  const lifetimeSeconds = Math.max(
    0,
    input.latestTelemetryRecord?.lifetimeTimeSaved?.timeSavedComparedToSoundedSpeed
      ?? settings.lifetimeTimeSavedComparedToSoundedSpeed
  );
  const weeklySeconds = Math.max(0, settings.weeklyTimeSavedComparedToSoundedSpeed);
  const previousMilestoneSeconds = getPreviousMilestoneSeconds(lifetimeSeconds);
  const nextMilestoneSeconds = getNextMilestoneSeconds(lifetimeSeconds);
  const level = getSavedTimeLevel(lifetimeSeconds);
  const nextLevel = level + 1;
  const milestoneSpanSeconds = nextMilestoneSeconds - previousMilestoneSeconds;
  const progressPercentRaw = milestoneSpanSeconds > 0
    ? Math.min(
      100,
      Math.max(0, ((lifetimeSeconds - previousMilestoneSeconds) * 100) / milestoneSpanSeconds)
    )
    : 100;
  const progressPercent = Math.round(progressPercentRaw * 100) / 100;
  const remainingSeconds = Math.max(0, nextMilestoneSeconds - lifetimeSeconds);

  return {
    enabled: settings.enabled,
    mediaStatus: getMediaStatus(input),
    speedLabel: `${formatSpeed(activeSpeed)}x`,
    simpleSlider: settings.simpleSlider,
    savedTime: {
      savedLabel: formatSavedTime(lifetimeSeconds),
      weeklyLabel: formatSavedTime(weeklySeconds),
      weeklyBoostLabel: `+${formatSavedTime(weeklySeconds)}`,
      lifetimeLabel: formatSavedTime(lifetimeSeconds),
      levelLabel: `Level ${level}`,
      nextLevelLabel: `Level ${nextLevel}`,
      nextMilestoneLabel: formatSavedTime(nextMilestoneSeconds),
      progressPercent,
      toNextLevelLabel: `${formatSavedTime(remainingSeconds)} to Level ${nextLevel}`,
      isLevelUp: input.newlyReachedMilestoneSeconds != undefined,
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
