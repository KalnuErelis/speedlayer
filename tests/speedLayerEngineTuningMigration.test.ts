import { describe, expect, it } from "vitest";

import {
  getSpeedLayerEngineTuningStorageUpdate,
  speedLayerEngineTuningVersion,
} from "@/settings/speedLayerEngineTuningMigration";
import { ControllerKind } from "@/settings/ControllerKind";

describe("SpeedLayer engine tuning migration", () => {
  it("updates only the old uncustomized simple profile", () => {
    expect(getSpeedLayerEngineTuningStorageUpdate({
      advancedMode: false,
      simpleSlider: 33,
      volumeThreshold: 0.00595,
      silenceSpeedRaw: 2.16,
      marginBefore: 0,
      marginAfter: 0.164,
      algorithmSpecificSettings: {
        [ControllerKind.CLONING]: {
          volumeThreshold: 0.01,
          marginBefore: 0.05,
          marginAfter: 0.03,
        },
        [ControllerKind.STRETCHING]: {
          volumeThreshold: 0.00595,
          marginBefore: 0,
          marginAfter: 0.164,
        },
      },
    })).toMatchObject({
      speedLayerEngineTuningVersion,
      advancedMode: false,
      simpleSlider: 50,
      volumeThreshold: 0.007,
      silenceSpeedRaw: 2.3,
      marginBefore: 0,
      marginAfter: 0.105,
      algorithmSpecificSettings: {
        [ControllerKind.STRETCHING]: {
          volumeThreshold: 0.007,
          marginBefore: 0,
          marginAfter: 0.105,
          silenceSpeedRaw: 2.3,
        },
      },
    });
  });

  it("leaves customized profiles alone and switches back to simple mode", () => {
    expect(getSpeedLayerEngineTuningStorageUpdate({
      advancedMode: true,
      simpleSlider: 80,
      volumeThreshold: 0.012,
      silenceSpeedRaw: 3,
      marginBefore: 0,
      marginAfter: 0.07,
    })).toEqual({
      speedLayerEngineTuningVersion,
      advancedMode: false,
    });
  });

  it("collapses advanced mode for installs with the previous tuning migration", () => {
    expect(getSpeedLayerEngineTuningStorageUpdate({
      speedLayerEngineTuningVersion: 1,
      advancedMode: true,
      simpleSlider: 50,
      volumeThreshold: 0.007,
      silenceSpeedRaw: 2.3,
      marginBefore: 0,
      marginAfter: 0.105,
    })).toEqual({
      speedLayerEngineTuningVersion,
      advancedMode: false,
    });
  });

  it("does nothing after the current migration has run", () => {
    expect(getSpeedLayerEngineTuningStorageUpdate({
      speedLayerEngineTuningVersion,
      advancedMode: true,
      simpleSlider: 33,
      volumeThreshold: 0.00595,
      silenceSpeedRaw: 2.16,
      marginBefore: 0,
      marginAfter: 0.164,
    })).toBeNull();
  });
});
