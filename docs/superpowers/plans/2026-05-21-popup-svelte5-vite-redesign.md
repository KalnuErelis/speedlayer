# Popup Svelte 5 Vite Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the SpeedLayer popup to Svelte 5 + Vite and replace the inherited Jump Cutter popup with a polished, compact SpeedLayer control surface.

**Architecture:** Use a hybrid build first: Webpack continues producing content scripts, background, options, manifest, locales, and copied static assets; Vite writes `dist-chromium/popup/main.js` after Webpack. Split popup logic into pure state helpers, Chrome/tab/telemetry adapters, and small visual Svelte components. Replace SmoothieChart with a purpose-built canvas timeline.

**Tech Stack:** Svelte 5, Vite, TypeScript, Chrome MV3, Vitest, existing Webpack build for non-popup extension entries.

---

## File Structure

Create:

- `vite.popup.config.ts`: Vite build config for the popup entry only.
- `src/entry-points/popup/state/intensitySettings.ts`: maps the simple popup intensity slider to existing settings writes.
- `src/entry-points/popup/state/popupViewState.ts`: converts settings and telemetry into render-ready popup state.
- `src/entry-points/popup/adapters/popupStorageAdapter.ts`: settings load/write wrapper around existing settings helpers.
- `src/entry-points/popup/adapters/popupTabAdapter.ts`: active-tab query, tab-load wait, and content-status messaging.
- `src/entry-points/popup/adapters/popupTelemetryAdapter.ts`: telemetry port lifecycle and polling cleanup.
- `src/entry-points/popup/components/PopupShell.svelte`: popup frame and layout.
- `src/entry-points/popup/components/EnableToggle.svelte`: master enabled toggle.
- `src/entry-points/popup/components/SpeedReadout.svelte`: current speed and media status.
- `src/entry-points/popup/components/SavedTimeCard.svelte`: weekly, lifetime, and milestone display.
- `src/entry-points/popup/components/IntensitySlider.svelte`: primary skip less / skip more control.
- `src/entry-points/popup/components/TimelineCanvas.svelte`: custom canvas timeline.
- `src/entry-points/popup/components/IconButton.svelte`: compact footer action.
- `src/entry-points/popup/components/SettingsSheet.svelte`: advanced settings panel.
- `tests/popupIntensitySettings.test.ts`: pure unit tests for intensity mapping.
- `tests/popupViewState.test.ts`: pure unit tests for popup state derivation.

Modify:

- `package.json`: Svelte 5/Vite plugin deps and build scripts.
- `tsconfig.json`: keep Svelte/Vite-compatible TS options.
- `webpack.config.js`: remove `popup` from Webpack entries while still copying popup HTML/CSS.
- `src/entry-points/popup/popup.html`: load `main.js` as a module.
- `src/entry-points/popup/main.ts`: mount Svelte 5 app and import popup CSS.
- `src/entry-points/popup/App.svelte`: replace large inherited component with new adapter-driven composition.
- `src/entry-points/popup/popup.css`: SpeedLayer popup visual system.
- `scripts/verify-chromium-build.mjs`: verify the popup script is module-compatible and exists after the hybrid build.

Remove after parity:

- `src/entry-points/popup/Chart.svelte`
- `src/entry-points/popup/RangeSlider.svelte`
- `src/entry-points/popup/TimeSaved.svelte`
- `src/entry-points/popup/VolumeIndicator.svelte`
- `@wofwca/smoothie` dependency if no non-popup imports remain.

## Task 1: Popup Build Migration

**Files:**
- Create: `vite.popup.config.ts`
- Modify: `package.json`
- Modify: `webpack.config.js`
- Modify: `src/entry-points/popup/popup.html`
- Modify: `src/entry-points/popup/main.ts`
- Modify: `scripts/verify-chromium-build.mjs`

- [ ] **Step 1: Add Svelte 5 and Vite plugin dependencies**

Run:

```bash
corepack yarn add -D svelte@^5 @sveltejs/vite-plugin-svelte@^5
```

Expected: `package.json` and `yarn.lock` update. `vite` already exists and remains installed.

