<script setup lang="ts">
/**
 * NOTHING IS CAPTIONED: the card prints its own name, and a second copy can drift from the printed face; the name still reaches a screen reader through the button's label.
 * The ART face borrows the card's ratio only while there is no image, so an empty tile does not collapse.
 */
import { computed } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import CardImage from '@/components/atoms/CardImage.vue';
import { t } from '@/content';
import { factionColorOf, placeholderOf } from '@/site/cards';
import { pictureSources } from '@/site/links';
import type { CardRow } from '@/site/cards';

const props = defineProps<{ row: CardRow; face: 'art' | 'card' }>();

defineEmits<{ select: [] }>();

const SIZES = '(min-width: 1160px) 380px, (min-width: 760px) 32vw, 45vw';

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
      <CardImage
        v-if="face === 'card'"
        :art="row.cardArt"
        :placeholder="placeholderOf(row, face)"
        radius="m"
        :sizes="SIZES"
      />
      <ArtFrame
        v-else
        :art="row.sceneArt"
        natural
        ratio="var(--ratio-card)"
        :placeholder="placeholderOf(row, face)"
        radius="m"
        :sources="pictureSources(row.sceneArt.src)"
        :sizes="SIZES"
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
