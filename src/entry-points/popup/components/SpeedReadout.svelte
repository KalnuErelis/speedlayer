<script lang="ts">
  export let speedLabel: string;
  export let statusLabel: string;
  export let ariaLabel: string;
</script>

<section class="sl-speed-readout" aria-label={ariaLabel}>
  <div class="sl-speed-readout__value">{speedLabel}</div>
  <div class="sl-speed-readout__status">{statusLabel}</div>
</section>
