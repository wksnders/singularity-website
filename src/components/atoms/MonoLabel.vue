<script setup lang="ts">
/**
 * Caps label, class `.c-mono`: kickers, eyebrows, placeholder captions. Never body copy.
 *
 * `.c-mono` is also the skin for label buttons and links, which is why the base rule sets no colour. Two things follow:
 * THIS ATOM MUST STAY IN THE ENTRY CHUNK (the site chrome imports it), or a view that wears the class without importing the atom loses it.
 * Being in the entry chunk also means every lazy view's CSS loads after it, so a view class may override `.c-mono` at equal specificity. Chrome components share the entry chunk and get no such order: they override with their own two-class selector, or write the declarations from the tokens.
 */
withDefaults(
  defineProps<{ tone?: 'accent' | 'muted' | 'faint'; size?: 'xs' | 's' | 'm'; as?: string }>(),
  { tone: 'muted', size: 's', as: 'p' },
);
</script>

<template>
  <component
    :is="as"
    class="c-mono"
    :class="[`c-mono--${tone}`, size === 's' ? null : `c-mono--${size}`]"
  >
    <slot />
  </component>
</template>

<style>
.c-mono {
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--size-label-s);
  letter-spacing: var(--track-label);
  text-transform: uppercase;
}

.c-mono--xs {
  font-size: var(--size-label-xs);
}

.c-mono--m {
  font-size: var(--size-label-m);
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
