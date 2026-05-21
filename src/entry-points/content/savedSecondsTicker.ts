import type {
  VideoTimeSavedEntry,
  VideoTimeSavedIdentity,
} from "@/helpers/videoTimeSavedLeaderboard";

export interface SavedSecondsTickerStateInput {
  savedSeconds: number;
}

export interface SavedSecondsTickerState {
  label: string;
  visible: boolean;
}

export function createSavedSecondsTickerState(
  input: SavedSecondsTickerStateInput
): SavedSecondsTickerState {
  const savedSeconds = Math.max(0, Number.isFinite(input.savedSeconds) ? input.savedSeconds : 0);

  return {
    label: `+${savedSeconds.toFixed(3)}s`,
    visible: true,
  };
}

export function getSavedSecondsForCurrentVideo(input: {
  entries: readonly VideoTimeSavedEntry[] | undefined;
  identity: VideoTimeSavedIdentity | undefined;
  currentSessionSavedSeconds: number;
  savedSecondsAtVideoStart?: number;
  sessionSavedSecondsAtVideoStart?: number;
}): number {
  const currentSessionSavedSeconds = Number.isFinite(input.currentSessionSavedSeconds)
    ? input.currentSessionSavedSeconds
    : 0;
  const storedSavedSeconds = input.entries?.find(entry => entry.id === input.identity?.id)?.savedSeconds ?? 0;
  const savedSecondsAtVideoStart = Number.isFinite(input.savedSecondsAtVideoStart)
    ? input.savedSecondsAtVideoStart ?? 0
    : storedSavedSeconds;
  const sessionSavedSecondsAtVideoStart = Number.isFinite(input.sessionSavedSecondsAtVideoStart)
    ? input.sessionSavedSecondsAtVideoStart ?? 0
    : 0;
  const currentVideoSessionSavedSeconds = Math.max(
    0,
    currentSessionSavedSeconds - sessionSavedSecondsAtVideoStart
  );

  return Math.max(
    Math.max(0, storedSavedSeconds),
    Math.max(0, savedSecondsAtVideoStart) + currentVideoSessionSavedSeconds
  );
}

export function createCurrentVideoSavedSecondsReader(input: {
  getEntries: () => readonly VideoTimeSavedEntry[] | undefined;
  getIdentity: () => VideoTimeSavedIdentity | undefined;
  getCurrentSessionSavedSeconds: () => number;
}): () => number {
  let activeIdentityId: string | undefined;
  let savedSecondsAtVideoStart = 0;
  let sessionSavedSecondsAtVideoStart = 0;

  return () => {
    const entries = input.getEntries();
    const identity = input.getIdentity();
    const currentSessionSavedSeconds = input.getCurrentSessionSavedSeconds();

    if (identity?.id !== activeIdentityId) {
      activeIdentityId = identity?.id;
      savedSecondsAtVideoStart = entries?.find(entry => entry.id === identity?.id)?.savedSeconds ?? 0;
      sessionSavedSecondsAtVideoStart = Number.isFinite(currentSessionSavedSeconds)
        ? currentSessionSavedSeconds
        : 0;
    }

    return getSavedSecondsForCurrentVideo({
      entries,
      identity,
      currentSessionSavedSeconds,
      savedSecondsAtVideoStart,
      sessionSavedSecondsAtVideoStart,
    });
  };
}

export function startSavedSecondsTicker(
  getSavedSeconds: () => number,
  onStop: (callback: () => void) => void
): void {
  if (typeof document === "undefined") return;

  const host = document.createElement("speedlayer-saved-seconds");
  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  const value = document.createElement("span");

  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      top: max(12px, env(safe-area-inset-top));
      right: max(12px, env(safe-area-inset-right));
      z-index: 2147483647;
      pointer-events: none;
      opacity: 1;
      transform: translateY(0);
    }

    span {
      display: inline-flex;
      align-items: center;
      min-width: 72px;
      justify-content: flex-end;
      box-sizing: border-box;
      padding: 5px 8px;
      border: 1px solid rgb(144 255 120 / 65%);
      border-radius: 8px;
      background: rgb(8 14 10 / 88%);
      box-shadow: 0 6px 22px rgb(0 0 0 / 35%), inset 0 1px 0 rgb(255 255 255 / 12%);
      color: #9cff6d;
      font: 700 13px/1.1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      letter-spacing: 0;
      text-shadow: 0 0 8px rgb(156 255 109 / 35%);
    }
  `;

  shadow.append(style, value);
  document.documentElement.append(host);

  const render = () => {
    const savedSeconds = getSavedSeconds();
    const state = createSavedSecondsTickerState({
      savedSeconds,
    });

    value.textContent = state.label;
    host.dataset.visible = state.visible ? "true" : "false";
  };

  const intervalId = window.setInterval(render, 100);
  render();

  onStop(() => {
    clearInterval(intervalId);
    host.remove();
  });
}
