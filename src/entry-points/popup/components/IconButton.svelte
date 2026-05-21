<script lang="ts">
  export let label: string;
  export let icon: string;
  export let onClick: () => void;
</script>

<button
  class="sl-icon-button"
  type="button"
  aria-label={label}
  title={label}
  on:click={onClick}
>
  <span aria-hidden="true">{icon}</span>
</button>
