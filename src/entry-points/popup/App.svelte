<!--
Copyright (C) 2020, 2021, 2022  WofWca <wofwca@protonmail.com>

This file is part of Jump Cutter Browser Extension.

Jump Cutter Browser Extension is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Jump Cutter Browser Extension is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Jump Cutter Browser Extension.  If not, see <https://www.gnu.org/licenses/>.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    ControllerKind_CLONING, ControllerKind_STRETCHING, changeAlgorithmAndMaybeRelatedSettings,
    ControllerKind_ALWAYS_SOUNDED,
    OppositeDayMode_ON,
    OppositeDayMode_OFF,
    OppositeDayMode_HIDDEN_BY_USER,
    OppositeDayMode_UNDISCOVERED,
  } from '@/settings';
  import type { PopupAdjustableRangeInputsCapitalized, Settings } from '@/settings';
  import { tippyActionAsyncPreload as tippy } from './tippyAction';
  import RangeSlider from './RangeSlider.svelte';
  import type { TelemetryMessage } from '@/entry-points/content/AllMediaElementsController';
  import {
    HotkeyAction,
    HotkeyAction_INCREASE_VOLUME_THRESHOLD,
    HotkeyAction_DECREASE_VOLUME_THRESHOLD,
    HotkeyAction_TOGGLE_VOLUME_THRESHOLD,
    HotkeyAction_SET_VOLUME_THRESHOLD,
    HotkeyAction_INCREASE_SOUNDED_SPEED,
    HotkeyAction_DECREASE_SOUNDED_SPEED,
    HotkeyAction_TOGGLE_SOUNDED_SPEED,
    HotkeyAction_SET_SOUNDED_SPEED,
    HotkeyAction_INCREASE_SILENCE_SPEED,
    HotkeyAction_DECREASE_SILENCE_SPEED,
    HotkeyAction_TOGGLE_SILENCE_SPEED,
    HotkeyAction_SET_SILENCE_SPEED,
    HotkeyAction_INCREASE_MARGIN_BEFORE,
    HotkeyAction_DECREASE_MARGIN_BEFORE,
    HotkeyAction_TOGGLE_MARGIN_BEFORE,
    HotkeyAction_SET_MARGIN_BEFORE,
    HotkeyAction_INCREASE_MARGIN_AFTER,
    HotkeyAction_DECREASE_MARGIN_AFTER,
    HotkeyAction_TOGGLE_MARGIN_AFTER,
    HotkeyAction_SET_MARGIN_AFTER,
    HotkeyAction_TOGGLE_PAUSE,
  } from '@/hotkeys';
  import type { HotkeyBinding } from '@/hotkeys';
  import type createKeydownListener from './hotkeys';
  import throttle from 'lodash/throttle';
  import { assertDev, getMessage } from '@/helpers';
  import { isMobile } from '@/helpers/isMobile';
  import VolumeIndicator from './VolumeIndicator.svelte';
  import PopupShell from './components/PopupShell.svelte';
  import EnableToggle from './components/EnableToggle.svelte';
  import SpeedReadout from './components/SpeedReadout.svelte';
  import SavedTimeCard from './components/SavedTimeCard.svelte';
  import IntensitySlider from './components/IntensitySlider.svelte';
  import IconButton from './components/IconButton.svelte';
  import SettingsSheet from './components/SettingsSheet.svelte';
  import TimelineCanvas from './components/TimelineCanvas.svelte';
  import {
    loadPopupSettings,
    onPopupSettingsChanged,
    writePopupSettings,
    type PopupSettings,
  } from './adapters/popupStorageAdapter';
  import {
    getActivePopupTab,
    getPopupRuntimeUrl,
    onPopupRuntimeMessage,
    openPopupOptionsPage,
    openPopupTab,
    reloadPopupTab,
    requestContentStatus,
    waitForPopupTabLoad,
    type PopupRuntimeMessageSender,
  } from './adapters/popupTabAdapter';
  import {
    connectPopupNonSettingsActions,
    connectPopupTelemetry,
    type PopupNonSettingsActionsPort,
  } from './adapters/popupTelemetryAdapter';
  import { buildWeeklyScorecard } from '@/helpers/weeklyScorecard';
  import { simpleSliderToSettings } from './state/intensitySettings';
  import { createPopupViewState } from './state/popupViewState';

  // See ./popup.css. Would be cool to do this at build-time
  if (BUILD_DEFINITIONS.BROWSER === 'chromium') {
    document.body.classList.add('better-dark-border');
  }

  type RequiredSettings =
    Pick<PopupSettings,
      'enabled'
      | 'applyTo'
      | 'popupAutofocusEnabledInput'
      | 'enableHotkeys'
      | 'silenceSpeedSpecificationMethod'
      | 'timeSavedRepresentation'
      | 'timeSavedAveragingMethod'
      | 'timeSavedAveragingWindowLength'
      | 'popupChartWidthPx'
      | 'popupChartHeightPx'
      | 'popupChartSpeed'
      | 'popupChartLengthInSeconds'
      | 'popupChartJumpPeriod'
      | 'dontAttachToCrossOriginMedia'
      | 'popupAlwaysShowOpenLocalFileLink'
      | 'advancedMode'
      | 'simpleSlider'
      | 'onPlaybackRateChangeFromOtherScripts'
      | 'hotkeys'
      | 'popupSpecificHotkeys'
      | 'oppositeDayMode'

      | 'lifetimeTimeSavedComparedToSoundedSpeed'
      | 'lifetimeTimeSavedComparedToIntrinsicSpeed'
      | 'lifetimeWouldHaveLastedIfSpeedWasSounded'
      | 'lifetimeWouldHaveLastedIfSpeedWasIntrinsic'
      | 'weeklyTimeSavedComparedToSoundedSpeed'
      | 'timeSavedLastSeenLifetimeMilestoneSeconds'
    >
    & ReturnType<Parameters<typeof createKeydownListener>[1]>
    & Parameters<typeof changeAlgorithmAndMaybeRelatedSettings>[0]
    & Parameters<typeof rangeInputSettingNameToAttrs>[1];
  let settings: RequiredSettings;

  let settingsPromise = loadPopupSettings();
  settingsPromise.then(s => {
    settings = s;
  })
  function assignNewSettings(newValues: Partial<RequiredSettings>) {
    for (const [k_, v] of Object.entries(newValues)) {
      const k = k_ as keyof typeof newValues;
      (settings[k] as any) = v;
    }
  }
  const tabPromise = getActivePopupTab();
  const tabLoadedPromise = waitForPopupTabLoad(tabPromise);

  let nonSettingsActionsPort: PopupNonSettingsActionsPort | undefined;

  let resolveFirstTelemetryReceivedP: () => void;
  const firstTelemetryReceivedP = new Promise<void>(r => resolveFirstTelemetryReceivedP = r);
  let latestTelemetryRecord: TelemetryMessage | undefined;
  let settingsSheetOpen = false;
  const telemetryUpdatePeriod = 0.02;
  let disconnect: undefined | (() => void);
  // Well, actaully we don't currently require this, because this component gets destroyed only when the document gets
  // destroyed.
  onDestroy(() => disconnect?.());
  $: connected = !!disconnect;
  let considerConnectionFailed = false;
  let gotAtLeastOneContentStatusResponse = false;
  let keydownListener: ReturnType<typeof createKeydownListener> | (() => {}) = () => {};
  let removeRuntimeMessageListener: (() => void) | undefined;
  onDestroy(() => removeRuntimeMessageListener?.());
  (async () => {
    const tab = await tabPromise;
    let elementLastActivatedAt: number | undefined;

    const onMessageListener = (
      message: any,
      sender: PopupRuntimeMessageSender
    ) => {
      if (
        sender.tab?.id !== tab.id
        || message.type !== 'contentStatus' // TODO DRY message types.
      ) return;
      gotAtLeastOneContentStatusResponse = true;
      // TODO check sender.url? Not only to check protocol, but also to somehow aid the user to locate the file that
      // he's trying to open. Idk how though, we can't just `input.value = sender.url`.
      if (
        message.elementLastActivatedAt // Nullish if no element is active, see `content/main.ts`.
        && (!elementLastActivatedAt || message.elementLastActivatedAt > elementLastActivatedAt)
      ) {
        disconnect?.();

        const frameId = sender.frameId!;
        elementLastActivatedAt = message.elementLastActivatedAt;

        const telemetryConnection = connectPopupTelemetry({
          tabId: tab.id!,
          frameId,
          telemetryUpdatePeriodSeconds: telemetryUpdatePeriod,
          onTelemetry(message) {
            latestTelemetryRecord = message;
            resolveFirstTelemetryReceivedP();
          },
        });

        nonSettingsActionsPort = connectPopupNonSettingsActions({ tabId: tab.id!, frameId });

        disconnect = () => {
          telemetryConnection.disconnect();
          nonSettingsActionsPort!.disconnect();
          nonSettingsActionsPort = undefined;
          disconnect = undefined;
        }
        considerConnectionFailed = false; // In case it timed out at first, but then succeeded some time later.
      }
    };
    removeRuntimeMessageListener = onPopupRuntimeMessage(onMessageListener);
    requestContentStatus(tab);
  })();

  (async () => {
    // Make a setings or a flag or something.
    const LISTEN_TO_HOTKEYS_IN_POPUP = true;
    await settingsPromise;
    if (LISTEN_TO_HOTKEYS_IN_POPUP && settings!.enableHotkeys) {
      const createKeydownListener = (await import(
        /* webpackExports: ['default'] */
        './hotkeys'
      )).default;
      keydownListener = createKeydownListener(
        nonSettingsActions => nonSettingsActionsPort?.postMessage(nonSettingsActions),
        () => settings,
        updateSettingsLocalCopyAndStorage,
      );
    }
  })();

  (async () => {
    await tabLoadedPromise;
    window.setTimeout(() => {
      if (!connected) {
        considerConnectionFailed = true;
      }
    }, 300);
  })();

  // This is to react to settings changes outside the popup. I think currently the only reasonable way they
  // can change from outside the popup while it's open is if you execute the `toggle_enabled` command (see
  // `initBrowserHotkeysListener.ts`).
  // Why debounce – because `addOnStorageChangedListener` also reacts to settings changes from inside this
  // (popup) script itself and sometimes when settings change rapidly, `onChanged` callback may lag behind so
  // the `settings` object's state begins jumping between the old and new state.
  // So we mitigate this by not updating the `settings` object with changes we got from `addOnStorageChangedListener`
  // until some time has passed since we last called `storage.set()`, to make sure that we have handled
  // these changes in the `addOnStorageChangedListener` callback.
  // TODO it's better to fix the root cause (i.e. not to react to same-source changes).
  let unhandledStorageChanges: Partial<Settings> | null = null;
  const removeStorageChangedListener = onPopupSettingsChanged(newValues => {
    if (thisScriptRecentlyUpdatedStorage) {
      unhandledStorageChanges = { ...unhandledStorageChanges, ...newValues };
    } else {
      assignNewSettings(newValues);
    }
  });
  onDestroy(removeStorageChangedListener);

  let thisScriptRecentlyUpdatedStorage = false;
  let thisScriptRecentlyUpdatedStorageTimeoud = -1;
  let settingsKeysToSaveToStorage = new Set<keyof typeof settings>();
  // `throttle` for performance, e.g. in case the user drags a slider (which makes the value change very often).
  const throttledSaveUnsavedSettingsToStorageAndTriggerCallbacks = throttle(() => {
    const newValues: Partial<typeof settings> = {};
    settingsKeysToSaveToStorage.forEach(key => {
      // @ts-expect-error 2322 they're both `Settings` or `Partial<Settings>` and the key is the same.
      newValues[key] = settings[key] as (typeof newValues)[typeof key];
    });
    writePopupSettings(newValues);
    settingsKeysToSaveToStorage.clear();

    thisScriptRecentlyUpdatedStorage = true;
    clearTimeout(thisScriptRecentlyUpdatedStorageTimeoud);
    // TODO would `requestIdleCallback` work? Perhaps RIC + setTimeout?
    thisScriptRecentlyUpdatedStorageTimeoud = (setTimeout as typeof window.setTimeout)(
      () => {
        thisScriptRecentlyUpdatedStorage = false;
        if (unhandledStorageChanges) {
          assignNewSettings(unhandledStorageChanges);
          unhandledStorageChanges = null;
        }
      },
      500,
    );
  }, 50);
  function updateSettingsLocalCopyAndStorage(newValues: Partial<typeof settings>) {
    assignNewSettings(newValues);
    Object.keys(newValues).forEach(key => settingsKeysToSaveToStorage.add(key as keyof typeof newValues));
    throttledSaveUnsavedSettingsToStorageAndTriggerCallbacks();
  }
  function createOnInputListener(settingKey: keyof typeof settings) {
    // Why is the value argument not used? Because we use `bind:value` in addition.
    return () => {
      settingsKeysToSaveToStorage.add(settingKey);
      throttledSaveUnsavedSettingsToStorageAndTriggerCallbacks();
    };
  }

  function rangeInputSettingNameToAttrs(
    name: PopupAdjustableRangeInputsCapitalized,
    settings: Pick<Settings, `popup${typeof name}${'Min' | 'Max' | 'Step'}`>
  ) {
    // TODO DRY?
    return {
      'useForInput': tippy,
      'min': settings[`popup${name}Min`],
      'max': settings[`popup${name}Max`],
      'step': settings[`popup${name}Step`],
    };
  }
  const tippyThemeMyTippy = 'my-tippy';
  const tippyThemeMyTippyAndPreLine = tippyThemeMyTippy + ' white-space-pre-line';


  $: silenceSpeedLabelClarification = settings?.silenceSpeedSpecificationMethod === 'relativeToSoundedSpeed'
    ? getMessage('relativeToSounded')
    : getMessage('absolute');

  function onChartClick() {
    nonSettingsActionsPort?.postMessage([{
      action: HotkeyAction_TOGGLE_PAUSE,
      keyCombination: { code: 'stub', }, // TODO this is dumb.
    }]);
  }

  const openLocalFileLinkProps = {
    href: getPopupRuntimeUrl('local-file-player/index.html'),
    target: '_blank',
  } as const;
  // Firefox for Android acts weird and apparently opens this
  // the same way it opens popups, and then when you select a file,
  // nothing happens.
  // We want to open it in a separate tab therefore.
  const onClickOpenLocalFileLink = !isMobile
    ? undefined
    : (e: Event) => {
      e.preventDefault();
      openPopupTab(getPopupRuntimeUrl('local-file-player/index.html'));
      window.close();
    };

  function openLocalFilePlayer() {
    openPopupTab(getPopupRuntimeUrl('local-file-player/index.html'));
    if (isMobile) {
      window.close();
    }
  }

  function onUseExperimentalAlgorithmInput(e: Event) {
    const newControllerType = (e.target as HTMLInputElement).checked
      ? ControllerKind_CLONING
      : ControllerKind_STRETCHING
    const newValues = changeAlgorithmAndMaybeRelatedSettings(settings, newControllerType);
    updateSettingsLocalCopyAndStorage(newValues);
  }

  $: controllerTypeAlwaysSounded = latestTelemetryRecord?.controllerType === ControllerKind_ALWAYS_SOUNDED;

  const displayNewBadgeOnExperimentalAlgorithm = new Date() < new Date('2024-09-30');

  function onAdvancedModeChange(isOn: boolean) {
    settingsKeysToSaveToStorage.add('advancedMode');
    throttledSaveUnsavedSettingsToStorageAndTriggerCallbacks();

    if (!isOn) {
      updateSettingsLocalCopyAndStorage({
        experimentalControllerType: ControllerKind_STRETCHING,
        marginBefore: 0,
        // However, it's not very nice to change this setting,
        // because it can only be changed back from the options page.
        silenceSpeedSpecificationMethod: 'relativeToSoundedSpeed',
      })

      // Set the settings according to the `simpleSlider`'s value.
      onSimpleSliderInput();
    }
  }
  function onSimpleSliderInput(nextSimpleSlider = settings.simpleSlider) {
    updateSettingsLocalCopyAndStorage({
      simpleSlider: nextSimpleSlider,
      ...simpleSliderToSettings(nextSimpleSlider),
    });
  }

  function onEnabledChange(enabled: boolean) {
    updateSettingsLocalCopyAndStorage({ enabled });
  }

  function openOptionsAndCloseOnMobile() {
    openPopupOptionsPage();
    if (isMobile) {
      // The options tab gets opened, but it is not visible because the popup stays open.
      window.close();
    }
  }

  $: liveLifetimeSavedSeconds = latestTelemetryRecord?.lifetimeTimeSaved.timeSavedComparedToSoundedSpeed
    ?? settings?.lifetimeTimeSavedComparedToSoundedSpeed
    ?? 0;
  $: scorecard = settings
    ? buildWeeklyScorecard(
      settings.weeklyTimeSavedComparedToSoundedSpeed,
      liveLifetimeSavedSeconds,
      settings.timeSavedLastSeenLifetimeMilestoneSeconds ?? 0,
    )
    : undefined;
  $: if (
    settings
    && scorecard?.newlyReachedMilestoneSeconds != undefined
    && settings.timeSavedLastSeenLifetimeMilestoneSeconds !== scorecard.newlyReachedMilestoneSeconds
  ) {
    updateSettingsLocalCopyAndStorage({
      timeSavedLastSeenLifetimeMilestoneSeconds: scorecard.newlyReachedMilestoneSeconds,
    });
  }
  $: viewState = settings && scorecard
    ? createPopupViewState({
      settings: {
        ...settings,
        weeklyTimeSavedComparedToSoundedSpeed: scorecard.weeklyTotalSeconds,
        lifetimeTimeSavedComparedToSoundedSpeed: scorecard.lifetimeSeconds,
      },
      latestTelemetryRecord,
      connected,
      connectionFailed: considerConnectionFailed,
    })
    : undefined;
  $: chartWidthPx = Math.min(settings?.popupChartWidthPx ?? 336, 336);

  function getMediaStatusLabel() {
    if (viewState?.mediaStatus === 'active') return getMessage('video');
    if (viewState?.mediaStatus === 'loading') return getMessage('loading');
    if (viewState?.mediaStatus === 'unavailable') return getMessage('contentScriptFail');
    return getMessage('noSuitableElement');
  }

  let hotkeysActions: {[P in HotkeyAction]?: HotkeyBinding[]} = {};
  settingsPromise.then((settings) => {
    if (!settings.enableHotkeys) return;
    [...settings.hotkeys, ...settings.popupSpecificHotkeys].forEach((hotKey) => {
      const actionId = hotKey.action;
      if (!hotkeysActions[actionId]) hotkeysActions[actionId] = [];
      hotkeysActions[actionId].push(hotKey);
    });
  });

  /**
   * Example output: '\nDecrease: E, shift+E'.
   * If there is no hotkey for the `actionId`, returns an empty string.
   */
  function getActionString(actionId: HotkeyAction, actionName: string): string {
    const actionHotkeys = hotkeysActions[actionId];
    if (!actionHotkeys) return '';
    let actionString = '';
    actionHotkeys.forEach((hotkey: HotkeyBinding, i: number) => {
      let keysString = '';
      const modifiers = hotkey.keyCombination.modifiers;
      if (modifiers) {
        modifiers.forEach((modifier) => {
          keysString += modifier.replace('Key', '') + '+';
        });
      }

      actionString += keysString + hotkey.keyCombination.code.replace(/^Key/, '');
      if (actionHotkeys.length !== i + 1) {
        actionString += ', ';
      }
    });

    // Perhaps using placeholders when passing data to getMessage()
    // to allow translator to have more control over this
    // Also perhaps including ":" in the translation string
    // because it might also be translated in some languages.
    return '\n' + actionName + ': ' + actionString;
  }

  let oppositeDayModeIsDiscoverable = false;
  (async () => {
    // Reveal the opposite day mode if the conditions are good.

    const now = new Date();
    const is1stOfApril = now.getDate() === 1 && now.getMonth() === 3;
    if (!is1stOfApril) {
      return
    }

    const settings = await settingsPromise;
    if (settings.oppositeDayMode !== OppositeDayMode_UNDISCOVERED) {
      // Already revealed, no need to do anything.
      return
    }
    // TODO perf: dyamically import whatever is below.

    await firstTelemetryReceivedP;
    assertDev(latestTelemetryRecord);

    // The opposite day mode is not as fun on the stretching controller.
    // Only the cloning one is fun, because it entirely skips "silence".
    if (latestTelemetryRecord.controllerType !== ControllerKind_CLONING) {
      return;
    }

    const timeSavedData = latestTelemetryRecord.sessionTimeSaved;

    // TODO fix: ahhh, this could be an exponentially decayed value,
    // it's not correct to just look at the absolute value.
    if (timeSavedData.wouldHaveLastedIfSpeedWasSounded < 2 * 60) {
      // Let's not turn on the opposite day mode yet,
      // it's too early to judge the average silence percentage
      // of the video.
      return
    }

    const timeSavedPercentage =
      timeSavedData.timeSavedComparedToSoundedSpeed /
      timeSavedData.wouldHaveLastedIfSpeedWasSounded;
    if (timeSavedPercentage < 0.20) {
      // If there is too little silence, we would have to skip too much,
      // and the cloning algorithm won't be able too keep up
      // playing the clone video. It won't be able to find the next
      // loud part in time, so we'd have to still play some
      // loud parts, which would ruin the effect.
      return
    }

    const remainingDuration = latestTelemetryRecord.elementRemainingIntrinsicDuration;
    if (Number.isNaN(remainingDuration) || remainingDuration < 5 * 60) {
      // Less than 5 minutes left, can't have much fun.
      return
    }

    oppositeDayModeIsDiscoverable = true;
  })();

