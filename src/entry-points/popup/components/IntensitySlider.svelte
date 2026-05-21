<script lang="ts">
  export let value: number;
  export let label: string;
  export let skipLessLabel: string;
  export let skipMoreLabel: string;
  export let onInput: (value: number) => void;
</script>

<label class="sl-intensity">
  <span class="sl-intensity__label">{label}</span>
  <input
    type="range"
    min="0"
    max="100"
    value={value}
    aria-label={label}
    on:input={(event) => onInput(event.currentTarget.valueAsNumber)}
  />
  <span class="sl-intensity__scale" aria-hidden="true">
    <span>{skipLessLabel}</span>
    <span>{skipMoreLabel}</span>
  </span>
</label>
