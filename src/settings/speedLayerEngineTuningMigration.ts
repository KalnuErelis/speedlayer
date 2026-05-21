import type { Settings } from "./";
import {
  simpleSliderDefaultValue,
  simpleSliderToSettings,
} from "./simpleSliderTuning";
import { ControllerKind } from "./ControllerKind";

export const speedLayerEngineTuningVersion = 2;

type TuningStorage = Partial<Settings> & {
  speedLayerEngineTuningVersion?: number;
};

const oldSimpleSliderDefaultValue = 33;
const oldDefaultSettings = {
  volumeThreshold: 0.00595,
  silenceSpeedRaw: 2.16,
  marginBefore: 0,
  marginAfter: 0.164,
};

export function getSpeedLayerEngineTuningStorageUpdate(
  stored: TuningStorage,
): TuningStorage | null {
  if ((stored.speedLayerEngineTuningVersion ?? 0) >= speedLayerEngineTuningVersion) {
    return null;
  }

  const tuningMarker = {
    speedLayerEngineTuningVersion,
    advancedMode: false,
  };
  if (!isOldUncustomizedSimpleProfile(stored)) {
    return tuningMarker;
  }

  const tunedSettings = simpleSliderToSettings(simpleSliderDefaultValue);
  const algorithmSpecificSettings = stored.algorithmSpecificSettings
    ? {
      ...stored.algorithmSpecificSettings,
      [ControllerKind.STRETCHING]: {
        ...stored.algorithmSpecificSettings[ControllerKind.STRETCHING],
        ...tunedSettings,
        marginBefore: oldDefaultSettings.marginBefore,
      },
    }
    : undefined;

  return {
    ...tuningMarker,
    simpleSlider: simpleSliderDefaultValue,
    ...tunedSettings,
    marginBefore: oldDefaultSettings.marginBefore,
    previousVolumeThreshold: tunedSettings.volumeThreshold,
    previousSilenceSpeedRaw: tunedSettings.silenceSpeedRaw,
    previousMarginBefore: oldDefaultSettings.marginBefore,
    previousMarginAfter: tunedSettings.marginAfter,
    ...(algorithmSpecificSettings ? { algorithmSpecificSettings } : {}),
  };
}

function isOldUncustomizedSimpleProfile(stored: TuningStorage) {
  return (
    stored.advancedMode === false &&
    stored.simpleSlider === oldSimpleSliderDefaultValue &&
    isClose(stored.volumeThreshold, oldDefaultSettings.volumeThreshold) &&
    isClose(stored.silenceSpeedRaw, oldDefaultSettings.silenceSpeedRaw) &&
    isClose(stored.marginBefore, oldDefaultSettings.marginBefore) &&
    isClose(stored.marginAfter, oldDefaultSettings.marginAfter)
  );
}

function isClose(value: unknown, expected: number) {
  return typeof value === "number" && Math.abs(value - expected) < 0.000001;
}
