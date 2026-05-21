<script lang="ts">
  export let weeklyLabel: string;
  export let lifetimeLabel: string;
  export let nextMilestoneLabel: string;
  export let weeklyText: string;
  export let lifetimeText: string;
  export let nextText: string;
  export let ariaLabel: string;
</script>

<section class="sl-card" aria-label={ariaLabel}>
  <div>
    <span class="sl-muted">{weeklyText}</span>
    <strong>{weeklyLabel}</strong>
  </div>
  <div class="sl-card__row">
    <span>{lifetimeText}</span>
    <span>{lifetimeLabel}</span>
  </div>
  <div class="sl-card__row">
    <span>{nextText}</span>
    <span>{nextMilestoneLabel}</span>
  </div>
</section>
