<script setup lang="ts">
/* The wordmark and badge images must be cut on the same size canvas; the badge is overlaid on top at the same width. */
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { t } from '@/content';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { asset } from '@/site/links';

const SIGN_DELAY = 1200;

const FALLBACK = 4000;
const CUES = ['scroll', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

const reduce = useMediaQuery('(prefers-reduced-motion: reduce)');
const signed = ref(false);

let timers: number[] = [];

function sign(): void {
  signed.value = true;
}

function arm(): void {
  release();
  timers.push(window.setTimeout(sign, SIGN_DELAY));
}

function release(): void {
  for (const cue of CUES) window.removeEventListener(cue, arm);
}

onMounted(() => {
  if (reduce.value) {
    signed.value = true;
    return;
  }
  for (const cue of CUES) window.addEventListener(cue, arm, { passive: true, once: true });
  timers.push(window.setTimeout(sign, FALLBACK));
});

onBeforeUnmount(() => {
  release();
  for (const timer of timers) window.clearTimeout(timer);
  timers = [];
});

const src = (name: string, ext: 'webp' | 'png') => asset(`/logo/${name}.${ext}`);
const set = (name: string, ext: 'webp' | 'png') =>
  `${src(name, ext)} 720w, ${asset(`/logo/${name}@2x.${ext}`)} 1440w, ${asset(`/logo/${name}@3x.${ext}`)} 2160w`;
const SIZES = '(max-width: 760px) 92vw, 720px';
</script>

<template>
  <span class="c-lockup" :class="{ 'is-signed': signed, 'is-instant': reduce }">
    <picture>
      <source type="image/webp" :srcset="set('singularity-logo', 'webp')" :sizes="SIZES" />
      <img
        class="c-lockup__word"
        :src="src('singularity-logo', 'png')"
        :srcset="set('singularity-logo', 'png')"
        :sizes="SIZES"
        :alt="t('chrome.logoAlt')"
        width="720"
        height="254"
        fetchpriority="high"
        decoding="async"
      />
    </picture>

    <!-- alt="" : the wordmark above already carries the name. -->
    <picture>
      <source type="image/webp" :srcset="set('singularity-exe-badge-center', 'webp')" :sizes="SIZES" />
      <img
        class="c-lockup__badge"
        :src="src('singularity-exe-badge-center', 'png')"
        :srcset="set('singularity-exe-badge-center', 'png')"
        :sizes="SIZES"
        alt=""
        width="720"
        height="254"
        decoding="async"
      />
    </picture>
  </span>
</template>

<style>
.c-lockup {
  position: relative;
  display: block;
  width: min(100%, 720px);
  filter: drop-shadow(0 10px 30px rgba(var(--rgb-bg), 0.7));
}

.c-lockup__word {
  display: block;
  width: 100%;
  height: auto;
}

.c-lockup__badge {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: auto;
  opacity: 0;
  transform: translateY(6px) scale(0.88);
  transform-origin: 51.4% 83.5%;
  transition:
    opacity 480ms var(--ease-out),
    transform 480ms var(--ease-out);
}

.c-lockup.is-signed .c-lockup__badge {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.c-lockup.is-instant .c-lockup__badge {
  transition: none;
}
</style>
