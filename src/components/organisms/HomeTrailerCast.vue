<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch, type ComponentPublicInstance } from 'vue';
import CardImage from '@/components/atoms/CardImage.vue';
import HomeTrailerDial from '@/components/molecules/HomeTrailerDial.vue';
import CardDetail from '@/components/organisms/CardDetail.vue';
import { useCardParam } from '@/composables/useCardParam';
import { useChrome } from '@/composables/useChrome';
import { FINE_HOVER, useMediaQuery } from '@/composables/useMediaQuery';
import { useViewport } from '@/composables/useViewport';
import { t } from '@/content';
import { lidStrips } from '@/data/lidArt';
import { factionById } from '@/data/universe';
import { runSpark, type SparkWire } from '@/site/castSpark';
import { castWires, dialTurn, sweepAngle, type Box, type CastGeo, type Side, type Wire } from '@/site/castWires';
import { seedsFor } from '@/data/starterStacks';
import { currentLocale } from '@/i18n/locales';
import { cardBySlug, placeholderOf } from '@/site/cards';
import { asset } from '@/site/links';
import type { CardRow } from '@/site/cards';

/** Share of a card's height each program shows above the one in front: at rest, and with the stack open. */
const PEEK = { rest: 0.045, open: 0.12 };
/* Matches the styles below: 124px cards from 1100px; under that four across a 640px row, so at most 154px. */
const CARD_SIZES = '(min-width: 1100px) 124px, min(25vw, 154px)';
/** The gutter layout's switch: the same width as the @media rule below. */
const GUTTERS = '(min-width: 1100px)';
/** Ms the circuits stay lit after a dial tap under reduced motion, in place of the spark. */
const STILL_LIGHT_MS = 2000;

const cast = lidStrips.flatMap((strip) => {
  const character = cardBySlug(strip.characterId);
  if (!character) return [];
  /* The character page's rule (useStack): the first seed. */
  const seed = seedsFor(strip.characterId)[0] ?? null;
  const programs = (seed?.programSlugs ?? []).map(cardBySlug).filter((row): row is CardRow => !!row);
  /* Painted bottom slot first, so the top program sits directly behind the character. */
  const back = programs.map((row, slot) => ({ row, slot })).reverse();
  const faction = factionById(strip.factionId);
  return [{ id: strip.characterId, character, programs, back, seed, tone: faction?.colorText ?? null, dialHue: strip.dialHue, trunkSlot: strip.trunkSlot }];
});
type CastCard = (typeof cast)[number];
const half = Math.ceil(cast.length / 2);
const sides = [cast.slice(0, half), cast.slice(half)];

const hover = useMediaQuery(FINE_HOVER);
const open = ref<string | null>(null);
let pressedWith: string | null = null;

const kindOf = (card: CastCard) => t(`home.zero.stacks.kind.${card.seed?.kind ?? 'starter'}`);

function label(card: CastCard): string {
  if (!card.seed) return t('home.zero.stacks.labelAlone', { name: card.character.name });
  const programs = new Intl.ListFormat(currentLocale.value, { type: 'conjunction' }).format(card.programs.map((p) => p.name));
  return t('home.zero.stacks.label', { name: card.character.name, deck: card.seed.deckName, kind: kindOf(card), programs });
}

function lift(card: CastCard, slot: number): string {
  const step = open.value === card.id ? PEEK.open : PEEK.rest;
  return `translateY(-${((slot + 1) * step * 100).toFixed(1)}%)`;
}

const opened = computed(() => cast.find((c) => c.id === open.value) ?? null);
const hint = computed(() => t(hover.value ? 'home.zero.stacks.hint' : 'home.zero.stacks.hintTouch'));
const captions = computed(() =>
  cast.map((card) => ({
    id: card.id,
    name: card.character.name,
    deck: card.seed ? t('home.zero.stacks.openDeck', { deck: card.seed.deckName, kind: kindOf(card), source: card.seed.source }) : null,
  })),
);

function onEnter(card: CastCard, event: PointerEvent): void {
  if (event.pointerType === 'mouse' && hover.value) open.value = card.id;
}

function onLeave(card: CastCard, event: PointerEvent): void {
  if (event.pointerType !== 'mouse' || open.value !== card.id) return;
  if (!(event.currentTarget as Element).matches(':focus-visible')) open.value = null;
}

