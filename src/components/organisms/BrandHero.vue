<script setup lang="ts">
/* Ring positions come from the count, never hand-placed, so any number of programs lands evenly. */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import { prefersReducedMotion } from '@/composables/useMediaQuery';
import { asset, pictureSources } from '@/site/links';
import { patternUrl } from '@/site/patterns';
import type { Program } from '@/data/types';
import type { Crumb } from '@/site/sections';

const props = defineProps<{
  name: string;
  icon: string | null;
  programs: Program[];
  /** A pattern scope under /patterns: a faction id, or `common` for a faction-less brand. */
  pattern: string;
  eyebrow?: string | null;
  crumbs: Crumb[];
  prev?: Crumb | null;
  next?: Crumb | null;
}>();

const RX = 40.5;
const RY = 34;
const SIZES = ['m', 's', 'l'] as const;

const pieces = computed(() => {
  const drawn = props.programs.filter((program) => program.art.src);
  return drawn.map((program, i) => {
    const angle = (i / drawn.length) * 2 * Math.PI;
    return {
      program,
      size: SIZES[i % SIZES.length],
      left: `${(50 + RX * Math.sin(angle)).toFixed(2)}%`,
      top: `${(50 - RY * Math.cos(angle)).toFixed(2)}%`,
      src: asset(program.art.src as string),
      sources: pictureSources(program.art.src),
    };
  });
});

/* Common's sheet repeats at 0.8 of a faction tile; drawing it at 0.8 keeps every texture at one scale. */
const patternSrc = computed(() => patternUrl(`${props.pattern}-texture`));

const patternStyle = computed(() => ({
  '--hero-pattern': `url(${patternSrc.value})`,
  '--hero-tile-scale': props.pattern === 'common' ? 0.8 : 1,
}));

const stage = ref<HTMLElement | null>(null);
const ring = ref<HTMLElement | null>(null);
let frame = 0;

/* Driven by scroll, never a clock, so scrolling back unwinds it. */
function turn(): void {
  frame = 0;
  const el = stage.value;
  if (!el || !ring.value || !pieces.value.length) return;
  const progress = Math.min(1, Math.max(0, window.scrollY / (el.offsetHeight || 1)));
  const slot = 360 / pieces.value.length;
  ring.value.style.setProperty('--hero-spin', `${(slot * progress).toFixed(2)}deg`);
}

function onScroll(): void {
  if (!frame) frame = requestAnimationFrame(turn);
}

