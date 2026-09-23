<script setup lang="ts">
/* Each column's stack is drawn twice so it can wrap modulo half its height. */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import { prefersReducedMotion, useMediaQuery } from '@/composables/useMediaQuery';
import { asset } from '@/site/links';
import type { Crumb } from '@/site/sections';

const props = defineProps<{
  marks: string[];
  crumbs: Crumb[];
  /** The h1 reads as `lead` + `logoAlt`, so the alt must finish the sentence. */
  lead: string;
  logoAlt: string;
}>();

const wide = useMediaQuery('(min-width: 900px)');

const CELLS = 12;
const PACE = [0.34, 0.55, 0.42, 0.62, 0.48, 0.28];
const FADE = [0.9, 0.5, 0.75, 0.4, 0.65, 0.85];

const columns = computed(() => {
  const n = props.marks.length;
  if (!n) return [];
  const count = wide.value ? 16 : 8;
  const sizes = wide.value ? [40, 28, 52, 34, 46, 30] : [30, 22, 36, 26];
  return Array.from({ length: count }, (_, c) => {
    const size = sizes[c % sizes.length];
    return {
      size,
      pace: PACE[c % PACE.length],
      style: {
        opacity: FADE[c % FADE.length],
        '--rain-size': `${size}px`,
        '--rain-gap': `${Math.round(size * 0.5)}px`,
      },
      cells: Array.from({ length: CELLS }, (_, k) =>
        (c * 3 + k * 5) % 7 < 2 ? null : props.marks[(c * 5 + k * 7) % n],
      ),
    };
  });
});

const rain = ref<HTMLElement | null>(null);
let frame = 0;
let lastY = 0;
let travel = 0;

/* Scrolling up holds the rain rather than rewinding */
function turn(): void {
  frame = 0;
  const y = window.scrollY;
  if (y > lastY) travel += y - lastY;
  lastY = y;
  if (!rain.value || y > window.innerHeight * 1.2) return;
  rain.value.querySelectorAll<HTMLElement>('[data-pace]').forEach((column) => {
    const half = column.offsetHeight / 2 || 1;
    const offset = (travel * Number(column.dataset.pace)) % half;
    column.style.transform = `translateY(${(offset - half).toFixed(1)}px)`;
  });
}

function onScroll(): void {
  if (!frame) frame = requestAnimationFrame(turn);
}

onMounted(() => {
  if (prefersReducedMotion()) return;
  lastY = window.scrollY;
  window.addEventListener('scroll', onScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <section class="c-brands-hero">
    <!-- Decorative: every brand is named in the bands below. -->
    <div class="c-brands-hero__rain" aria-hidden="true">
      <div ref="rain" class="c-brands-hero__columns">
        <div
          v-for="(column, c) in columns"
          :key="c"
          class="c-brands-hero__column"
          :data-pace="column.pace"
          :style="column.style"
        >
          <div v-for="copy in 2" :key="copy" class="c-brands-hero__stack">
            <template v-for="(src, k) in column.cells" :key="k">
              <img
                v-if="src"
                class="c-brands-hero__drop"
                :src="src"
                alt=""
                :width="column.size"
                :height="column.size"
                decoding="async"
              />
              <span v-else class="c-brands-hero__drop"></span>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="c-brands-hero__layer c-brands-hero__wash" aria-hidden="true"></div>
    <div class="c-brands-hero__layer c-brands-hero__dim" aria-hidden="true"></div>
    <div class="c-brands-hero__layer c-brands-hero__glow" aria-hidden="true"></div>

    <div class="c-brands-hero__bar">
      <div class="l-wrap">
        <Breadcrumbs :crumbs="crumbs" />
      </div>
    </div>

    <div class="c-brands-hero__body">
      <h1 class="c-brands-hero__title">
        <span class="c-brands-hero__lead">{{ lead }}</span>
        <span class="c-brands-hero__logo">
          <span class="c-brands-hero__logo-scrim" aria-hidden="true"></span>
          <img
            :src="asset('/logo/singularity-logo-flat.svg')"
            :alt="logoAlt"
            width="646"
            height="178"
            fetchpriority="high"
            decoding="async"
          />
        </span>
      </h1>
    </div>
  </section>
</template>

<style>
.c-brands-hero {
  --brands-wash: #2a3160;

  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: clamp(340px, calc(40vh + 12vw), 640px);
}

.c-brands-hero__rain {
  position: absolute;
  inset: -22% -18%;
  z-index: -4;
  transform: rotate(-12deg);
}

.c-brands-hero__columns {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  overflow: hidden;
  pointer-events: none;
}

.c-brands-hero__column {
  display: flex;
  flex-direction: column;
  transform: translateY(-50%);
  will-change: transform;
}

.c-brands-hero__stack {
  display: flex;
  flex-direction: column;
  gap: var(--rain-gap);
  padding-bottom: var(--rain-gap);
}

.c-brands-hero__drop {
  display: block;
  flex: 0 0 auto;
  width: var(--rain-size);
  height: var(--rain-size);
  object-fit: contain;
}

.c-brands-hero__layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.c-brands-hero__wash {
  z-index: -3;
  background: var(--brands-wash);
  mix-blend-mode: color;
}

.c-brands-hero__dim {
  z-index: -2;
  background: rgba(var(--rgb-bg), 0.62);
}

.c-brands-hero__glow {
  z-index: -1;
  background:
    radial-gradient(55% 45% at 50% 50%, rgba(var(--rgb-accent), 0.16), transparent 70%),
    linear-gradient(to top, var(--color-bg) 0%, rgba(var(--rgb-bg), 0) 30%);
}

.c-brands-hero__bar {
  position: absolute;
  top: var(--nav-height);
  left: 0;
  right: 0;
  border-bottom: 1px solid rgba(var(--rgb-ink), 0.08);
  background: linear-gradient(to bottom, rgba(var(--rgb-bg), 0.55), rgba(var(--rgb-bg), 0.25));
}

/* Two classes, so these hold whichever chunk's CSS loads first. */
.c-brands-hero__bar .c-crumbs__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgba(var(--rgb-ink), 0.78);
}

.c-brands-hero__bar .c-crumbs__current {
  color: var(--color-accent-text);
}

.c-brands-hero__body {
  position: relative;
  width: 100%;
  max-width: var(--width-content);
  margin: 0 auto;
  padding: 124px var(--gutter) clamp(40px, 6vw, 80px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.c-brands-hero__title {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.c-brands-hero__lead {
  font-size: clamp(1.25rem, 3.6vw, 2rem);
  line-height: 1.1;
}

.c-brands-hero__logo {
  position: relative;
  display: block;
  width: min(76%, 520px);
  margin-top: var(--space-2);
}

.c-brands-hero__logo-scrim {
  position: absolute;
  inset: -60% -22%;
  z-index: -1;
  background: radial-gradient(closest-side, rgba(var(--rgb-bg), 0.62), transparent);
}

.c-brands-hero__logo img {
  display: block;
  width: 100%;
  height: auto;
  filter: invert(1) brightness(0.7) sepia(1) hue-rotate(190deg) saturate(0.8)
    drop-shadow(0 0 8px rgba(var(--rgb-accent), 0.5))
    drop-shadow(0 0 32px rgba(198, 208, 247, 0.34));
}
</style>
