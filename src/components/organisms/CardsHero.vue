<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import WallHero from '@/components/organisms/WallHero.vue';
import type { WallColumn, WallImage } from '@/components/organisms/WallHero.vue';

const props = defineProps<{
  cards: WallImage[];
  /** Cards the wall starts with(loaded for the db) others at low priority. */
  initial: number;
  sizes: string;
  title: string;
  overlap: number;
}>();

const LAYOUT = {
  wide: { hero: 340, card: 150, gap: 18, extend: 150, pool: 22 },
  narrow: { hero: 260, card: 92, gap: 12, extend: 210, pool: 16 },
};

const WALL_EXTRA = 200;
const PACE = [0.34, 0.55, 0.42, 0.62, 0.48, 0.28, 0.5, 0.38];
const STAGGER = [0, -0.45, -0.15, -0.6, -0.3, -0.52, -0.1, -0.38];

const vw = ref(0);
let frame = 0;

function measure(): void {
  frame = 0;
  vw.value = window.innerWidth;
}

function onResize(): void {
  if (!frame) frame = requestAnimationFrame(measure);
}

const expanded = ref(false);
const hero = ref<{ $el: HTMLElement } | null>(null);
let idle = 0;
let fallback = 0;
const loaded = new Set<string>();

function expand(): void {
  if (fallback) window.clearTimeout(fallback);
  fallback = 0;
  hero.value?.$el.removeEventListener('load', onImageLoad, true);
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (saveData || expanded.value) return;
  idle = window.requestIdleCallback
    ? window.requestIdleCallback(() => (expanded.value = true), { timeout: 2000 })
    : window.setTimeout(() => (expanded.value = true), 200);
}

function onImageLoad(event: Event): void {
  if (!(event.target instanceof HTMLImageElement)) return;
  loaded.add(event.target.currentSrc);
  if (loaded.size >= props.initial) expand();
}

onMounted(() => {
  measure();
  window.addEventListener('resize', onResize, { passive: true });
  hero.value?.$el.addEventListener('load', onImageLoad, true);
  fallback = window.setTimeout(expand, 5000);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  hero.value?.$el.removeEventListener('load', onImageLoad, true);
  if (frame) cancelAnimationFrame(frame);
  if (fallback) window.clearTimeout(fallback);
  if (idle && window.cancelIdleCallback) window.cancelIdleCallback(idle);
  else if (idle) window.clearTimeout(idle);
});

const layout = computed(() => (vw.value >= 900 ? LAYOUT.wide : LAYOUT.narrow));

const pitch = computed(() => Math.round((layout.value.card * 88) / 63) + layout.value.gap);

const count = computed(() =>
  vw.value ? Math.ceil((vw.value + WALL_EXTRA) / (layout.value.card + layout.value.gap)) + 1 : 0,
);

const rows = computed(() => {
  const { hero, extend } = layout.value;
  return Math.ceil((hero * 1.25 + extend + vw.value * 0.21) / pitch.value) + 1;
});

/* Until expanded, later cells reuse the first cards. */
const columns = computed<WallColumn[]>(() => {
  const cards = props.cards;
  const n = Math.min(cards.length, layout.value.pool);
  const ready = expanded.value ? n : Math.min(props.initial, n);
  if (!n || !ready || !count.value) return [];
  const { card, gap } = layout.value;
  const cardH = pitch.value - gap;
  return Array.from({ length: count.value }, (_, c) => ({
    pace: PACE[c % PACE.length],
    width: card,
    height: cardH,
    style: {
      '--wall-size': `${card}px`,
      '--wall-item-h': `${cardH}px`,
      '--wall-gap': `${gap}px`,
      '--wall-radius': `${Math.round(card * 0.05)}px`,
      translate: `0 ${(STAGGER[c % STAGGER.length] * pitch.value).toFixed(1)}px`,
    },
    cells: Array.from({ length: rows.value }, (_, r) => {
      const index = (c * 7 + r * 3) % n;
      return cards[index < ready ? index : index % ready];
    }),
  }));
});

const heroStyle = computed(() => ({
  '--cards-gap': `${layout.value.gap}px`,
  '--cards-overlap': `${props.overlap}px`,
  '--cards-fade': `${props.overlap}px`,
  '--cards-fade-extended': `${props.overlap + layout.value.extend}px`,
  '--wall-glow-at': `50% ${Math.round(layout.value.hero * 0.46)}px`,
}));
</script>

<template>
  <WallHero
    ref="hero"
    class="c-cards-hero"
    aria-labelledby="cards-title"
    :style="heroStyle"
    :columns="columns"
    :extend="layout.extend"
    :sizes="sizes"
    lazy
  >
    <div class="c-cards-hero__body">
      <span class="c-cards-hero__scrim" aria-hidden="true"></span>
      <h1 id="cards-title" class="c-cards-hero__title">{{ title }}</h1>
    </div>
  </WallHero>
</template>

<style>
.c-cards-hero {
  flex-direction: column;
  min-height: 260px;
  padding: calc(var(--nav-height) - 8px) var(--gutter) var(--cards-overlap);
  --wall-fade: var(--cards-fade);
}

@supports (overflow: clip) {
  .c-cards-hero {
    --wall-fade: var(--cards-fade-extended);
  }
}

@media (min-width: 900px) {
  .c-cards-hero {
    min-height: 340px;
  }
}

.c-cards-hero .c-wall-hero__wall {
  inset: auto;
  left: 50%;
  top: 50%;
  width: calc(100% + 200px);
  height: calc(100% + 21vw);
  transform: translate(-50%, -50%) rotate(-12deg);
}

.c-cards-hero .c-wall-hero__columns {
  justify-content: center;
  gap: var(--cards-gap);
}

.c-cards-hero .c-wall-hero__column {
  flex: 0 0 auto;
}

.c-cards-hero .c-wall-hero__item {
  object-fit: cover;
}

.c-cards-hero__body {
  position: relative;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.c-cards-hero__scrim {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: -1;
  width: min(900px, 120vw);
  height: 340px;
  transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(var(--rgb-bg), 0.66), transparent);
}

.c-cards-hero__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(2.25rem, 6vw, 4rem);
  line-height: 1;
  letter-spacing: -0.02em;
  color: color-mix(in srgb, var(--color-accent) 80%, var(--color-ink-bright));
  text-shadow:
    0 0 10px rgba(var(--rgb-accent), 0.45),
    0 0 40px color-mix(in srgb, var(--color-accent-text) 30%, transparent);
}
</style>
