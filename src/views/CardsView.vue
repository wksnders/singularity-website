<script setup lang="ts">
/* Every control is in the URL (see `useCardDb`), and the column count is CSS rather than a resize listener. */
import { computed, onMounted, ref, watch } from 'vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import FaceToggle from '@/components/atoms/FaceToggle.vue';
import FilterChip from '@/components/atoms/FilterChip.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import CardTile from '@/components/molecules/CardTile.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import MissingCardNote from '@/components/molecules/MissingCardNote.vue';
import CardsHero from '@/components/organisms/CardsHero.vue';
import CardDetail from '@/components/organisms/CardDetail.vue';
import { t } from '@/content';
import { useCardDb } from '@/composables/useCardDb';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { useSlashFocus } from '@/composables/useSlashFocus';
import {
  ALL,
  CARD_TILE_SIZES,
  EXTRA_FACETS,
  PRINTED_TOTAL,
  SORTS,
  TRANSCRIBED_TOTAL,
  cardBySlug,
  cardRows,
  facetGroups,
  isDefault,
  matches,
  sortRows,
} from '@/site/cards';
import { asset, pictureSources, soon, to } from '@/site/links';
import type { FacetKey, SortKey } from '@/site/cards';

const OVERLAP = 64;

/* Shares files with the grid; the first eight are its first two desktop rows. */
const WALL_SIZE = 22;
const WALL_INITIAL = 8;
const wallCards = cardRows
  .flatMap((row) =>
    row.cardArt.src ? [{ src: asset(row.cardArt.src), sources: pictureSources(row.cardArt.src) }] : [],
  )
  .slice(0, WALL_SIZE);

const db = useCardDb({ isKnown: (slug) => Boolean(cardBySlug(slug)) });

/* The field is local so a keystroke never waits on a router round trip; the URL follows it, and follows back if the query changes elsewhere. */
const searchText = ref(db.query.value);
watch(searchText, (value) => {
  if (value !== db.query.value) db.setQuery(value);
});
watch(db.query, (value) => {
  if (value !== searchText.value) searchText.value = value;
});

const searchField = ref<HTMLInputElement | null>(null);
const moreOpen = ref(false);

/* The FIELD is the source of truth for what is shown, not the URL: routing is async, so filtering off `db.query` would leave the grid one keystroke behind. */
const strictRows = computed(() =>
  cardRows.filter((row) => matches(row, db.facets.value, searchText.value)),
);

/* A query matching no whole word widens to the old substring pass rather than dead-ending, and stays empty unless that found something, so a facet emptying the grid is never blamed on the query. */
const looseRows = computed(() =>
  searchText.value.trim() && strictRows.value.length === 0
    ? cardRows.filter((row) => matches(row, db.facets.value, searchText.value, true))
    : [],
);

const widened = computed(() => looseRows.value.length > 0);

const shown = computed(() =>
  sortRows(widened.value ? looseRows.value : strictRows.value, db.sort.value),
);

const groups = computed(() => facetGroups(db.facets.value, searchText.value, widened.value));

const phone = useMediaQuery('(max-width: 599.98px)');
const extraFacets = computed<FacetKey[]>(() => (phone.value ? [...EXTRA_FACETS, 'box'] : EXTRA_FACETS));

/* AN ACTIVE FACET IS NEVER HIDDEN, even collapsed, or the grid is filtered with no visible cause and nothing but the blanket Clear to undo it. */
/* A folded row stays until the panel next collapses, so clearing doesn't remove the chip being tapped. */
const pinned = ref<FacetKey[]>([]);
watch(moreOpen, () => (pinned.value = []));

const visibleGroups = computed(() =>
  groups.value.filter(
    (group) =>
      moreOpen.value ||
      !extraFacets.value.includes(group.key) ||
      db.facets.value[group.key] !== ALL ||
      pinned.value.includes(group.key),
  ),
);

const activeRow = computed(() => (db.card.slug.value ? cardBySlug(db.card.slug.value) : null));

const filtered = computed(() => !isDefault(db.facets.value) || Boolean(searchText.value.trim()));
const countLabel = computed(() => {
  const n = shown.value.length;
  const base = n === 1 ? t('cardsPage.countOne') : `${n} ${t('cardsPage.countMany')}`;
  const notes = [
    filtered.value ? t('cardsPage.countFiltered') : '',
    widened.value ? t('cardsPage.countWidened') : '',
  ].filter(Boolean);
  return [base, ...notes].join(' · ');
});

