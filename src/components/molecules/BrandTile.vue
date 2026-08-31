<script setup lang="ts">
/**
 * The brand shelf tile, used wherever a faction's brands are listed together.
 *
 * The mark IS the brand's art, so the tile leads with it rather than reserving
 * a wide art slot. Sits beside FactionTile: same faction edge, same hover, one
 * row up from EntityTile. A brand with no shipped mark falls back to the
 * faction dot, so the grid never develops a hole while art is pending.
 */
import BaseLink from '@/components/atoms/BaseLink.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import { to } from '@/site/links';
import type { Brand, Faction } from '@/data/types';

defineProps<{
  brand: Brand;
  faction?: Faction | null;
  descriptor?: string;
  /** Derived count line, e.g. "12 cards · 3 characters play it". */
  note?: string;
}>();
</script>

<template>
  <BaseLink
    :to="to('brand', { brandId: brand.id })"
    class="c-brand"
    :style="{ '--faction': faction?.color, '--faction-text': faction?.colorText }"
  >
    <span class="c-brand__mark">
      <BrandMark :icon="brand.icon" :name="brand.name" :color="faction?.color" :size="88" />
    </span>
    <span class="c-brand__body">
      <h3 class="c-brand__name">{{ brand.name }}</h3>
      <span v-if="descriptor" class="c-brand__descriptor">{{ descriptor }}</span>
      <span v-if="note" class="c-brand__note">{{ note }}</span>
    </span>
  </BaseLink>
</template>

<style>
.c-brand {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-left: 2px solid var(--faction, var(--color-line-strong));
  border-radius: var(--radius-l);
  color: var(--color-ink);
  transition:
    border-color var(--dur-2) var(--ease-out),
    background var(--dur-2) var(--ease-out);
}

.c-brand:hover {
  color: var(--color-ink);
  text-decoration: none;
  background: var(--color-surface-raised);
  border-color: rgba(var(--rgb-accent), 0.5);
  border-left-color: var(--faction, var(--color-line-strong));
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
  display: block;
  min-width: 0;
}

.c-brand__name {
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 400;
  overflow-wrap: anywhere;
}

.c-brand__descriptor {
  display: block;
  margin-top: var(--space-2);
  max-width: 44ch;
  font-size: var(--size-m);
  line-height: 1.55;
  color: var(--color-ink-soft);
}

.c-brand__note {
  display: block;
  margin-top: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--size-mono-m);
  letter-spacing: 0.04em;
  color: var(--color-ink-faint);
}
</style>
