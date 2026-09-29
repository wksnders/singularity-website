<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import CardImage from '@/components/atoms/CardImage.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import CardDetail from '@/components/organisms/CardDetail.vue';
import { useCardParam } from '@/composables/useCardParam';
import { FINE_HOVER, useMediaQuery } from '@/composables/useMediaQuery';
import { t } from '@/content';
import { lidStrips } from '@/data/lidArt';
import { seedsFor } from '@/data/starterStacks';
import { currentLocale } from '@/i18n/locales';
import { cardBySlug, placeholderOf } from '@/site/cards';
import type { CardRow } from '@/site/cards';

/** Share of a card's height each program shows above the one in front: at rest, and with the stack open. */
const PEEK = { rest: 0.045, open: 0.12 };
/* Matches the styles below: 124px cards from 1100px; under that four across a 640px row, so at most 154px. */
const CARD_SIZES = '(min-width: 1100px) 124px, min(25vw, 154px)';

const cast = lidStrips.flatMap((strip) => {
  const character = cardBySlug(strip.characterId);
  if (!character) return [];
  /* The character page's rule (useStack): the first seed. */
  const seed = seedsFor(strip.characterId)[0] ?? null;
  const programs = (seed?.programSlugs ?? []).map(cardBySlug).filter((row): row is CardRow => !!row);
  /* Painted bottom slot first, so the top program sits directly behind the character. */
  const back = programs.map((row, slot) => ({ row, slot })).reverse();
  return [{ id: strip.characterId, character, programs, back, seed }];
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
const caption = computed(() => {
  const card = opened.value;
  if (!card?.seed) return t(hover.value ? 'home.zero.stacks.hint' : 'home.zero.stacks.hintTouch');
  return t('home.zero.stacks.open', { name: card.character.name, deck: card.seed.deckName, kind: kindOf(card), source: card.seed.source });
});

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
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown);
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div ref="root" class="c-home-cast">
    <div class="c-home-cast__grid" :style="{ '--n': cast.length }">
      <!-- First in the DOM: the player leads tab and reading order; the grid places it. -->
      <div class="c-home-cast__stage">
        <slot />
      </div>
      <div
        v-for="(side, s) in sides"
        :key="s"
        class="c-home-cast__side"
        :class="s === 0 ? 'c-home-cast__side--left' : 'c-home-cast__side--right'"
      >
        <button
          v-for="card in side"
          :key="card.id"
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
          <span class="c-home-cast__character" data-slot="-1">
            <CardImage :art="card.character.cardArt" :placeholder="placeholderOf(card.character, 'card')" :sizes="CARD_SIZES" />
          </span>
        </button>
      </div>
    </div>

    <MonoLabel :tone="opened ? 'accent' : 'muted'" class="c-home-cast__caption" aria-hidden="true">{{ caption }}</MonoLabel>

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
.c-home-cast__grid {
  --player-w: calc(var(--width-reading) - 2 * var(--gutter));
  --card-w: 100%;

  isolation: isolate;
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  gap: var(--space-4) var(--space-2);
  max-width: var(--player-w);
  margin: var(--space-7) auto 0;
  padding: 0 var(--gutter);
  box-sizing: content-box;
}

.c-home-cast__stage {
  grid-column: 1 / -1;
  margin-bottom: var(--space-2);
}

.c-home-cast__side {
  display: contents;
}

/* Padding % reads the containing block, not the card: both come from --card-w. Only the resting peek is reserved; an open stack rises over its neighbours. */
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
}

.c-home-cast__caption {
  min-height: 1.6em;
  margin: var(--space-3) auto 0;
  padding: 0 var(--gutter);
  line-height: 1.6;
  text-align: center;
}

/* Two lines of the line-height above: room for an open caption's second line. */
@media (max-width: 759px) {
  .c-home-cast__caption {
    min-height: 3.2em;
  }
}
</style>
