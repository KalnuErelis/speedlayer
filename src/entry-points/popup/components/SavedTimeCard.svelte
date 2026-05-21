<script lang="ts">
  export let weeklyLabel: string;
  export let lifetimeLabel: string;
  export let nextMilestoneLabel: string;
  export let weeklyText: string;
  export let lifetimeText: string;
  export let nextText: string;
  export let ariaLabel: string;
</script>

<section class="sl-saved-display" aria-label={ariaLabel}>
  <span class="sl-saved-display__label">{weeklyText}</span>
  <strong class="sl-saved-display__value">{weeklyLabel}</strong>
  <div class="sl-saved-display__stats">
    <span>{lifetimeText}</span>
    <span>{lifetimeLabel}</span>
    <span>{nextText}</span>
    <span>{nextMilestoneLabel}</span>
  </div>
</section>
