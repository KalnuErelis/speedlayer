export interface SavedSecondsTickerStateInput {
  savedSeconds: number;
  previousSavedSeconds: number;
}

export interface SavedSecondsTickerState {
  label: string;
  visible: boolean;
}

export function createSavedSecondsTickerState(
  input: SavedSecondsTickerStateInput
): SavedSecondsTickerState {
  const savedSeconds = Math.max(0, Number.isFinite(input.savedSeconds) ? input.savedSeconds : 0);
  const previousSavedSeconds = Math.max(
    0,
    Number.isFinite(input.previousSavedSeconds) ? input.previousSavedSeconds : 0
  );

  return {
    label: `+${savedSeconds.toFixed(3)}s`,
    visible: savedSeconds > previousSavedSeconds,
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
  let previousSavedSeconds = 0;
  let hideTimeout = -1;

  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      top: max(12px, env(safe-area-inset-top));
      right: max(12px, env(safe-area-inset-right));
      z-index: 2147483647;
      pointer-events: none;
      opacity: 0;
      transform: translateY(-4px);
      transition: opacity 140ms ease, transform 140ms ease;
    }

    :host([data-visible="true"]) {
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
      previousSavedSeconds,
    });

    value.textContent = state.label;
    host.dataset.visible = state.visible ? "true" : "false";
    previousSavedSeconds = Math.max(
      previousSavedSeconds,
      Number.isFinite(savedSeconds) ? savedSeconds : 0
    );

    if (state.visible) {
      clearTimeout(hideTimeout);
      hideTimeout = window.setTimeout(() => {
        host.dataset.visible = "false";
      }, 1800);
    }
  };

  const intervalId = window.setInterval(render, 100);
  render();

  onStop(() => {
    clearInterval(intervalId);
    clearTimeout(hideTimeout);
    host.remove();
  });
}
