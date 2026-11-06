<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import ThreatBadge from '@/components/atoms/ThreatBadge.vue';
import { t } from '@/content';
import { bossGroups, bossPainting, bosses as bossCards, game, rogueAIs } from '@/data/universe';
import type { Boss } from '@/data/types';
import { asset, pictureSources, to } from '@/site/links';
import { patternUrl } from '@/site/patterns';

let next = 0;
const groups = bossGroups.map((group) => {
  const name = rogueAIs.find((r) => r.id === group.encounterId)?.name ?? group.encounterId;
  const members = group.bossIds.map((id) => bossCards.find((b) => b.id === id)).filter((b): b is Boss => Boolean(b));
  return {
    name,
    bosses: members.map((boss) => ({
      ...boss,
      group: name,
      index: next++,
      /* Two bosses of one encounter can share a printed name, so the epithet tells them apart. */
      label: members.filter((m) => m.name === boss.name).length > 1 ? `${boss.name} — ${boss.epithet}` : boss.name,
    })),
  };
});
const bosses = groups.flatMap((group) => group.bosses);

const shown = ref(0);
const painted = ref(0);
/* A painting is fetched only once asked for, and stays mounted so the cross-fade has both ends. */
const seen = ref<number[]>([0]);
const current = computed(() => bosses[shown.value]);
const frame = ref<HTMLElement | null>(null);

/* Stepping wraps at both ends, and a new painting fades in only once decoded or the cross-fade passes through an empty frame. */
async function show(step: number): Promise<void> {
  const index = ((step % bosses.length) + bosses.length) % bosses.length;
  shown.value = index;
  if (!seen.value.includes(index)) {
    seen.value = [...seen.value, index];
    await nextTick();
    await frame.value?.querySelector<HTMLImageElement>(`[data-boss="${index}"] img`)?.decode().catch(() => undefined);
  }
  if (shown.value === index) painted.value = index;
}

function onKey(event: KeyboardEvent): void {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  event.preventDefault();
  void show(shown.value + (event.key === 'ArrowRight' ? 1 : -1));
}

/* Word joiners, so the range never breaks across lines at its dash. */
const players = game.incursionsPlayers.replace('–', '⁠–⁠');

/* The texture is a bundled mask (CORS); the spine is a plain background, so the CDN serves it. */
const ground = {
  '--incursions-texture': `url(${patternUrl('incursions-texture')})`,
  '--incursions-spine': `url(${asset('/incursions/spine-280.webp')})`,
};
</script>

<template>
  <!-- Tucks under HomeFactionBand's foot: its margin-top and padding-top pair with .c-factions__foot there. -->
  <section class="c-incursions" :style="ground">
    <div class="c-incursions__texture" aria-hidden="true"></div>
    <div class="c-incursions__spine c-incursions__spine--side" aria-hidden="true"></div>
    <div class="c-incursions__grid">
      <div class="c-incursions__spine c-incursions__spine--grid" aria-hidden="true"></div>

      <div class="c-incursions__head">
        <ThreatBadge>{{ t('home.incursions.badge') }}</ThreatBadge>
        <h2 class="c-incursions__title">
          {{ t('home.incursions.title', { players }) }}
        </h2>
        <p class="c-incursions__body">{{ t('home.incursions.body') }}</p>
      </div>

      <div class="c-incursions__art">
        <div ref="frame" class="c-incursions__frame">
          <div
            v-for="index in seen"
            :key="bosses[index].id"
            class="c-incursions__painting"
            :class="{ 'is-shown': index === painted }"
            :data-boss="index"
            :aria-hidden="index === painted ? undefined : 'true'"
          >
            <ArtFrame
              :art="{ ...bosses[index].art, alt: index === painted ? bosses[index].art.alt : '' }"
              ratio="auto"
              placeholder=""
              :sources="pictureSources(bossPainting(bosses[index].cardId, 960))"
              sizes="(min-width: 960px) 448px, min(448px, calc(100vw - 96px))"
            />
          </div>
        </div>
        <div class="c-incursions__nav" @keydown="onKey">
          <button type="button" class="c-incursions__step" :aria-label="t('home.incursions.prev')" @click="show(shown - 1)">
            <span aria-hidden="true">←</span>
          </button>
          <p class="c-incursions__now" aria-live="polite">
            <span class="c-incursions__name">{{ current.label }}</span>
            <span class="l-sr-only">, </span>
            <span class="c-incursions__group-of">{{ current.group }}</span>
          </p>
          <button type="button" class="c-incursions__step" :aria-label="t('home.incursions.next')" @click="show(shown + 1)">
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div class="c-incursions__controls">
        <div class="c-incursions__groups" @keydown="onKey">
          <div
            v-for="group in groups"
            :key="group.name"
            role="group"
            :aria-label="group.name"
            class="c-incursions__group"
            :class="{ 'is-active': group.bosses.some((boss) => boss.index === shown) }"
            :style="{ '--count': group.bosses.length }"
          >
            <div class="c-incursions__thumbs">
              <button
                v-for="boss in group.bosses"
                :key="boss.id"
                type="button"
                class="c-incursions__thumb"
                :aria-pressed="boss.index === shown"
                :aria-label="t('home.incursions.show', { name: boss.label })"
                @click="show(boss.index)"
              >
                <ArtFrame
                  :art="{ src: bossPainting(boss.cardId, 480), alt: '' }"
                  ratio="auto"
                  placeholder=""
                  :sources="pictureSources(bossPainting(boss.cardId, 480))"
                  sizes="72px"
                />
              </button>
            </div>
            <span class="c-incursions__rule" aria-hidden="true"></span>
            <span class="c-incursions__group-name" aria-hidden="true">{{ group.name }}</span>
          </div>
        </div>
        <div class="c-incursions__cta-wrap">
          <BaseLink :to="to('incursions')" class="c-incursions__cta">
            <span class="c-incursions__cta-fill" aria-hidden="true"></span>
            <span class="c-incursions__cta-label">{{ t('home.incursions.cta') }} <span aria-hidden="true">→</span></span>
          </BaseLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.c-incursions {
  position: relative;
  z-index: 0;
  isolation: isolate;
  overflow: hidden;
  margin-top: -109px;
  background: var(--color-bg-alt);
}

