<script setup lang="ts">
/**
 * The pool as a picker: small tiles choose, one large card reads.
 */
import { computed, ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import { pictureSources } from '@/site/links';
import type { Art } from '@/data/types';
import type { RouteLocationRaw } from 'vue-router';

export interface PoolCard {
  id: string;
  name: string;
  brandId: string;
  brandName: string;
  cardArt: Art;
}

export interface PoolGroup {
  id: string;
  name: string;
  color: string | null;
  textColor: string | null;
  icon: string | null;
  to: RouteLocationRaw;
  linkLabel: string;
  note?: string | null;
  cards: PoolCard[];
}

const props = defineProps<{
  groups: PoolGroup[];
  selectedId: string | null;
}>();

const emit = defineEmits<{ select: [card: PoolCard] }>();

const facet = ref<string | null>(null);
const rove = ref<Record<string, number>>({});
const rails = ref<Record<string, HTMLElement | null>>({});

const total = computed(() => props.groups.reduce((sum, g) => sum + g.cards.length, 0));
const shown = computed(() =>
  props.groups.filter((group) => !facet.value || facet.value === group.id),
);
const shownCount = computed(() => shown.value.reduce((sum, g) => sum + g.cards.length, 0));

const isGrid = computed(() => facet.value !== null);

function tabIndexFor(group: PoolGroup, index: number): number {
  return index === (rove.value[group.id] ?? 0) ? 0 : -1;
}

/* One tab stop per group; arrows, Home and End move within it. Without this the
   pool is one tab stop per card between the chips and the section's exit. */
function onRoveKey(event: KeyboardEvent, groupId: string): void {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  const list = event.currentTarget as HTMLElement;
  const tiles = Array.from(list.querySelectorAll<HTMLButtonElement>('[data-tile]'));
  if (!tiles.length) return;
  event.preventDefault();

  const from = Math.max(0, tiles.indexOf(document.activeElement as HTMLButtonElement));
  const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tiles.length - 1
        : Math.min(tiles.length - 1, Math.max(0, from + step));

  tiles[next].focus();
  rove.value = { ...rove.value, [groupId]: next };
}

function scrollRail(groupId: string, direction: 1 | -1): void {
  const rail = rails.value[groupId];
  if (!rail) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  rail.scrollBy({
    left: direction * Math.min(rail.clientWidth * 0.8, 520),
    behavior: reduced ? 'auto' : 'smooth',
  });
}
</script>

<template>
  <div class="c-pool">
    <div class="c-pool__panel">
      <slot name="panel" />
    </div>

    <div class="c-pool__main">
      <div class="c-pool__facets" role="group" :aria-label="t('pool.filterLabel')">
        <button
          type="button"
          class="c-pool__facet"
          :aria-pressed="facet === null"
          @click="facet = null"
        >
          <span class="c-pool__dot" aria-hidden="true" />
          {{ t('pool.allBrands') }}
          <span class="c-pool__facet-count">{{ total }}</span>
        </button>
        <button
          v-for="group in groups"
          :key="group.id"
          type="button"
          class="c-pool__facet"
          :aria-pressed="facet === group.id"
          @click="facet = facet === group.id ? null : group.id"
        >
          <span
            class="c-pool__dot"
            aria-hidden="true"
            :style="group.color ? { background: group.color } : undefined"
          />
          {{ group.name }}
          <span class="c-pool__facet-count">{{ group.cards.length }}</span>
        </button>
      </div>

      <MonoLabel v-if="facet" tone="muted" class="c-pool__count" aria-live="polite">
        {{ shownCount }} {{ t('pool.ofTotal') }} {{ total }} {{ t('pool.programsShown') }}
      </MonoLabel>

      <div v-for="group in shown" :key="group.id" class="c-pool__group">
        <div
          class="c-pool__head"
          :style="group.color ? { '--group-color': group.color } : undefined"
        >
          <div class="c-pool__head-name">
            <BrandMark :icon="group.icon" :name="group.name" :color="group.color" :size="30" />
            <h3 class="c-pool__group-title">{{ group.name }}</h3>
            <MonoLabel tone="muted" as="span">{{ group.cards.length }}</MonoLabel>
          </div>
          <div class="c-pool__head-tools">
            <span v-if="!isGrid" class="c-pool__arrows">
              <button
                type="button"
                class="c-pool__arrow"
                :aria-label="`${t('pool.scrollBack')} ${group.name}`"
                @click="scrollRail(group.id, -1)"
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                class="c-pool__arrow"
                :aria-label="`${t('pool.scrollForward')} ${group.name}`"
                @click="scrollRail(group.id, 1)"
              >
                <span aria-hidden="true">→</span>
              </button>
            </span>
            <BaseLink :to="group.to" class="c-pool__group-link">{{ group.linkLabel }}</BaseLink>
          </div>
        </div>

        <p v-if="group.note" class="c-pool__note">{{ group.note }}</p>

        <ul
          :ref="(el) => (rails[group.id] = el as HTMLElement | null)"
          class="c-pool__tiles"
          :class="isGrid ? 'c-pool__tiles--grid' : 'c-pool__tiles--rail'"
          :aria-label="`${group.name} ${t('pool.programs')}`"
          @keydown="onRoveKey($event, group.id)"
        >
          <li v-for="(card, index) in group.cards" :key="card.id">
            <!-- One of these is chosen at a time, so aria-current. aria-pressed
                 would announce every tile as an independent toggle. -->
            <button
              type="button"
              data-tile
              class="c-pool__tile"
              :class="{ 'is-current': card.id === selectedId }"
              :aria-current="card.id === selectedId ? 'true' : undefined"
              :aria-label="card.name"
              :title="card.name"
              :tabindex="tabIndexFor(group, index)"
              @click="emit('select', card)"
            >
              <ArtFrame
                :art="card.cardArt"
                ratio="63 / 88"
                :placeholder="t('pool.cardPlaceholder')"
                radius="s"
                fit="contain"
                :sources="pictureSources(card.cardArt.src)"
                sizes="160px"
              />
            </button>
            <p v-if="isGrid" class="c-pool__tile-name">{{ card.name }}</p>
          </li>
        </ul>
      </div>

      <div class="c-pool__foot">
        <slot name="foot" />
      </div>
    </div>
  </div>
</template>

<style>
.c-pool {
  margin-top: var(--space-8);
  display: flex;
  flex-wrap: wrap;
  gap: clamp(24px, 3vw, 40px);
  align-items: flex-start;
}

/* The slot is empty below the picker's breakpoint, where the panel would be
   off-screen. */
.c-pool__panel:empty {
  display: none;
}

.c-pool__panel {
  flex: 0 0 auto;
  width: 320px;
  max-width: 100%;
  position: sticky;
  top: calc(var(--nav-height) + var(--space-9));
}

.c-pool__main {
  flex: 1 1 420px;
  min-width: 0;
}

.c-pool__facets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.c-pool__facet {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  padding-inline: 14px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink);
  font-size: var(--size-m);
  white-space: nowrap;
  cursor: pointer;
}

