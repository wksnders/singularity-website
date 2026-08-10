<script setup lang="ts">
/**
 * Card class 2 of 3 — the FRAMELESS art tile. Art, then the caption BELOW it.
 * No text over unknown pixels, no scrim, no card chrome: the art is the crown
 * jewel and gets the whole frame.
 */
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import type { Art } from '@/data/types';
import type { RouteLocationRaw } from 'vue-router';

withDefaults(
  defineProps<{
    to: RouteLocationRaw;
    art?: Art | null;
    placeholder?: string;
    /** Rendered above the name, per the character wireframe. */
    epithet?: string;
    name: string;
    /** Mono badge above the epithet: sealed unlocks, any-faction bonus. */
    badge?: string;
    /** One entry per faction membership — a dot beside every name. */
    tags?: { label: string; color?: string | null }[];
    ratio?: string;
  }>(),
  { ratio: '3 / 4', placeholder: '[ character art 3:4 ]' },
);
</script>

<template>
  <BaseLink :to="to" class="c-tile">
    <span class="c-tile__art" :style="{ '--faction': tags?.[0]?.color || undefined }">
      <ArtFrame :art="art" :ratio="ratio" radius="m" :placeholder="placeholder" />
    </span>
    <span class="c-tile__body">
      <span v-if="badge" class="c-tile__badge">{{ badge }}</span>
      <span v-if="epithet" class="c-tile__epithet">{{ epithet }}</span>
      <h3 class="c-tile__name">{{ name }}</h3>
      <span v-if="tags?.length" class="c-tile__tags">
        <span v-for="tag in tags" :key="tag.label" class="c-tile__tag">
          <FactionDot :color="tag.color" />
          {{ tag.label }}
        </span>
      </span>
    </span>
  </BaseLink>
</template>

<style>
.c-tile {
  display: block;
  color: var(--color-ink);
}

.c-tile:hover {
  text-decoration: none;
  color: var(--color-ink);
}

.c-tile__art {
  display: block;
  border-radius: var(--radius-m);
  overflow: hidden;
  border-bottom: 3px solid var(--faction);
  transition: transform var(--dur-2) var(--ease-out);
}

.c-tile:hover .c-tile__art {
  transform: translateY(-2px);
}

.c-tile__body {
  display: block;
  padding-top: var(--space-3);
}

.c-tile__epithet {
  display: block;
  font-size: var(--size-mono-m);
  letter-spacing: 0.06em;
  color: var(--color-ink-muted);
}

.c-tile__badge {
  display: block;
  margin-bottom: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
  white-space: nowrap;
}

.c-tile__name {
  margin-top: var(--space-1);
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 500;
}

.c-tile__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-3);
  margin-top: var(--space-2);
}

.c-tile__tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: var(--size-mono-m);
  color: var(--color-ink-muted);
}
</style>
