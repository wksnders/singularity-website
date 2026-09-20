<script setup lang="ts">
/**
 * The printed card, and the one place its rule lives: `--ratio-card`, `contain`, the full source ladder. NEVER CROPPED — cropping a card removes printed rules.
 * `art` is a `cardArt`. The exception is a stage with a card/art toggle under it — the zoom, and the character page's reading panel — which shows the art face in this same box, so it letterboxes instead of moving the toggle. Anywhere else an illustration or a scene goes through ArtFrame, which may crop.
 */
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import { pictureSources } from '@/site/links';
import type { Art } from '@/data/types';

withDefaults(
  defineProps<{
    art: Art | null;
    placeholder: string;
    radius?: 's' | 'm';
    sizes?: string;
  }>(),
  { radius: 's', sizes: '200px' },
);
</script>

<template>
  <ArtFrame
    :art="art"
    ratio="var(--ratio-card)"
    fit="contain"
    :radius="radius"
    :placeholder="placeholder"
    :sources="pictureSources(art?.src ?? null)"
    :sizes="sizes"
  />
</template>
