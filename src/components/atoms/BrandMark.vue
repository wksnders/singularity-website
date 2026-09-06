<script setup lang="ts">
// Marks are decorative by default (alt is empty unless `labelled`), and each mark's distinct silhouette, not ring colour alone, tells brands apart.
import { computed } from 'vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import { asset } from '@/site/links';

const props = withDefaults(
  defineProps<{

    icon?: string | null;

    name: string;

    size?: number;

    color?: string | null;

    labelled?: boolean;

    eager?: boolean;
  }>(),
  { size: 40, labelled: false, eager: false },
);

/* `brand.icon` is a public/-relative path, so it must be joined to the deploy base through asset(). */
const src = computed(() => (props.icon ? asset(props.icon) : null));

const dotSize = () => Math.max(8, Math.round(props.size * 0.32));
</script>

<template>
  <img
    v-if="src"
    class="c-mark"
    :src="src"
    :alt="labelled ? name : ''"
    :width="size"
    :height="size"
    :loading="eager ? 'eager' : 'lazy'"
    :fetchpriority="eager ? 'high' : 'auto'"
    decoding="async"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
  <FactionDot v-else :color="color" :size="dotSize()" />
</template>

<style>
.c-mark {
  display: inline-block;
  flex: 0 0 auto;
  object-fit: contain;
  vertical-align: middle;
  /* The glyph is white on transparency, so a mark only reads on a dark surface — never place one on `--color-accent` without a dark plate. */
}
</style>