onMounted(() => {
  if (prefersReducedMotion()) return;
  window.addEventListener('scroll', onScroll, { passive: true });
  turn();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <section class="c-brand-hero">
    <div class="c-brand-hero__backdrop">
      <div class="c-brand-hero__layer c-brand-hero__glow" aria-hidden="true"></div>
      <!-- Only with a file: with no mask the tint floods the hero. -->
      <div
        v-if="patternSrc"
        class="c-brand-hero__layer c-brand-hero__pattern"
        :style="patternStyle"
        aria-hidden="true"
      ></div>

      <div class="c-brand-hero__bar">
        <Breadcrumbs
          :crumbs="crumbs"
          :prev="prev"
          :next="next"
          compact-hops
        />
      </div>

      <div class="c-brand-hero__frame">
        <div ref="stage" class="c-brand-hero__stage">
          <!-- Decorative: every program is named in the programs band below. -->
          <div ref="ring" class="c-brand-hero__ring" aria-hidden="true">
            <div class="c-brand-hero__arrive">
              <div
                v-for="piece in pieces"
                :key="piece.program.slug"
                class="c-brand-hero__slot"
                :style="{ left: piece.left, top: piece.top }"
              >
                <div class="c-brand-hero__upright">
                  <picture
                    class="c-brand-hero__piece"
                    :class="`c-brand-hero__piece--${piece.size}`"
                  >
                    <source
                      v-for="source in piece.sources"
                      :key="source.type"
                      :type="source.type"
                      :srcset="source.srcset"
                      sizes="150px"
                    />
                    <img :src="piece.src" alt="" decoding="async" />
                  </picture>
                </div>
              </div>
            </div>
          </div>

          <div class="c-brand-hero__well" aria-hidden="true"></div>

          <div class="c-brand-hero__centre">
            <div class="c-brand-hero__crest">
              <div class="c-brand-hero__halo" aria-hidden="true"></div>
              <!-- Never clipped to a circle: several marks are deliberately not round. -->
              <img
                v-if="icon"
                class="c-brand-hero__mark"
                :src="asset(icon)"
                alt=""
                width="384"
                height="384"
                fetchpriority="high"
              />
              <div class="c-brand-hero__crest-fade" aria-hidden="true"></div>
            </div>
            <div class="c-brand-hero__title">
              <div class="c-brand-hero__title-scrim" aria-hidden="true"></div>
              <h1 class="c-brand-hero__name">{{ name }}</h1>
              <p v-if="eyebrow" class="c-brand-hero__eyebrow">{{ eyebrow }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="l-wrap c-brand-hero__below">
      <slot />
    </div>
  </section>
</template>

<style>
.c-brand-hero {
  background: var(--color-bg);
}

/* Full-bleed, or above 1280 the pattern stops on a hard vertical line. */
.c-brand-hero__backdrop {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

/* The cq units below all read this capped width. */
.c-brand-hero__frame {
  container-type: inline-size;
  position: relative;
  z-index: var(--z-raised);
  max-width: 1280px;
  margin: 0 auto;
}

.c-brand-hero__stage {
  /* Clears the fixed nav and the crumb bar; the ring box shares both insets. */
  --hero-top: clamp(132px, 18svh, 168px);
  --hero-bottom: clamp(16px, 2.5svh, 32px);

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: min(100svh - var(--nav-height) - var(--space-2), max(560px, 70.3cqw));
  overflow: hidden;
  padding: var(--hero-top) var(--gutter) var(--hero-bottom);
  text-align: center;
}

.c-brand-hero__layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.c-brand-hero__glow {
  background: radial-gradient(44% 40% at 50% 48%, var(--faction), transparent 74%);
  opacity: 0.2;
}

/* Black ink on transparency, so only usable as a mask; the radial layer keeps it off the type. */
.c-brand-hero__pattern {
  --hero-tile: clamp(300px, 40vw, 640px);
  --hero-clear: 48%;

  background: var(--faction-text);
  opacity: 0.2;
  mask-image: var(--hero-pattern),
    radial-gradient(66% 60% at 50% 48%, transparent var(--hero-clear), #000 100%);
  mask-size:
    calc(var(--hero-tile) * var(--hero-tile-scale, 1)) auto,
    100% 100%;
  mask-repeat: repeat, no-repeat;
  mask-composite: intersect;
  -webkit-mask-image: var(--hero-pattern),
    radial-gradient(66% 60% at 50% 48%, transparent var(--hero-clear), #000 100%);
  -webkit-mask-size:
    calc(var(--hero-tile) * var(--hero-tile-scale, 1)) auto,
    100% 100%;
  -webkit-mask-repeat: repeat, no-repeat;
  /* A different keyword from the standard `intersect`, not a prefix of it. */
  -webkit-mask-composite: source-in;
}

@media (min-width: 700px) {
  .c-brand-hero__pattern {
    --hero-clear: 76%;
  }
}

.c-brand-hero__ring {
  position: absolute;
  inset: var(--hero-top) 0 var(--hero-bottom);
  z-index: 3;
  transform: rotate(var(--hero-spin, 0deg));
  will-change: transform;
}

.c-brand-hero__arrive {
  position: absolute;
  inset: 0;
  animation: c-brand-hero-arrive 900ms var(--ease-out) both;
}

.c-brand-hero__slot {
  position: absolute;
}

/* Counter-rotates by the ring's own angle, so the art never tilts. */
.c-brand-hero__upright {
  position: absolute;
  transform: translate(-50%, -50%) rotate(calc(-1 * var(--hero-spin, 0deg)));
}

.c-brand-hero__piece {
  display: block;
  transition: transform var(--dur-2) var(--ease-out);
}

.c-brand-hero__piece:hover {
  transform: translateY(-8px);
}

.c-brand-hero__piece img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 26px rgba(var(--rgb-bg), 0.85));
}

.c-brand-hero__piece--s {
  width: clamp(46px, min(7.5cqw, 8.8svh), 96px);
  height: clamp(46px, min(7.5cqw, 8.8svh), 96px);
}

.c-brand-hero__piece--m {
  width: clamp(56px, min(9.375cqw, 11svh), 120px);
  height: clamp(56px, min(9.375cqw, 11svh), 120px);
}

.c-brand-hero__piece--l {
  width: clamp(66px, min(11.72cqw, 13.8svh), 150px);
  height: clamp(66px, min(11.72cqw, 13.8svh), 150px);
}

.c-brand-hero__piece--l img {
  filter: drop-shadow(0 14px 32px rgba(var(--rgb-bg), 0.9));
}

.c-brand-hero__well {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 4;
  width: min(520px, 58%);
  height: min(400px, 52%);
  transform: translate(-50%, -50%);
  pointer-events: none;
  background: radial-gradient(
    closest-side,
    rgba(var(--rgb-bg), 0.88) 18%,
    rgba(var(--rgb-bg), 0.6) 58%,
    rgba(var(--rgb-bg), 0) 100%
  );
}

.c-brand-hero__bar {
  position: absolute;
  inset: 0 0 auto;
  z-index: 7;
  padding: clamp(74px, 8vw, 88px) var(--space-4) var(--space-5);
  background: linear-gradient(
    to bottom,
    rgba(var(--rgb-bg), 0.95) 0%,
    rgba(var(--rgb-bg), 0.95) 76%,
    rgba(var(--rgb-bg), 0) 100%
  );
  text-align: left;
}

/* Clips rather than wraps so the bar never grows into the ring; two classes so these hold whichever CSS loads first. */
.c-brand-hero__bar .c-crumbs {
  flex-wrap: nowrap;
  max-width: 1280px;
  margin: 0 auto;
}

.c-brand-hero__bar .c-crumbs__list {
  flex-wrap: nowrap;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.c-brand-hero__bar .c-crumbs__current {
  color: var(--faction-text);
}

.c-brand-hero__centre {
  position: relative;
  z-index: 6;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  width: 100%;
  pointer-events: none;
}

.c-brand-hero__crest {
  position: relative;
  display: grid;
  place-items: center;
  width: clamp(104px, min(21cqw, 23svh), 280px);
  height: clamp(104px, min(21cqw, 23svh), 280px);
  animation: c-brand-hero-mark 700ms var(--ease-out) both;
}

.c-brand-hero__halo {
  position: absolute;
  inset: -15%;
  border-radius: var(--radius-pill);
  background: radial-gradient(closest-side, var(--faction), transparent 78%);
  opacity: 0.28;
}

.c-brand-hero__mark {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Sinks the mark's foot under the name; at 50% wide the ellipse fades out at the box edge instead of drawing one. */
.c-brand-hero__crest-fade {
  position: absolute;
  left: -30%;
  right: -30%;
  bottom: -8%;
  height: 56%;
  background: radial-gradient(
    50% 100% at 50% 100%,
    var(--color-bg) 44%,
    rgba(var(--rgb-bg), 0.82) 70%,
    rgba(var(--rgb-bg), 0) 100%
  );
}

.c-brand-hero__title {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: clamp(-58px, -4.5cqw, -24px);
}

.c-brand-hero__title-scrim {
  position: absolute;
  inset: -28% -2%;
  background: radial-gradient(
    closest-side,
    rgba(var(--rgb-bg), 0.88) 0%,
    rgba(var(--rgb-bg), 0.8) 46%,
    rgba(var(--rgb-bg), 0) 100%
  );
}

.c-brand-hero__name {
  position: relative;
  max-width: 54cqw;
  font-size: clamp(1.9rem, min(6.4cqw, 6.8svh), 3.75rem);
  line-height: 1.04;
}

.c-brand-hero__eyebrow {
  position: relative;
  max-width: 54cqw;
  margin-top: var(--space-3);
  font-family: var(--font-mono);
  font-size: clamp(var(--size-mono-xs), 1.4cqw, var(--size-mono-s));
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  color: var(--faction-text);
}

.c-brand-hero__below {
  padding-block: clamp(20px, 3vw, 28px) clamp(24px, 3.5vw, 32px);
}

@keyframes c-brand-hero-arrive {
  from {
    transform: translateY(38px) scale(0.965);
    opacity: 0;
  }
}

@keyframes c-brand-hero-mark {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
}
</style>
