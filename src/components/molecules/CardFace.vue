<script setup lang="ts">
/**
 * A printed card: the image, and the same card's wording for readers who
 * cannot see it.
 *
 * The two are one component because they are one thing. A surface that shows a
 * card's ILLUSTRATION instead must not carry the wording — art plus text is a
 * reconstruction of a card, not a card. Show the card, or show the art.
 *
 * The wording is visually hidden and that is the point: there is no visible
 * text to duplicate. `aria-label` is not a substitute — it collapses the face
 * into one unpunctuated run.
 */
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import type { CardLine } from '@/site/cardText';
import type { Art } from '@/data/types';

defineProps<{
  /** The printed card. Never an illustration. */
  art: Art;
  placeholder: string;
  /** The face, in printed order. */
  lines: CardLine[];
}>();
</script>

<template>
  <div class="c-face">
    <ArtFrame :art="art" ratio="63 / 88" radius="s" fit="contain" :placeholder="placeholder" />
    <dl class="l-sr-only">
      <template v-for="line in lines" :key="line.label">
        <dt>{{ line.label }}</dt>
        <dd v-for="(value, index) in line.values" :key="index">{{ value }}</dd>
      </template>
    </dl>
  </div>
</template>