- [ ] **Step 2: Add the popup Vite config**

Create `vite.popup.config.ts` with:

```ts
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import path from "node:path";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        dev: !isProduction,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    IS_DEV_MODE: JSON.stringify(!isProduction),
    "BUILD_DEFINITIONS.BROWSER": JSON.stringify("chromium"),
    "BUILD_DEFINITIONS.BROWSER_MAY_HAVE_AUDIO_DESYNC_BUG": JSON.stringify(true),
    "BUILD_DEFINITIONS.BROWSER_MAY_HAVE_EQUAL_OLD_AND_NEW_VALUE_IN_STORAGE_CHANGE_OBJECT": JSON.stringify(false),
    "BUILD_DEFINITIONS.CONTACT_EMAIL": JSON.stringify(""),
  },
  build: {
    outDir: "dist-chromium/popup",
    emptyOutDir: false,
    sourcemap: !isProduction ? "inline" : false,
    lib: {
      entry: "src/entry-points/popup/main.ts",
      formats: ["es"],
      fileName: () => "main.js",
    },
    rollupOptions: {
      output: {
        entryFileNames: "main.js",
        chunkFileNames: "../chunks/popup-[name]-[hash].js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});
```

- [ ] **Step 3: Update build scripts**

In `package.json`, change scripts to:

```json
"_abstract-build": "yarn lint && NODE_ENV=production webpack --mode=production",
"build:popup:chromium": "NODE_ENV=production vite build --config vite.popup.config.ts",
"build:chromium": "yarn run _abstract-build --env browser=chromium --env noreport && yarn run build:popup:chromium",
"build:chromium:report": "yarn run _abstract-build --env browser=chromium && yarn run build:popup:chromium",
"serve:popup:chromium": "vite build --watch --config vite.popup.config.ts",
```

Keep `build:gecko` on Webpack only for now:

```json
"build:gecko": "yarn run _abstract-build --env browser=gecko",
```

- [ ] **Step 4: Remove popup from Webpack entries**

In `webpack.config.js`, remove this entry:

```js
popup: './src/entry-points/popup/main.ts',
```

Keep this copy pattern for popup HTML/CSS:

```js
{ context: 'src/entry-points', from: 'popup/*.(html|css)', to: 'popup/[name][ext]' },
```

- [ ] **Step 5: Make popup script a module**

In `src/entry-points/popup/popup.html`, replace:

```html
<script defer src="main.js"></script>
```

with:

```html
<script type="module" src="main.js"></script>
```

- [ ] **Step 6: Mount Svelte 5 app**

In `src/entry-points/popup/main.ts`, replace the class-component mount with:

```ts
import { mount } from "svelte";
import App from "./App.svelte";
import "./popup.css";

mount(App, {
  target: document.body,
});
```

- [ ] **Step 7: Extend build verifier for module popup**

In `scripts/verify-chromium-build.mjs`, after the required-files loop, add:

```js
const popupHtml = fs.readFileSync(path.join(dist, "popup/popup.html"), "utf8");
const popupMain = fs.readFileSync(path.join(dist, "popup/main.js"), "utf8");

if (!popupHtml.includes('type="module"')) {
  throw new Error("Popup HTML must load popup/main.js as a module");
}

if (popupMain.includes("new App(")) {
  throw new Error("Popup build still contains legacy Svelte class-component mounting");
}
```

- [ ] **Step 8: Verify the hybrid build**

Run:

```bash
corepack yarn build:chromium
corepack yarn verify:chromium
```

Expected: build succeeds, `dist-chromium/popup/main.js` exists, and `verify:chromium` prints `Chromium build verified`.

- [ ] **Step 9: Commit build migration**

Run:

```bash
git add package.json yarn.lock vite.popup.config.ts webpack.config.js src/entry-points/popup/popup.html src/entry-points/popup/main.ts scripts/verify-chromium-build.mjs
git commit -m "build: migrate popup to svelte 5 vite"
```

## Task 2: Popup State Helpers

