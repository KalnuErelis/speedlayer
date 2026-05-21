import { beforeEach, describe, expect, it, vi } from "vitest";

type Listener<T extends (...args: any[]) => void> = {
  addListener: (listener: T) => void;
  emit: (...args: Parameters<T>) => void;
};

function createListener<T extends (...args: any[]) => void>(): Listener<T> {
  let listeners: T[] = [];
  return {
    addListener: listener => {
      listeners = [...listeners, listener];
    },
    emit: (...args) => {
      listeners.forEach(listener => listener(...args));
    },
  };
}

const connectMock = vi.fn();

vi.mock("@/webextensions-api-browser-or-chrome", () => ({
  browserOrChrome: {
    tabs: {
      connect: connectMock,
    },
  },
}));

describe("connectPopupTelemetry", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    connectMock.mockReset();
    vi.stubGlobal("IS_DEV_MODE", false);
  });

  it("stops polling when the telemetry port disconnects", async () => {
    const onMessage = createListener<(message: unknown) => void>();
    const onDisconnect = createListener<() => void>();
    const postMessage = vi.fn();

    connectMock.mockReturnValue({
      onMessage,
      onDisconnect,
      postMessage,
      disconnect: vi.fn(),
    });

    const { connectPopupTelemetry } = await import("@/entry-points/popup/adapters/popupTelemetryAdapter");

    connectPopupTelemetry({
      tabId: 1,
      frameId: 2,
      telemetryUpdatePeriodSeconds: 1,
      onTelemetry: vi.fn(),
    });

    expect(postMessage).toHaveBeenCalledTimes(1);

    onDisconnect.emit();
    vi.advanceTimersByTime(3000);

    expect(postMessage).toHaveBeenCalledTimes(1);
  });

  it("cleans up polling if postMessage throws after a port is closed", async () => {
    const onMessage = createListener<(message: unknown) => void>();
    const onDisconnect = createListener<() => void>();
    const postMessage = vi.fn()
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error("Port closed");
      });

    connectMock.mockReturnValue({
      onMessage,
      onDisconnect,
      postMessage,
      disconnect: vi.fn(),
    });

    const { connectPopupTelemetry } = await import("@/entry-points/popup/adapters/popupTelemetryAdapter");

    connectPopupTelemetry({
      tabId: 1,
      frameId: 2,
      telemetryUpdatePeriodSeconds: 1,
      onTelemetry: vi.fn(),
    });

    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(3000);

    expect(postMessage).toHaveBeenCalledTimes(2);
  });
});
