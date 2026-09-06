<script setup lang="ts">
// Decorative art passes alt: ""; all other alt text comes from the data record.
import { asset } from '@/site/links';
import type { Art } from '@/data/types';

export interface ArtSource {
  type: string;
  srcset: string;
}

const props = withDefaults(
  defineProps<{
    art?: Art | null;

    ratio?: string;

    placeholder?: string;
    radius?: 's' | 'm' | 'l' | 'none';
    /** One eager image per page: the hero. */
    eager?: boolean;
    /** `contain` for anything that must not be cropped — a printed card. */
    fit?: 'cover' | 'contain';
    sources?: ArtSource[];
    sizes?: string;
    focal?: { x: number; y: number };
  }>(),
  {
    ratio: '3 / 4',
    placeholder: '[ art pending ]',
    radius: 'none',
    eager: false,
    fit: 'cover',
    sources: () => [],
    sizes: '100vw',
  },
);

const src = (art: Art) => (art.src ? asset(art.src) : null);

const objectPosition = (art: Art) => {
  const point = props.focal ?? art.focal;
  return point ? `${point.x * 100}% ${point.y * 100}%` : '50% 50%';
};

const radiusVar = () => (props.radius === 'none' ? '0' : `var(--radius-${props.radius})`);
</script>

<template>
  <div class="c-art" :style="{ aspectRatio: ratio, borderRadius: radiusVar() }">
    <picture v-if="art && art.src">
      <source
        v-for="source in sources"
        :key="source.type"
        :type="source.type"
        :srcset="source.srcset"
        :sizes="sizes"
      />
      <img
        class="c-art__img"
        :src="src(art)!"
        :alt="art.alt"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : 'auto'"
        decoding="async"
        :style="{ objectPosition: objectPosition(art), objectFit: fit }"
      />
    </picture>
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

.c-art picture {
  display: contents;
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