**Files:**
- Create: `src/entry-points/popup/state/intensitySettings.ts`
- Create: `src/entry-points/popup/state/popupViewState.ts`
- Create: `tests/popupIntensitySettings.test.ts`
- Create: `tests/popupViewState.test.ts`

- [ ] **Step 1: Write intensity mapping tests**

Create `tests/popupIntensitySettings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { simpleSliderToSettings } from "@/entry-points/popup/state/intensitySettings";

describe("simpleSliderToSettings", () => {
  it("maps the least aggressive slider value", () => {
    expect(simpleSliderToSettings(0)).toEqual({
      volumeThreshold: 0.001,
      silenceSpeedRaw: 1.5,
      marginAfter: 0.23,
    });
  });

  it("maps the most aggressive slider value", () => {
    expect(simpleSliderToSettings(100)).toEqual({
      volumeThreshold: 0.016,
      silenceSpeedRaw: 3.5,
      marginAfter: 0.03,
    });
  });

  it("clamps impossible slider values", () => {
    expect(simpleSliderToSettings(-50)).toEqual(simpleSliderToSettings(0));
    expect(simpleSliderToSettings(150)).toEqual(simpleSliderToSettings(100));
  });
});
```

- [ ] **Step 2: Run the failing intensity tests**

Run:

```bash
corepack yarn test -- tests/popupIntensitySettings.test.ts
```

Expected: fails because `intensitySettings.ts` does not exist.

- [ ] **Step 3: Implement intensity mapping**

Create `src/entry-points/popup/state/intensitySettings.ts`:

```ts
import { clamp } from "@/helpers";

export type IntensitySettings = {
  volumeThreshold: number;
  silenceSpeedRaw: number;
  marginAfter: number;
};

export function simpleSliderToSettings(rawSimpleSlider: number): IntensitySettings {
  const simpleSlider = clamp(rawSimpleSlider, 0, 100);

  return {
    volumeThreshold: 0.001 + 0.00015 * simpleSlider,
    silenceSpeedRaw: 1.5 + 0.02 * simpleSlider,
    marginAfter: 0.03 + 0.002 * (100 - simpleSlider),
  };
}
```

- [ ] **Step 4: Write popup view state tests**

Create `tests/popupViewState.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createPopupViewState } from "@/entry-points/popup/state/popupViewState";

describe("createPopupViewState", () => {
  it("shows a no-video state before telemetry arrives", () => {
    expect(createPopupViewState({
      settings: {
        enabled: true,
        simpleSlider: 50,
        soundedSpeed: 1.5,
        weeklyTimeSavedComparedToSoundedSpeed: 0,
        lifetimeTimeSavedComparedToSoundedSpeed: 60,
        timeSavedLastSeenLifetimeMilestoneSeconds: 0,
      },
      latestTelemetryRecord: undefined,
      connected: false,
      connectionFailed: false,
    })).toMatchObject({
      enabled: true,
      mediaStatus: "no-video",
      speedLabel: "1.5x",
      savedTime: {
        weeklyLabel: "0s",
        lifetimeLabel: "1 min",
        nextMilestoneLabel: "15 min",
      },
    });
  });

  it("shows active video state when telemetry is connected", () => {
    expect(createPopupViewState({
      settings: {
        enabled: true,
        simpleSlider: 80,
        soundedSpeed: 1.75,
        weeklyTimeSavedComparedToSoundedSpeed: 125,
        lifetimeTimeSavedComparedToSoundedSpeed: 3661,
        timeSavedLastSeenLifetimeMilestoneSeconds: 3600,
      },
      latestTelemetryRecord: {
        elementVolume: 0.2,
        inputVolume: 0.2,
        soundedSpeed: 1.75,
      },
      connected: true,
      connectionFailed: false,
    })).toMatchObject({
      mediaStatus: "active",
      speedLabel: "1.75x",
      savedTime: {
        weeklyLabel: "2 min",
        lifetimeLabel: "1h 1m",
        nextMilestoneLabel: "2h",
      },
    });
  });

  it("shows unavailable state when connection fails", () => {
    expect(createPopupViewState({
      settings: {
        enabled: true,
        simpleSlider: 50,
        soundedSpeed: 1.5,
        weeklyTimeSavedComparedToSoundedSpeed: 0,
        lifetimeTimeSavedComparedToSoundedSpeed: 0,
        timeSavedLastSeenLifetimeMilestoneSeconds: 0,
      },
      latestTelemetryRecord: undefined,
      connected: false,
      connectionFailed: true,
    })).toMatchObject({
      mediaStatus: "unavailable",
    });
  });
});
```

