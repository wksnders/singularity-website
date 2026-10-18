<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import CardImage from '@/components/atoms/CardImage.vue';
import { FINE_HOVER, prefersReducedMotion, useMediaQuery } from '@/composables/useMediaQuery';
import { t } from '@/content';
import { characters } from '@/data/universe';
import type { Art } from '@/data/types';
import { pictureSources, to } from '@/site/links';

const RAIL_MAX = 20;
const CROWD = 9;
const END = 'end';
const TURN_STAGGER_MS = 50;
const DRAG_THRESHOLD_PX = 6;

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/* The stride must be coprime with the count, or the walk repeats some characters and skips others. */
const roster = characters.filter((c) => c.cardArt.src).sort((a, b) => a.order - b.order);
const walkStride = [5, 7, 3].find((s) => gcd(s, roster.length) === 1) ?? 1;
const walk = roster.map((_, i) => roster[(i * walkStride) % roster.length]);

const cast = walk.slice(0, RAIL_MAX);

const crowd = walk.slice(RAIL_MAX, RAIL_MAX + CROWD);
const total = characters.length;

const cardBack: Art = { src: '/box-core/card-back-960.webp', alt: '' };
const backSources = pictureSources(cardBack.src);

/* Must follow .c-cast-rail__item's clamp(200px, 24vw, 300px). */
const CARD_SIZES = '(min-width: 1250px) 300px, (min-width: 834px) 24vw, 200px';

const paddles = useMediaQuery(`${FINE_HOVER} and (min-width: 600px)`);
const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

const zone = ref<HTMLElement | null>(null);
const rail = ref<HTMLElement | null>(null);
const thumb = ref<HTMLElement | null>(null);

const atStart = ref(true);
const atEnd = ref(false);
const hovered = ref(false);
/* Id → turn delay in ms; never delete an entry, or that card turns back face down. */
const up = reactive(new Map<string, number>());

const dealing = ref(true);

/* Reduced motion deals every card face up, and they stay up if it is turned off. */
watch(
  reduced,
  (on) => {
    if (on) [...cast.map((c) => c.id), END].forEach((id) => up.set(id, 0));
  },
  { immediate: true },
);

let frame = 0;

function measure(): void {
  frame = 0;
  const el = rail.value;
  if (!el) return;
  const css = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  const left = box.left + (parseFloat(css.paddingLeft) || 0) - 2;
  const right = box.right - (parseFloat(css.paddingRight) || 0) + 2;
  const span = el.scrollWidth - el.clientWidth;

  atStart.value = el.scrollLeft < 4;
  atEnd.value = el.scrollLeft >= span - 4;
  if (thumb.value) {
    const share = Math.min(1, el.clientWidth / el.scrollWidth);
    const progress = span > 0 ? el.scrollLeft / span : 0;
    thumb.value.style.width = `${(share * 100).toFixed(2)}%`;
    thumb.value.style.left = `${(progress * (1 - share) * 100).toFixed(2)}%`;
  }

  let k = 0;
  el.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
    const id = card.dataset.card!;
    if (up.has(id)) return;
    const rect = card.getBoundingClientRect();
    if (rect.width && rect.left >= left && rect.right <= right) up.set(id, dealing.value ? 0 : k++ * TURN_STAGGER_MS);
  });

  if (dealing.value) requestAnimationFrame(() => (dealing.value = false));
}

function schedule(): void {
  if (!frame) frame = requestAnimationFrame(measure);
}

/* Not offsetWidth: its rounding adds up over twenty cards until a stop misses its snap point. */
function stride(el: HTMLElement): number {
  const card = el.querySelector<HTMLElement>('[data-card]');
  return card ? card.getBoundingClientRect().width + (parseFloat(getComputedStyle(el).columnGap) || 0) : 1;
}

/* Stops land on snap points only while the rail's padding-left equals its scroll-padding-left. */
let target: number | null = null;
let targetAt = 0;

