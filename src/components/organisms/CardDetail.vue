<script setup lang="ts">
/* NOTHING PRINTED ON THE CARD IS REPEATED BESIDE IT: the rows carry what the card does not print, and the printed wording stays in the DOM visually hidden for readers who cannot see the image. */
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseLink from '@/components/atoms/BaseLink.vue';
import FaceToggle from '@/components/atoms/FaceToggle.vue';
import PrintingChips from '@/components/molecules/PrintingChips.vue';
import CardZoom from '@/components/organisms/CardZoom.vue';
import type { ZoomRow } from '@/components/organisms/CardZoom.vue';
import { t } from '@/content';
import {
  linesOf,
  placeholderOf,
  printingsForRow,
  resolveRowPrinting,
  zoomKicker,
  zoomStats,
} from '@/site/cards';
import { to } from '@/site/links';
import type { CardRow } from '@/site/cards';

const props = withDefaults(
  defineProps<{
    open: boolean;
    row: CardRow | null;
    /** The `?printing=` the host page holds. Absent means the standard printing. */
    printing?: string | null;
    openFace?: 'card' | 'art';
  }>(),
  { printing: null, openFace: 'card' },
);

defineEmits<{ close: []; printing: [id: string] }>();

/* The face is dialog state, not an address: `?face=` belongs to the GRID behind it. */
const face = ref<'card' | 'art'>(props.openFace);
watch(
  [() => props.row?.slug, () => props.open],
  () => {
    if (props.open) face.value = props.openFace;
  },
);

const printings = computed(() => (props.row ? printingsForRow(props.row) : []));
const active = computed(() => (props.row ? resolveRowPrinting(props.row, props.printing) : null));

const blankArt = { src: null, alt: '' };

/* A printing overrides the pictures and the name, never the mechanics. */
const art = computed(() => {
  const chosen = active.value;
  if (chosen) return face.value === 'art' ? chosen.sceneArt : chosen.cardArt;
  return face.value === 'art' ? props.row?.sceneArt : props.row?.cardArt;
});

const name = computed(() => active.value?.name ?? props.row?.name ?? '');

const stats = computed<ZoomRow[]>(() => {
  const row = props.row;
  if (!row) return [];
  const rows = zoomStats(row, (brandId) => to('brand', { brandId }));
  const chosen = active.value;
  if (!chosen || printings.value.length < 2) return rows;
  /* The printing row states which face is on screen; the chips change it. */
  return [...rows, { label: t('cardsPage.stats.printing'), value: chosen.label }];
});

const hidden = computed(() => (props.row ? linesOf(props.row) : []));

const route = useRoute();
const router = useRouter();

/** One way out, chosen by kind. Suppressed when it resolves to the current page, where it would be a close button that pushes a history entry. */
const exit = computed(() => {
  const row = props.row;
  if (!row) return null;
  const target =
    row.kind === 'characters'
      ? { label: t('cardsPage.exit.character'), to: to('character', { characterId: row.slug }) }
      : row.kind === 'programs'
        ? { label: t('cardsPage.exit.brand'), to: to('brand', { brandId: row.brandIds[0] }) }
        : row.kind === 'architech'
          ? { label: t('cardsPage.exit.incursions'), to: to('incursions') }
          : { label: t('cardsPage.exit.rules'), to: to('rules') };
  return router.resolve(target.to).path === route.path ? null : target;
});
</script>

<template>
  <!-- Never v-if this: CardZoom's scroll lock, inert and focus hang off a watcher on `open`, which a component mounting already-open never fires. -->
  <CardZoom
    :open="open && Boolean(row)"
    :kicker="row ? zoomKicker(row) : ''"
    :name="name"
    :art="art ?? blankArt"
    :placeholder="row ? placeholderOf(row, face) : ''"
    :rows="stats"
    :errata-line="t('cardsPage.noErrata')"
    @close="$emit('close')"
  >
    <template #figure>
      <FaceToggle
        v-model="face"
        class="c-cdetail__face"
        :card-label="t('cardsPage.zoomFace.card')"
        :art-label="t('cardsPage.zoomFace.art')"
      />
    </template>

    <template #face>
      <PrintingChips
        class="c-cdetail__printings"
        :printings="printings"
        :active-id="active?.id ?? null"
        :label="t('cardsPage.printings')"
        @select="$emit('printing', $event)"
      />

      <div class="l-sr-only">
        <p v-for="line in hidden" :key="line.label">
          {{ line.label }}: {{ line.values.join('. ') }}
        </p>
      </div>
    </template>

    <template #links>
      <p v-if="exit" class="c-cdetail__exit">
        <BaseLink :to="exit.to">{{ exit.label }} →</BaseLink>
      </p>
    </template>
  </CardZoom>
</template>

<style>
.c-cdetail__face {
  margin-top: var(--space-4);
  max-width: 300px;
}

.c-cdetail__printings {
  margin-top: var(--space-4);
}

.c-cdetail__exit {
  margin-top: var(--space-5);
}
</style>
