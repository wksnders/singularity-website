<script setup lang="ts">

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

watch(
  () => props.program?.slug,
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
  <!-- Never v-if this: CardZoom's scroll lock and inert engage from its watcher on `open`, which never fires if it mounts already open. -->
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
