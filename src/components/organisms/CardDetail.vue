<script setup lang="ts">
/**
 * The enlarged card: one dialog for every kind and every surface.
 *
 * ALWAYS OPENS ON THE PRINTED CARD, whatever face the grid behind it is browsing.
 * NOTHING PRINTED ON THE CARD IS REPEATED BESIDE IT — the rows carry what the card does not print, and the printed wording stays in the DOM visually hidden for readers who cannot see the image.
 * No pager, deliberately: the pool is grouped, sortable and filterable, so "next" would mean something different after every control change.
 */
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseLink from '@/components/atoms/BaseLink.vue';
import FaceToggle from '@/components/atoms/FaceToggle.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
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
  }>(),
  { printing: null },
);

defineEmits<{ close: []; printing: [id: string] }>();

/* The face is dialog state, not an address: `?face=` belongs to the GRID behind it. Reset per card, or the next one opens showing something other than itself. */
const face = ref<'card' | 'art'>('card');
watch(
  () => props.row?.slug,
  () => {
    face.value = 'card';
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

/** The printed face, for readers who cannot see the image. Never rendered visibly. */
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
        :card-label="t('cardsPage.zoomFace.card')"
        :art-label="t('cardsPage.zoomFace.art')"
      />
    </template>

    <template #face>
      <div v-if="printings.length > 1" class="c-cdetail__printings">
        <MonoLabel tone="faint" as="span">{{ t('cardsPage.printings') }}</MonoLabel>
        <div class="c-cdetail__chips" role="group" :aria-label="t('cardsPage.printings')">
          <button
            v-for="option in printings"
            :key="option.id"
            type="button"
            class="c-cdetail__chip"
            :aria-pressed="option.id === active?.id"
            @click="$emit('printing', option.id)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

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
.c-cdetail__printings {
  margin-top: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  align-items: center;
}

.c-cdetail__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.c-cdetail__chip {
  min-height: 40px;
  padding-inline: var(--space-3);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink-soft);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  cursor: pointer;
}

.c-cdetail__chip[aria-pressed='true'] {
  border-color: var(--color-accent);
  background: var(--color-accent-wash);
  color: var(--color-ink);
}

.c-cdetail__exit {
  margin-top: var(--space-5);
}
</style>
