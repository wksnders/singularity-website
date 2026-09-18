<script setup lang="ts">
// Tags below are closed tight against each other so no stray space lands beside a glyph.
import { computed } from 'vue';
import CardGlyph from '@/components/atoms/CardGlyph.vue';
import { glyphSegments } from '@/site/cardText';
import { tokenGlyph } from '@/site/glyphs';

const props = defineProps<{ text: string }>();

const segments = computed(() => glyphSegments(props.text));
</script>

<template>
  <span
    ><template v-for="(seg, i) in segments" :key="i"
      ><span v-if="seg.word && tokenGlyph[seg.text]"
        ><CardGlyph :name="tokenGlyph[seg.text]" /><span class="l-sr-only">{{ seg.word }}</span></span
      ><template v-else>{{ seg.text }}</template></template
    ></span
  >
</template>
