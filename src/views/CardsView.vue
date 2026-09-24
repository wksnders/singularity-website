<script setup lang="ts">
/* Every control is in the URL (see `useCardDb`), and the column count is CSS rather than a resize listener. */
import { computed, onMounted, ref, watch } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import FaceToggle from '@/components/atoms/FaceToggle.vue';
import FilterChip from '@/components/atoms/FilterChip.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import CardTile from '@/components/molecules/CardTile.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import MissingCardNote from '@/components/molecules/MissingCardNote.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import CardDetail from '@/components/organisms/CardDetail.vue';
import { t } from '@/content';
import { useCardDb } from '@/composables/useCardDb';
import { provideSections } from '@/composables/useSections';
import { useSlashFocus } from '@/composables/useSlashFocus';
import {
  ALL,
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
import { soon, to } from '@/site/links';
import type { FacetKey, SortKey } from '@/site/cards';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'gallery', label: t('cardsPage.sections.gallery') },
  { id: 'anatomy', label: t('cardsPage.sections.anatomy') },
]);

provideSections(sections);

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

/* AN ACTIVE FACET IS NEVER HIDDEN, even collapsed, or the grid is filtered with no visible cause and nothing but the blanket Clear to undo it. */
const visibleGroups = computed(() =>
  groups.value.filter(
    (group) =>
      moreOpen.value || !EXTRA_FACETS.includes(group.key) || db.facets.value[group.key] !== ALL,
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

function onFacet(key: FacetKey, id: string): void {
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

/** Slot order must match the printed 1-8 numbering of the anatomy diagram below. */
const anatomy = computed(() =>
  ['name', 'cost', 'art', 'type', 'rules', 'flavour', 'brand', 'set'].map((key, index) => ({
    index: index + 1,
    title: t(`cardsPage.anatomy.${key}.title`),
    body: t(`cardsPage.anatomy.${key}.body`),
  })),
);
</script>

<template>
  <SecondaryHero glow="90% 70% at 16% 0%" :note="t('cardsPage.hero.pending')">
    <Breadcrumbs
      :crumbs="[
        { label: t('ia.universe.label'), to: to('universe') },
        { label: t('ia.universe.cards.label') },
      ]"
    />
    <div class="cards__head">
      <div class="cards__head-main">
        <MonoLabel tone="accent">{{ t('ia.universe.cards.label') }}</MonoLabel>
        <h1 class="l-page-title cards__title">{{ t('cardsPage.hero.title') }}</h1>
      </div>
      <p class="l-lede cards__lede">{{ t('cardsPage.hero.lede') }}</p>
    </div>
    <SectionIndex :sections="sections" />
  </SecondaryHero>

  <ScrollSpyRail :sections="sections" />

  <SectionBand id="gallery" :heading="t('cardsPage.sections.gallery')">
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

      <FaceToggle
        class="cards__face"
        :model-value="db.face.value"
        :card-label="t('cardsPage.face.card')"
        :art-label="t('cardsPage.face.art')"
        @update:model-value="db.setFace($event)"
      />

      <div class="l-row" role="group" :aria-label="t('cardsPage.sortLabel')">
        <MonoLabel tone="muted" as="span">{{ t('cardsPage.sortLabel') }}</MonoLabel>
        <button
          v-for="option in SORTS"
          :key="option"
          type="button"
          class="cards__sort-btn"
          :aria-current="db.sort.value === option ? 'true' : undefined"
          @click="db.setSort(option)"
        >
          {{ sortLabel(option) }}
        </button>
      </div>
    </div>

    <MissingCardNote :slug="db.card.missing.value" @dismiss="db.card.dismissMissing()" />

    <div class="cards__facets">
      <div v-for="group in visibleGroups" :key="group.key" class="cards__facet" role="group" :aria-label="group.aria">
        <MonoLabel tone="faint" as="span" class="cards__facet-label">{{ group.label }}</MonoLabel>
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
      <UiButton variant="text" :aria-expanded="moreOpen" @click="moreOpen = !moreOpen">
        {{ moreOpen ? t('cardsPage.fewerFilters') : t('cardsPage.moreFilters') }}
      </UiButton>
      <MonoLabel tone="muted" as="span" class="cards__count" aria-live="polite">
        {{ countLabel }}
      </MonoLabel>
      <UiButton v-if="filtered" variant="text" @click="resetAll()">
        {{ t('filters.clear') }}
      </UiButton>
    </div>

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
  </SectionBand>

  <SectionBand
    id="anatomy"
    class="l-band--alt l-band--line-top"
    :heading="t('cardsPage.sections.anatomy')"
  >
    <MonoLabel tone="faint">{{ t('cardsPage.anatomyNote') }}</MonoLabel>

    <div class="l-split">
      <div class="l-split__main cards__diagram">
        <article class="cards__frame">
          <div class="cards__frame-row">
            <span>1 · {{ t('cardsPage.anatomy.name.title') }}</span>
            <span>2</span>
          </div>
          <ArtFrame
            :art="null"
            ratio="4 / 3"
            radius="s"
            :placeholder="`3 · ${t('cardsPage.anatomy.art.title')}`"
          />
          <p class="cards__frame-type">4 · {{ t('cardsPage.anatomy.type.title') }}</p>
          <div class="cards__frame-text">
            <span>5 · {{ t('cardsPage.anatomy.rules.title') }}</span>
            <span>6 · {{ t('cardsPage.anatomy.flavour.title') }}</span>
          </div>
          <div class="cards__frame-row">
            <span>7 · {{ t('cardsPage.anatomy.brand.title') }}</span>
            <span>8 · {{ t('cardsPage.anatomy.set.title') }}</span>
          </div>
        </article>
      </div>

      <div class="l-split__aside">
        <p class="l-lede cards__body">{{ t('cardsPage.anatomyBody') }}</p>
        <ol class="cards__slots">
          <li v-for="slot in anatomy" :key="slot.index">
            <span class="cards__slot-index">{{ slot.index }}</span>
            <span>
              <span class="cards__slot-title">{{ slot.title }}</span>
              <span class="cards__slot-body">{{ slot.body }}</span>
            </span>
          </li>
        </ol>
        <MonoLabel tone="faint">{{ t('cardsPage.sleeves') }}</MonoLabel>
        <MonoLabel tone="faint" class="cards__pending">{{ t('cardsPage.framePending') }}</MonoLabel>
      </div>
    </div>

    <BandFoot :to="to('learn')" :label="t('cardsPage.exitLearn')" />
  </SectionBand>

  <CardDetail
    :open="db.card.open.value"
    :row="activeRow"
    :printing="db.card.printing.value"
    @close="db.card.close()"
    @printing="db.card.setPrinting($event)"
  />
</template>

<style>
.cards__lede,
.cards__body {
  margin-top: var(--space-5);
}

.cards__diagram {
  flex: 0 1 300px;
}

.cards__frame {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  aspect-ratio: var(--ratio-card);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-m);
  background: var(--color-surface-raised);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono-tight);
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.cards__frame-row,
.cards__frame-text {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.cards__frame-text {
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-2);
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-s);
}

