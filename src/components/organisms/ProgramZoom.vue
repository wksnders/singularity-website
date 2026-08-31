<script setup lang="ts">
/**
 * A program at reading size. The one enlarged view: gallery, brand page, pool.
 */
import { computed, ref, watch } from 'vue';
import FaceToggle from '@/components/atoms/FaceToggle.vue';
import CardZoom from '@/components/organisms/CardZoom.vue';
import type { ZoomRow } from '@/components/organisms/CardZoom.vue';
import { t } from '@/content';
import { to } from '@/site/links';
import type { Program } from '@/data/types';

const props = defineProps<{
  open: boolean;
  program: Program | null;
  brandName: string;
}>();

defineEmits<{ close: [] }>();

const face = ref<'card' | 'art'>('card');

/* Carried across, a card can open showing something other than the card. */
watch(
  () => props.program?.id,
  () => {
    face.value = 'card';
  },
);

const blankArt = { src: null, alt: '' };

const art = computed(() =>
  face.value === 'art' ? props.program?.art : props.program?.cardArt,
);

const rows = computed<ZoomRow[]>(() => {
  const program = props.program;
  if (!program) return [];
  return [
    {
      label: t('character.rowBrand'),
      value: props.brandName,
      to: to('brand', { brandId: program.brandId }),
    },
    { label: t('character.rowSet'), value: t(`cards.sets.${program.set}`) },
    { label: t('character.rowArtist'), value: art.value?.artist || t('character.artistSlot') },
  ];
});
</script>

<template>
  <!-- Never v-if this: CardZoom's scroll lock and inert hang off a watcher on
       `open`, which a component that mounts already-open never fires. -->
  <CardZoom
    :open="open && Boolean(program)"
    :kicker="brandName"
    :name="program?.name ?? ''"
    :art="art ?? blankArt"
    :placeholder="t('cards.artPlaceholder')"
    :rows="rows"
    :errata-line="t('character.noErrata')"
    @close="$emit('close')"
  >
    <template #face>
      <FaceToggle v-model="face" />
    </template>
    <template #links>
      <slot name="links" />
    </template>
  </CardZoom>
</template>
