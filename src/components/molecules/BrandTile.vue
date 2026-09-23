<script setup lang="ts">

import BaseLink from '@/components/atoms/BaseLink.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import { to } from '@/site/links';
import type { Brand, Faction } from '@/data/types';

withDefaults(
  defineProps<{
    brand: Brand;
    faction?: Faction | null;
    color?: string | null;
    descriptor?: string;
    /** Why a brand sits outside the faction lines; universal and personal brands only. */
    condition?: string;

    note?: string;
    markSize?: number;
  }>(),
  { faction: null, color: null, markSize: 88 },
);
</script>

<template>
  <BaseLink
    :to="to('brand', { brandId: brand.id })"
    class="c-brand"
    :style="{ '--faction': color ?? faction?.color, '--faction-text': faction?.colorText }"
  >
    <span class="c-brand__edge" aria-hidden="true"></span>
    <span class="c-brand__mark">
      <BrandMark
        :icon="brand.icon"
        :name="brand.name"
        :color="color ?? faction?.color"
        :size="markSize"
      />
    </span>
    <div class="c-brand__body">
      <h3 class="c-brand__name">{{ brand.name }}</h3>
      <span v-if="descriptor" class="c-brand__descriptor">{{ descriptor }}</span>
      <span v-if="condition" class="c-brand__condition">{{ condition }}</span>
      <span v-if="note" class="c-brand__note">{{ note }}</span>
    </div>
  </BaseLink>
</template>

<style>
.c-brand {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 22px 22px 20px;
  background: var(--color-surface-sunk);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
  color: var(--color-ink);
  transition:
    border-color var(--dur-2) var(--ease-out),
    background var(--dur-2) var(--ease-out);
}

.c-brand:hover {
  color: var(--color-ink);
  text-decoration: none;
  background: var(--color-surface);
  border-color: rgba(var(--rgb-accent), 0.5);
}

.c-brand__edge {
  position: absolute;
  top: -1px;
  left: 24px;
  right: 24px;
  height: 2px;
  border-radius: 0 0 2px 2px;
  background: var(--faction, rgba(var(--rgb-ink), 0.28));
}

.c-brand__mark {
  display: flex;
  flex: 0 0 auto;
  transition: transform var(--dur-2) var(--ease-out);
}

.c-brand:hover .c-brand__mark {
  transform: scale(1.04);
}

.c-brand__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.c-brand__name {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 2.4vw, 1.5rem);
  font-weight: 400;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.c-brand__descriptor {
  max-width: 44ch;
  font-size: var(--size-body-s);
  line-height: 1.55;
  color: rgba(var(--rgb-ink), 0.78);
}

.c-brand__condition {
  font-size: var(--size-m);
  line-height: 1.5;
  color: rgba(var(--rgb-ink), 0.66);
}

.c-brand__note {
  margin-top: 2px;
  font-family: var(--font-mono);
  font-size: var(--size-s);
  line-height: 1.5;
  color: var(--color-ink-soft);
}
</style>
