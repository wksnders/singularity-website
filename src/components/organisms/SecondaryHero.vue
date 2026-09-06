<script setup lang="ts">
/* Deliberately has no art slot so these pages never render a broken image. */
withDefaults(defineProps<{ glow?: string; note?: string }>(), {
  glow: '90% 70% at 80% 0%',
});
</script>

<template>
  <section class="c-subhero" :style="{ '--glow-origin': glow }">
    <div class="c-subhero__field" aria-hidden="true" />
    <div class="c-subhero__body l-wrap">
      <slot />
      <p v-if="note" class="c-subhero__note" aria-hidden="true">{{ note }}</p>
    </div>
  </section>
</template>

<style>
.c-subhero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--color-line);
}

.c-subhero__field {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(var(--glow-origin), rgba(var(--rgb-accent), 0.18) 0%, rgba(var(--rgb-bg), 0) 60%),
    repeating-linear-gradient(
      135deg,
      rgba(var(--rgb-ink), 0.04) 0 12px,
      rgba(var(--rgb-ink), 0.015) 12px 24px
    );
}

.c-subhero__body {
  position: relative;
  padding-block: calc(var(--nav-height) + var(--space-12)) var(--band-y);
}

.c-subhero__note {
  margin-top: var(--space-8);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: 0.12em;
  color: rgba(var(--rgb-ink), 0.32);
}
</style>
