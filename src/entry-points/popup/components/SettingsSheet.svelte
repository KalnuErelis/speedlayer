<script lang="ts">
  export let open: boolean;
  export let titleLabel: string;
  export let advancedLabel: string;
  export let onClose: () => void;
  export let onOpenOptions: () => void;
</script>

{#if open}
  <section class="sl-sheet" aria-label={titleLabel}>
    <div class="sl-sheet__header">
      <span>{titleLabel}</span>
      <button class="sl-sheet__close" type="button" on:click={onClose} aria-label={titleLabel}>×</button>
    </div>
    <slot />
    <button class="sl-sheet__advanced" type="button" on:click={onOpenOptions}>{advancedLabel}</button>
  </section>
{/if}
