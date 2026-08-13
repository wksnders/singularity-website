<script setup lang="ts">
/**
 * Every image on the site goes through here.
 * - Reserves its aspect ratio before the file loads, so nothing shifts.
 * - Falls back to a striped placeholder with a mono caption naming the art
 *   that belongs there, which is what the site shows until the renders land.
 * - alt comes from data. Decorative art passes alt: "".
 */
import type { Art } from '@/data/types';

const props = withDefaults(
  defineProps<{
    art?: Art | null;
    /** CSS aspect-ratio, e.g. "3 / 4". */
    ratio?: string;
    /** Caption shown while the art is missing. */
    placeholder?: string;
    radius?: 's' | 'm' | 'l' | 'none';
    /** One eager image per page: the hero. */
    eager?: boolean;
    /** `contain` for anything that must not be cropped — a printed card. */
    fit?: 'cover' | 'contain';
  }>(),
  { ratio: '3 / 4', placeholder: '[ art pending ]', radius: 'none', eager: false, fit: 'cover' },
);

const focal = (art: Art) =>
  art.focal ? `${art.focal.x * 100}% ${art.focal.y * 100}%` : '50% 50%';

const radiusVar = () => (props.radius === 'none' ? '0' : `var(--radius-${props.radius})`);
</script>

<template>
  <div class="c-art" :style="{ aspectRatio: ratio, borderRadius: radiusVar() }">
    <img
      v-if="art && art.src"
      class="c-art__img"
      :src="art.src"
      :alt="art.alt"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
      :style="{ objectPosition: focal(art), objectFit: fit }"
    />
    <div v-else class="c-art__empty">
      <span class="c-art__caption">{{ placeholder }}</span>
    </div>
  </div>
</template>

<style>
.c-art {
  position: relative;
  overflow: hidden;
  width: 100%;
  background: var(--color-surface);
}

.c-art__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.c-art__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  text-align: center;
  background: repeating-linear-gradient(
    135deg,
    rgba(var(--rgb-ink), 0.055) 0 10px,
    rgba(var(--rgb-ink), 0.02) 10px 20px
  );
  box-shadow: inset 0 0 0 1px var(--color-line);
}

.c-art__caption {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.04em;
  color: rgba(var(--rgb-ink), 0.55);
}
</style>
