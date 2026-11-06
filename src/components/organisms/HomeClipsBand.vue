<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import { FINE_HOVER, prefersReducedMotion, useMediaQuery } from '@/composables/useMediaQuery';
import { t } from '@/content';
import { clips } from '@/data/universe';
import type { Clip } from '@/data/types';
import { asset, outbound } from '@/site/links';
import type { ResolvedLink } from '@/site/links';

const link = (clip: Clip): ResolvedLink =>
  clip.youTubeId ? { href: `https://www.youtube.com/shorts/${clip.youTubeId}`, external: true } : outbound('youtube');

const meta = (clip: Clip) =>
  clip.durationSec === null
    ? clip.kind
    : t('home.clips.meta', {
        kind: clip.kind,
        time: `${Math.floor(clip.durationSec / 60)}:${String(clip.durationSec % 60).padStart(2, '0')}`,
      });

const teeth = { '--rail-img': `url(${asset('/box-core/rail-teeth-528.webp')})` };

/* Touch scrolls the row by hand, so the arrows are for a mouse only. */
const arrows = useMediaQuery(`${FINE_HOVER} and (min-width: 600px)`);
const row = ref<HTMLElement | null>(null);
const atStart = ref(true);
const atEnd = ref(false);

function measure(): void {
  const el = row.value;
  if (!el) return;
  atStart.value = el.scrollLeft <= 1;
  atEnd.value = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
}

/* aria-disabled, not disabled, so a focused arrow keeps focus at the end of the row. */
function page(dir: 1 | -1): void {
  const el = row.value;
  if (!el || (dir < 0 ? atStart.value : atEnd.value)) return;
  el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

onMounted(() => {
  measure();
  window.addEventListener('resize', measure);
});

onBeforeUnmount(() => window.removeEventListener('resize', measure));
</script>

<template>
  <section id="clips" class="c-clips" aria-labelledby="clips-title" :style="teeth">
    <div class="c-clips__rail c-clips__rail--top" aria-hidden="true"><div class="c-clips__teeth"></div></div>
    <div class="c-clips__rail c-clips__rail--bottom" aria-hidden="true"><div class="c-clips__teeth"></div></div>
    <div class="c-clips__body">
    <div class="c-clips__head">
      <h2 id="clips-title" class="c-clips__title">{{ t('home.clips.title') }}</h2>
      <div class="c-clips__actions">
        <BaseLink :link="outbound('youtube')" class="c-clips__all">
          {{ t('home.clips.link') }} <span aria-hidden="true">→</span>
        </BaseLink>
        <div v-if="arrows" class="c-clips__arrows">
          <button type="button" class="c-clips__arrow" :aria-label="t('home.clips.prev')" :aria-disabled="atStart" @click="page(-1)">
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" class="c-clips__arrow" :aria-label="t('home.clips.next')" :aria-disabled="atEnd" @click="page(1)">
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>

    <ul ref="row" class="c-clips__row" role="list" @scroll.passive="measure">
      <li v-for="clip in clips" :key="clip.id" class="c-clips__item">
        <BaseLink :link="link(clip)" class="c-clips__card">
          <ArtFrame
            aria-hidden="true"
            :art="clip.poster"
            ratio="9 / 16"
            radius="none"
            :placeholder="clip.stillNote"
            sizes="200px"
          />
          <span class="c-clips__shade" aria-hidden="true"></span>
          <span class="c-clips__foot">
            <span class="c-clips__text">
              <span class="c-clips__name">{{ clip.title }}</span>
              <span class="c-clips__meta">{{ meta(clip) }}</span>
            </span>
            <span class="c-clips__play" aria-hidden="true"></span>
          </span>
        </BaseLink>
      </li>
    </ul>
    </div>
  </section>
</template>

<style>
/* The rails' scale follows the hero side panel's column (PANEL.ref in src/site/lidSplitScene.ts); a tile must be whole px or it seams. */
.c-clips {
  --clips-pad: max(var(--gutter), (100% - var(--width-content)) / 2);
  --rail-h: 24px;
  --rail-tile: 158px;

  container-type: inline-size;
  position: relative;
  scroll-margin-top: var(--scroll-offset);
}

/* On a child, so 100cqw in --rail-h measures the band here exactly as it does in the rails. */
.c-clips__body {
  padding: calc(var(--rail-h) + var(--space-7)) 0 calc(var(--rail-h) + var(--space-10));
}

.c-clips__rail {
  position: absolute;
  right: 0;
  left: 0;
  z-index: var(--z-raised);
  height: var(--rail-h);
  pointer-events: none;
  filter: saturate(0.3) brightness(0.82) drop-shadow(0 6px 6px rgba(0, 0, 0, 0.7));
}

.c-clips__rail--top {
  top: 0;
}

.c-clips__rail--bottom {
  bottom: 0;
}

.c-clips__teeth {
  position: absolute;
  inset: 0;
  background: var(--rail-img) 0 0 / var(--rail-tile) 100% repeat-x;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, rgba(0, 0, 0, 0.18) 18%, rgba(0, 0, 0, 0.55) 36%, rgba(0, 0, 0, 0.88) 50%, #000 60%);
  mask-image: linear-gradient(to bottom, transparent 0, rgba(0, 0, 0, 0.18) 18%, rgba(0, 0, 0, 0.55) 36%, rgba(0, 0, 0, 0.88) 50%, #000 60%);
}

/* Mirrored so its teeth point into the band, and shifted half a tooth so the two rails would mesh. */
.c-clips__rail--bottom .c-clips__teeth {
  background-position-x: calc(var(--rail-tile) / 8);
  transform: scaleY(-1);
}

.c-clips__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3) var(--space-4);
  max-width: var(--width-content);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.c-clips__title {
  font-size: clamp(1.444rem, 3.57vw, 1.969rem);
  line-height: 1;
}

.c-clips__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.c-clips__all {
  display: inline-flex;
  align-items: center;
  column-gap: 0.25em;
  min-height: 44px;
  font-size: var(--size-m);
  font-weight: 500;
  color: var(--color-accent-text);
}

.c-clips__all:hover {
  color: var(--color-ink-bright);
}

.c-clips__arrows {
  display: flex;
  gap: var(--space-2);
}

.c-clips__arrow {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(var(--rgb-ink), 0.22);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink);
  font-size: 1.125rem;
  cursor: pointer;
}

