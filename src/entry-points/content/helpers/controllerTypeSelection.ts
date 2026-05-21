import type { Settings } from "@/settings";
import { ControllerKind } from "@/settings/ControllerKind";

type ControllerSelectionSettings = Pick<
  Settings,
  "experimentalControllerType" | "dontAttachToCrossOriginMedia"
>;

export function getAppropriateControllerType(
  settings: ControllerSelectionSettings,
  elementSourceIsCrossOrigin: boolean,
  elementIsLikelyLive = false
): ControllerKind {
  if (elementIsLikelyLive) {
    return ControllerKind.ALWAYS_SOUNDED;
  }

  // Analyzing audio data of a CORS-restricted media element is impossible because its
  // `MediaElementAudioSourceNode` outputs silence. Avoid attaching instead of risking muting it.
  return elementSourceIsCrossOrigin && settings.dontAttachToCrossOriginMedia
    ? ControllerKind.ALWAYS_SOUNDED
    : settings.experimentalControllerType;
}
