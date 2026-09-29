<script setup lang="ts">
import ThreatBadge from '@/components/atoms/ThreatBadge.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import { t } from '@/content';
import { bossWall, game } from '@/data/universe';
import { asset, to } from '@/site/links';

const bossMotion = (i: number) => ({
  '--boss-dy': i % 2 ? '12px' : '0px',
  '--boss-amp': `${(i % 2 ? -1 : 1) * (5 + (i % 3))}px`,
  animationDelay: `${-(i % 3) * 2.2}s`,
});

const hideBrokenArt = (event: Event) => {
  (event.target as HTMLImageElement).style.visibility = 'hidden';
};
</script>

<template>
  <section class="l-band l-band--line-top c-incursions">
    <div class="c-incursions__wall" aria-hidden="true">
      <!-- Two identical sets: the track scrolls by one set's width and loops seamlessly. -->
      <div class="c-incursions__track">
        <div v-for="set in 2" :key="set" class="c-incursions__set">
          <span v-for="(src, i) in bossWall" :key="src" class="c-incursions__boss" :style="bossMotion(i)">
            <img :src="asset(src)" alt="" loading="lazy" decoding="async" @error="hideBrokenArt" />
          </span>
        </div>
      </div>
    </div>
    <div class="c-incursions__scrim" aria-hidden="true"></div>
    <div class="l-wrap c-incursions__copy">
      <ThreatBadge>{{ t('home.incursions.badge') }}</ThreatBadge>
      <h2 class="c-incursions__title">
        {{ t('home.incursions.title', { players: game.incursionsPlayers }) }}
      </h2>
      <p class="l-lede l-lede--narrow c-incursions__body">
        {{ t('home.incursions.body') }}
      </p>
      <UiButton :to="to('incursions')" class="c-incursions__cta">
        {{ t('home.incursions.cta') }}
      </UiButton>
    </div>
  </section>
</template>

<style>
.c-incursions {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

/* The overhang must cover the corners the turn exposes, plus the float's travel. */
.c-incursions__wall {
  --boss-gap: clamp(8px, 1vw, 12px);

  position: absolute;
  inset: calc(-3vw - 24px) -5%;
  pointer-events: none;
  transform: rotate(-3deg);
}

.c-incursions__track {
  position: absolute;
  inset: 0 auto 0 0;
  width: 200%;
  display: flex;
  animation: c-incursions-scroll 420s linear infinite;
}

/* The trailing padding stands in for the gap between the two sets, so each set is exactly half the track. */
.c-incursions__set {
  flex: 0 0 50%;
  min-width: 0;
  display: flex;
  gap: var(--boss-gap);
  padding-right: var(--boss-gap);
  box-sizing: border-box;
}

.c-incursions__boss {
  flex: 1 1 0;
  min-width: 0;
  border-radius: var(--radius-s);
  overflow: hidden;
  background: var(--color-surface);
  /* Also the reduced-motion pose: base.css cuts the float back to this. */
  transform: translateY(var(--boss-dy));
  animation: c-incursions-float 26s ease-in-out infinite alternate;
}

.c-incursions__boss img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 20%;
  filter: saturate(0.8) brightness(0.66);
}

/* Keep the count in step with bossWall's note in src/data/universe.ts. */
@media (max-width: 759px) {
  .c-incursions__boss:nth-child(n + 6) {
    display: none;
  }
}

@keyframes c-incursions-scroll {
  from {
    transform: translateX(-50%);
  }

  to {
    transform: translateX(0);
  }
}

@keyframes c-incursions-float {
  from {
    transform: translateY(calc(var(--boss-dy) - var(--boss-amp)));
  }

  to {
    transform: translateY(calc(var(--boss-dy) + var(--boss-amp)));
  }
}

/* The body copy must hold 4.5:1 wherever it ends, even over the brightest patch of art. */
.c-incursions__scrim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    rgba(var(--rgb-bg), 0.92) 0%,
    rgba(var(--rgb-bg), 0.7) 50%,
    rgba(var(--rgb-bg), 0.28) 100%
  );
}

@media (max-width: 899px) {
  .c-incursions__scrim {
    background: linear-gradient(
      100deg,
      rgba(var(--rgb-bg), 0.92) 0%,
      rgba(var(--rgb-bg), 0.8) 50%,
      rgba(var(--rgb-bg), 0.6) 100%
    );
  }
}

.c-incursions__copy {
  position: relative;
}

.c-incursions__title {
  max-width: 22ch;
  margin-top: var(--space-5);
  font-size: clamp(1.625rem, 4.6vw, 2.75rem);
  line-height: 1.08;
}

/* Two classes, so this beats .l-lede whichever stylesheet loads first. */
.l-lede.c-incursions__body {
  margin-top: var(--space-5);
  color: var(--color-ink-muted);
}

.c-incursions__cta {
  margin-top: var(--space-7);
}
</style>