.c-clips__arrow[aria-disabled='true'] {
  opacity: 0.35;
  cursor: default;
}

/* The top padding keeps the cards' focus ring inside the scroller's clip. */
.c-clips__row {
  display: flex;
  gap: var(--space-2);
  margin: calc(var(--space-5) - var(--space-1)) 0 0;
  list-style: none;
  padding: var(--space-1) var(--clips-pad) var(--space-2);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 0 var(--clips-pad);
  scrollbar-width: none;
}

.c-clips__row::-webkit-scrollbar {
  display: none;
}

.c-clips__item {
  flex: 0 0 148px;
  scroll-snap-align: start;
}

.c-clips__card {
  position: relative;
  display: block;
  overflow: hidden;
  border: 1px solid rgba(var(--rgb-ink), 0.12);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  color: var(--color-ink);
  text-decoration: none;
}

.c-clips__card:hover {
  border-color: rgba(var(--rgb-accent), 0.5);
  color: var(--color-ink);
  text-decoration: none;
}

.c-clips__shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(0deg, rgba(var(--rgb-bg), 0.82) 0%, rgba(var(--rgb-bg), 0) 48%);
}

.c-clips__foot {
  position: absolute;
  right: var(--space-3);
  bottom: var(--space-3);
  left: var(--space-3);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-2);
}

.c-clips__text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.c-clips__name {
  font-size: var(--size-m);
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.c-clips__meta {
  font-family: var(--font-label);
  font-size: var(--size-label-2xs);
  font-weight: 600;
  letter-spacing: var(--track-label);
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.c-clips__play {
  position: relative;
  flex: 0 0 30px;
  height: 30px;
  border-radius: var(--radius-pill);
  background: rgba(var(--rgb-accent), 0.92);
}

.c-clips__play::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -5px 0 0 -3px;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid var(--color-on-accent);
}

@media (min-width: 720px) {
  .c-clips__body {
    padding: calc(var(--rail-h) + var(--space-9)) 0 calc(var(--rail-h) + 56px);
  }

  .c-clips__row {
    gap: var(--space-3);
  }

  .c-clips__item {
    flex-basis: clamp(160px, 15vw, 200px);
  }
}

@media (min-width: 760px) {
  .c-clips {
    --rail-h: calc(clamp(300px, 100cqw * 434 / 1280, 440px) * 80 * 846 / (434 * 2360));
    --rail-tile: calc(clamp(300px, 100cqw * 434 / 1280, 440px) * 528 * 846 / (434 * 2360));
  }
}

/* A custom property with an unsupported round() only fails where it is used, so it must be gated, not just ordered. */
@supports (width: round(1px, 1px)) {
  @media (min-width: 760px) {
    .c-clips {
      --rail-h: round(clamp(300px, 100cqw * 434 / 1280, 440px) * 80 * 846 / (434 * 2360), 1px);
      --rail-tile: round(clamp(300px, 100cqw * 434 / 1280, 440px) * 528 * 846 / (434 * 2360), 1px);
    }
  }

  .c-clips__rail--bottom .c-clips__teeth {
    background-position-x: round(var(--rail-tile) / 8, 1px);
  }
}
</style>