.c-pool__facet[aria-pressed='true'] {
  border-color: rgba(var(--rgb-accent), 0.55);
  background: var(--color-accent-wash);
}

.c-pool__dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: var(--radius-pill);
  background: rgba(var(--rgb-ink), 0.35);
}

.c-pool__facet-count {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  color: var(--color-ink-soft);
}

.c-pool__count {
  margin-top: var(--space-3);
}

.c-pool__group {
  margin-top: var(--space-8);
}

.c-pool__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) 14px;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-s) var(--radius-s) 0 0;
  border-bottom: 2px solid var(--group-color, var(--color-line-strong));
  background: linear-gradient(90deg, rgba(var(--rgb-ink), 0.07), transparent 62%);
}

.c-pool__head-name {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.c-pool__group-title {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: normal;
}

.c-pool__head-tools {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.c-pool__arrows {
  display: flex;
  gap: var(--space-1);
}

.c-pool__arrow {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--color-ink-soft);
  cursor: pointer;
}

.c-pool__group-link {
  font-size: var(--size-s);
  font-weight: 500;
  white-space: nowrap;
}

.c-pool__note {
  margin-top: var(--space-3);
  max-width: 52ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.c-pool__tiles {
  margin-top: 14px;
  list-style: none;
}

.c-pool__tiles--rail {
  display: flex;
  gap: 10px;
  /* Trailing space so the next tile PEEKS. dims the last tile. */
  padding: 0 56px var(--space-1) 0;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}

.c-pool__tiles--rail::-webkit-scrollbar {
  display: none;
}

.c-pool__tiles--rail > li {
  flex: 0 0 auto;
  width: 104px;
}

.c-pool__tiles--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 18px var(--space-3);
}

.c-pool__tile {
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-s);
  overflow: hidden;
  background: transparent;
  cursor: pointer;
  scroll-snap-align: start;
}

.c-pool__tile.is-current {
  border-color: rgba(var(--rgb-accent), 0.55);
  box-shadow: 0 0 24px var(--color-accent-wash);
}

.c-pool__tile-name {
  margin-top: var(--space-2);
  font-size: var(--size-s);
  line-height: 1.45;
  color: var(--color-ink-soft);
}

.c-pool__foot:not(:empty) {
  margin-top: var(--space-8);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-line);
}
</style>
