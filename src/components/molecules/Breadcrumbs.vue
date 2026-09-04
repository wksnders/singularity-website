<script setup lang="ts">
/**
 * P4 — the breadcrumb spine on lore pages, with lateral hops (previous/next
 * faction, brand or character). 44px targets: this is the main way a reader
 * walks sideways through the universe.
 *
 * Mount it only where there is an ancestor to name: a lone crumb with no `to`
 * is a navigation landmark with nothing to navigate to.
 */
import BaseLink from '@/components/atoms/BaseLink.vue';
import { t } from '@/content';
import type { Crumb } from '@/site/sections';

defineProps<{
  crumbs: Crumb[];
  prev?: Crumb | null;
  next?: Crumb | null;
  position?: { label: string; index: number; total: number } | null;
  compactHops?: boolean;
}>();

const pad = (n: number) => String(n).padStart(2, '0');
</script>

<template>
  <nav
    class="c-crumbs"
    :class="{ 'c-crumbs--compact': compactHops }"
    :aria-label="t('wayfinding.breadcrumb')"
  >
    <ol class="c-crumbs__list">
      <li v-for="(crumb, i) in crumbs" :key="i" class="c-crumbs__item">
        <BaseLink
          v-if="crumb.to"
          :to="crumb.to"
          class="c-crumbs__link"
          :class="{ 'c-crumbs__link--parent': i === crumbs.length - 2 }"
        >{{ crumb.label }}</BaseLink>
        <span v-else aria-current="page" class="c-crumbs__current">{{ crumb.label }}</span>
        <span v-if="i < crumbs.length - 1" class="c-crumbs__sep" aria-hidden="true">/</span>
      </li>
    </ol>
    <div v-if="prev || next" class="c-crumbs__hops">
      <span v-if="position" class="c-crumbs__position">
        {{ position.label }} {{ pad(position.index) }} / {{ pad(position.total) }}
      </span>
      <BaseLink
        v-if="prev"
        :to="prev.to"
        rel="prev"
        class="c-crumbs__hop"
        :class="{ 'c-crumbs__hop--icon': compactHops }"
        :title="compactHops ? prev.label : undefined"
      >
        <span class="l-sr-only">{{ t('wayfinding.previous') }} {{ prev.label }}</span>
        <span aria-hidden="true">←</span>
        <span v-if="!compactHops" aria-hidden="true">{{ prev.label }}</span>
      </BaseLink>
      <BaseLink
        v-if="next"
        :to="next.to"
        rel="next"
        class="c-crumbs__hop"
        :class="{ 'c-crumbs__hop--icon': compactHops }"
        :title="compactHops ? next.label : undefined"
      >
        <span class="l-sr-only">{{ t('wayfinding.next') }} {{ next.label }}</span>
        <span v-if="!compactHops" aria-hidden="true">{{ next.label }}</span>
        <span aria-hidden="true">→</span>
      </BaseLink>
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
.c-crumbs__position,
.c-crumbs__hop {
  font-family: var(--font-mono);
  font-size: var(--size-mono-m);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.c-crumbs__link {
  color: var(--color-ink-muted);
}

.c-crumbs__link--parent {
  color: var(--color-accent-text);
}

.c-crumbs__current {
  color: var(--color-ink-soft);
}

.c-crumbs__sep {
  color: rgba(var(--rgb-ink), 0.3);
}

.c-crumbs__hops {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.c-crumbs__position {
  color: var(--color-ink-faint);
  white-space: nowrap;
}

.c-crumbs__hop {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding-inline: var(--space-3);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-s);
  color: var(--color-ink-muted);
  white-space: nowrap;
}

.c-crumbs__hop--icon {
  display: grid;
  place-items: center;
  width: 44px;
  padding-inline: 0;
}

.c-crumbs--compact {
  flex-wrap: nowrap;
}

.c-crumbs--compact .c-crumbs__list {
  flex: 1 1 auto;
  min-width: 0;
}

.c-crumbs--compact .c-crumbs__hops {
  flex: 0 1 auto;
  flex-wrap: nowrap;
  min-width: 0;
  align-self: flex-start;
}

.c-crumbs--compact .c-crumbs__position {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.c-crumbs--compact .c-crumbs__hop {
  flex: 0 0 auto;
}
</style>