</script>

<svelte:window
  on:keydown={keydownListener}
/>
{#await settingsPromise then _}
{#if viewState}
<PopupShell>
  <EnableToggle
    slot="toggle"
    enabled={viewState.enabled}
    label={getMessage('enable')}
    autofocusEnabled={settings.popupAutofocusEnabledInput}
    onChange={onEnabledChange}
  />

  <SpeedReadout
    speedLabel={viewState.speedLabel}
    statusLabel={getMediaStatusLabel()}
    ariaLabel={getMessage('soundedSpeed')}
  />

  <SavedTimeCard
    weeklyLabel={viewState.savedTime.weeklyLabel}
    lifetimeLabel={viewState.savedTime.lifetimeLabel}
    nextMilestoneLabel={viewState.savedTime.nextMilestoneLabel}
    weeklyText={getMessage('timeSaved')}
    lifetimeText={getMessage('timeSavedSinceInstallation')}
    nextText={getMessage('more')}
    ariaLabel={getMessage('timeSaved')}
  />

  <!-- TODO transitions? -->
  <div
    class="sl-chart-panel"
    style={
      `--popupChartHeight: ${settings.popupChartHeightPx}px;`
      + 'min-height: var(--popupChartHeight);'
      + 'display: flex;'
      + 'align-items: center;'
    }
  >
  <div
    style={
      "width: 100%;"
    }
  >
  {#if !connected}
    <div class="content-script-connection-info">
      <!-- TODO should we add an {:else} block for the case when it's disabled and put something like a
      "enable the extension" button? Redundant tho. -->
      {#if settings.enabled}
        {#if considerConnectionFailed}
          {#if gotAtLeastOneContentStatusResponse}
            <p>
              <span>🤷‍♀️ {getMessage('noSuitableElement')}.</span>
              <br/>
              <!-- Maybe remove this button as we already have the "changeElementSearchCriteria" one?
              Also it's kind of confusing, because this button also qualifies as a one that changes
              the search criteria. -->
              <!-- TODO how about don't show this button when there are no such elements on the page
              (e.g. when `settings.applyTo !== 'videoOnly'` and there are no <audio> elements) -->
              {#if settings.applyTo !== 'both'}
                <button
                  on:click={async () => {
                    // TODO same issue as with "retry".
                    settings.applyTo = 'both';
                    await writePopupSettings({ applyTo: 'both', enabled: false });
                    writePopupSettings({ enabled: true });
                  }}
                  style="margin: 0.25rem"
                >🔍 {getMessage('alsoSearchFor', getMessage(settings.applyTo === 'videoOnly' ? 'audio' : 'video'))}</button>
              {/if}
              <!-- How about just suggesting unmuting the element first? -->
              <!-- TODO somehow highligth the related section after opening the options page? Or maybe it's Better
              to replace it with those very inputs from the options page? -->
              <button
                on:click={() => openPopupOptionsPage()}
                style="margin: 0.25rem"
              >⚙️ {getMessage('changeElementSearchCriteria')}</button>
              <!-- Event though we now have implemented dynamic element search, there may still be some bug where this
              could be useful. -->
              <button
                on:click={async () => {
                  // TODO this flashes the parts of the UI that depend on the `enabled` setting, which doesn't look
                  // ideal.
                  await writePopupSettings({ enabled: false });
                  writePopupSettings({ enabled: true });
                }}
                style="margin: 0.25rem"
              >🔄 {getMessage('retry')}</button>
            </p>
          {:else}
            <p>
              ⚠️ {getMessage('contentScriptFail')}.<br>
              {#each getMessage('suggestOpenLocalFile', getMessage('openLocalFile')).split('**') as part, i}
                {#if i !== 1}
                  <span>{part}</span>
                {:else}
                  <!-- svelte-ignore a11y-missing-attribute --->
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <a
                    {...openLocalFileLinkProps}
                    on:click={onClickOpenLocalFileLink}
                  >{part}</a>
                {/if}
              {/each}
            </p>
          {/if}
        {:else}
          <p>⏳ {getMessage('loading')}...</p>
        {/if}
      {/if}
    </div>
  {:else}
    <TimelineCanvas
      {latestTelemetryRecord}
      volumeThreshold={settings.volumeThreshold}
      widthPx={chartWidthPx}
      heightPx={settings.popupChartHeightPx}
      lengthSeconds={settings.popupChartLengthInSeconds}
      timeProgressionSpeed={settings.popupChartSpeed}
      soundedSpeed={settings.soundedSpeed}
      onClick={onChartClick}
    />
    <!-- TODO it an element is cross-origin and we called `createMediaElementSource` for it and it appears
    to produce sound, don't show the warning. -->
    {#if latestTelemetryRecord?.elementLikelyCorsRestricted}
      {#await import(
        /* webpackExports: ['default'] */
        './MediaUnsupportedMessage.svelte'
      )}
        <!-- `await` so it doesnt get shown immediately so it doesn't flash -->
        {#await new Promise(r => setTimeout(r, 300)) then _}
          ⏳ {getMessage('loading')}...
        {/await}
      {:then { default: MediaUnsupportedMessage }}
        <MediaUnsupportedMessage
          {latestTelemetryRecord}
          {settings}
          on:dontAttachToCrossOriginMediaChange={({ detail }) => {
            updateSettingsLocalCopyAndStorage({ dontAttachToCrossOriginMedia: detail });
          }}
        />
      {/await}
    {/if}
  {/if}
  </div>
  </div>

  {#if !settings.advancedMode}
  <IntensitySlider
    value={viewState.simpleSlider}
    label={`${getMessage('skipLess')} / ${getMessage('skipMore')}`}
    skipLessLabel={getMessage('skipLess')}
    skipMoreLabel={getMessage('skipMore')}
    onInput={onSimpleSliderInput}
  />
  {:else}
  <section class="sl-legacy-controls" aria-label="Advanced controls">
  {#if settings.advancedMode}
  <VolumeIndicator {latestTelemetryRecord} {getActionString}/>
  {/if}
  <label
    use:tippy={{
      content: () => getMessage('useExperimentalAlgorithmTooltip'),
      theme: tippyThemeMyTippyAndPreLine,
    }}
    style="margin-top: 1rem; display: inline-flex; align-items: center;"
  >
    <input
      checked={settings.experimentalControllerType === ControllerKind_CLONING}
      on:input={onUseExperimentalAlgorithmInput}
      disabled={controllerTypeAlwaysSounded}
      type="checkbox"
      style="margin: 0 0.5rem 0 0;"
    >
    <span>🧪</span>
    {#if displayNewBadgeOnExperimentalAlgorithm}
      <span>🆕</span>
    {/if}
    <span>&nbsp;{getMessage('useExperimentalAlgorithm')}</span>
  </label>
  {#if (
    // The opposite day mode only applies to the cloning controller.
    settings.experimentalControllerType === ControllerKind_CLONING
    && (
      settings.oppositeDayMode === OppositeDayMode_UNDISCOVERED
        ? oppositeDayModeIsDiscoverable
        : settings.oppositeDayMode !== OppositeDayMode_HIDDEN_BY_USER
    )
  )}
    <br>
    <label
      style="margin-top: 1rem; display: inline-flex; align-items: center;"
    >
      <input
        checked={settings.oppositeDayMode === OppositeDayMode_ON}
        on:change={e => {
          updateSettingsLocalCopyAndStorage({
            oppositeDayMode: e.currentTarget.checked
              ? OppositeDayMode_ON
              : OppositeDayMode_OFF
          })
        }}
        type="checkbox"
        style="margin: 0 0.5rem 0 0;"
      >
      <!-- TODO translation -->
      <span>🔀 Opposite day</span>
    </label>
  {/if}
  {#if latestTelemetryRecord?.clonePlaybackError}
    <p>
      <!-- This usually happens when the user has activated the experimental
      algoruthm _after_ the page has loaded, so we couldn't intercept
      and clone the original `MediaSource` in `cloneMediaSources`,
      which can be fixed by a page reload.
      If an error is caused by something else, a page reload might also help,
      (but I haven't seen this happen, at least on YouTube).
      -->
      <!-- Maybe we should just switch back
      to the stretching algorithm when this happens
      instead of bothering the user with warnings?? -->
      <!-- FYI "failed to analyze loudness" is confusing because
      we actually do show the current loudness,
      because we analyze the original element in parallel. -->
      <!-- <span>⚠️</span> -->
      <!-- <span>{getMessage('contentScriptFail')}</span><br> -->
      <span>Reload the page to restart loudness analysis</span>
      <!-- TODO improvement: i18n -->
      <button
        type="button"
        on:click={(e) => {
          tabPromise.then(tab => {
            // Keep in mind that the currently actuve tab and the tab
            // that we're currently connected to might not be the same tab,
            // e.g. if this popup is open in a separate tab.
            assertDev(tab.id)
            reloadPopupTab(tab);
          })
          const thisButton = e.target;
          assertDev(thisButton instanceof HTMLButtonElement)
          thisButton.disabled = true;
          setTimeout(() => thisButton.disabled = false, 5000);
        }}
      >🔄 Reload<!--  the page --></button>
    </p>
  {/if}
  <!-- TODO DRY `VolumeThreshold`? Like `'V' + 'olumeThreshold'`? Same for other inputs. -->
  <RangeSlider
    label="🔉 {getMessage('volumeThreshold')}"
    {...rangeInputSettingNameToAttrs('VolumeThreshold', settings)}
    bind:value={settings.volumeThreshold}
    on:input={createOnInputListener('volumeThreshold')}
    disabled={controllerTypeAlwaysSounded}
    useForInputParams={{
      content: () => {
        let tooltip = getMessage('volumeThresholdTooltip');
        const hotkeysString = getActionString(HotkeyAction_INCREASE_VOLUME_THRESHOLD, getMessage("increaseSettingValue")) +
        getActionString(HotkeyAction_DECREASE_VOLUME_THRESHOLD, getMessage("decreaseSettingValue")) +
        getActionString(HotkeyAction_TOGGLE_VOLUME_THRESHOLD, getMessage("toggleSettingValue")) +
        getActionString(HotkeyAction_SET_VOLUME_THRESHOLD, getMessage("setSettingValue"));

        if (hotkeysString) {
          tooltip += '\n' + hotkeysString;
        }

        return tooltip;
      },
      theme: tippyThemeMyTippyAndPreLine,
    }}
  />
  </section>
  {/if}
  {#if (
    settings.advancedMode
    || settings.onPlaybackRateChangeFromOtherScripts !== 'updateSoundedSpeed'
  )}
  <datalist id="sounded-speed-datalist">
    <option>1</option>
  </datalist>
  <RangeSlider
    label="▶️ {getMessage('soundedSpeed')}"
    list="sounded-speed-datalist"
    fractionalDigits={2}
    {...rangeInputSettingNameToAttrs('SoundedSpeed', settings)}
    bind:value={settings.soundedSpeed}
    on:input={createOnInputListener('soundedSpeed')}
    useForInputParams={{
      content: () => {
        let tooltip = getMessage('soundedSpeedTooltip');
        const hotkeysString = getActionString(HotkeyAction_INCREASE_SOUNDED_SPEED, getMessage("increaseSettingValue")) +
        getActionString(HotkeyAction_DECREASE_SOUNDED_SPEED, getMessage("decreaseSettingValue")) +
        getActionString(HotkeyAction_TOGGLE_SOUNDED_SPEED, getMessage("toggleSettingValue")) +
        getActionString(HotkeyAction_SET_SOUNDED_SPEED, getMessage("setSettingValue"));

        if (hotkeysString) {
          tooltip += '\n' + hotkeysString;
        }

        return tooltip;
      },
      theme: tippyThemeMyTippyAndPreLine,
    }}
  />
  {/if}
  {#if settings.advancedMode}
  <RangeSlider
    label="⏩ {getMessage('silenceSpeed')} ({silenceSpeedLabelClarification})"
    fractionalDigits={2}
    {...rangeInputSettingNameToAttrs('SilenceSpeedRaw', settings)}
    bind:value={settings.silenceSpeedRaw}
    on:input={createOnInputListener('silenceSpeedRaw')}
    disabled={
      settings.experimentalControllerType === ControllerKind_CLONING
      || controllerTypeAlwaysSounded
    }
    useForInputParams={{
      content: () => {
        let tooltip = getMessage(
        'silenceSpeedTooltip',
        settings.silenceSpeedSpecificationMethod === 'relativeToSoundedSpeed'
          ? getMessage('silenceSpeedTooltipRelativeNote')
          : ''
        );

        const hotkeysString = getActionString(HotkeyAction_INCREASE_SILENCE_SPEED, getMessage("increaseSettingValue")) +
        getActionString(HotkeyAction_DECREASE_SILENCE_SPEED, getMessage("decreaseSettingValue")) +
        getActionString(HotkeyAction_TOGGLE_SILENCE_SPEED, getMessage("toggleSettingValue")) +
        getActionString(HotkeyAction_SET_SILENCE_SPEED, getMessage("setSettingValue"));

        if (hotkeysString) {
          tooltip += '\n' + hotkeysString;
        }

        return tooltip;

      },
      theme: tippyThemeMyTippyAndPreLine,
    }}
  />
  <RangeSlider
    label="⏱️⬅️ {getMessage('marginBefore')}"
    {...rangeInputSettingNameToAttrs('MarginBefore', settings)}
    bind:value={settings.marginBefore}
    on:input={createOnInputListener('marginBefore')}
    disabled={controllerTypeAlwaysSounded}
    useForInputParams={{
      content: () => {
        let tooltip = getMessage('marginBeforeTooltip');
        const hotkeysString = getActionString(HotkeyAction_INCREASE_MARGIN_BEFORE, getMessage("increaseSettingValue")) +
        getActionString(HotkeyAction_DECREASE_MARGIN_BEFORE, getMessage("decreaseSettingValue")) +
        getActionString(HotkeyAction_TOGGLE_MARGIN_BEFORE, getMessage('toggleSettingValue')) +
        getActionString(HotkeyAction_SET_MARGIN_BEFORE, getMessage('setSettingValue'));

        if (hotkeysString) {
          tooltip += '\n' + hotkeysString;
        }

        return tooltip;
      },
      theme: tippyThemeMyTippyAndPreLine,
    }}
  />
  <RangeSlider
    label="⏱️➡️ {getMessage('marginAfter')}"
    {...rangeInputSettingNameToAttrs('MarginAfter', settings)}
    bind:value={settings.marginAfter}
    on:input={createOnInputListener('marginAfter')}
    disabled={controllerTypeAlwaysSounded}
    useForInputParams={{
      content: () => {
        let tooltip = getMessage('marginAfterTooltip');
        const hotkeysString = getActionString(HotkeyAction_INCREASE_MARGIN_AFTER, getMessage("increaseSettingValue")) +
        getActionString(HotkeyAction_DECREASE_MARGIN_AFTER, getMessage("decreaseSettingValue")) +
        getActionString(HotkeyAction_TOGGLE_MARGIN_AFTER, getMessage("toggleSettingValue")) +
        getActionString(HotkeyAction_SET_MARGIN_AFTER, getMessage('setSettingValue'));

        if (hotkeysString) {
          tooltip += '\n' + hotkeysString;
        }

        return tooltip;
      },
      theme: tippyThemeMyTippyAndPreLine,
    }}
  />
  {/if}
  <SettingsSheet
    open={settingsSheetOpen}
    titleLabel={getMessage('popupAdvancedMode')}
    advancedLabel={getMessage('popupAdvancedMode')}
    closeLabel="Close settings"
    onClose={() => settingsSheetOpen = false}
    onOpenOptions={openOptionsAndCloseOnMobile}
  >
    <label class="sl-sheet__toggle">
      <input
        type="checkbox"
        bind:checked={settings.advancedMode}
        on:change={e => onAdvancedModeChange(e.currentTarget.checked)}
      />
      {getMessage("popupAdvancedMode")}
    </label>
    {#if settings.popupAlwaysShowOpenLocalFileLink}
      <button type="button" on:click={openLocalFilePlayer}>{getMessage('openLocalFile')}</button>
    {/if}
  </SettingsSheet>

  <svelte:fragment slot="footer">
    <div class="sl-popup__footer-actions">
      {#if settings.popupAlwaysShowOpenLocalFileLink}
        <IconButton label={getMessage('openLocalFile')} icon="📂" onClick={openLocalFilePlayer} />
      {/if}
      <IconButton label={getMessage('popupAdvancedMode')} icon="⚙️" onClick={() => settingsSheetOpen = true} />
    </div>
  </svelte:fragment>
</PopupShell>
{/if}
{/await}

<style>
  /* Global because otherwise it's not applied. I think it's fine as we have to specify the theme explicitly anyway. */
  :global(.tippy-box[data-theme~='my-tippy']) {
    font-size: inherit;
  }
  :global(.tippy-box[data-theme~='white-space-pre-line']) {
    white-space: pre-line;
  }

  .content-script-connection-info {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .capitalize-first-letter::first-letter {
    text-transform: capitalize;
  }
</style>
