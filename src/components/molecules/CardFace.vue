<script setup lang="ts">
// Pass `lines` only where the card's wording is not already on the page: it must stay real text, because aria-label collapses a face into one unpunctuated run.
import CardImage from '@/components/atoms/CardImage.vue';
import type { CardLine } from '@/site/cardText';
import type { Art } from '@/data/types';

withDefaults(
  defineProps<{

    art: Art | null;
    placeholder: string;

    lines?: CardLine[];
    actionLabel?: string;

    radius?: 's' | 'm';
    sizes?: string;
  }>(),
  { lines: undefined, actionLabel: undefined, radius: 's', sizes: '160px' },
);

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
      <CardImage :art="art" :placeholder="placeholder" :radius="radius" :sizes="sizes" />
      <slot name="overlay" />
    </component>
    <dl v-if="lines?.length" class="l-sr-only">
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