/* Ink-on-transparency art, so it is a mask and the rose is the background. */
.c-incursions__texture {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: var(--color-threat-text);
  opacity: 0.07;
  -webkit-mask-image: var(--incursions-texture);
  -webkit-mask-size: 300px;
  mask-image: var(--incursions-texture);
  mask-size: 300px;
}

.c-incursions::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(ellipse 90% 40% at 30% 50%, rgba(var(--rgb-threat), 0.16), transparent 70%);
}

.c-incursions__spine--side {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--gutter);
  width: 40px;
  background: var(--incursions-spine) center top / 100% auto repeat-y;
  filter: drop-shadow(0 0 18px rgba(var(--rgb-threat), 0.5));
}

.c-incursions__spine--grid {
  display: none;
}

.c-incursions__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'head'
    'art'
    'controls';
  gap: clamp(24px, 3vw, 32px) 0;
  max-width: var(--width-content);
  margin: 0 auto;
  padding: 108px var(--gutter) var(--band-y) 76px;
}

.c-incursions__head {
  grid-area: head;
  min-width: 0;
}

.c-incursions__title {
  max-width: 18ch;
  margin-top: var(--space-5);
  font-size: clamp(1.706rem, 4.83vw, 2.888rem);
  line-height: 1;
}

.c-incursions__body {
  max-width: 56ch;
  margin-top: 18px;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: rgba(var(--rgb-ink), 0.76);
}

.c-incursions__art {
  grid-area: art;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 448px;
}

.c-incursions__frame {
  position: relative;
  aspect-ratio: 5 / 7;
  overflow: hidden;
  border-radius: 12px;
  background: var(--color-surface);
}

.c-incursions__painting {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 360ms ease;
}

.c-incursions__painting.is-shown {
  opacity: 1;
}

.c-incursions__painting > .c-art,
.c-incursions__thumb > .c-art {
  height: 100%;
}

.c-incursions__nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.c-incursions__step {
  flex: none;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(var(--rgb-ink), 0.22);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink);
  font-size: 1.125rem;
  cursor: pointer;
}

.c-incursions__step:hover {
  background: rgba(var(--rgb-ink), 0.08);
}

.c-incursions__now {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  text-align: center;
}

.c-incursions__name {
  max-width: 100%;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 2.1vw, 1.444rem);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.c-incursions__group-of,
.c-incursions__group-name {
  font-family: var(--font-label);
  font-weight: 600;
  text-transform: uppercase;
}

.c-incursions__group-of {
  font-size: 0.72rem;
  letter-spacing: var(--track-label);
  color: rgba(var(--rgb-ink), 0.6);
}

.c-incursions__controls {
  grid-area: controls;
  align-self: end;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  container: inc-controls / inline-size;
}

/* Each group grows by its thumb count over its inner gaps, so every thumb in a row is the same width. */
.c-incursions__groups {
  --gap-in: var(--space-2);

  display: flex;
  flex-wrap: wrap;
  gap: 14px var(--space-2);
}