- [ ] **Step 5: Run the failing popup state tests**

Run:

```bash
corepack yarn test -- tests/popupViewState.test.ts
```

Expected: fails because `popupViewState.ts` does not exist.

- [ ] **Step 6: Implement popup view state**

Create `src/entry-points/popup/state/popupViewState.ts` with exported types and pure state derivation:

```ts
import { formatSavedTime, getNextMilestoneSeconds } from "@/helpers/weeklyScorecard";

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
  latestTelemetryRecord: { soundedSpeed?: number; elementVolume?: number; inputVolume?: number } | undefined;
  connected: boolean;
  connectionFailed: boolean;
};

export type PopupViewState = {
  enabled: boolean;
  mediaStatus: PopupMediaStatus;
  speedLabel: string;
  simpleSlider: number;
  savedTime: {
    weeklyLabel: string;
    lifetimeLabel: string;
    nextMilestoneLabel: string;
  };
};

export function createPopupViewState(input: PopupViewStateInput): PopupViewState {
  const { settings } = input;
  const activeSpeed = input.latestTelemetryRecord?.soundedSpeed ?? settings.soundedSpeed;
  const nextMilestoneSeconds = getNextMilestoneSeconds(settings.lifetimeTimeSavedComparedToSoundedSpeed);

  return {
    enabled: settings.enabled,
    mediaStatus: getMediaStatus(input),
    speedLabel: `${formatSpeed(activeSpeed)}x`,
    simpleSlider: settings.simpleSlider,
    savedTime: {
      weeklyLabel: formatSavedTime(settings.weeklyTimeSavedComparedToSoundedSpeed),
      lifetimeLabel: formatSavedTime(settings.lifetimeTimeSavedComparedToSoundedSpeed),
      nextMilestoneLabel: formatSavedTime(nextMilestoneSeconds),
    },
  };
}

function getMediaStatus(input: PopupViewStateInput): PopupMediaStatus {
  if (input.connectionFailed) return "unavailable";
  if (input.connected && input.latestTelemetryRecord) return "active";
  if (input.connected) return "loading";
  return "no-video";
}

function formatSpeed(speed: number): string {
  return Number.isInteger(speed) ? speed.toFixed(0) : speed.toFixed(2).replace(/0$/, "");
}
```

- [ ] **Step 7: Run state tests**

Run:

```bash
corepack yarn test -- tests/popupIntensitySettings.test.ts tests/popupViewState.test.ts
```

Expected: both test files pass.

- [ ] **Step 8: Commit state helpers**

Run:

```bash
git add src/entry-points/popup/state tests/popupIntensitySettings.test.ts tests/popupViewState.test.ts
git commit -m "test: add popup state helpers"
```

## Task 3: Popup Adapters

**Files:**
- Create: `src/entry-points/popup/adapters/popupStorageAdapter.ts`
- Create: `src/entry-points/popup/adapters/popupTabAdapter.ts`
- Create: `src/entry-points/popup/adapters/popupTelemetryAdapter.ts`
- Modify: `src/entry-points/popup/App.svelte`

- [ ] **Step 1: Extract storage adapter**

Create `src/entry-points/popup/adapters/popupStorageAdapter.ts`:

```ts
import {
  addOnStorageChangedListener,
  getSettings,
  setSettings,
  settingsChanges2NewValues,
  type Settings,
} from "@/settings";

export type PopupSettings = Settings;

export async function loadPopupSettings(): Promise<PopupSettings> {
  return getSettings();
}

export async function writePopupSettings(settings: Partial<PopupSettings>): Promise<void> {
  await setSettings(settings);
}

export function onPopupSettingsChanged(listener: (changes: Partial<PopupSettings>) => void): () => void {
  return addOnStorageChangedListener(changes => {
    listener(settingsChanges2NewValues(changes) as Partial<PopupSettings>);
  });
}
```