function onFocus(card: CastCard, event: FocusEvent): void {
  if ((event.target as Element).matches(':focus-visible')) open.value = card.id;
}

function onBlur(card: CastCard): void {
  if (open.value === card.id) open.value = null;
}

const zoom = useCardParam({ isKnown: (slug) => Boolean(cardBySlug(slug)) });
const zoomed = computed(() => (zoom.slug.value ? cardBySlug(zoom.slug.value) : null));

/* `detail` is 0 for a keyboard click (Enter or Space). */
function onClick(card: CastCard, event: MouseEvent): void {
  /* Not every browser's click carries pointerType. */
  const own = (event as PointerEvent).pointerType;
  const via = event.detail === 0 ? 'key' : own || pressedWith || 'mouse';
  pressedWith = null;
  if (via === 'touch' || via === 'pen') {
    open.value = open.value === card.id ? null : card.id;
    return;
  }
  const hit = via === 'key' ? null : (event.target as Element).closest<HTMLElement>('[data-slot]');
  const slot = Number(hit?.dataset.slot ?? -1);
  zoom.openCard((card.programs[slot] ?? card.character).slug);
}

const root = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const dial = ref<InstanceType<typeof HomeTrailerDial> | null>(null);
/* Plain arrays: only measure() and the spark read them. */
const cardEls: HTMLElement[] = [];
const artEls: HTMLElement[] = [];
const keep = (list: HTMLElement[], i: number) => (el: Element | ComponentPublicInstance | null) => {
  if (el instanceof HTMLElement) list[i] = el;
};

const gutters = useMediaQuery(GUTTERS);
const { heroIntro } = useChrome();
/* CSS backgrounds take no fetchpriority: the spine art waits for the hero's entrance instead. */
const spineArt = computed(() => heroIntro.value === null);
const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
const { resizing } = useViewport();
const colors = cast.map((c) => c.tone ?? 'currentColor');
const trunkOrder = cast.map((c, i) => ({ i, slot: c.trunkSlot })).sort((a, b) => a.slot - b.slot).map((c) => c.i);
const geo = shallowRef<CastGeo | null>(null);
const wires = computed(() => (geo.value ? castWires(geo.value, colors, trunkOrder, half) : []));
const turn = computed(() => {
  const g = geo.value;
  const i = cast.findIndex((c) => c.id === open.value);
  return g && i >= 0 ? dialTurn(g.plate, g.cards[i]) : 0;
});
/** Reduced motion's stand-in for the spark: a dial tap lights its side for a moment. */
const still = ref<Record<Side, boolean>>({ l: false, r: false });

function lit(wire: Wire): boolean {
  if (cast[wire.card]?.id === open.value) return true;
  return wire.kind === 'crown' ? still.value.l || still.value.r : still.value[wire.side];
}

function measure(): void {
  const el = root.value;
  const player = stage.value?.firstElementChild;
  const d = dial.value;
  if (!el || !(player instanceof HTMLElement) || !d?.left || !d.right || !d.plate) return;
  const o = el.getBoundingClientRect();
  const box = (node: Element): Box => {
    const r = node.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
  };
  geo.value = {
    gutters: gutters.value,
    player: box(player),
    cards: cast.map((_, i) => (cardEls[i] ? box(cardEls[i]) : { x: 0, y: 0, w: 0, h: 0 })),
    dials: [box(d.left), box(d.right)],
    plate: box(d.plate),
  };
}

/* Measured once a drag settles, never per frame. */
let observer: ResizeObserver | null = null;
const remeasure = () => {
  if (!resizing.value) void nextTick(measure);
};
watch([resizing, gutters], remeasure);

const sparkEls = new Map<string, { charge?: SVGGElement; head?: SVGGElement; path?: SVGPathElement; via?: SVGCircleElement }>();
const keepSpark = (key: string, part: 'charge' | 'head' | 'path' | 'via') => (el: Element | ComponentPublicInstance | null) => {
  if (!(el instanceof SVGElement)) return;
  const entry = sparkEls.get(key) ?? {};
  Object.assign(entry, { [part]: el });
  sparkEls.set(key, entry);
};
const busy: Record<Side, boolean> = { l: false, r: false };
const running = new Set<() => void>();
const stillTimer: Record<Side, number> = { l: 0, r: 0 };

