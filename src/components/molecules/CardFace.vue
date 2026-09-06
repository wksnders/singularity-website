<script setup lang="ts">
// The visually hidden wording belongs only to a printed card, never a bare illustration, and must stay real text — aria-label collapses the face into one unpunctuated run.
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import { pictureSources } from '@/site/links';
import type { CardLine } from '@/site/cardText';
import type { Art } from '@/data/types';

const props = defineProps<{

  art: Art;
  placeholder: string;

  lines: CardLine[];
  actionLabel?: string;

  sizes?: string;
}>();

const sources = () => pictureSources(props.art.src);

defineEmits<{ select: [] }>();
</script>

<template>
  <div class="c-face">
    <component
      :is="actionLabel ? 'button' : 'div'"
      :type="actionLabel ? 'button' : undefined"
      :aria-label="actionLabel"
      class="c-face__frame"
      :class="{ 'is-action': actionLabel }"
      @click="actionLabel && $emit('select')"
    >
      <ArtFrame
        :art="art"
        ratio="63 / 88"
        radius="s"
        fit="contain"
        :placeholder="placeholder"
        :sources="sources()"
        :sizes="sizes ?? '160px'"
      />
      <slot name="overlay" />
    </component>
    <dl class="l-sr-only">
      <template v-for="line in lines" :key="line.label">
        <dt>{{ line.label }}</dt>
        <dd v-for="(value, index) in line.values" :key="index">{{ value }}</dd>
      </template>
    </dl>
  </div>
</template>

<style>
.c-face__frame {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: var(--radius-s);
  background: transparent;
}

.c-face__frame.is-action {
  cursor: zoom-in;
}
</style>
