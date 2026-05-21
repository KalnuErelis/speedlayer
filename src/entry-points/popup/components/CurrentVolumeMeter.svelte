<script lang="ts">
  import { getMessage } from "@/helpers";
  import type { TelemetryMessage } from "@/entry-points/content/AllMediaElementsController";
  import {
    HotkeyAction,
    HotkeyAction_DECREASE_VOLUME,
    HotkeyAction_INCREASE_VOLUME,
  } from "@/hotkeys";
  import { tippyActionAsyncPreload as tippy } from "../tippyAction";

  const tippyThemeMyTippyAndPreLine = "my-tippy white-space-pre-line";

  type GetActionStringFunc = (actionId: HotkeyAction, actionName: string) => string;
  export let getActionString: GetActionStringFunc;
  export let latestTelemetryRecord: TelemetryMessage | undefined;

  $: volume = latestTelemetryRecord?.elementVolume ?? 0;
  $: icon = getVolumeIcon(volume);

  function getVolumeIcon(volume: number) {
    if (volume < 0.001) return "🔇";
    if (volume < 1 / 3) return "🔈";
    if (volume < 2 / 3) return "🔉";
    return "🔊";
  }
</script>

<span
  class="sl-volume-meter"
  use:tippy={{
    content: () => {
      let tooltip = getMessage("volume");
      const hotkeysString =
        getActionString(HotkeyAction_INCREASE_VOLUME, getMessage("increaseSettingValue")) +
        getActionString(HotkeyAction_DECREASE_VOLUME, getMessage("decreaseSettingValue"));
      if (hotkeysString) tooltip += "\n" + hotkeysString;
      return tooltip;
    },
    theme: tippyThemeMyTippyAndPreLine,
  }}
>
  <span class="sl-volume-meter__icon" aria-hidden="true">{icon}</span>
  <meter aria-label={getMessage("volume")} min="0" max="1" value={volume}></meter>
</span>
