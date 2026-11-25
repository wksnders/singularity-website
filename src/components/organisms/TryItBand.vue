<script setup lang="ts">
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import TryFreeCard from '@/components/molecules/TryFreeCard.vue';
import { t } from '@/content';
import { coreBoxRender, coreProduct } from '@/data/universe';
import { outbound, pictureSources, to } from '@/site/links';
import { patternUrl } from '@/site/patterns';

const texture = { '--try-pattern': `url(${patternUrl('common-texture')})` };
const boxArt = coreBoxRender ? { src: coreBoxRender, alt: t('home.tryIt.box.alt') } : null;
const BOX_SIZES = '(min-width: 64em) 290px, (min-width: 45em) 260px, 65vw';
</script>

<template>
  <section id="learn" class="l-band--alt c-try" :style="texture" aria-labelledby="try-it-title">
    <div class="c-try__texture" aria-hidden="true"></div>
    <div class="l-wrap">
      <h2 id="try-it-title" class="c-try__h">{{ t('home.tryIt.title') }}</h2>

      <div class="c-try__grid">
        <TryFreeCard route="tts" row class="c-try__tts" />
        <TryFreeCard route="printAndPlay" row class="c-try__pnp" />

        <div class="c-try__box">
          <div class="c-try__render">
            <ArtFrame
              :art="boxArt"
              ratio="1 / 1"
              radius="m"
              :placeholder="t('home.tryIt.box.placeholder')"
              :sources="pictureSources(coreBoxRender)"
              :sizes="BOX_SIZES"
            />
          </div>
          <div class="c-try__box-text">
            <h3 class="c-try__box-title">{{ t('home.tryIt.box.title') }}</h3>
            <ul class="c-try__list">
              <li>{{ t('home.tryIt.box.years') }}</li>
              <li>{{ t('home.tryIt.box.colors') }}</li>
              <li>{{ t('home.tryIt.box.testing') }}</li>
            </ul>
            <div class="c-try__foot">
              <UiButton variant="primary" :link="outbound('buy')" class="c-try__buy">
                {{
                  coreProduct.price
                    ? t('home.tryIt.box.buy', { price: coreProduct.price })
                    : t('home.tryIt.box.buyNoPrice')
                }}
              </UiButton>
              <p class="c-try__alt">
                <span>{{ t('home.tryIt.box.notReady') }}</span>
                <span class="c-try__alt-links">
                  <BaseLink :to="to('rules')">{{ t('home.tryIt.box.rules') }}</BaseLink>
                  <span aria-hidden="true">·</span>
                  <BaseLink :to="to('cards')">{{ t('home.tryIt.box.cards') }}</BaseLink>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.c-try {
  --fade-mid: 5.625rem;
  --fade-end: 12.5rem;

  position: relative;
  isolation: isolate;
  padding-block: var(--band-y) clamp(3rem, 8vw, 5rem);
}

/* Ink-on-transparency art, so it is a mask and the tint is the background; the fade must die above the card scans. */
.c-try__texture {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: var(--color-ink);
  opacity: 0.07;
  mask-image: var(--try-pattern), linear-gradient(to bottom, #000 0, rgba(0, 0, 0, 0.55) var(--fade-mid), transparent var(--fade-end));
  mask-size: 24.375rem, 100% 100%;
  mask-repeat: repeat, no-repeat;
  mask-composite: intersect;
  -webkit-mask-image: var(--try-pattern), linear-gradient(to bottom, #000 0, rgba(0, 0, 0, 0.55) var(--fade-mid), transparent var(--fade-end));
  -webkit-mask-size: 24.375rem, 100% 100%;
  -webkit-mask-repeat: repeat, no-repeat;
  /* A different keyword from the standard `intersect`, not a prefix of it. */
  -webkit-mask-composite: source-in;
}

.c-try__h {
  font-size: var(--size-h2);
  line-height: 1.1;
  text-wrap: balance;
}

/* One source order at every width (TTS · print & play · box); only the room changes. */
.c-try__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'tts'
    'pnp'
    'box';
  gap: 0.625rem;
  margin-top: clamp(1.25rem, 3vw, 1.75rem);
}

.c-try__tts {
  grid-area: tts;
}

.c-try__pnp {
  grid-area: pnp;
}

.c-try__box {
  --try-glow: 50% 22%;

  grid-area: box;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  padding: 0 1.125rem 1.375rem;
  border: 1px solid rgba(var(--rgb-accent), 0.42);
  border-radius: var(--radius-l);
  background:
    radial-gradient(ellipse 85% 50% at var(--try-glow), rgba(var(--rgb-accent), 0.2), transparent 70%),
    #151729;
  box-shadow: 0 0 3.75rem rgba(123, 108, 255, 0.12);
}

.c-try__render {
  width: 82%;
  margin: var(--space-5) auto 0;
}

.c-try__box-text {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.c-try__box-title {
  font-family: var(--font-display);
  font-size: clamp(1.312rem, 2.31vw, 1.575rem);
  font-weight: 700;
}

.c-try__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0.625rem 0 0;
  padding: 0;
  list-style: none;
  font-size: var(--size-body-s);
  line-height: 1.45;
  color: var(--color-ink);
}

.c-try__foot {
  display: flex;
  flex-direction: column;
  margin-top: auto;
  padding-top: var(--space-4);
}

.c-try__buy {
  min-height: 3.25rem;
}

.c-try__alt {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0 var(--space-2);
  margin-top: var(--space-1);
  font-size: var(--size-s);
  color: var(--color-ink-soft);
}

.c-try__alt > span:first-child {
  padding: var(--space-1) 0;
}

.c-try__alt-links {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
}

.c-try__alt a {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 var(--space-1);
  font-weight: 500;
  color: var(--color-accent);
}

.c-try__alt a:hover {
  color: var(--color-ink-bright);
  text-decoration: none;
}

@media (min-width: 45em) {
  .c-try {
    --fade-mid: 6.875rem;
    --fade-end: 15.625rem;
  }

  .c-try__grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      'tts pnp'
      'box box';
    gap: var(--space-4);
  }

  .c-try__box {
    --try-glow: 22% 50%;

    grid-template-columns: 16.25rem minmax(0, 1fr);
    gap: var(--space-7);
    align-items: center;
    padding: 1.25rem 1.75rem 1.25rem 0.75rem;
  }

  .c-try__render {
    width: 100%;
    margin: 0 auto;
  }
}

@media (min-width: 64em) {
  .c-try__grid {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    grid-template-areas:
      'tts box'
      'pnp box';
  }

  .c-try__box {
    --try-glow: 50% 26%;

    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    gap: 0;
    align-items: stretch;
    padding: 0 1.5rem 1.5rem;
  }

  .c-try__render {
    width: 80%;
    margin: var(--space-6) auto 0;
  }
}
</style>
