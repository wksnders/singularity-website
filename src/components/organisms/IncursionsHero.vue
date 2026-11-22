<script setup lang="ts">
/* Pinned and scroll-driven only where the last @media and its @supports match, so nothing here may need the scroll to be read. */
import BaseLink from '@/components/atoms/BaseLink.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import { t } from '@/content';
import { bosses, characters, incursionsHeroCards } from '@/data/universe';
import { asset, pictureSources, to } from '@/site/links';
import { scaledSizes } from '@/site/pageScale';

const BOSS_ID = 'calebrena-world-breaker';

const SQUAD_IDS = ['null-constructor', 'white-noise', 'sector-probe', 'cosma', 'archidex'];

const FEATHERED = ['null-constructor'];

const SIZES = {
  boss: '(min-width: 60em) 928px, min(118vw, 736px)',
  figure: '(min-width: 60em) 250px, (min-width: 47.5em) min(34vw, 208px), min(46vw, 242px)',
  hand: '(min-width: 60em) 224px, min(38vw, 176px)',
  card: '112px',
};

const picture = (path: string) => ({ src: asset(path), sources: pictureSources(path) });

const painting = bosses.find((boss) => boss.id === BOSS_ID)?.art.src ?? null;
const boss = painting ? picture(painting) : null;
const squad = SQUAD_IDS.flatMap((id) => {
  const art = characters.find((character) => character.id === id)?.art.src;
  return art ? [{ id, feathered: FEATHERED.includes(id), ...picture(art) }] : [];
});
const hands = incursionsHeroCards.hands.map(({ painting, height }) => ({ height, ...picture(`/incursions/hand-${painting}-960.webp`) }));
const designs = incursionsHeroCards.designs.map((id) => picture(`/incursions/design-${id}-480.webp`));
const mutation = picture(`/incursions/back-${incursionsHeroCards.mutationBack}-480.webp`);
</script>

<template>
  <section class="c-inc-hero">
    <div class="c-inc-hero__scene" aria-hidden="true">
      <span class="c-inc-hero__sky"></span>
      <picture v-if="boss" class="c-inc-hero__boss">
        <source v-for="source in boss.sources" :key="source.type" :type="source.type" :srcset="source.srcset" :sizes="scaledSizes(SIZES.boss)" />
        <img :src="boss.src" alt="" width="960" height="1344" fetchpriority="high" decoding="async" />
      </picture>
      <span class="c-inc-hero__haze"></span>
      <picture
        v-for="(figure, i) in squad"
        :key="figure.id"
        class="c-inc-hero__fig"
        :class="[`c-inc-hero__fig--${i}`, { 'c-inc-hero__fig--feathered': figure.feathered }]"
      >
        <source v-for="source in figure.sources" :key="source.type" :type="source.type" :srcset="source.srcset" :sizes="scaledSizes(SIZES.figure)" />
        <img :src="figure.src" alt="" width="1280" height="1568" loading="lazy" decoding="async" />
      </picture>
    </div>

    <div class="c-inc-hero__lead">
      <div class="c-inc-hero__frame">
        <Breadcrumbs
          :crumbs="[
            { label: t('ia.universe.label'), to: to('universe') },
            { label: t('ia.universe.incursions.label') },
          ]"
        />
        <h1 class="c-inc-hero__title">{{ t('ia.universe.incursions.label') }}</h1>
        <div class="c-inc-hero__allies">
          <h2 class="c-inc-hero__beat">{{ t('incursions.hero.allies.title') }}</h2>
          <p>{{ t('incursions.hero.allies.body') }}</p>
        </div>
        <p class="c-inc-hero__next">
          <BaseLink :to="{ hash: '#roster' }">{{ t('incursions.hero.encounters') }} <span aria-hidden="true">↓</span></BaseLink>
        </p>
        <div class="c-inc-hero__stakes">
          <div class="c-inc-hero__piles" aria-hidden="true">
            <span class="c-inc-hero__pile c-inc-hero__pile--design">
              <picture v-for="(card, i) in designs" :key="card.src" class="c-inc-hero__card" :class="`c-inc-hero__card--${i}`">
                <source v-for="source in card.sources" :key="source.type" :type="source.type" :srcset="source.srcset" :sizes="scaledSizes(SIZES.card)" />
                <img :src="card.src" alt="" width="480" height="671" decoding="async" />
              </picture>
            </span>
            <span class="c-inc-hero__pile c-inc-hero__pile--mutation">
              <picture v-for="i in designs.length" :key="i" class="c-inc-hero__card" :class="`c-inc-hero__card--${i - 1}`">
                <source v-for="source in mutation.sources" :key="source.type" :type="source.type" :srcset="source.srcset" :sizes="scaledSizes(SIZES.card)" />
                <img :src="mutation.src" alt="" width="480" height="671" decoding="async" />
              </picture>
            </span>
          </div>
          <p class="c-inc-hero__stakes-line">{{ t('incursions.hero.stakes') }}</p>
        </div>
      </div>
    </div>

    <div class="c-inc-hero__answer">
      <picture
        v-for="(hand, i) in hands"
        :key="hand.src"
        class="c-inc-hero__hand"
        :class="i ? 'c-inc-hero__hand--right' : 'c-inc-hero__hand--left'"
        aria-hidden="true"
      >
        <source v-for="source in hand.sources" :key="source.type" :type="source.type" :srcset="source.srcset" :sizes="scaledSizes(SIZES.hand)" />
        <img :src="hand.src" alt="" width="960" :height="hand.height" decoding="async" />
      </picture>
      <div class="c-inc-hero__reply">
        <h2 class="c-inc-hero__beat c-inc-hero__beat--threat">{{ t('incursions.hero.answer.title') }}</h2>
        <p>{{ t('incursions.hero.answer.body') }}</p>
      </div>
    </div>
  </section>
