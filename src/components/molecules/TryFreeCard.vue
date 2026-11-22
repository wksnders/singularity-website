<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import { useCopy } from '@/composables/useCopy';
import { FINE_HOVER, useMediaQuery } from '@/composables/useMediaQuery';
import { t } from '@/content';
import { starterDecks } from '@/data/starterStacks';
import { characters, tryRoutes, ttsShot } from '@/data/universe';
import { pictureSources, to, tryRouteLink } from '@/site/links';
import type { ResolvedLink } from '@/site/links';
import type { Art } from '@/data/types';

const props = defineProps<{ route: 'tts' | 'printAndPlay'; row?: boolean }>();

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

const ttsArt: Art = { src: ttsShot, alt: '' };
/* The cover-cropped picture's drawn width at each .c-try-free__pic size; change with that CSS and the grids that hold the card. */
const TTS_SIZES = {
  row: '(min-width: 1024px) 510px, (min-width: 720px) 46vw, 210px',
  stacked: '(min-width: 1200px) 560px, (min-width: 720px) 47vw, 210px',
};

const [deckA, deckB] = starterDecks.filter((deck) => deck.kind === 'starter');

const copyKey = computed(() => (props.route === 'tts' ? 'tts' : 'pnp'));

const link = computed<ResolvedLink>(() => {
  const route = tryRoutes.find((r) => r.id === props.route);
  if (!route) {
    if (import.meta.env.DEV) console.warn(`[TryFreeCard] no try route "${props.route}": linking to Learn.`);
    return { to: to('learn'), external: false };
  }
  return tryRouteLink(route);
});

/* A phone cannot run either free route: touch gets a copy-for-your-computer button, not the link. */
const pointer = useMediaQuery(FINE_HOVER);
const canCopy = typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.writeText);
const router = useRouter();
const { copied, copy } = useCopy({ resetMs: 2400 });

function hrefOf(target: ResolvedLink): string {
  const href = target.href ?? (target.to ? router.resolve(target.to).href : location.href);
  return new URL(href, location.href).href;
}

function copyLink(): void {
  const href = hrefOf(link.value);
  void copy(href, copyKey.value, () => location.assign(href));
}

const copyLabel = computed(() => t(copied.value === copyKey.value ? 'home.tryIt.copied' : 'home.tryIt.copy'));
</script>

<template>
  <div class="c-try-free" :class="{ 'c-try-free--row': row }">
    <div v-if="route === 'tts'" class="c-try-free__pic" aria-hidden="true">
      <ArtFrame
        :art="ttsArt"
        ratio="auto"
        :placeholder="t('home.tryIt.tts.placeholder')"
        :sources="pictureSources(ttsShot)"
        :sizes="row ? TTS_SIZES.row : TTS_SIZES.stacked"
      />
    </div>
    <div v-else class="c-try-free__pic c-try-free__pic--pnp" aria-hidden="true">
      <div class="c-try-free__sheet c-try-free__sheet--back"></div>
      <div class="c-try-free__sheet">
        <div class="c-try-free__sheet-grid">
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
    <div class="c-try-free__text">
      <h3 class="c-try-free__title">{{ t(`home.tryIt.${copyKey}.title`) }}</h3>
      <p class="c-try-free__body">
        {{ t(`home.tryIt.${copyKey}.body`, { a: deckA?.name ?? '', b: deckB?.name ?? '' }) }}
      </p>
      <BaseLink v-if="pointer || !canCopy" :link="link" class="c-try-free__link">
        {{ t(`home.tryIt.${copyKey}.link`) }}
      </BaseLink>
      <button v-else type="button" class="c-try-free__link" aria-live="polite" @click="copyLink">
        {{ copyLabel }}
      </button>
    </div>
  </div>
</template>

<style>
.c-try-free {
  display: grid;
  grid-template-columns: 7rem minmax(0, 1fr);
  gap: 0.875rem;
  align-items: center;
  padding: var(--space-3);
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 1rem;
  background: var(--color-surface-raised);
}

.c-try-free__pic {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  border-radius: 0.625rem;
}

.c-try-free__pic > .c-art {
  position: absolute;
  inset: 0;
}

.c-try-free__pic--pnp {
  background:
    radial-gradient(ellipse 70% 80% at 50% 70%, rgba(var(--rgb-accent), 0.13), transparent 70%),
    #0e0e1a;
}

.c-try-free__sheet {
  position: absolute;
  left: 50%;
  top: 12%;
  height: 96%;
  aspect-ratio: 8.5 / 11;
  padding: 5.5%;
  overflow: hidden;
  border-radius: 0.125rem;
  background: #f4f4f8;
  box-shadow: 0 1.25rem 2.75rem rgba(0, 0, 0, 0.6);
  transform: translateX(-50%) rotate(-4deg);
}

/* Two classes: the 45em rule below moves the front sheet and must not move this one. */
.c-try-free__sheet.c-try-free__sheet--back {
  display: none;
  top: 14%;
  height: 104%;
  background: #dcdce6;
  box-shadow: 0 1.125rem 2.5rem rgba(0, 0, 0, 0.5);
  transform: translateX(-36%) rotate(6deg);
}

.c-try-free__sheet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3%;
}

.c-try-free__sheet-grid .c-art {
  background: transparent;
}

.c-try-free__text {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.c-try-free__title {
  font-family: var(--font-display);
  font-size: var(--size-body-l);
  font-weight: 700;
}

.c-try-free__body {
  margin-top: 0.375rem;
  font-size: var(--size-m);
  line-height: 1.5;
  color: var(--color-ink-muted);
}

.c-try-free__link {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  min-height: 2.75rem;
  margin-top: 0.625rem;
  padding: 0.375rem 0 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--size-body-s);
  font-weight: 500;
  color: var(--color-accent);
  text-align: left;
  cursor: pointer;
}

.c-try-free__link:hover {
  color: var(--color-ink-bright);
  text-decoration: none;
}

@media (min-width: 45em) {
  .c-try-free {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    align-items: stretch;
    padding: 0;
    border-radius: var(--radius-l);
  }

  .c-try-free__pic {
    aspect-ratio: 16 / 9;
    border-radius: 0;
  }

  .c-try-free__sheet {
    top: 9%;
    height: 104%;
    transform: translateX(-58%) rotate(-4deg);
  }

  .c-try-free__sheet.c-try-free__sheet--back {
    display: block;
  }

  .c-try-free__text {
    padding: 1rem 1.25rem 1.125rem;
  }

  .c-try-free__title {
    font-size: 1.378rem;
  }

  .c-try-free__link {
    margin-top: auto;
  }
}

@media (min-width: 64em) {
  .c-try-free--row {
    grid-template-columns: 16.25rem minmax(0, 1fr);
  }

  .c-try-free--row .c-try-free__pic {
    aspect-ratio: auto;
    min-height: 12.5rem;
  }

  .c-try-free--row .c-try-free__text {
    justify-content: center;
    padding: 1.25rem 1.5rem;
  }

  .c-try-free--row .c-try-free__link {
    margin-top: 0.625rem;
  }
}
</style>