const footnote = computed(() =>
  t('cardsPage.footnote')
    .replace('{shown}', String(TRANSCRIBED_TOTAL))
    .replace('{total}', String(PRINTED_TOTAL)),
);

const sortLabel = (key: SortKey) => t(`cardsPage.sorts.${key}`);

function onSortPick(event: Event): void {
  db.setSort((event.target as HTMLSelectElement).value as SortKey);
}

function onFacet(key: FacetKey, id: string): void {
  if (!moreOpen.value && extraFacets.value.includes(key) && !pinned.value.includes(key)) {
    pinned.value = [...pinned.value, key];
  }
  db.setFacet(key, id);
}

function resetAll(): void {
  searchText.value = '';
  db.reset();
}

/* Here `/` also selects what is already typed: the database's search is usually replaced, not extended. */
useSlashFocus(
  () => {
    searchField.value?.select();
    return searchField.value;
  },
  { enabled: () => !db.card.open.value },
);

onMounted(() => {
  /* A shared link can arrive with a hidden facet already set; leaving the disclosure shut would show a filtered grid with no visible cause. */
  moreOpen.value = EXTRA_FACETS.some((key) => db.facets.value[key] !== ALL);
});
</script>

<template>
  <CardsHero
    :cards="wallCards"
    :initial="WALL_INITIAL"
    :sizes="CARD_TILE_SIZES"
    :title="t('cardsPage.hero.title')"
    :overlap="OVERLAP"
  />

  <section
    id="gallery"
    tabindex="-1"
    class="l-wrap cards__gallery"
    :style="{ '--cards-overlap': `${OVERLAP}px` }"
  >
    <div class="cards__bar">
      <div class="cards__tools">
        <div class="cards__search">
          <label class="l-sr-only" for="card-search">{{ t('cardsPage.searchLabel') }}</label>
          <input
            id="card-search"
            ref="searchField"
            v-model="searchText"
            type="search"
            class="cards__search-input"
            :placeholder="t('cardsPage.searchPlaceholder')"
          />
          <span class="cards__key" aria-hidden="true">/</span>
        </div>

        <div class="cards__sort" role="group" :aria-label="t('cardsPage.sortLabel')">
          <MonoLabel tone="muted" as="span">{{ t('cardsPage.sortLabel') }}</MonoLabel>
          <button
            v-for="option in SORTS"
            :key="option"
            type="button"
            class="cards__sort-btn"
            :aria-pressed="db.sort.value === option"
            @click="db.setSort(option)"
          >
            {{ sortLabel(option) }}
          </button>
        </div>

        <div class="cards__sort-pick">
          <span class="cards__sort-pick-text" aria-hidden="true">
            <span class="cards__sort-pick-label">{{ t('cardsPage.sortLabel') }}</span>
            <span class="cards__sort-pick-value">{{ sortLabel(db.sort.value) }}</span> ▾
          </span>
          <select
            class="cards__sort-select"
            :aria-label="t('cardsPage.sortLabel')"
            :value="db.sort.value"
            @change="onSortPick"
          >
            <option v-for="option in SORTS" :key="option" :value="option">
              {{ sortLabel(option) }}
            </option>
          </select>
        </div>

        <FaceToggle
          class="cards__face"
          role="group"
          :aria-label="t('cardsPage.faceLabel')"
          :model-value="db.face.value"
          :card-label="t('cardsPage.face.card')"
          :art-label="t('cardsPage.face.art')"
          @update:model-value="db.setFace($event)"
        />
      </div>

      <div class="cards__facets">
        <div v-for="group in visibleGroups" :key="group.key" class="cards__facet" role="group" :aria-label="group.aria">
          <span class="cards__facet-label">{{ group.label }}</span>
          <div class="cards__facet-options">
            <FilterChip
              v-for="option in group.options"
              :key="option.id"
              :active="option.on"
              :color="option.color"
              :icon="option.icon"
              :show-dot="option.showDot"
              :count="option.count"
              @toggle="onFacet(group.key, option.id)"
            >
              {{ option.label }}
            </FilterChip>
          </div>
        </div>
      </div>

      <div class="cards__meta">
        <UiButton variant="text" class="cards__meta-btn" :aria-expanded="moreOpen" @click="moreOpen = !moreOpen">
          <template v-if="moreOpen">{{ t('cardsPage.fewerFilters') }}</template>
          <template v-else>
            <span class="cards__more-long">{{ t('cardsPage.moreFilters') }}</span>
            <span class="cards__more-short">{{ t('cardsPage.moreFiltersShort') }}</span>
          </template>
        </UiButton>
        <UiButton v-if="filtered" variant="text" class="cards__meta-btn" @click="resetAll()">
          {{ t('filters.clear') }}
        </UiButton>
        <span class="cards__count" aria-live="polite">{{ countLabel }}</span>
      </div>
    </div>

    <MissingCardNote :slug="db.card.missing.value" @dismiss="db.card.dismissMissing()" />

    <div
      v-if="shown.length"
      class="cards__grid"
      :class="db.face.value === 'art' ? 'cards__grid--ragged' : 'cards__grid--even'"
    >
      <CardTile
        v-for="row in shown"
        :key="row.slug"
        :row="row"
        :face="db.face.value"
        @select="db.card.openCard(row.slug)"
      />
    </div>

    <EmptyState
      v-else
      variant="noResults"
      :kicker="t('filters.noResults')"
      :title="t('cardsPage.emptyTitle')"
      :body="t('cardsPage.emptyBody')"
      :action-label="t('filters.clear')"
      @action="resetAll()"
    />

    <div class="cards__foot">
      <p class="cards__foot-note">{{ footnote }}</p>
      <p class="cards__foot-links">
        <BaseLink :to="soon('#errata')">{{ t('cardsPage.exitErrata') }} →</BaseLink>
        <BaseLink :to="to('rules')">{{ t('cardsPage.exitKeywords') }} →</BaseLink>
      </p>
    </div>
  </section>

  <CardDetail
    :open="db.card.open.value"
    :row="activeRow"
    :printing="db.card.printing.value"
    @close="db.card.close()"
    @printing="db.card.setPrinting($event)"
  />
