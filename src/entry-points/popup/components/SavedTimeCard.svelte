<script lang="ts">
  export let savedLabel: string;
  export let currentVideoLabel: string;
  export let weeklyBoostLabel: string;
  export let levelLabel: string;
  export let progressPercent: number;
  export let toNextLevelLabel: string;
  export let isLevelUp: boolean;
  export let weeklyText: string;
  export let progressText: string;
  export let ariaLabel: string;
  export let topVideos: Array<{
    title: string;
    savedLabel: string;
  }> = [];
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
    <span>this video saved</span>
    <span>{currentVideoLabel}</span>
    <span>{weeklyText} saved</span>
    <span>{weeklyBoostLabel}</span>
    <span>{progressText} milestone</span>
    <span>{toNextLevelLabel}</span>
  </div>
  {#if topVideos.length}
    <div class="sl-video-saves">
      <span class="sl-saved-display__label">top saves</span>
      {#each topVideos as video}
        <div class="sl-video-saves__row">
          <span title={video.title}>{video.title}</span>
          <strong>{video.savedLabel}</strong>
        </div>
      {/each}
    </div>
  {/if}
</section>
