<script setup lang="ts">
/** Mono annotation: kickers, eyebrows, placeholder captions. Never body copy. */
withDefaults(defineProps<{ tone?: 'accent' | 'muted' | 'faint'; as?: string }>(), {
  tone: 'muted',
  as: 'p',
});
</script>

<template>
  <component :is="as" class="c-mono" :class="`c-mono--${tone}`">
    <slot />
  </component>
</template>

<style>
.c-mono {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
}

.c-mono--accent {
  color: var(--color-accent-text);
}

.c-mono--muted {
  color: var(--color-ink-soft);
}

.c-mono--faint {
  color: var(--color-ink-faint);
}
</style>
