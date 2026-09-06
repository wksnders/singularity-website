<script setup lang="ts">
/* The mobile-only up-link targets the #on-this-page anchor rendered by the view's section index. */
import UiButton from '@/components/atoms/UiButton.vue';
import { t } from '@/content';
import type { RouteLocationRaw } from 'vue-router';
import type { ResolvedLink } from '@/site/links';

defineProps<{ to?: RouteLocationRaw; link?: ResolvedLink; label: string }>();
</script>

<template>
  <div class="c-bandfoot">
    <div class="c-bandfoot__exits">
      <UiButton variant="quiet" :to="to" :link="link">{{ label }}</UiButton>
      <slot />
    </div>
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

.c-bandfoot__exits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-6);
  align-items: center;
}

.c-bandfoot__up {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

@media (min-width: 900px) {
  .c-bandfoot__up {
    display: none;
  }
}
</style>