</template>

<style>
.cards__gallery {
  position: relative;
  max-width: 1400px;
  padding-bottom: var(--band-y);
}

.cards__gallery .c-missing-card,
.cards__gallery .c-empty {
  margin-top: var(--space-6);
}

.cards__bar {
  margin-top: calc(var(--cards-overlap) * -1);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid rgba(var(--rgb-ink), 0.14);
  border-radius: 18px;
  background: rgba(var(--rgb-surface), 0.94);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.cards__tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) 18px;
  align-items: center;
}

.cards__search {
  position: relative;
  flex: 1 1 100%;
  min-width: 0;
}

.cards__search-input {
  width: 100%;
  min-height: 52px;
  padding: 0 20px;
  border: 1px solid rgba(var(--rgb-accent), 0.5);
  border-radius: var(--radius-pill);
  background: var(--color-bg-alt);
  color: var(--color-ink);
  font: inherit;
  font-size: var(--size-body);
}

.cards__key {
  display: none;
  position: absolute;
  top: 50%;
  right: var(--space-4);
  transform: translateY(-50%);
  padding: 3px 7px;
  border: 1px solid rgba(var(--rgb-ink), 0.24);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  color: rgba(var(--rgb-ink), 0.5);
}

.cards__sort {
  flex: 0 1 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: var(--space-3);
  min-width: 0;
}

.cards__sort-btn {
  min-height: 44px;
  padding: 0 2px;
  border: 0;
  background: none;
  color: rgba(var(--rgb-ink), 0.5);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: var(--track-mono-tight);
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
}

.cards__sort-btn[aria-pressed='true'] {
  color: var(--color-ink);
}

.cards__sort-btn:hover {
  color: var(--color-accent-text);
}

.cards__sort-pick {
  position: relative;
  display: none;
  flex: 0 1 auto;
  align-items: center;
  min-width: 0;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid rgba(var(--rgb-ink), 0.24);
  border-radius: var(--radius-pill);
}

.cards__sort-pick:has(.cards__sort-select:focus-visible) {
  box-shadow:
    0 0 0 2px var(--color-bg),
    0 0 0 4px var(--color-accent);
}