function spark(wire: Wire): SparkWire | null {
  const els = sparkEls.get(wire.key);
  if (!els?.charge?.isConnected || !els.head || !els.path) return null;
  return { charge: els.charge, head: els.head, path: els.path, via: els.via ?? null, color: wire.color, card: artEls[wire.card] ?? null };
}

function fire(side: Side): void {
  open.value = null;
  const g = geo.value;
  if (!g) return;
  if (reduced.value) {
    window.clearTimeout(stillTimer[side]);
    still.value = { ...still.value, [side]: true };
    stillTimer[side] = window.setTimeout(() => (still.value = { ...still.value, [side]: false }), STILL_LIGHT_MS);
    return;
  }
  if (busy[side]) return;
  const d = g.dials[side === 'l' ? 0 : 1];
  const around = (w: Wire) => (w.via ? sweepAngle(side, d, w.via.x, w.via.y) : 0);
  const trunks = wires.value.filter((w) => w.kind === 'trunk' && w.side === side);
  if (side === 'r') trunks.reverse();
  let order: number[];
  if (g.gutters) {
    const own = side === 'l' ? cast.slice(0, half).map((_, i) => i) : cast.slice(half).map((_, i) => half + i);
    const far = side === 'l' ? cast.slice(half).map((_, i) => half + i) : cast.slice(0, half).map((_, i) => i);
    order = [...own.reverse(), ...far];
  } else {
    const centre = (i: number) => {
      const twigs = wires.value.filter((w) => w.kind === 'crown' && w.card === i && w.via);
      const x = twigs.reduce((a, w) => a + (w.via?.x ?? 0), 0) / Math.max(1, twigs.length);
      const y = twigs.reduce((a, w) => a + (w.via?.y ?? 0), 0) / Math.max(1, twigs.length);
      return sweepAngle(side, d, x, y);
    };
    order = cast.map((_, i) => i).sort((a, b) => centre(a) - centre(b));
  }
  const kind = g.gutters ? 'trace' : 'crown';
  const branches = order.flatMap((i) => wires.value.filter((w) => w.kind === kind && w.card === i).sort((a, b) => around(a) - around(b)));
  const t = trunks.map(spark).filter((w): w is SparkWire => !!w);
  const b = branches.map(spark).filter((w): w is SparkWire => !!w);
  if (!t.length && !b.length) return;
  busy[side] = true;
  const run = runSpark(t, b);
  running.add(run.stop);
  void run.done.then(() => {
    busy[side] = false;
    running.delete(run.stop);
  });
}

function onPointerDown(event: PointerEvent): void {
  if (open.value && !root.value?.contains(event.target as Node)) open.value = null;
}

