<script setup lang="ts">
/**
 * P4 — the breadcrumb spine on lore pages, with lateral hops (previous/next
 * faction, brand or character). 44px targets: this is the main way a reader
 * walks sideways through the universe.
 */
import BaseLink from '@/components/atoms/BaseLink.vue';
import type { Crumb } from '@/site/sections';

defineProps<{
  crumbs: Crumb[];
  prev?: Crumb | null;
  next?: Crumb | null;
}>();
</script>

<template>
  <nav class="c-crumbs" aria-label="Breadcrumb">
    <ol class="c-crumbs__list">
      <li v-for="(crumb, i) in crumbs" :key="i" class="c-crumbs__item">
        <BaseLink v-if="crumb.to" :to="crumb.to" class="c-crumbs__link">{{ crumb.label }}</BaseLink>
        <span v-else aria-current="page" class="c-crumbs__current">{{ crumb.label }}</span>
        <span v-if="i < crumbs.length - 1" class="c-crumbs__sep" aria-hidden="true">/</span>
      </li>
    </ol>
    <div v-if="prev || next" class="c-crumbs__hops">
      <BaseLink v-if="prev" :to="prev.to" class="c-crumbs__hop">← {{ prev.label }}</BaseLink>
      <BaseLink v-if="next" :to="next.to" class="c-crumbs__hop">{{ next.label }} →</BaseLink>
    </div>
  </nav>
</template>

<style>
.c-crumbs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  align-items: center;
  justify-content: space-between;
}

.c-crumbs__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  list-style: none;
}

.c-crumbs__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.c-crumbs__link,
.c-crumbs__current,
.c-crumbs__hop {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.c-crumbs__link {
  color: var(--color-ink-faint);
}

.c-crumbs__current {
  color: var(--color-ink);
}

.c-crumbs__sep {
  color: rgba(var(--rgb-ink), 0.3);
}

.c-crumbs__hops {
  display: flex;
  gap: var(--space-2);
}

.c-crumbs__hop {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding-inline: var(--space-3);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-s);
  color: var(--color-ink-muted);
  white-space: nowrap;
}
</style>