function step(direction: 1 | -1): void {
  const el = rail.value;
  if (!el) return;
  const width = stride(el);
  const max = el.scrollWidth - el.clientWidth;

  const css = getComputedStyle(el);
  const room = el.clientWidth - (parseFloat(css.paddingLeft) || 0) - (parseFloat(css.paddingRight) || 0);
  const cards = Math.max(1, Math.floor(room / width) - 1);
  const gliding = target !== null && performance.now() - targetAt < 700 && Math.abs(target - el.scrollLeft) > 2;
  const from = gliding ? target! : el.scrollLeft;
  target = Math.max(0, Math.min(max, (Math.round(from / width) + direction * cards) * width));
  targetAt = performance.now();
  el.scrollTo({ left: target, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

let drag: { x: number; from: number; moved: boolean; id: number } | null = null;
let swallowClick = false;
let snapBack = 0;

function onPointerDown(event: PointerEvent): void {
  if (event.pointerType !== 'mouse' || event.button !== 0 || !rail.value) return;
  clearTimeout(snapBack);
  drag = { x: event.clientX, from: rail.value.scrollLeft, moved: false, id: event.pointerId };
}

function onPointerMove(event: PointerEvent): void {
  const el = rail.value;
  if (!drag || !el) return;
  /* Before the threshold nothing is captured, so a release outside the rail never reaches onPointerUp. */
  if (!(event.buttons & 1)) {
    drag = null;
    return;
  }
  const dx = event.clientX - drag.x;
  if (!drag.moved && Math.abs(dx) > DRAG_THRESHOLD_PX) {
    drag.moved = true;
    try {
      el.setPointerCapture(drag.id);
    } catch {
      /* Throws if the pointer is already released. */
    }
    el.classList.add('is-dragging');
  }
  if (drag.moved) el.scrollLeft = drag.from - dx;
}

function onPointerUp(): void {
  const el = rail.value;
  const ended = drag;
  drag = null;
  if (!el || !ended?.moved) return;
  swallowClick = true;
  setTimeout(() => (swallowClick = false), 0);
  const width = stride(el);
  const max = el.scrollWidth - el.clientWidth;
  /* Snapping stays off until the glide lands, or it yanks the row mid-glide. */
  el.scrollTo({ left: Math.max(0, Math.min(max, Math.round(el.scrollLeft / width) * width)), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  snapBack = window.setTimeout(() => el.classList.remove('is-dragging'), 520);
}

function onClickCapture(event: MouseEvent): void {
  if (!swallowClick) return;
  event.preventDefault();
  event.stopPropagation();
}

/* Keyboard only: a mouse press also focuses the link, and scrolling then moves the card out from under the click. */
function onCardFocus(event: FocusEvent): void {
  const el = rail.value;
  const card = (event.target as HTMLElement).closest<HTMLElement>('[data-card]');
  if (!el || !card || !card.matches(':focus-visible')) return;
  const inset = zone.value?.querySelector<HTMLElement>('.c-cast-rail__paddle')?.offsetWidth ?? 0;
  const box = el.getBoundingClientRect();
  const rect = card.getBoundingClientRect();
  if (rect.left >= box.left + inset && rect.right <= box.right - inset) return;
  const index = [...el.querySelectorAll('[data-card]')].indexOf(card);
  const max = el.scrollWidth - el.clientWidth;
  const slot = index - (inset ? 1 : 0);
  el.scrollTo({ left: Math.max(0, Math.min(max, slot * stride(el))), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

function onZoneEnter(event: PointerEvent): void {
  if (event.pointerType === 'mouse') hovered.value = true;
}

onMounted(() => {
  void nextTick(measure);
  window.addEventListener('resize', schedule);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', schedule);
  cancelAnimationFrame(frame);
  clearTimeout(snapBack);
});
</script>

<template>
  <section class="l-band c-cast-rail" aria-labelledby="cast-rail-title">
    <div class="l-wrap">
      <h2 id="cast-rail-title" class="c-cast-rail__title">{{ t('home.cast.title', { count: total }) }}</h2>
    </div>

    <div
      ref="zone"
      class="c-cast-rail__zone"
      :class="{ 'is-hovered': hovered }"
      @pointerenter="onZoneEnter"
      @pointerleave="hovered = false"
      @focusin="hovered = true"
      @focusout="hovered = false"
    >
      <!-- Out of the Tab order: the next Tab would scroll back whatever a paddle paged. -->
      <template v-if="paddles">
        <button
          type="button"
          class="c-cast-rail__paddle c-cast-rail__paddle--prev"
          :class="{ 'is-shown': !atStart }"
          :disabled="atStart"
          tabindex="-1"
          :aria-label="t('home.cast.prev')"
          @click="step(-1)"
        >
          <span class="c-cast-rail__icon">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M11 3.5 5.5 9l5.5 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </button>
        <button
          type="button"
          class="c-cast-rail__paddle c-cast-rail__paddle--next"
          :class="{ 'is-shown': !atEnd }"
          :disabled="atEnd"
          tabindex="-1"
          :aria-label="t('home.cast.next')"
          @click="step(1)"
        >
          <span class="c-cast-rail__icon">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M7 3.5 12.5 9 7 14.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </button>
      </template>

      <ul
        ref="rail"
        role="list"
        class="c-cast-rail__rail"
        :class="{ 'is-dealing': dealing }"
        :aria-label="t('home.cast.list')"
        @scroll.passive="schedule"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @dragstart.prevent
        @click.capture="onClickCapture"
        @focusin="onCardFocus"
      >
        <li v-for="c in cast" :key="c.id" role="listitem" class="c-cast-rail__item">
          <BaseLink
            :to="to('character', { characterId: c.id })"
            class="c-cast-rail__card"
            :data-card="c.id"
            :aria-label="`${c.name}, ${c.epithet}`"
          >
            <span
              class="c-cast-rail__turn"
              :class="{ 'is-up': up.has(c.id) }"
              :style="up.has(c.id) ? { transitionDelay: `${up.get(c.id)}ms` } : undefined"
            >
              <span class="c-cast-rail__face">
                <CardImage :art="{ ...c.cardArt, alt: '' }" :placeholder="t('character.cardArtPlaceholder')" radius="m" :sizes="CARD_SIZES" />
              </span>
              <span class="c-cast-rail__face c-cast-rail__face--back" aria-hidden="true">
                <ArtFrame :art="cardBack" ratio="var(--ratio-card)" :sources="backSources" :sizes="CARD_SIZES" />
              </span>
            </span>
          </BaseLink>
        </li>

        <li role="listitem" class="c-cast-rail__item">
          <BaseLink
            :to="to('characters')"
            class="c-cast-rail__card c-cast-rail__card--end"
            :data-card="END"
          >
            <span
              class="c-cast-rail__turn"
              :class="{ 'is-up': up.has(END) }"
              :style="up.has(END) ? { transitionDelay: `${up.get(END)}ms` } : undefined"
            >
              <span class="c-cast-rail__face c-cast-rail__face--crowd">
                <span class="c-cast-rail__crowd" aria-hidden="true">
                  <ArtFrame
                    v-for="k in crowd"
                    :key="k.id"
                    :art="{ ...k.cardArt, alt: '' }"
                    ratio="var(--ratio-card)"
                    :sources="pictureSources(k.cardArt.src)"
                    sizes="96px"
                  />
                </span>
                <span class="c-cast-rail__veil" aria-hidden="true"></span>
                <span class="c-cast-rail__count">
                  <span class="c-cast-rail__count-row">
                    <span class="c-cast-rail__count-n">{{ total }}</span>
                    <span class="c-cast-rail__count-label">{{ t('home.cast.allLabel') }}</span>
                  </span>
                  <span class="c-cast-rail__count-link">{{ t('home.cast.browse') }} <span aria-hidden="true">→</span></span>
                </span>
              </span>
              <span class="c-cast-rail__face c-cast-rail__face--back" aria-hidden="true">
                <ArtFrame :art="cardBack" ratio="var(--ratio-card)" :sources="backSources" :sizes="CARD_SIZES" />
              </span>
            </span>
          </BaseLink>
        </li>
      </ul>
    </div>

    <div class="l-wrap" aria-hidden="true">
      <div class="c-cast-rail__track"><span ref="thumb" class="c-cast-rail__thumb"></span></div>
    </div>
  </section>
</template>

<style>
.c-cast-rail__title {
  font-size: var(--size-h2);
  line-height: 1.1;
}

.c-cast-rail__zone {
  /* overflow-x clips vertically too: the top padding is the room for the hover lift. */
  --pad-top: var(--space-4);
  --pad-bottom: var(--space-6);

  position: relative;
  margin-top: var(--space-4);
}

.c-cast-rail__rail {
  display: flex;
  gap: 18px;
  margin: 0;
  padding: var(--pad-top) var(--gutter) var(--pad-bottom);
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scroll-padding: 0 var(--gutter);
  scrollbar-width: none;
}

.c-cast-rail__rail::-webkit-scrollbar {
  display: none;
}

.c-cast-rail__rail.is-dragging {
  scroll-snap-type: none;
  cursor: grabbing;
}

@media (hover: hover) and (pointer: fine) {
  .c-cast-rail__rail {
    cursor: grab;
  }
}

.c-cast-rail__item {
  flex: 0 0 clamp(200px, 24vw, 300px);
  scroll-snap-align: start;
}

.c-cast-rail__card {
  position: relative;
  display: block;
  aspect-ratio: var(--ratio-card);
  border-radius: var(--radius-m);
  perspective: 1200px;
  color: var(--color-ink);
  text-decoration: none;
  transition: transform var(--dur-2) var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .c-cast-rail__card:hover {
    color: var(--color-ink);
    transform: translateY(-6px);
  }
}

.c-cast-rail__turn {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform: rotateY(180deg);
  transition: transform 420ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.c-cast-rail__turn.is-up {
  transform: rotateY(0deg);
}

.c-cast-rail__rail.is-dealing .c-cast-rail__turn {
  transition: none;
}

.c-cast-rail__face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--radius-m);
  background: var(--color-surface-sunk);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(var(--rgb-ink), 0.1);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.c-cast-rail__face--back {
  transform: rotateY(180deg);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(var(--rgb-ink), 0.14);
}

.c-cast-rail__face .c-art {
  height: 100%;
  background: transparent;
}

.c-cast-rail__face--crowd {
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(var(--rgb-accent-text), 0.4),
    0 0 48px rgba(var(--rgb-accent), 0.12);
}

.c-cast-rail__crowd {
  position: absolute;
  inset: 0;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
  align-content: start;
}

/* On the image: ArtFrame writes its own radius inline on the frame. */
.c-cast-rail__crowd .c-art__img {
  border-radius: 5px;
}

.c-cast-rail__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--color-surface-sunk) 22%,
    rgba(var(--rgb-surface-sunk), 0.4) 52%,
    rgba(var(--rgb-surface-sunk), 0) 70%
  );
}

.c-cast-rail__count {
  container-type: inline-size;
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 13px 14px 12px;
  border-radius: 10px;
  background: rgba(var(--rgb-bg), 0.76);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  box-shadow:
    inset 0 1px 0 rgba(var(--rgb-accent), 0.22),
    0 0 0 1px rgba(var(--rgb-accent), 0.1);
}

.c-cast-rail__count-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
}

.c-cast-rail__count-n {
  font-family: var(--font-display);
  font-size: clamp(1.625rem, 3vw, 2rem);
  /* Capped by the panel's width, or large text pushes the panel off a 200px card. */
  font-size: min(clamp(1.625rem, 3vw, 2rem), 18cqi);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
}

.c-cast-rail__count-label {
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono-tight);
  text-transform: uppercase;
  color: var(--color-accent-text);
}

.c-cast-rail__count-link {
  font-size: var(--size-body-s);
  font-weight: 500;
}

.c-cast-rail__paddle {
  position: absolute;
  top: var(--pad-top);
  bottom: var(--pad-bottom);
  z-index: 2;
  width: 120px;
  display: flex;
  align-items: center;
  border: 0;
  border-radius: 0;
  color: var(--color-ink);
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  /* The delay keeps a just-hidden paddle catching clicks, so a fast run of them never lands on the card underneath. */
  transition:
    opacity 220ms linear,
    visibility 0s 800ms;
}

.c-cast-rail__paddle.is-shown {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 220ms linear,
    visibility 0s;
}

.c-cast-rail__paddle--prev {
  left: 0;
  justify-content: flex-start;
  padding: 0 0 0 22px;
  background: linear-gradient(to right, rgba(var(--rgb-bg), 0.94) 22%, rgba(var(--rgb-bg), 0));
}

.c-cast-rail__paddle--next {
  right: 0;
  justify-content: flex-end;
  padding: 0 22px 0 0;
  background: linear-gradient(to left, rgba(var(--rgb-bg), 0.94) 22%, rgba(var(--rgb-bg), 0));
}

.c-cast-rail__icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
  background: rgba(var(--rgb-bg), 0.6);
  box-shadow:
    inset 0 0 0 1px rgba(var(--rgb-accent), 0.5),
    0 0 24px rgba(var(--rgb-accent), 0.14);
  opacity: 0;
  transition: opacity 180ms linear;
}

.c-cast-rail__zone.is-hovered .c-cast-rail__icon {
  opacity: 1;
}

.c-cast-rail__track {
  position: relative;
  height: 2px;
  margin-top: 4px;
  border-radius: 2px;
  background: rgba(var(--rgb-ink), 0.12);
}

.c-cast-rail__thumb {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 30%;
  border-radius: 2px;
  background: var(--color-accent);
}
</style>
