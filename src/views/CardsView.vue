<script setup lang="ts">
/**
 * CARD GALLERY — the printed card is the image; its wording is data. Search
 * reads the wording, which is the whole point: a rules lookup mid-game has to
 * find text, not a picture.
 */
import { computed, ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import FilterBar from '@/components/molecules/FilterBar.vue';
import ProgramCard from '@/components/molecules/ProgramCard.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { t } from '@/content';
import { brandById, factionById, factions, programs } from '@/data/universe';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { soon, to } from '@/site/links';
import type { Program } from '@/data/types';
import type { FilterOption } from '@/site/filters';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'gallery', label: t('cardsPage.sections.gallery') },
  { id: 'anatomy', label: t('cardsPage.sections.anatomy') },
]);

const faction = useQueryFilter('faction');
const search = ref('');

const filterOptions = computed<FilterOption[]>(() => [
  ...factions.map((f) => ({ id: f.id, label: f.name, color: f.color, showDot: true })),
  { id: 'unaligned', label: t('universe.anyFaction'), showDot: true, color: null },
]);

const brandOf = (program: Program) => brandById(program.brandId);
const factionOf = (program: Program) => {
  const brand = brandOf(program);
  return brand?.factionId ? factionById(brand.factionId) : null;
};

function matches(program: Program): boolean {
  const active = faction.value.value;
  const brand = brandOf(program);
  const factionOk =
    !active ||
    (active === 'unaligned' ? brand?.kind === 'personal' : brand?.factionId === active);
  const query = search.value.trim().toLowerCase();
  const searchOk =
    !query ||
    `${program.name} ${program.type} ${program.rules} ${program.flavour}`
      .toLowerCase()
      .includes(query);
  return factionOk && searchOk;
}

const shown = computed(() => programs.filter(matches));

/** The eight slots every program card carries, in printed order. */
const anatomy = computed(() =>
  ['name', 'cost', 'art', 'type', 'rules', 'flavour', 'brand', 'set'].map((key, index) => ({
    index: index + 1,
    title: t(`cardsPage.anatomy.${key}.title`),
    body: t(`cardsPage.anatomy.${key}.body`),
  })),
);

function clearAll(): void {
  faction.set(null);
  search.value = '';
}
</script>

<template>
  <SecondaryHero glow="60% 60% at 50% 0%" :note="t('cardsPage.hero.pending')">
    <Breadcrumbs
      :crumbs="[
        { label: t('ia.universe.label'), to: to('universe') },
        { label: t('ia.universe.cards.label') },
      ]"
    />
    <h1 class="cards__title">{{ t('cardsPage.hero.title') }}</h1>
    <p class="cards__lede">{{ t('cardsPage.hero.lede') }}</p>
    <SectionIndex :sections="sections" />
  </SecondaryHero>

  <ScrollSpyRail :sections="sections" />

  <section id="gallery" tabindex="-1" class="l-band">
    <div class="l-wrap">
      <SectionMarker
        id="gallery"
        :index="1"
        :total="2"
        :heading="t('cardsPage.sections.gallery')"
      />
      <MonoLabel tone="faint">{{ t('cardsPage.countNote') }}</MonoLabel>

      <FilterBar
        class="cards__gap"
        :options="filterOptions"
        :active="faction.value.value"
        :count="shown.length"
        :count-label="t('cardsPage.count')"
        :all-label="t('filters.all')"
        :search="search"
        :search-label="t('cardsPage.searchLabel')"
        :search-placeholder="t('characters.searchPlaceholder')"
        @toggle="faction.toggle($event)"
        @clear="faction.set(null)"
        @update:search="search = $event"
      />

      <p class="cards__note">{{ t('cardsPage.textNote') }}</p>

      <ul v-if="shown.length" class="cards__grid">
        <li v-for="program in shown" :key="program.id">
          <ProgramCard
            :program="program"
            :brand-label="brandOf(program)?.name"
            :color="factionOf(program)?.color"
          />
        </li>
      </ul>

      <EmptyState
        v-else
        class="cards__gap"
        variant="noResults"
        :kicker="t('filters.noResults')"
        :title="t('cardsPage.emptyTitle')"
        :body="t('cardsPage.emptyBody')"
        :action-label="t('filters.clear')"
        @action="clearAll()"
      />

      <BandFoot :to="soon('#errata')" :label="t('cardsPage.exitErrata')" />
    </div>
  </section>

  <section id="anatomy" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <SectionMarker
        id="anatomy"
        :index="2"
        :total="2"
        :heading="t('cardsPage.sections.anatomy')"
      />
      <MonoLabel tone="faint">{{ t('cardsPage.anatomyNote') }}</MonoLabel>

      <div class="l-split cards__gap">
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
          <p class="cards__body">{{ t('cardsPage.anatomyBody') }}</p>
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
    </div>
  </section>
</template>

<style>
.cards__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
}

.cards__lede,
.cards__body {
  margin-top: var(--space-5);
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.cards__note {
  margin-top: var(--space-4);
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-faint);
}

.cards__gap {
  margin-top: var(--space-6);
}

.cards__grid {
  margin-top: var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-6) var(--space-4);
  list-style: none;
}

.cards__diagram {
  flex: 0 1 300px;
}

.cards__frame {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  aspect-ratio: 63 / 88;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-m);
  background: var(--color-surface-raised);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: 0.1em;
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
</style>
