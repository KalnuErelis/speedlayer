<script lang="ts">
  export let title = "SpeedLayer";
</script>

<main class="sl-popup sl-popup--classic-player">
  <header class="sl-popup__header">
    <slot name="toggle" />
    <span class="sl-popup__brand">{title}</span>
  </header>
  <section class="sl-popup__display" aria-live="polite">
    <slot name="display" />
  </section>
  <div class="sl-popup__body">
    <slot />
  </div>
  <footer class="sl-popup__footer">
    <slot name="footer" />
  </footer>
</main>