.cards__sort-pick-text {
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: var(--track-mono-tight);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--color-ink);
}

.cards__sort-pick-label {
  margin-right: 6px;
  color: var(--color-ink-soft);
}

/* Invisible over the pill; `--size-field` stops iOS Safari zooming. */
.cards__sort-select {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  font-size: var(--size-field);
  cursor: pointer;
}

@media (max-width: 599.98px) {
  .cards__sort {
    display: none;
  }

  .cards__sort-pick {
    display: flex;
  }
}

/* Too narrow for the value; the picker still names it. */
@media (max-width: 359.98px) {
  .cards__sort-pick-value {
    display: none;
  }
}

.cards__bar .cards__face {
  flex: 0 0 auto;
  max-width: 100%;
  margin-left: auto;
  border-color: rgba(var(--rgb-ink), 0.24);
}

.cards__face .c-face-toggle__btn {
  flex: 0 0 auto;
  padding-inline: var(--space-4);
  white-space: nowrap;
}

.cards__facets {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cards__facet {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cards__facet-label {
  flex: 0 0 auto;
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(var(--rgb-ink), 0.5);
}

/* The padding keeps the focus ring inside the scroller's clip. */
.cards__facet-options {
  display: flex;
  gap: var(--space-2);
  min-width: 0;
  margin: -4px;
  padding: 4px;
  overflow-x: auto;
  scroll-padding-inline: 4px;
  scrollbar-width: none;
}

.cards__facet-options .c-chip {
  flex: 0 0 auto;
}

.cards__meta {
  padding-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) 20px;
  align-items: center;
  border-top: 1px solid rgba(var(--rgb-ink), 0.08);
}

.cards__meta .cards__meta-btn {
  max-width: 100%;
  color: var(--color-accent-text);
  font-family: var(--font-body);
  font-size: var(--size-body-s);
  letter-spacing: normal;
  text-align: left;
  text-transform: none;
  white-space: normal;
}

.cards__more-long {
  display: none;
}

.cards__meta .cards__meta-btn:hover {
  color: var(--color-ink);
}

.cards__count {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: var(--track-mono-tight);
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

@media (min-width: 900px) {
  .cards__bar {
    padding: 16px 20px;
    border-radius: var(--radius-l);
  }

  .cards__search {
    flex-basis: 280px;
  }

  .cards__search-input {
    padding-right: 52px;
  }

  .cards__key {
    display: block;
  }

  .cards__bar .cards__face {
    margin-left: 0;
  }

  .cards__facet {
    flex-direction: row;
    gap: var(--space-2) var(--space-3);
    align-items: center;
  }

  .cards__facet-label {
    width: 108px;
  }

  .cards__facet-options {
    flex: 1 1 0;
    flex-wrap: wrap;
    margin: 0;
    padding: 0;
    overflow-x: visible;
  }

  .cards__more-long {
    display: inline;
  }

  .cards__more-short {
    display: none;
  }
}

.cards__grid {
  margin-top: var(--space-6);
}

/* Every printed card is 63/88, so the default face gets a real grid: nothing for multi-column to pack, and DOM order stays reading order so Tab and a screen reader follow the chosen sort. */
.cards__grid--even {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5) var(--space-4);
}

/* Art is the opt-in face and keeps each tile's own height, which only multi-column can pack. Reading order running DOWN each column is the price, and it is confined to this face. */
.cards__grid--ragged {
  columns: 2;
  column-gap: var(--space-4);
}

.cards__grid--ragged .c-ctile {
  margin-bottom: var(--space-5);
}

@media (min-width: 760px) {
  .cards__grid--even {
    grid-template-columns: repeat(3, 1fr);
  }

  .cards__grid--ragged {
    columns: 3;
  }
}

@media (min-width: 1360px) {
  .cards__grid--even {
    grid-template-columns: repeat(4, 1fr);
  }

  .cards__grid--ragged {
    columns: 4;
  }
}

.cards__foot {
  margin-top: var(--space-8);
  padding-top: var(--space-5);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  align-items: baseline;
  justify-content: space-between;
  border-top: 1px solid var(--color-line);
}

.cards__foot-note {
  max-width: 60ch;
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  line-height: 1.7;
  color: var(--color-ink-faint);
}

.cards__foot-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  font-size: var(--size-m);
}
</style>
