<script setup lang="ts">
import { computed } from 'vue';
import WallHero from '@/components/organisms/WallHero.vue';
import type { WallColumn } from '@/components/organisms/WallHero.vue';
import { useMediaQuery } from '@/composables/useMediaQuery';
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

const columns = computed<WallColumn[]>(() => {
  const n = props.marks.length;
  if (!n) return [];
  const count = wide.value ? 16 : 8;
  const sizes = wide.value ? [40, 28, 52, 34, 46, 30] : [30, 22, 36, 26];
  return Array.from({ length: count }, (_, c) => {
    const size = sizes[c % sizes.length];
    return {
      pace: PACE[c % PACE.length],
      width: size,
      height: size,
      style: {
        opacity: FADE[c % FADE.length],
        '--wall-size': `${size}px`,
        '--wall-gap': `${Math.round(size * 0.5)}px`,
      },
      cells: Array.from({ length: CELLS }, (_, k) =>
        (c * 3 + k * 5) % 7 < 2 ? null : props.marks[(c * 5 + k * 7) % n],
      ),
    };
  });
});
</script>

<template>
  <WallHero class="c-brands-hero" :columns="columns" :crumbs="crumbs">
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
  </WallHero>
</template>

<style>
.c-brands-hero {
  min-height: clamp(340px, calc(40vh + 12vw), 640px);
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
