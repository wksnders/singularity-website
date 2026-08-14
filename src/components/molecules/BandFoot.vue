<script setup lang="ts">
/**
 * W5 — the foot of a band: exactly ONE exit, plus a mobile-only route back to
 * the section index. Two exits at the bottom of a band is a dead end wearing a
 * hat: the reader picks neither.
 */
import UiButton from '@/components/atoms/UiButton.vue';
import { t } from '@/content';
import type { RouteLocationRaw } from 'vue-router';
import type { ResolvedLink } from '@/site/links';

defineProps<{ to?: RouteLocationRaw; link?: ResolvedLink; label: string }>();
</script>

<template>
  <div class="c-bandfoot">
    <UiButton variant="quiet" :to="to" :link="link">{{ label }}</UiButton>
    <a class="c-bandfoot__up" href="#on-this-page">↑ {{ t('wayfinding.sections') }}</a>
  </div>
</template>

<style>
.c-bandfoot {
  margin-top: var(--space-8);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-6);
  align-items: center;
  justify-content: space-between;
}

.c-bandfoot__up {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

/* The index is always visible on desktop; this shortcut is for small screens. */
@media (min-width: 900px) {
  .c-bandfoot__up {
    display: none;
  }
}
</style>
