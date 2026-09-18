<script setup lang="ts">
/**
 * One card in the database grid.
 *
 * NOTHING IS CAPTIONED: the card prints its own name, and a second copy can drift from the printed face. The name still reaches a screen reader through the button's label.
 * CARD is the default face, always 63/88 and `contain`, because a cropped card face loses rules text. ART is the scene illustration at its own shape, which is what makes the grid ragged. The rule both obey is on `CardFace`.
 */
import { computed } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import { t } from '@/content';
import { factionColorOf, placeholderOf } from '@/site/cards';
import { pictureSources } from '@/site/links';
import type { CardRow } from '@/site/cards';

const props = defineProps<{ row: CardRow; face: 'art' | 'card' }>();

defineEmits<{ select: [] }>();

const art = computed(() => (props.face === 'art' ? props.row.sceneArt : props.row.cardArt));
const edge = computed(() => factionColorOf(props.row) ?? 'rgba(var(--rgb-ink), 0.28)');
</script>

<template>
  <button
    type="button"
    class="c-ctile"
    :style="{ '--tile-edge': edge }"
    :aria-label="`${t('cardsPage.openCard')} ${row.name}`"
    @click="$emit('select')"
  >
    <span class="c-ctile__frame">
      <ArtFrame
        :art="art"
        :natural="face === 'art'"
        ratio="63 / 88"
        :placeholder="placeholderOf(row, face)"
        radius="m"
        fit="contain"
        :sources="pictureSources(art?.src ?? null)"
        sizes="(min-width: 1160px) 380px, (min-width: 760px) 32vw, 45vw"
      />
    </span>
  </button>
</template>

<style>
.c-ctile {
  display: inline-block;
  width: 100%;
  /* No bottom margin of its own: the even grid spaces rows with `gap`, and the ragged one adds it back because column flow has no row gap. */
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
  /* CSS columns will otherwise split a tile across two of them. */
  break-inside: avoid;
}

.c-ctile__frame {
  display: block;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-bottom: 2px solid var(--tile-edge);
  border-radius: var(--radius-m);
}

.c-ctile:hover .c-ctile__frame,
.c-ctile:focus-visible .c-ctile__frame {
  border-color: var(--tile-edge);
}

</style>
