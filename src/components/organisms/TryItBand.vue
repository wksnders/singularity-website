<script setup lang="ts">
import { useRouter } from 'vue-router';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import { useCopy } from '@/composables/useCopy';
import { FINE_HOVER, useMediaQuery } from '@/composables/useMediaQuery';
import { t } from '@/content';
import { starterDecks } from '@/data/starterStacks';
import { characters, coreProduct, tryRoutes } from '@/data/universe';
import { outbound, pictureSources, to, tryRouteLink } from '@/site/links';
import { patternUrl } from '@/site/patterns';
import type { ResolvedLink } from '@/site/links';
import type { Art } from '@/data/types';

/** The print sheet's faces, in reading order. */
const SHEET_CARDS = [
  'SC-008C-EN',
  'SC-015C-EN',
  'SC-040C-EN',
  'SC-001C-EN',
  'SC-022C-EN',
  'SC-014C-EN',
  'SC-017C-EN',
  'SC-033C-EN',
  'SC-025C-EN',
];

const sheet = SHEET_CARDS.map((id) => characters.find((c) => c.cardId === id)?.cardArt).filter(
  (art): art is Art => Boolean(art?.src),
);

const routeLink = (id: string): ResolvedLink => {
  const route = tryRoutes.find((r) => r.id === id);
  if (!route) {
    if (import.meta.env.DEV) console.warn(`[TryItBand] no try route "${id}": linking to Learn.`);
    return { to: to('learn'), external: false };
  }
  return tryRouteLink(route);
};
const ttsLink = routeLink('tts');
const pnpLink = routeLink('printAndPlay');

const [deckA, deckB] = starterDecks.filter((deck) => deck.kind === 'starter');

/* A phone cannot run either free route: touch gets a copy-for-your-computer button, not the link. */
const pointer = useMediaQuery(FINE_HOVER);
const canCopy = typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.writeText);
const router = useRouter();
const { copied, copy } = useCopy({ resetMs: 2400 });

function hrefOf(link: ResolvedLink): string {
  const href = link.href ?? (link.to ? router.resolve(link.to).href : location.href);
  return new URL(href, location.href).href;
}

function copyLink(key: string, link: ResolvedLink): void {
  const href = hrefOf(link);
  void copy(href, key, () => location.assign(href));
}

const copyLabel = (key: string) => t(copied.value === key ? 'home.tryIt.copied' : 'home.tryIt.copy');

const texture = { '--try-pattern': `url(${patternUrl('common-texture')})` };
</script>

<template>
  <section id="learn" class="l-band--alt c-try" :style="texture" aria-labelledby="try-it-title">
    <div class="c-try__texture" aria-hidden="true"></div>
    <div class="l-wrap">
      <h2 id="try-it-title" class="c-try__h">{{ t('home.tryIt.title') }}</h2>

      <div class="c-try__grid">
        <div class="c-try__free c-try__free--tts">
          <div class="c-try__pic c-try__pic--tts" aria-hidden="true">
            <ArtFrame :art="null" ratio="auto" :placeholder="t('home.tryIt.tts.placeholder')" />
          </div>
          <div class="c-try__text">
            <h3 class="c-try__title">{{ t('home.tryIt.tts.title') }}</h3>
            <p class="c-try__body">
              {{ t('home.tryIt.tts.body', { a: deckA?.name ?? '', b: deckB?.name ?? '' }) }}
            </p>
            <BaseLink v-if="pointer || !canCopy" :link="ttsLink" class="c-try__link">
              {{ t('home.tryIt.tts.link') }}
            </BaseLink>
            <button v-else type="button" class="c-try__link" aria-live="polite" @click="copyLink('tts', ttsLink)">
              {{ copyLabel('tts') }}
            </button>
          </div>
        </div>

        <div class="c-try__free c-try__free--pnp">
          <div class="c-try__pic c-try__pic--pnp" aria-hidden="true">
            <div class="c-try__sheet c-try__sheet--back"></div>
            <div class="c-try__sheet">
              <div class="c-try__sheet-grid">
                <ArtFrame
                  v-for="art in sheet"
                  :key="art.src ?? ''"
                  :art="art"
                  ratio="var(--ratio-card)"
                  :sources="pictureSources(art.src)"
                  sizes="96px"
                />
              </div>
            </div>
          </div>
          <div class="c-try__text">
            <h3 class="c-try__title">{{ t('home.tryIt.pnp.title') }}</h3>
            <p class="c-try__body">{{ t('home.tryIt.pnp.body') }}</p>
            <BaseLink v-if="pointer || !canCopy" :link="pnpLink" class="c-try__link">
              {{ t('home.tryIt.pnp.link') }}
            </BaseLink>
            <button v-else type="button" class="c-try__link" aria-live="polite" @click="copyLink('pnp', pnpLink)">
              {{ copyLabel('pnp') }}
            </button>
          </div>
        </div>

        <div class="c-try__box">
          <div class="c-try__render">
            <ArtFrame :art="null" ratio="1 / 1" radius="m" :placeholder="t('home.tryIt.box.placeholder')" />
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
  --fade-mid: 90px;
  --fade-end: 200px;

  position: relative;
  isolation: isolate;
  padding-block: var(--band-y) clamp(48px, 8vw, 80px);
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
  mask-size: 390px, 100% 100%;
  mask-repeat: repeat, no-repeat;
  mask-composite: intersect;
  -webkit-mask-image: var(--try-pattern), linear-gradient(to bottom, #000 0, rgba(0, 0, 0, 0.55) var(--fade-mid), transparent var(--fade-end));
  -webkit-mask-size: 390px, 100% 100%;
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
  gap: 10px;
  margin-top: clamp(20px, 3vw, 28px);
}

