<script setup lang="ts">

import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import type { Art } from '@/data/types';
import type { RouteLocationRaw } from 'vue-router';
import type { ResolvedLink } from '@/site/links';

withDefaults(
  defineProps<{
    to?: RouteLocationRaw;

    link?: ResolvedLink;
    kicker?: string;
    title: string;
    body?: string;
    art?: Art | null;
    placeholder?: string;
    ratio?: string;

    featured?: boolean;
    current?: boolean;
  }>(),
  { ratio: '16 / 9', featured: false },
);
</script>

<template>
  <component
    :is="to || link ? BaseLink : 'div'"
    :to="to"
    :link="link"
    class="c-card"
    :class="{ 'c-card--featured': featured, 'c-card--current': current }"
  >
    <ArtFrame v-if="placeholder || art" :art="art" :ratio="ratio" :placeholder="placeholder" />
    <div class="c-card__body">
      <MonoLabel v-if="kicker" :tone="featured ? 'faint' : 'accent'">{{ kicker }}</MonoLabel>
      <h3 class="c-card__title">{{ title }}</h3>
      <p v-if="body" class="c-card__text">{{ body }}</p>
      <slot />
    </div>
  </component>
</template>

<style>
.c-card {
  display: block;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
  overflow: hidden;
  color: var(--color-ink);
  transition: border-color var(--dur-2) var(--ease-out);
}

.c-card:hover {
  border-color: rgba(var(--rgb-accent), 0.5);
  color: var(--color-ink);
  text-decoration: none;
}

.c-card--current {
  border-color: rgba(var(--rgb-accent), 0.55);
  box-shadow: 0 0 32px rgba(var(--rgb-accent), 0.16);
}

.c-card--featured {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-on-accent);
  box-shadow: 0 0 40px rgba(var(--rgb-accent), 0.3);
}

.c-card--featured:hover {
  color: var(--color-on-accent);
}

.c-card__body {
  padding: var(--space-5);
}

.c-card__title {
  margin-top: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 400;
}

.c-card--featured .c-card__title {
  font-weight: 700;
}

.c-card__text {
  margin-top: 10px;
  font-size: var(--size-m);
  line-height: 1.55;
  color: var(--color-ink-soft);
}

.c-card--featured .c-card__text {
  color: rgba(var(--rgb-on-accent), 0.8);
}
</style>