</template>

<style>
/* Registered names are document-wide, and --turn alone is HomeTrailerDial's angle. */
@property --inc-turn {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

@property --inc-lead-ink {
  syntax: '<number>';
  inherits: true;
  initial-value: 1;
}

@property --inc-stakes-ink {
  syntax: '<number>';
  inherits: true;
  initial-value: 1;
}

@property --inc-answer-ink {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

/* Stage lengths are multiples of --u, so the wide scene scales whole. */
.c-inc-hero {
  --u: 1rem;
  --inc-turn: 0;
  --inc-lead-ink: 1;
  --inc-stakes-ink: 1;
  --inc-answer-ink: 0;
  position: relative;
  /* ScrollSpyRail is fixed and would sit on the scene. */
  z-index: calc(var(--z-rail) + 1);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  background: var(--color-bg);
}

.c-inc-hero__scene {
  grid-area: 1 / 1;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--color-line);
  pointer-events: none;
}

.c-inc-hero__sky,
.c-inc-hero__haze {
  position: absolute;
  inset: 0;
}

.c-inc-hero__sky {
  background: radial-gradient(ellipse 95% 24rem at 50% 11rem, rgba(var(--rgb-threat), 0.5), transparent 78%);
}

.c-inc-hero__haze {
  background:
    radial-gradient(ellipse 16rem 3.25rem at 8.75rem 6.25rem, rgba(var(--rgb-bg), 0.9) 45%, transparent 100%),
    radial-gradient(ellipse 22rem 6rem at 50% calc(10.25rem + min(36vw, 15rem)), rgba(var(--rgb-bg), 0.74), transparent 100%),
    radial-gradient(ellipse 85% 7rem at 50% calc(100% - 4.5rem), rgba(var(--rgb-threat), 0.26), transparent 100%),
    linear-gradient(180deg, rgba(var(--rgb-bg), 0.78) 0, transparent 7rem);
}

.c-inc-hero__boss,
.c-inc-hero__fig {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.c-inc-hero__scene img,
.c-inc-hero__answer img,
.c-inc-hero__card img {
  width: 100%;
  max-width: none;
  height: auto;
}

.c-inc-hero__boss {
  top: -1.5rem;
  width: min(118vw, 46rem);
  -webkit-mask-image: linear-gradient(180deg, #000 36%, transparent 57%), radial-gradient(ellipse 50% 50% at 50% 32%, #000 62%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(180deg, #000 36%, transparent 57%), radial-gradient(ellipse 50% 50% at 50% 32%, #000 62%, transparent 100%);
  mask-composite: intersect;
}

.c-inc-hero__fig--0 {
  --slot: 0;
  --x0: -29.5;
  --x1: -31;
  --b0: 1.25;
  --b1: 7;
  --h0: 17.75;
  --h1: 15.5;
  z-index: 0;
}

.c-inc-hero__fig--1 {
  --slot: 1;
  --x0: -18.8;
  --x1: -17;
  --b0: 0.4;
  --b1: 1.5;
  --h0: 18.25;
  --h1: 18.5;
  z-index: 3;
}

.c-inc-hero__fig--2 {
  --slot: 2;
  --x0: -9.2;
  --x1: 0;
  --b0: 1;
  --b1: 0.5;
  --h0: 16.5;
  --h1: 17.25;
  z-index: 2;
}

.c-inc-hero__fig--3 {
  --slot: 3;
  --x0: -0.2;
  --x1: 17;
  --b0: 2.25;
  --b1: 2.25;
  --h0: 15;
  --h1: 17;
  z-index: 1;
}

.c-inc-hero__fig--4 {
  --slot: 4;
  --x0: 8.4;
  --x1: 30.5;
  --b0: -0.5;
  --b1: 6;
  --h0: 17.75;
  --h1: 16.5;
  z-index: 3;
}

.c-inc-hero__fig {
  aspect-ratio: 1280 / 1568;
}

.c-inc-hero__fig--feathered {
  -webkit-mask-image: linear-gradient(to top, transparent 6%, #000 36%), linear-gradient(to right, transparent 4%, #000 30%, #000 74%, transparent 96%);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(to top, transparent 6%, #000 36%), linear-gradient(to right, transparent 4%, #000 30%, #000 74%, transparent 96%);
  mask-composite: intersect;
}

.c-inc-hero__frame {
  text-align: center;
}

.c-inc-hero__title {
  margin-top: min(36vw, 15rem);
  font-size: clamp(2.25rem, 10.5vw, 4.5rem);
  line-height: 0.95;
  text-shadow: var(--shadow-on-art);
}

.c-inc-hero__title::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: calc(var(--u) * -1) 0;
  border-radius: calc(var(--u) * 1.5);
  background: rgba(var(--rgb-bg), 0.62);
  filter: blur(calc(var(--u) * 0.75));
  pointer-events: none;
}

.c-inc-hero__beat {
  font-size: 1.75rem;
  line-height: 1.02;
}

.c-inc-hero__beat--threat {
  font-size: clamp(2.25rem, 9vw, 3.5rem);
  line-height: 0.95;
  color: var(--color-threat-text);
}

.c-inc-hero__allies {
  margin-top: var(--space-3);
  text-shadow: 0 0 1rem rgba(var(--rgb-bg), 0.9);
}

.c-inc-hero__allies p {
  margin-top: var(--space-1);
  color: var(--color-ink);
}

.c-inc-hero__next {
  margin-top: var(--space-2);
}

.c-inc-hero__next a {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  font-weight: 500;
}

.c-inc-hero__piles {
  display: flex;
  justify-content: center;
  gap: calc(var(--u) * 2);
  padding-left: calc(var(--u) * 0.75);
}

.c-inc-hero__pile {
  position: relative;
  width: calc(var(--u) * 7);
  aspect-ratio: 480 / 671;
}

.c-inc-hero__pile--design {
  transform: rotate(-4deg);
  filter: drop-shadow(0 0 calc(var(--u) * 0.5) rgba(var(--rgb-ink), 0.8)) drop-shadow(0 0 calc(var(--u) * 1.4) rgba(var(--rgb-ink), 0.45));
}

.c-inc-hero__pile--mutation {
  transform: rotate(4deg) translateY(calc(var(--u) * 0.4));
  filter: drop-shadow(0 0 calc(var(--u) * 0.5) rgba(var(--rgb-threat), 0.95)) drop-shadow(0 0 calc(var(--u) * 1.4) rgba(var(--rgb-threat), 0.6));
}

.c-inc-hero__card {
  position: absolute;
  inset: 0;
}

.c-inc-hero__card--0 {
  transform: translate(calc(var(--u) * -0.95), calc(var(--u) * 0.3)) rotate(-11deg);
}

.c-inc-hero__card--1 {
  transform: translate(calc(var(--u) * -0.4), calc(var(--u) * 0.1)) rotate(-5deg);
}

.c-inc-hero__card--2 {
  transform: translate(calc(var(--u) * 0.2), 0) rotate(2deg);
}

.c-inc-hero__stakes-line {
  margin-top: var(--space-5);
  font-size: var(--size-body-s);
  line-height: 1.5;
  color: var(--color-ink-muted);
}

.c-inc-hero__answer {
  grid-area: 2 / 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-8) var(--gutter) var(--space-12);
  text-align: center;
  background: radial-gradient(ellipse 34rem 9rem at 50% 9.5rem, rgba(var(--rgb-threat), 0.34), transparent 100%);
}

.c-inc-hero__hand {
  width: min(38vw, 11rem);
}

.c-inc-hero__hand--left {
  justify-self: end;
}

.c-inc-hero__reply {
  grid-column: 1 / -1;
}

.c-inc-hero__reply p {
  margin-top: var(--space-2);
  font-size: var(--size-body-l);
  color: var(--color-ink);
}

@media (max-width: 59.9375em) {
  .c-inc-hero {
    --fig-u: min(2.3vw, 0.86rem);
    /* 18.5 is the tallest --h1. */
    grid-template-rows: repeat(4, auto) calc(var(--fig-u) * 18.5 + var(--space-6));
  }

  .c-inc-hero__lead,
  .c-inc-hero__frame {
    display: contents;
  }

  .c-inc-hero__scene {
    grid-row: 1 / 6;
  }

  .c-inc-hero__fig {
    bottom: 0.75rem;
    left: calc(11% + var(--slot) * 19.5%);
    height: calc(var(--fig-u) * var(--h1));
  }

  .c-inc-hero__frame > * {
    position: relative;
    z-index: calc(var(--z-raised) + 1);
    grid-column: 1;
    padding-inline: var(--gutter);
  }

  .c-inc-hero__frame > .c-crumbs {
    grid-row: 1;
    padding-top: 5.5rem;
  }

  .c-inc-hero__title {
    grid-row: 2;
    justify-self: center;
  }

  .c-inc-hero__allies {
    grid-row: 3;
  }

  .c-inc-hero__next {
    grid-row: 4;
  }

  .c-inc-hero__stakes {
    grid-row: 6;
    padding-block: var(--space-10) var(--space-4);
  }

  .c-inc-hero__stakes-line {
    max-width: 20rem;
    margin-inline: auto;
  }

  .c-inc-hero__answer {
    grid-row: 7;
  }
}

@media (max-width: 47.4375em) {
  .c-inc-hero {
    --fig-u: min(3vw, 1rem);
  }

  /* Their images are lazy, so a phone never fetches the two it hides. */
  .c-inc-hero__fig--0,
  .c-inc-hero__fig--4 {
    display: none;
  }

  .c-inc-hero__fig {
    left: calc(50% + (var(--slot) - 2) * 29%);
  }
}

@media (min-width: 60em) {
  .c-inc-hero {
    --u: min(1rem, 100vw / 90);
    --u-art: var(--u);
    --u-boss: var(--u);
    --spare: 0px;
    --sky: 0px;
    --title-top: 22.5;
    /* Slot 1's --b0 + --h0, and slot 4's right edge. */
    --squad-reach: 18.65;
    --squad-edge: 15.6;
    --stage-h: calc(var(--u) * 56.25);
  }

  .c-inc-hero__sky {
    background: radial-gradient(ellipse calc(var(--u-boss) * 48.6) calc(var(--u-boss) * 31.5) at calc(50% + var(--u-boss) * 14.4 * (1 - var(--inc-turn))) calc(var(--sky) + var(--u-boss) * 15.75), rgba(var(--rgb-threat), 0.5), transparent 78%);
  }

  .c-inc-hero__haze {
    background:
      radial-gradient(ellipse calc(var(--u) * 21.6) calc(var(--u) * 5) at calc(50% - var(--u) * 27.9) calc(var(--u) * 7.9), rgba(var(--rgb-bg), 0.85), transparent 100%),
      radial-gradient(ellipse calc(var(--u) * 46.8) calc(var(--u) * 6.75) at 50% calc(var(--u) * 26.7 + var(--spare)), rgba(var(--rgb-bg), 0.74), transparent 100%),
      radial-gradient(ellipse calc(var(--u-art) * 46.8) calc(var(--u-art) * 12.4) at calc(50% - (var(--u-art) * 12.6 + (var(--u-art) - var(--u)) * var(--squad-edge)) * (1 - var(--inc-turn))) calc(100% - var(--u-art) * 4.5), rgba(var(--rgb-threat), 0.26), transparent 100%),
      linear-gradient(180deg, rgba(var(--rgb-bg), 0.78) 0, transparent calc(var(--u) * 7.3), transparent calc(100% - var(--u-art) * 30.4), rgba(var(--rgb-bg), 0.7) calc(100% - var(--u-art) * 19.1), rgba(var(--rgb-bg), 0.9) 100%);
  }

  .c-inc-hero__boss {
    top: calc(var(--sky) + var(--u-boss) * (-8 + 1.5 * var(--inc-turn)));
    left: calc(50% + var(--u-boss) * 15 * (1 - var(--inc-turn)));
    width: calc(var(--u-boss) * (58 - 4 * var(--inc-turn)));
  }

  .c-inc-hero__fig {
    bottom: calc(var(--u-art) * (var(--b0) + (var(--b1) - var(--b0)) * var(--inc-turn)));
    left: calc(50% + var(--u-art) * (var(--x0) + (var(--x1) - var(--x0)) * var(--inc-turn)) - (var(--u-art) - var(--u)) * var(--squad-edge) * (1 - var(--inc-turn)));
    height: calc(var(--u-art) * (var(--h0) + (var(--h1) - var(--h0)) * var(--inc-turn)));
  }

  .c-inc-hero__lead {
    grid-area: 1 / 1;
    position: relative;
    z-index: calc(var(--z-raised) + 1);
  }

  .c-inc-hero__frame {
    position: relative;
    width: min(100% - 2 * var(--gutter), calc(var(--u) * 67.5));
    height: var(--stage-h);
    margin-inline: auto;
  }

  .c-inc-hero__frame > .c-crumbs,
  .c-inc-hero__title,
  .c-inc-hero__allies,
  .c-inc-hero__next {
    position: absolute;
    right: 0;
    left: 0;
    margin: 0;
  }

  .c-inc-hero__frame > .c-crumbs {
    top: calc(var(--u) * 7);
  }

  .c-inc-hero__title {
    top: calc(var(--u) * var(--title-top) + var(--spare));
    width: fit-content;
    margin-inline: auto;
    font-size: calc(var(--u) * 7.25);
    line-height: 0.92;
  }

  .c-inc-hero__title::before {
    inset: calc(var(--u) * -2) calc(var(--u) * -3);
    border-radius: calc(var(--u) * 2);
    filter: blur(calc(var(--u) * 1.25));
  }

  .c-inc-hero__beat {
    font-size: calc(var(--u) * 2);
  }

  .c-inc-hero__beat--threat {
    font-size: calc(var(--u) * 4.5);
  }

  .c-inc-hero__allies {
    top: calc(var(--u) * 30.25 + var(--spare));
    opacity: var(--inc-lead-ink);
  }

  .c-inc-hero__allies p,
  .c-inc-hero__next a {
    font-size: max(var(--size-s), var(--u));
  }

  .c-inc-hero__next {
    top: calc(var(--u) * 34.25 + var(--spare));
    opacity: var(--inc-lead-ink);
  }

  .c-inc-hero__next:focus-within {
    opacity: 1;
  }

  .c-inc-hero__next a {
    min-height: calc(var(--u) * 2.75);
  }

  .c-inc-hero__stakes {
    position: absolute;
    right: 0;
    bottom: calc(var(--u) * 2.25);
    width: calc(var(--u) * 18.5);
    text-align: left;
    opacity: var(--inc-stakes-ink);
  }

  .c-inc-hero__stakes-line {
    margin-top: calc(var(--u) * 1.25);
    font-size: max(var(--size-s), calc(var(--u) * 0.9375));
  }

  .c-inc-hero__answer {
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: calc(var(--u) * 3);
    padding-block: var(--space-10) var(--space-16);
  }

  .c-inc-hero__hand {
    grid-row: 1;
    width: calc(var(--u-boss) * 14);
  }

  .c-inc-hero__hand--right {
    grid-column: 3;
  }

  .c-inc-hero__reply {
    grid-area: 1 / 2;
  }

  .c-inc-hero__reply p {
    font-size: max(var(--size-s), calc(var(--u) * 1.125));
  }
}

@media (min-width: 60em) and (min-height: 44em) and (min-aspect-ratio: 5/4) and (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .c-inc-hero {
      --u: min(1rem, 100vw / 90, 100svh / 56.25);
      --u-art: calc(var(--u) + (min(100vw / 90, 100svh / 56.25) - var(--u)) * 0.3);
      --spare: calc(100svh - var(--u) * 56.25 - (var(--u-art) - var(--u)) * var(--squad-reach));
      --u-boss: min(calc(var(--u) + var(--spare) * 0.3 / var(--title-top)), calc(100vw / (2 * 15 + 58)));
      --sky: calc(var(--spare) - (var(--u-boss) - var(--u)) * var(--title-top));
      --stage-h: 100svh;
      --travel: calc(var(--u) * 30 + var(--spare));
      animation-name: c-inc-hero-turn, c-inc-hero-lead, c-inc-hero-stakes, c-inc-hero-answer;
      /* Firefox has needed a duration to run a scroll-driven animation. */
      animation-duration: 1ms;
      animation-timing-function: cubic-bezier(0.3333, 0, 0.6667, 1);
      animation-fill-mode: both;
      animation-timeline: view();
      animation-range: contain 2% contain 96%, contain 3% contain 34%, contain 2% contain 20%, contain 20% contain 62%;
    }

    .c-inc-hero__scene,
    .c-inc-hero__answer {
      position: sticky;
      top: 0;
      align-self: start;
      height: var(--stage-h);
    }

    .c-inc-hero__lead {
      height: calc(var(--stage-h) + var(--travel));
      pointer-events: none;
    }

    .c-inc-hero__frame > * {
      pointer-events: auto;
    }

    .c-inc-hero__answer {
      grid-area: 1 / 1;
      z-index: var(--z-raised);
      display: block;
      overflow: hidden;
      padding: 0;
      background: none;
      pointer-events: none;
    }

    .c-inc-hero__hand {
      position: absolute;
      opacity: var(--inc-turn);
    }

    .c-inc-hero__hand--left {
      top: calc(var(--sky) + var(--u-boss) * (11 - 1.9 * var(--inc-turn)));
      left: calc(50% + var(--u-boss) * (3 - 32 * var(--inc-turn)));
      transform: translateX(-50%) rotate(calc(10deg - 10deg * var(--inc-turn))) scale(calc(0.5 + 0.5 * var(--inc-turn)));
    }

    .c-inc-hero__hand--right {
      top: calc(var(--sky) + var(--u-boss) * (11 - 2.75 * var(--inc-turn)));
      left: calc(50% + var(--u-boss) * (27 + 1.5 * var(--inc-turn)));
      transform: translateX(-50%) rotate(calc(-10deg + 10deg * var(--inc-turn))) scale(calc(0.5 + 0.5 * var(--inc-turn)));
    }

    .c-inc-hero__reply {
      position: absolute;
      top: calc(var(--u) * 25.25 + var(--spare));
      right: var(--gutter);
      left: var(--gutter);
      opacity: var(--inc-answer-ink);
      transform: translateY(calc(var(--u) * 5 * (1 - var(--inc-answer-ink))));
      text-shadow: var(--shadow-on-art);
      pointer-events: auto;
    }
  }
}

@keyframes c-inc-hero-turn {
  from {
    --inc-turn: 0;
  }

  to {
    --inc-turn: 1;
  }
}

@keyframes c-inc-hero-lead {
  from {
    --inc-lead-ink: 1;
  }

  to {
    --inc-lead-ink: 0;
  }
}

@keyframes c-inc-hero-stakes {
  from {
    --inc-stakes-ink: 1;
  }

  to {
    --inc-stakes-ink: 0;
  }
}

@keyframes c-inc-hero-answer {
  from {
    --inc-answer-ink: 0;
  }

  to {
    --inc-answer-ink: 1;
  }
}
</style>
