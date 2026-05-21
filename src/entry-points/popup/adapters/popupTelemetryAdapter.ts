import { browserOrChrome } from "@/webextensions-api-browser-or-chrome";
import type { TelemetryMessage } from "@/entry-points/content/AllMediaElementsController";
import type { HotkeyBinding, NonSettingsAction } from "@/hotkeys";

export type PopupTelemetryConnection = {
  disconnect: () => void;
};

export type PopupNonSettingsActionsPort = {
  disconnect: () => void;
  postMessage: (actions: Array<HotkeyBinding<NonSettingsAction>>) => void;
};

export function connectPopupTelemetry(args: {
  tabId: number;
  frameId: number;
  telemetryUpdatePeriodSeconds: number;
  onTelemetry: (message: TelemetryMessage) => void;
}): PopupTelemetryConnection {
  const telemetryPort = browserOrChrome.tabs.connect(args.tabId, { name: "telemetry", frameId: args.frameId });
  let telemetryTimeoutId: ReturnType<typeof setTimeout> | undefined;

  telemetryPort.onMessage.addListener(message => {
    if (message) args.onTelemetry(message as TelemetryMessage);
  });

  function requestTelemetry() {
    telemetryPort.postMessage(IS_DEV_MODE ? "getTelemetry" : undefined);
    telemetryTimeoutId = setTimeout(requestTelemetry, args.telemetryUpdatePeriodSeconds * 1000);
  }

  requestTelemetry();

  return {
    disconnect() {
      if (telemetryTimeoutId) clearTimeout(telemetryTimeoutId);
      telemetryPort.disconnect();
    },
  };
}

export function connectPopupNonSettingsActions(args: {
  tabId: number;
  frameId: number;
}): PopupNonSettingsActionsPort {
  const port = browserOrChrome.tabs.connect(args.tabId, {
    name: "nonSettingsActions",
    frameId: args.frameId,
  });

  return {
    disconnect: () => port.disconnect(),
    postMessage: actions => port.postMessage(actions),
  };
}
