<script setup lang="ts">

import BaseLink from './BaseLink.vue';
import type { RouteLocationRaw } from 'vue-router';
import type { ResolvedLink } from '@/site/links';

defineProps<{
  to?: RouteLocationRaw;
  link?: ResolvedLink;
  index?: string;
  current?: boolean;
  accent?: boolean;
}>();
</script>

<template>
  <BaseLink
    :to="to"
    :link="link"
    class="c-jump"
    :class="{ 'is-current': current, 'is-accent': accent }"
    :aria-current="current ? 'true' : undefined"
  >
    <span v-if="index" class="c-jump__index">{{ index }}</span>
    <slot />
  </BaseLink>
</template>

<style>
.c-jump {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding-inline: 12px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-s);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
  white-space: nowrap;
}

.c-jump:hover {
  background: rgba(var(--rgb-ink), 0.07);
  color: var(--color-ink);
  text-decoration: none;
}

.c-jump.is-current {
  border-color: rgba(var(--rgb-accent), 0.45);
  color: var(--color-ink);
}

.c-jump.is-accent {
  border-color: rgba(var(--rgb-accent), 0.55);
  background: var(--color-accent-wash);
  color: var(--color-ink);
}

.c-jump__index {
  color: var(--color-ink-faint);
}
</style>
