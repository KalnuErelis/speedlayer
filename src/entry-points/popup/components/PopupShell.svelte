<script lang="ts">
  export let title = "SpeedLayer";
</script>

<main class="sl-popup">
  <header class="sl-popup__header">
    <slot name="toggle" />
    <span class="sl-popup__brand">{title}</span>
  </header>
  <div class="sl-popup__body">
    <slot />
  </div>
  <footer class="sl-popup__footer">
    <slot name="footer" />
  </footer>
</main>