.c-try__free--tts {
  grid-area: tts;
}

.c-try__free--pnp {
  grid-area: pnp;
}

.c-try__free {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: var(--space-3);
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 16px;
  background: var(--color-surface-raised);
}

.c-try__pic {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
}

.c-try__pic > .c-art {
  position: absolute;
  inset: 0;
}

.c-try__pic--pnp {
  background:
    radial-gradient(ellipse 70% 80% at 50% 70%, rgba(var(--rgb-accent), 0.13), transparent 70%),
    #0e0e1a;
}

.c-try__sheet {
  position: absolute;
  left: 50%;
  top: 12%;
  height: 96%;
  aspect-ratio: 8.5 / 11;
  padding: 5.5%;
  overflow: hidden;
  border-radius: 2px;
  background: #f4f4f8;
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.6);
  transform: translateX(-50%) rotate(-4deg);
}

/* Two classes: the 720px rule below moves the front sheet and must not move this one. */
.c-try__sheet.c-try__sheet--back {
  display: none;
  top: 14%;
  height: 104%;
  background: #dcdce6;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
  transform: translateX(-36%) rotate(6deg);
}

.c-try__sheet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3%;
}

.c-try__sheet-grid .c-art {
  background: transparent;
}

.c-try__text {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.c-try__title {
  font-family: var(--font-display);
  font-size: var(--size-body-l);
  font-weight: 700;
}

.c-try__body {
  margin-top: 6px;
  font-size: var(--size-m);
  line-height: 1.5;
  color: var(--color-ink-muted);
}

.c-try__link {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  min-height: 44px;
  margin-top: 10px;
  padding: 6px 0 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--size-body-s);
  font-weight: 500;
  color: var(--color-accent);
  text-align: left;
  cursor: pointer;
}

.c-try__link:hover {
  color: var(--color-ink-bright);
  text-decoration: none;
}

.c-try__box {
  --try-glow: 50% 22%;

  grid-area: box;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  padding: 0 18px 22px;
  border: 1px solid rgba(var(--rgb-accent), 0.42);
  border-radius: var(--radius-l);
  background:
    radial-gradient(ellipse 85% 50% at var(--try-glow), rgba(var(--rgb-accent), 0.2), transparent 70%),
    #151729;
  box-shadow: 0 0 60px rgba(123, 108, 255, 0.12);
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
  margin: 10px 0 0;
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
  min-height: 52px;
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
  min-height: 44px;
  padding: 0 var(--space-1);
  font-weight: 500;
  color: var(--color-accent);
}

.c-try__alt a:hover {
  color: var(--color-ink-bright);
  text-decoration: none;
}

@media (min-width: 720px) {
  .c-try {
    --fade-mid: 110px;
    --fade-end: 250px;
  }

  .c-try__grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      'tts pnp'
      'box box';
    gap: var(--space-4);
  }

  .c-try__free {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    align-items: stretch;
    padding: 0;
    border-radius: var(--radius-l);
  }

  .c-try__pic {
    aspect-ratio: 16 / 9;
    border-radius: 0;
  }

  .c-try__sheet {
    top: 9%;
    height: 104%;
    transform: translateX(-58%) rotate(-4deg);
  }

  .c-try__sheet.c-try__sheet--back {
    display: block;
  }

  .c-try__text {
    padding: 16px 20px 18px;
  }

  .c-try__title {
    font-size: 1.378rem;
  }

  .c-try__link {
    margin-top: auto;
  }

  .c-try__box {
    --try-glow: 22% 50%;

    grid-template-columns: 260px minmax(0, 1fr);
    gap: var(--space-7);
    align-items: center;
    padding: 20px 28px 20px 12px;
  }

  .c-try__render {
    width: 100%;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .c-try__grid {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    grid-template-areas:
      'tts box'
      'pnp box';
  }

  .c-try__free {
    grid-template-columns: 260px minmax(0, 1fr);
  }

  .c-try__pic {
    aspect-ratio: auto;
    min-height: 200px;
  }

  .c-try__text {
    justify-content: center;
    padding: 20px 24px;
  }

  .c-try__link {
    margin-top: 10px;
  }

  .c-try__box {
    --try-glow: 50% 26%;

    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    gap: 0;
    align-items: stretch;
    padding: 0 24px 24px;
  }

  .c-try__render {
    width: 80%;
    margin: var(--space-6) auto 0;
  }
}
</style>
