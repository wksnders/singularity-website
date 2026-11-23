<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { bossWall } from '@/data/universe';
import { asset } from '@/site/links';
import { pageScale } from '@/site/pageScale';

const bossMotion = (i: number) => ({
  '--boss-dy': `${(i % 2 ? 12 : 0) * pageScale.value}px`,
  '--boss-amp': `${(i % 2 ? -1 : 1) * (5 + (i % 3)) * pageScale.value}px`,
  animationDelay: `${-(i % 3) * 2.2}s`,
});

const hideBrokenArt = (event: Event) => {
  (event.target as HTMLImageElement).style.visibility = 'hidden';
};

const root = ref<HTMLElement | null>(null);
const offscreen = ref(false);
let io: IntersectionObserver | null = null;

onMounted(() => {
  if (!('IntersectionObserver' in window) || !root.value) return;
  io = new IntersectionObserver(([entry]) => {
    offscreen.value = !entry.isIntersecting;
  });
  io.observe(root.value);
});

onBeforeUnmount(() => io?.disconnect());
</script>

<template>
  <div ref="root" class="c-boss-backdrop" :class="{ 'is-offscreen': offscreen }" aria-hidden="true">
    <div class="c-boss-backdrop__wall">
      <!-- Two identical sets: the track scrolls by one set's width and loops seamlessly. -->
      <div class="c-boss-backdrop__track">
        <div v-for="set in 2" :key="set" class="c-boss-backdrop__set">
          <span v-for="(src, i) in bossWall" :key="src" class="c-boss-backdrop__boss" :style="bossMotion(i)">
            <img :src="asset(src)" alt="" loading="lazy" decoding="async" @error="hideBrokenArt" />
          </span>
        </div>
      </div>
    </div>
    <div class="c-boss-backdrop__scrim"></div>
  </div>
</template>

<style>
/* The host band needs `position: relative` and `isolation: isolate`; this fills it from behind. */
.c-boss-backdrop {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

/* The overhang covers the corners the turn exposes, plus the float's travel. */
.c-boss-backdrop__wall {
  --boss-gap: clamp(0.5rem, 1vw, 0.75rem);

  position: absolute;
  inset: calc(-3vw - 1.5rem) -5%;
  transform: rotate(-3deg);
}

.c-boss-backdrop__track {
  position: absolute;
  inset: 0 auto 0 0;
  width: 200%;
  display: flex;
  animation: c-boss-backdrop-scroll 420s linear infinite;
}

/* The trailing padding stands in for the gap between the two sets, so each set is exactly half the track. */
.c-boss-backdrop__set {
  flex: 0 0 50%;
  min-width: 0;
  display: flex;
  gap: var(--boss-gap);
  padding-right: var(--boss-gap);
  box-sizing: border-box;
}

.c-boss-backdrop__boss {
  flex: 1 1 0;
  min-width: 0;
  border-radius: var(--radius-s);
  overflow: hidden;
  background: var(--color-surface);
  /* Also the reduced-motion pose: base.css cuts the float back to this. */
  transform: translateY(var(--boss-dy));
  animation: c-boss-backdrop-float 26s ease-in-out infinite alternate;
}

.c-boss-backdrop__boss img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 20%;
  filter: saturate(0.8) brightness(0.66);
}

/* Keep the count in step with bossWall's note in src/data/universe.ts. */
@media (max-width: 47.4375em) {
  .c-boss-backdrop__boss:nth-child(n + 6) {
    display: none;
  }
}

.c-boss-backdrop.is-offscreen .c-boss-backdrop__track,
.c-boss-backdrop.is-offscreen .c-boss-backdrop__boss {
  animation-play-state: paused;
}

@keyframes c-boss-backdrop-scroll {
  from {
    transform: translateX(-50%);
  }

  to {
    transform: translateX(0);
  }
}

@keyframes c-boss-backdrop-float {
  from {
    transform: translateY(calc(var(--boss-dy) - var(--boss-amp)));
  }

  to {
    transform: translateY(calc(var(--boss-dy) + var(--boss-amp)));
  }
}

/* The host's copy must hold 4.5:1 wherever it ends, even over the brightest patch of art; a host whose copy runs wider raises `--boss-scrim-lift`. */
.c-boss-backdrop__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    rgba(var(--rgb-bg), 0.92) 0%,
    rgba(var(--rgb-bg), calc(0.7 + var(--boss-scrim-lift, 0))) 50%,
    rgba(var(--rgb-bg), calc(0.28 + var(--boss-scrim-lift, 0))) 100%
  );
}

@media (max-width: 56.1875em) {
  .c-boss-backdrop__scrim {
    background: linear-gradient(
      100deg,
      rgba(var(--rgb-bg), 0.92) 0%,
      rgba(var(--rgb-bg), calc(0.8 + var(--boss-scrim-lift, 0))) 50%,
      rgba(var(--rgb-bg), calc(0.6 + var(--boss-scrim-lift, 0))) 100%
    );
  }
}
</style>
