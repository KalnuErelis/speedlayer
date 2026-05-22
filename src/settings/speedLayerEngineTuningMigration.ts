import type { Settings } from "./";
import {
  simpleSliderDefaultValue,
  simpleSliderToSettings,
} from "./simpleSliderTuning";
import { ControllerKind } from "./ControllerKind";

export const speedLayerEngineTuningVersion = 5;

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
const previousSimpleDefaultSettings = [
  {
    volumeThreshold: 0.004,
    silenceSpeedRaw: 2.075,
    marginBefore: 0,
    marginAfter: 0.12,
  },
  {
    volumeThreshold: 0.007,
    silenceSpeedRaw: 2.3,
    marginBefore: 0,
    marginAfter: 0.105,
  },
];
export function getSpeedLayerEngineTuningStorageUpdate(
  stored: TuningStorage,
): TuningStorage | null {
  if ((stored.speedLayerEngineTuningVersion ?? 0) >= speedLayerEngineTuningVersion) {
    return null;
  }

  const tuningMarker = {
    speedLayerEngineTuningVersion,
  };
  if (isCurrentUncustomizedAdvancedProfile(stored) || isPreviousUncustomizedAdvancedProfile(stored)) {
    return {
      ...tuningMarker,
      advancedMode: false,
      ...simpleSliderToSettings(simpleSliderDefaultValue),
      marginBefore: oldDefaultSettings.marginBefore,
    };
  }

  if ((stored.speedLayerEngineTuningVersion ?? 0) >= 2) {
    if (stored.advancedMode === false && typeof stored.simpleSlider === "number") {
      return getSimpleModeTuningUpdate(stored, tuningMarker);
    }

    return tuningMarker;
  }

  if (!isOldUncustomizedSimpleProfile(stored)) {
    if (stored.advancedMode === false && typeof stored.simpleSlider === "number") {
      return getSimpleModeTuningUpdate(stored, tuningMarker);
    }

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
    advancedMode: false,
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

function getSimpleModeTuningUpdate(
  stored: TuningStorage,
  tuningMarker: Pick<TuningStorage, "speedLayerEngineTuningVersion">,
): TuningStorage {
  const tunedSettings = simpleSliderToSettings(stored.simpleSlider ?? simpleSliderDefaultValue);
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

function isCurrentUncustomizedAdvancedProfile(stored: TuningStorage) {
  const tunedSettings = simpleSliderToSettings(simpleSliderDefaultValue);
  return isUncustomizedAdvancedProfile(stored, {
    ...tunedSettings,
    marginBefore: oldDefaultSettings.marginBefore,
  });
}

function isPreviousUncustomizedAdvancedProfile(stored: TuningStorage) {
  return previousSimpleDefaultSettings.some(expected =>
    isUncustomizedAdvancedProfile(stored, expected)
  );
}

function isUncustomizedAdvancedProfile(
  stored: TuningStorage,
  expected: Pick<Settings, "volumeThreshold" | "silenceSpeedRaw" | "marginBefore" | "marginAfter">,
) {
  return (
    stored.advancedMode === true &&
    stored.simpleSlider === simpleSliderDefaultValue &&
    isClose(stored.volumeThreshold, expected.volumeThreshold) &&
    isClose(stored.silenceSpeedRaw, expected.silenceSpeedRaw) &&
    isClose(stored.marginBefore, expected.marginBefore) &&
    isClose(stored.marginAfter, expected.marginAfter)
  );
}

function isClose(value: unknown, expected: number) {
  return typeof value === "number" && Math.abs(value - expected) < 0.000001;
}