- [ ] **Step 2: Extract tab adapter**

Create `src/entry-points/popup/adapters/popupTabAdapter.ts`:

```ts
import { browserOrChrome } from "@/webextensions-api-browser-or-chrome";

export type PopupTab = chrome.tabs.Tab | browser.tabs.Tab;

export async function getActivePopupTab(): Promise<PopupTab> {
  const tabs = await browserOrChrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

export async function waitForPopupTabLoad(tabPromise: Promise<PopupTab>): Promise<PopupTab> {
  let tab = await tabPromise;
  if (tab.status === "complete") return tab;

  return new Promise(resolve => {
    let pollTimeout: ReturnType<typeof setTimeout>;

    function finishIfComplete(updatedTab: PopupTab) {
      if (updatedTab.status !== "complete") return false;
      resolve(updatedTab);
      browserOrChrome.tabs.onUpdated.removeListener(onUpdatedListener);
      clearTimeout(pollTimeout);
      return true;
    }

    const onUpdatedListener = (tabId: number, _: unknown, updatedTab: PopupTab) => {
      if (tabId === tab.id) finishIfComplete(updatedTab);
    };

    browserOrChrome.tabs.onUpdated.addListener(onUpdatedListener);

    async function poll() {
      tab = await getActivePopupTab();
      if (!finishIfComplete(tab)) pollTimeout = setTimeout(poll, 2000);
    }

    pollTimeout = setTimeout(poll, 2000);
  });
}

export async function requestContentStatus(tab: PopupTab): Promise<void> {
  if (!tab.id) return;
  await browserOrChrome.tabs.sendMessage(tab.id, "checkContentStatus");
}
```

- [ ] **Step 3: Extract telemetry adapter**

Create `src/entry-points/popup/adapters/popupTelemetryAdapter.ts`:

```ts
import { browserOrChrome } from "@/webextensions-api-browser-or-chrome";
import type { TelemetryMessage } from "@/entry-points/content/AllMediaElementsController";

export type PopupTelemetryConnection = {
  disconnect: () => void;
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
```

- [ ] **Step 4: Replace inline App helpers with adapters**

In `src/entry-points/popup/App.svelte`, replace direct imports of `browserOrChrome`, `getSettings`, `setSettings`, `addOnStorageChangedListener`, and `settingsChanges2NewValues` with the adapter functions above.

- [ ] **Step 5: Run current gates**

Run:

```bash
corepack yarn test
corepack yarn tsc --noEmit
```

Expected: tests and typecheck pass.

- [ ] **Step 6: Commit adapters**

Run:

```bash
git add src/entry-points/popup/adapters src/entry-points/popup/App.svelte
git commit -m "refactor: isolate popup browser adapters"
```

## Task 4: New Popup Components

**Files:**
- Create: `src/entry-points/popup/components/PopupShell.svelte`
- Create: `src/entry-points/popup/components/EnableToggle.svelte`
- Create: `src/entry-points/popup/components/SpeedReadout.svelte`
- Create: `src/entry-points/popup/components/SavedTimeCard.svelte`
- Create: `src/entry-points/popup/components/IntensitySlider.svelte`
- Create: `src/entry-points/popup/components/IconButton.svelte`
- Create: `src/entry-points/popup/components/SettingsSheet.svelte`
- Modify: `src/entry-points/popup/App.svelte`
- Modify: `src/entry-points/popup/popup.css`

- [ ] **Step 1: Create component props contracts**

Create each component with typed exported props and simple markup. Use Svelte 5-compatible normal `<script lang="ts">` exports because this repo is migrating from Svelte 4 syntax incrementally.

`EnableToggle.svelte` contract:

```svelte
<script lang="ts">
  export let enabled: boolean;
  export let onChange: (enabled: boolean) => void;
</script>

<label class="sl-toggle">
  <input
    type="checkbox"
    checked={enabled}
    aria-label="Enabled"
    on:change={(event) => onChange(event.currentTarget.checked)}
  />
  <span>{enabled ? "Enabled" : "Disabled"}</span>
</label>
```

`SpeedReadout.svelte` contract:

```svelte
<script lang="ts">
  import type { PopupMediaStatus } from "../state/popupViewState";

  export let speedLabel: string;
  export let mediaStatus: PopupMediaStatus;

  $: statusLabel = mediaStatus === "active"
    ? "Video active"
    : mediaStatus === "loading"
      ? "Connecting"
      : mediaStatus === "unavailable"
        ? "Unavailable"
        : "No video detected";
</script>

<section class="sl-speed-readout" aria-label="Current speed">
  <div class="sl-speed-readout__value">{speedLabel}</div>
  <div class="sl-speed-readout__status">{statusLabel}</div>
</section>
```

`SavedTimeCard.svelte` contract:

```svelte
<script lang="ts">
  export let weeklyLabel: string;
  export let lifetimeLabel: string;
  export let nextMilestoneLabel: string;
</script>

<section class="sl-card" aria-label="Saved time">
  <div>
    <span class="sl-muted">Saved this week</span>
    <strong>{weeklyLabel}</strong>
  </div>
  <div class="sl-card__row">
    <span>Lifetime</span>
    <span>{lifetimeLabel}</span>
  </div>
  <div class="sl-card__row">
    <span>Next</span>
    <span>{nextMilestoneLabel}</span>
  </div>
</section>
```

- [ ] **Step 2: Add layout shell and footer components**

`PopupShell.svelte` contract:

```svelte
<script lang="ts">
  export let title = "SpeedLayer";
</script>

<main class="sl-popup">
  <header class="sl-popup__header">
    <slot name="toggle" />
    <span class="sl-popup__brand">{title}</span>
  </header>
  <div class="sl-popup__body">
    <slot />
  </div>
  <footer class="sl-popup__footer">
    <slot name="footer" />
  </footer>
</main>
```

`IconButton.svelte` contract:

```svelte
<script lang="ts">
  export let label: string;
  export let icon: string;
  export let onClick: () => void;
</script>

<button class="sl-icon-button" type="button" aria-label={label} title={label} on:click={onClick}>
  <span aria-hidden="true">{icon}</span>
</button>
```

- [ ] **Step 3: Add intensity slider**

`IntensitySlider.svelte` contract:

```svelte
<script lang="ts">
  export let value: number;
  export let onInput: (value: number) => void;
</script>

<label class="sl-intensity">
  <span class="sl-intensity__label">Intensity</span>
  <input
    type="range"
    min="0"
    max="100"
    value={value}
    aria-label="Skip intensity"
    on:input={(event) => onInput(event.currentTarget.valueAsNumber)}
  />
  <span class="sl-intensity__scale" aria-hidden="true">
    <span>Skip less</span>
    <span>Skip more</span>
  </span>
</label>
```

- [ ] **Step 4: Add settings sheet skeleton**

`SettingsSheet.svelte` contract:

```svelte
<script lang="ts">
  export let open: boolean;
  export let onClose: () => void;
  export let onOpenOptions: () => void;
</script>

{#if open}
  <section class="sl-sheet" aria-label="Settings">
    <button class="sl-sheet__close" type="button" on:click={onClose} aria-label="Close settings">Close</button>
    <button type="button" on:click={onOpenOptions}>Advanced settings</button>
  </section>
{/if}
```

- [ ] **Step 5: Compose the new components in App**

Replace the inherited visible layout in `App.svelte` with `PopupShell`, `EnableToggle`, `SpeedReadout`, `SavedTimeCard`, `IntensitySlider`, `TimelineCanvas`, `IconButton`, and `SettingsSheet`. Keep the existing adapter state and actions wired.

- [ ] **Step 6: Add SpeedLayer popup CSS**

In `src/entry-points/popup/popup.css`, define stable dimensions and no nested cards:

```css
html,
body {
  margin: 0;
  width: 360px;
  min-height: 360px;
  background: #101214;
  color: #f4f7f5;
  font: 13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.sl-popup {
  box-sizing: border-box;
  width: 360px;
  min-height: 360px;
  padding: 12px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
}

.sl-popup__header,
.sl-popup__footer,
.sl-card__row,
.sl-intensity__scale {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sl-popup__brand,
.sl-speed-readout__value,
.sl-card strong {
  font-weight: 700;
}

.sl-muted,
.sl-speed-readout__status,
.sl-card__row {
  color: #aeb8b2;
}
```

- [ ] **Step 7: Run UI compile gates**

Run:

```bash
corepack yarn tsc --noEmit
corepack yarn build:chromium
corepack yarn verify:chromium
```

Expected: all pass.

- [ ] **Step 8: Commit component rewrite**

Run:

```bash
git add src/entry-points/popup/App.svelte src/entry-points/popup/components src/entry-points/popup/popup.css
git commit -m "feat: redesign speedlayer popup"
```

## Task 5: Timeline Canvas

**Files:**
- Create: `src/entry-points/popup/components/TimelineCanvas.svelte`
- Modify: `src/entry-points/popup/App.svelte`
- Delete after parity: `src/entry-points/popup/Chart.svelte`
- Modify: `package.json`

- [ ] **Step 1: Create canvas component**

Create `src/entry-points/popup/components/TimelineCanvas.svelte`:

```svelte
<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  export type TimelineSample = {
    timeMs: number;
    volume: number;
    threshold: number;
    skipped: boolean;
  };

  export let samples: TimelineSample[] = [];
  export let emptyLabel = "Waiting for video";

  let canvas: HTMLCanvasElement;
  let animationFrameId: number | undefined;
  let mounted = false;

  onMount(() => {
    mounted = true;
    render();
  });

  onDestroy(() => {
    mounted = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  });

  $: if (mounted) render();

  function render() {
    if (!canvas) return;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(draw);
  }

  function draw() {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#15191c";
    ctx.fillRect(0, 0, width, height);

    if (samples.length === 0) {
      ctx.fillStyle = "#7f8a84";
      ctx.font = "12px system-ui";
      ctx.fillText(emptyLabel, 12, Math.round(height / 2) + 4);
      return;
    }

    const maxVolume = Math.max(...samples.map(sample => sample.volume), ...samples.map(sample => sample.threshold), 0.001);
    const barWidth = Math.max(2, width / samples.length);

    samples.forEach((sample, index) => {
      const x = index * barWidth;
      const barHeight = Math.max(1, (sample.volume / maxVolume) * (height - 8));
      ctx.fillStyle = sample.skipped ? "#8ddf7d" : "#d7dfdc";
      ctx.fillRect(x, height - barHeight, Math.ceil(barWidth), barHeight);
    });

    const threshold = samples[samples.length - 1]?.threshold ?? 0;
    const thresholdY = height - (threshold / maxVolume) * (height - 8);
    ctx.strokeStyle = "#f06a6a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, thresholdY);
    ctx.lineTo(width, thresholdY);
    ctx.stroke();
  }
</script>

<canvas
  bind:this={canvas}
  class="sl-timeline"
  width="336"
  height="76"
  aria-label="Playback activity timeline"
/>
```

- [ ] **Step 2: Wire telemetry samples in App**

In `App.svelte`, keep a capped array of timeline samples:

```ts
let timelineSamples: TimelineSample[] = [];

type TimelineSample = {
  timeMs: number;
  volume: number;
  threshold: number;
  skipped: boolean;
};

function appendTimelineSample(record: TelemetryMessage, volumeThreshold: number) {
  timelineSamples = [
    ...timelineSamples.slice(-119),
    {
      timeMs: Date.now(),
      volume: record.inputVolume ?? record.elementVolume ?? 0,
      threshold: volumeThreshold,
      skipped: (record as { isSounded?: boolean }).isSounded === false,
    },
  ];
}
```