/* The zoom's own Escape runs first and marks the event handled. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value && !event.defaultPrevented) open.value = null;
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('keydown', onKeydown);
  measure();
  void document.fonts?.ready.then(measure);
  if (root.value) {
    observer = new ResizeObserver(remeasure);
    observer.observe(root.value);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown);
  document.removeEventListener('keydown', onKeydown);
  observer?.disconnect();
  for (const stop of running) stop();
  window.clearTimeout(stillTimer.l);
  window.clearTimeout(stillTimer.r);
});
</script>

<template>
  <div
    ref="root"
    class="c-home-cast"
    :style="geo ? { '--spine-y': `${(geo.player.y + geo.player.h / 2).toFixed(1)}px` } : undefined"
  >
    <div
      v-if="geo && spineArt"
      class="c-home-cast__spine"
      aria-hidden="true"
      :style="{ '--spine': `-webkit-image-set(url(${asset('/trailer/spine-h-443.webp')}) 1x, url(${asset('/trailer/spine-h-886.webp')}) 2x)` }"
    />
    <svg class="c-home-cast__wires" aria-hidden="true">
      <g
        v-for="wire in wires"
        :key="wire.key"
        class="c-home-cast__wire"
        :class="[`c-home-cast__wire--${wire.kind}`, { 'is-lit': lit(wire) }]"
        :style="{ '--wire': wire.color }"
      >
        <path v-for="(d, k) in wire.d" :key="`g${k}`" class="c-home-cast__wire-glow" :d="d" />
        <path v-for="(d, k) in wire.d" :key="`c${k}`" class="c-home-cast__wire-core" :d="d" />
        <circle v-if="wire.via" :ref="keepSpark(wire.key, 'via')" class="c-home-cast__via" :cx="wire.via.x" :cy="wire.via.y" :r="wire.via.r" />
        <g :ref="keepSpark(wire.key, 'charge')" class="c-home-cast__charge">
          <path class="c-home-cast__wire-glow" :d="wire.route" />
          <path :ref="keepSpark(wire.key, 'path')" class="c-home-cast__wire-core" :d="wire.route" />
        </g>
        <g :ref="keepSpark(wire.key, 'head')" class="c-home-cast__head">
          <path class="c-home-cast__wire-glow" :d="wire.route" />
          <path class="c-home-cast__head-core" :d="wire.route" />
        </g>
      </g>
    </svg>
    <div class="c-home-cast__grid" :style="{ '--n': cast.length }">
      <!-- First in the DOM: the player leads tab and reading order; the grid places it. -->
      <div ref="stage" class="c-home-cast__stage">
        <slot />
      </div>
      <div
        v-for="(side, s) in sides"
        :key="s"
        class="c-home-cast__side"
        :class="s === 0 ? 'c-home-cast__side--left' : 'c-home-cast__side--right'"
      >
        <button
          v-for="(card, i) in side"
          :key="card.id"
          :ref="keep(cardEls, s ? half + i : i)"
          type="button"
          class="c-home-cast__card"
          :class="{ 'is-open': open === card.id }"
          :style="{ '--peek': PEEK.rest * card.programs.length }"
          aria-haspopup="dialog"
          :aria-label="label(card)"
          @pointerdown="pressedWith = $event.pointerType"
          @pointerenter="onEnter(card, $event)"
          @pointerleave="onLeave(card, $event)"
          @focus="onFocus(card, $event)"
          @blur="onBlur(card)"
          @click="onClick(card, $event)"
        >
          <span
            v-for="{ row, slot } in card.back"
            :key="row.slug"
            class="c-home-cast__program"
            :data-slot="slot"
            :style="{ transform: lift(card, slot) }"
          >
            <CardImage :art="row.cardArt" :placeholder="placeholderOf(row, 'card')" :sizes="CARD_SIZES" />
          </span>
          <span :ref="keep(artEls, s ? half + i : i)" class="c-home-cast__character" data-slot="-1">
            <CardImage :art="card.character.cardArt" :placeholder="placeholderOf(card.character, 'card')" :sizes="CARD_SIZES" />
          </span>
        </button>
      </div>
    </div>

    <HomeTrailerDial
      ref="dial"
      class="c-home-cast__dial"
      :turn="turn"
      :hue="opened?.dialHue ?? null"
      :tone="opened?.tone ?? null"
      :open="open"
      :captions="captions"
      :hint="hint"
      :spine="spineArt"
      @fire="fire"
    />

    <CardDetail
      :open="zoom.open.value"
      :row="zoomed"
      :printing="zoom.printing.value"
      @close="zoom.close()"
      @printing="zoom.setPrinting($event)"
    />
  </div>
</template>

<style>
.c-home-cast {
  position: relative;
}

/* The tile's mirror seam must sit on the player's centre line. */
.c-home-cast__spine {
  display: none;
  position: absolute;
  left: 50%;
  top: calc(var(--spine-y) - 66px);
  width: 100vw;
  height: 132px;
  translate: -50% 0;
  background: var(--spine) 50vw 0 / 443px 132px repeat-x;
  pointer-events: none;
}

/* HomeHero's SIDE_QUERY. */
@media (min-width: 47.5em), (orientation: landscape) and (min-width: 34em) {
  .c-home-cast__spine {
    display: block;
  }
}

/* Glow is an under-stroke, never a CSS filter on a path. */
.c-home-cast__wires {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
  stroke-width: 2.5;
  stroke-linejoin: round;
  pointer-events: none;
}

.c-home-cast__wire {
  stroke: var(--wire);
  opacity: 0.8;
  transition: opacity var(--dur-3) var(--ease-linear);
}

.c-home-cast__wire.is-lit {
  opacity: 1;
}

