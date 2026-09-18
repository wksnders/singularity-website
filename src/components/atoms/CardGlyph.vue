<script setup lang="ts">
// Decorative: the caller supplies the spoken word beside it.
import { computed } from 'vue';
import { glyphs } from '@/site/glyphs';
import type { Glyph, GlyphName } from '@/site/glyphs';

const props = defineProps<{ name: GlyphName }>();

const glyph = computed<Glyph>(() => glyphs[props.name]);
</script>

<template>
  <svg
    class="c-glyph"
    :class="`is-${glyph.tone ?? 'ink'}`"
    :viewBox="glyph.viewBox"
    :style="{ width: `${glyph.ratio}em` }"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    v-html="glyph.body"
  ></svg>
</template>

<style>
.c-glyph {
  height: 1em;
  vertical-align: -0.13em;
}

.c-glyph.is-power {
  color: var(--color-glyph-power);
}

.c-glyph.is-ai {
  color: var(--color-glyph-ai);
}

.c-glyph.is-corruption {
  color: var(--color-glyph-corruption);
}
</style>
