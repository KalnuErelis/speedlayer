import { describe, expect, it } from "vitest";
import { getAppropriateControllerType } from "@/entry-points/content/helpers/controllerTypeSelection";
import { ControllerKind } from "@/settings/ControllerKind";

describe("getAppropriateControllerType", () => {
  it("keeps CORS-restricted media sounded-only when protected", () => {
    expect(getAppropriateControllerType(
      {
        experimentalControllerType: ControllerKind.STRETCHING,
        dontAttachToCrossOriginMedia: true,
      },
      true
    )).toBe(ControllerKind.ALWAYS_SOUNDED);
  });

  it("uses the configured controller for ordinary media", () => {
    expect(getAppropriateControllerType(
      {
        experimentalControllerType: ControllerKind.STRETCHING,
        dontAttachToCrossOriginMedia: true,
      },
      false
    )).toBe(ControllerKind.STRETCHING);
  });

  it("uses the sounded-only controller for live media", () => {
    expect(getAppropriateControllerType(
      {
        experimentalControllerType: ControllerKind.STRETCHING,
        dontAttachToCrossOriginMedia: true,
      },
      false,
      true
    )).toBe(ControllerKind.ALWAYS_SOUNDED);
  });
});