.c-home-cast__wire-glow {
  stroke-width: 8;
  stroke-opacity: 0.14;
  stroke-linecap: round;
  transition: stroke-opacity var(--dur-3) var(--ease-linear);
}

.c-home-cast__wire.is-lit > .c-home-cast__wire-glow {
  stroke-opacity: 0.32;
}

.c-home-cast__wire--trunk:not(.is-lit) > .c-home-cast__wire-glow {
  stroke-opacity: 0;
}

.c-home-cast__via {
  fill: var(--color-bg);
}

/* The spark's copies (castSpark.ts animates them); hidden at rest. */
.c-home-cast__charge,
.c-home-cast__head {
  opacity: 0;
}

.c-home-cast__charge > .c-home-cast__wire-glow {
  stroke-opacity: 0.45;
}

.c-home-cast__head-core {
  stroke: var(--color-ink-bright);
  stroke-width: 3.2;
  stroke-linecap: round;
}

.c-home-cast__grid {
  --player-w: calc(var(--width-reading) - 2 * var(--gutter));
  --card-w: 100%;

  isolation: isolate;
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  gap: var(--space-4) var(--space-2);
  position: relative;
  z-index: var(--z-raised);
  max-width: var(--player-w);
  /* HomeView's phone spine ends here: keep its bottom inset in step. */
  margin: var(--space-7) auto 0;
  padding: 0 var(--gutter);
  box-sizing: content-box;
}

/* Room above the card row for the crowns. */
.c-home-cast__stage {
  grid-column: 1 / -1;
  margin-bottom: var(--space-10);
}

.c-home-cast__side {
  display: contents;
}

/* Padding % reads the containing block, not the card, so both come from --card-w; only the resting peek is reserved, and an open stack rises over its neighbours. */
.c-home-cast__card {
  position: relative;
  z-index: var(--z-raised);
  display: grid;
  width: var(--card-w);
  margin: 0;
  padding: calc(var(--card-w) * var(--peek) / (var(--ratio-card))) 0 0;
  border: 0;
  border-radius: var(--radius-s);
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* Bridges the gap to the next card, so the pointer never crosses dead space and closes the stack it is moving between. */
.c-home-cast__card::after {
  content: '';
  position: absolute;
  inset: 0 calc(var(--space-2) / -2);
  z-index: -1;
}

.c-home-cast__card.is-open {
  z-index: calc(var(--z-raised) + 1);
}

/* CARD_SIZES in the script matches this switch and the 124px card. */
@media (min-width: 1100px) {
  .c-home-cast__grid {
    --card-w: min(100%, 124px);

    grid-template-columns: minmax(0, 1fr) minmax(0, var(--player-w)) minmax(0, 1fr);
    gap: var(--space-4) var(--space-6);
    align-items: center;
    max-width: calc(var(--width-content) - 2 * var(--gutter));
  }

  .c-home-cast__stage {
    grid-column: 2;
    grid-row: 1;
    margin-bottom: 0;
  }

  .c-home-cast__side {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    grid-row: 1;
  }

  .c-home-cast__side--left {
    grid-column: 1;
    align-items: flex-end;
  }

  .c-home-cast__side--right {
    grid-column: 3;
    align-items: flex-start;
  }

  .c-home-cast__card::after {
    inset: 0 0 calc(var(--space-4) * -1);
  }
}

.c-home-cast__program,
.c-home-cast__character {
  grid-area: 1 / 1;
  display: block;
}

.c-home-cast__program {
  box-shadow: 0 0 0 1px rgba(var(--rgb-bg), 0.6);
  border-radius: var(--radius-s);
  transition: transform var(--dur-3) var(--ease-out);
}

.c-home-cast__character {
  position: relative;
  z-index: var(--z-raised);
  border-radius: var(--radius-s);
  box-shadow: 0 -8px 18px rgba(0, 0, 0, 0.6);
  /* The spark's glow animates this list (castSpark.ts REST): one list in every state. */
  filter: brightness(1) drop-shadow(0 0 0 transparent);
}

.c-home-cast__dial {
  width: min(100% - 2 * var(--gutter), 560px);
  margin-top: var(--space-7);
}

@media (min-width: 1100px) {
  .c-home-cast__dial {
    margin-top: var(--space-5);
  }
}
</style>