.cards__frame-type {
  padding-block: var(--space-1);
  border-block: 1px solid var(--color-line);
}

.cards__slots {
  margin-top: var(--space-6);
  display: grid;
  gap: var(--space-3);
  list-style: none;
}

.cards__slots li {
  display: flex;
  gap: var(--space-3);
}

.cards__slot-index {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-line-strong);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  color: var(--color-ink-muted);
}

.cards__slot-title {
  display: block;
  font-size: var(--size-m);
  font-weight: 500;
}

.cards__slot-body {
  display: block;
  margin-top: 2px;
  font-size: var(--size-mono-m);
  line-height: 1.5;
  color: var(--color-ink-faint);
}

.cards__pending {
  display: block;
  margin-top: var(--space-2);
}

.cards__head {
  margin-top: var(--space-5);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-10);
  align-items: flex-end;
  justify-content: space-between;
}

.cards__head-main {
  flex: 1 1 380px;
  min-width: 0;
}

.cards__head .cards__title {
  margin-top: var(--space-2);
}

.cards__head .cards__lede {
  flex: 1 1 320px;
  margin-top: 0;
  max-width: 52ch;
}

.cards__face {
  margin-top: var(--space-4);
  max-width: 300px;
}

.cards__tools {
  margin-top: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.cards__search {
  position: relative;
  flex: 1 1 280px;
  max-width: 560px;
}

.cards__search-input {
  width: 100%;
  min-height: 52px;
  padding: 0 52px 0 var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  font-size: var(--size-body);
}

.cards__key {
  position: absolute;
  top: 50%;
  right: var(--space-4);
  transform: translateY(-50%);
  padding: 3px 7px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-s);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  color: var(--color-ink-faint);
}

.cards__sort-btn {
  min-height: 44px;
  padding: 0 2px;
  border: 0;
  background: none;
  color: var(--color-ink-faint);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  cursor: pointer;
}

.cards__sort-btn[aria-current] {
  color: var(--color-ink);
}

.cards__sort-btn:hover {
  color: var(--color-accent-text);
}

.cards__facets {
  margin-top: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cards__facet {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  align-items: baseline;
}

.cards__facet-label {
  flex: 0 0 92px;
}

.cards__facet-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  min-width: 0;
}

.cards__meta {
  margin-top: var(--space-4);
  padding-top: var(--space-2);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.cards__count {
  margin-left: auto;
}

/* THREE IS THE CEILING, not the design's six: the content column is capped at `--width-content`, so the column count IS the card size. A fourth needs the wrap widened, which `ScrollSpyRail` hard-codes a breakpoint against. */
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