.c-incursions__group {
  flex: var(--count) 0 calc((var(--count) - 1) * var(--gap-in));
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.c-incursions__group:first-child {
  flex-basis: 100%;
}

/* The padding gives the pressed ring room; the negative margin keeps the row in place. */
.c-incursions__thumbs {
  display: flex;
  gap: var(--gap-in);
  padding: 4px;
  margin: -4px;
}

.c-incursions__thumb {
  flex: 1 1 0;
  min-width: 44px;
  aspect-ratio: 5 / 7;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 6px;
  background: var(--color-surface);
  box-shadow: 0 0 0 1px rgba(var(--rgb-ink), 0.14);
  filter: brightness(0.55) saturate(0.7);
  cursor: pointer;
  transition:
    filter 240ms ease,
    box-shadow 240ms ease;
  -webkit-tap-highlight-color: transparent;
}

.c-incursions__thumb:hover,
.c-incursions__thumb[aria-pressed='true'] {
  filter: none;
}

.c-incursions__thumb[aria-pressed='true'] {
  box-shadow:
    0 0 0 2px var(--color-bg-alt),
    0 0 0 4px var(--color-threat-text);
}

/* After the pressed ring, so keyboard focus still shows on the shown boss. */
.c-incursions__thumb:focus-visible {
  box-shadow:
    0 0 0 2px var(--color-bg-alt),
    0 0 0 4px var(--color-accent);
}

.c-incursions__rule {
  height: 2px;
  border-radius: 1px;
  background: rgba(var(--rgb-ink), 0.14);
  transition: background 240ms ease;
}

.c-incursions__group-name {
  overflow: hidden;
  font-size: var(--size-xs);
  line-height: 1.2;
  letter-spacing: var(--track-label-tight);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--color-threat-text);
  opacity: 0;
  transition: opacity 240ms ease;
}

.c-incursions__group.is-active .c-incursions__rule {
  background: var(--color-threat-text);
}

.c-incursions__group.is-active .c-incursions__group-name {
  opacity: 1;
}

.c-incursions__cta-wrap {
  padding: 4px;
}

/* clip-path cuts off an outer focus ring, so focus repaints the outline layer instead. */
.c-incursions__cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 36px;
  background: rgba(var(--rgb-threat-text), 0.7);
  clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%);
  color: var(--color-ink);
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
  outline-offset: -3px;
}

.c-incursions__cta:hover {
  background: var(--color-threat-text);
  color: var(--color-ink-bright);
  text-decoration: none;
}

.c-incursions__cta:focus-visible {
  background: var(--color-accent);
}

.c-incursions__cta-fill {
  position: absolute;
  inset: 1.5px;
  background: var(--color-threat-deep);
  clip-path: polygon(15px 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 15px 100%, 0 50%);
}

.c-incursions__cta-label {
  position: relative;
}

/* Same breakpoint as HomeFactionBand's wide layout: the foot's hardware is placed against this spine column. */
@media (min-width: 960px) {
  .c-incursions {
    margin-top: -147px;
  }

  .c-incursions__texture {
    -webkit-mask-size: 360px;
    mask-size: 360px;
  }

  .c-incursions::before {
    background: radial-gradient(ellipse 40% 70% at 50% 55%, rgba(var(--rgb-threat), 0.18), transparent 70%);
  }

  .c-incursions__spine--side {
    display: none;
  }

  .c-incursions__grid {
    grid-template-columns: minmax(0, 448px) 72px minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'art spine head'
      'art spine controls';
    column-gap: 32px;
    padding: 132px var(--gutter) var(--band-y);
  }

  .c-incursions__groups {
    column-gap: var(--space-4);
  }

  /* Overshoots the grid so it runs up under the factions band's foot and on to the band's bottom edge. */
  .c-incursions__spine--grid {
    display: block;
    grid-area: spine;
    position: relative;
  }

  .c-incursions__spine--grid::before {
    content: '';
    position: absolute;
    inset: -160px 0 -200px;
    background: var(--incursions-spine) center top / 100% auto repeat-y;
    filter: drop-shadow(0 0 26px rgba(var(--rgb-threat), 0.5));
  }

  /* One row once the column holds all eight thumbs at the 44px tap target: 8 × 44 + 5 × 6 inner + 2 × 22 between = 426px. */
  @container inc-controls (min-width: 426px) {
    .c-incursions__groups {
      --gap-in: 6px;

      flex-wrap: nowrap;
      column-gap: 22px;
    }

    .c-incursions__group:first-child {
      flex-basis: calc((var(--count) - 1) * var(--gap-in));
    }
  }
}
</style>
