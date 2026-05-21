<script lang="ts">
  export let savedLabel: string;
  export let weeklyBoostLabel: string;
  export let levelLabel: string;
  export let progressPercent: number;
  export let toNextLevelLabel: string;
  export let isLevelUp: boolean;
  export let weeklyText: string;
  export let progressText: string;
  export let ariaLabel: string;
</script>

<section class:sl-saved-display--level-up={isLevelUp} class="sl-saved-display" aria-label={ariaLabel}>
  <div class="sl-saved-display__topline">
    <span class="sl-saved-display__label">{levelLabel}</span>
    {#if isLevelUp}
      <span class="sl-saved-display__badge">LEVEL UP</span>
    {/if}
  </div>
  <strong class="sl-saved-display__value">{savedLabel}</strong>
  <div class="sl-level-track" aria-label={`${Math.round(progressPercent)}% ${progressText}`}>
    <span
      class="sl-level-track__fill"
      style={`--sl-level-progress: ${progressPercent}%`}
    ></span>
  </div>
  <div class="sl-saved-display__stats">
    <span>{weeklyText}</span>
    <span>{weeklyBoostLabel}</span>
    <span>{progressText}</span>
    <span>{toNextLevelLabel}</span>
  </div>
</section>
