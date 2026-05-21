<script lang="ts">
  export let enabled: boolean;
  export let label: string;
  export let autofocusEnabled = false;
  export let onChange: (enabled: boolean) => void;
</script>

<label class="sl-toggle">
  <!-- svelte-ignore a11y_autofocus - mirrors the existing popup keyboard setting. -->
  <input
    type="checkbox"
    checked={enabled}
    aria-label={label}
    autofocus={autofocusEnabled}
    on:change={(event) => onChange(event.currentTarget.checked)}
  />
  <span>{label}</span>
</label>
