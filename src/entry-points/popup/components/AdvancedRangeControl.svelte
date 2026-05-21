<script lang="ts">
  export let value: number;
  export let label: string;
  export let fractionalDigits = 3;

  type SvelteActionParameters = any;
  type SvelteAction = (node: HTMLElement, parameters: SvelteActionParameters) => {
    update?: (parameters: SvelteActionParameters) => void,
    destroy?: () => void,
  };

  export let useForInput: SvelteAction = () => ({});
  export let useForInputParams: SvelteActionParameters = undefined;

  $: displayValue = Number.isFinite(value) ? value : 0;
</script>

<label class="sl-advanced-range">
  <span>{label}</span>
  <div class="sl-advanced-range__row">
    <input
      type="range"
      {...$$restProps}
      bind:value
      use:useForInput={useForInputParams}
      on:input
    >
    <span
      aria-hidden="true"
      class="sl-advanced-range__value"
    >{displayValue.toFixed(fractionalDigits)}</span>
  </div>
</label>