Call `appendTimelineSample` whenever telemetry updates and pass `timelineSamples` to `TimelineCanvas`.

- [ ] **Step 3: Remove Smoothie dependency from popup**

Delete `src/entry-points/popup/Chart.svelte` after App no longer imports it.

Run:

```bash
rg "@wofwca/smoothie|Chart\\.svelte|SmoothieChart|TimeSeries" src package.json
```

If no remaining non-popup references exist, remove `@wofwca/smoothie`:

```bash
corepack yarn remove @wofwca/smoothie
```

- [ ] **Step 4: Verify cleanup**

Run:

```bash
corepack yarn test
corepack yarn tsc --noEmit
corepack yarn build:chromium
corepack yarn verify:chromium
rg -n "preload|i\\.f\\.preload|rel=\\\"preload\\\"|SmoothieChart|@wofwca/smoothie" dist-chromium/popup dist-chromium/chunks src/entry-points/popup package.json || true
```

Expected: gates pass; search returns no Smoothie/preload references for popup output.

- [ ] **Step 5: Commit timeline replacement**

Run:

```bash
git add src/entry-points/popup package.json yarn.lock
git commit -m "feat: replace popup chart with canvas timeline"
```

## Task 6: Rendered UI Verification And Closeout

**Files:**
- Modify as needed based on verification findings.
- Use: `docs/speedlayer/manual-test.html`

- [ ] **Step 1: Start manual fixture server**

Run:

```bash
corepack yarn serve:manual-test
```

Expected: server prints the local fixture URL, usually `http://127.0.0.1:8765/docs/speedlayer/manual-test.html`.

- [ ] **Step 2: Load the rebuilt extension in Chrome**

Use Chrome `chrome://extensions` and reload the unpacked extension from:

```text
/Users/jauniuskadunas/Documents/Codex/2026-05-21/i-have-a-crazy-idea-do/jumpcutter/dist-chromium
```

Expected: SpeedLayer reloads without manifest errors.

- [ ] **Step 3: Manual popup walkthrough**

Open:

```text
http://127.0.0.1:8765/docs/speedlayer/manual-test.html
```

Check:

- Popup opens.
- Enable toggle works.
- Speed readout is visible.
- Saved-time card is visible.
- Timeline renders nonblank after playback starts.
- Intensity slider changes settings without layout shift.
- Settings sheet opens and closes.
- Local file action still opens the local file player.
- Popup can be opened and closed five times without console errors.

- [ ] **Step 4: Screenshot review**

Capture popup screenshot and check:

- no text overlap
- no clipped labels
- no barcode/debug-looking chart
- no nested card layout
- no visible helper-heavy or defensive copy
- popup fits in Chrome's extension popup viewport

- [ ] **Step 5: Run final gates**

Run:

```bash
corepack yarn test
corepack yarn tsc --noEmit
corepack yarn lint
corepack yarn svelte-check --tsconfig ./tsconfig.json
corepack yarn build:chromium
corepack yarn verify:chromium
/Users/jauniuskadunas/.codex/skills/codex-review/scripts/codex-review --mode local
codex-guard done
```

Expected:

- tests pass
- typecheck passes
- lint has no new errors
- svelte-check has no new errors
- Chromium build verifies
- Codex review has no accepted/actionable findings, or accepted findings are fixed and gates rerun
- done guard reports clear local/pushed/deployed/runtime buckets

- [ ] **Step 6: Commit verification fixes**

If verification required edits, commit them:

```bash
git add src/entry-points/popup package.json yarn.lock vite.popup.config.ts webpack.config.js scripts/verify-chromium-build.mjs tests
git commit -m "fix: polish popup redesign verification"
```

If no verification edits were needed, do not create an empty commit.

## Final State To Report

Report these buckets:

- local: latest commit hash, clean/dirty state, generated `dist-chromium` status
- pushed/PR: whether commits were pushed
- deployed: Chrome Web Store remains unpublished unless a separate publish task happened
- runtime: manual Chrome fixture proof and popup console status
- blocked proof: any browser/extension console proof that could not be collected from this environment
