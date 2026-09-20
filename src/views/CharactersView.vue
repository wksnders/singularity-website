<script setup lang="ts">
// Characters with no faction are exempt from the faction filter rather than excluded by it.
// TODO: should we offer a way to exclude them, question for design research.
import { computed, ref } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import EntityTile from '@/components/molecules/EntityTile.vue';
import FilterBar from '@/components/molecules/FilterBar.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { t } from '@/content';
import { brandsOf, characters, matchesFactionFilter } from '@/data/universe';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { provideSections } from '@/composables/useSections';
import { matchesQuery, nameHaystack, searchHaystack } from '@/site/cardText';
import { characterFactionOptions, factionTags } from '@/site/characters';
import { to } from '@/site/links';
import type { Character } from '@/data/types';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'characters', label: t('characters.sections.cast') },
]);

provideSections(sections);

const faction = useQueryFilter('faction');
const search = ref('');

const filterOptions = computed(() => characterFactionOptions(t('ia.universe.universal.label')));

const brandNames = (character: Character) => brandsOf(character).map((brand) => brand.name);

function badge(character: Character): string | undefined {
  if (character.factionIds === 'any') return t('characters.anyFactionBadge');
  return undefined;
}

function matches(character: Character, loose: boolean): boolean {
  const factionOk = matchesFactionFilter(character, faction.value.value);
  const query = search.value.trim().toLowerCase();
  /* HP is deliberately not indexed: the word is printed nowhere on the card, and a bare number would match every ability line containing it. */
  const haystack = searchHaystack([
    character.name,
    character.epithet,
    character.abilityName,
    character.abilityText,
    ...brandNames(character),
    t(`cards.sets.${character.set}`),
  ]);
  const searchOk = matchesQuery(
    haystack,
    query,
    nameHaystack([character.name, character.epithet, character.abilityName, ...brandNames(character)]),
    loose,
  );
  return factionOk && searchOk;
}

const strictShown = computed(() => characters.filter((c) => matches(c, false)));

/* A query matching no whole word widens to a substring pass, and stays empty unless that found something, so the faction filter emptying the grid is never blamed on the query. */
const looseShown = computed(() =>
  search.value.trim() && strictShown.value.length === 0
    ? characters.filter((c) => matches(c, true))
    : [],
);

const widened = computed(() => looseShown.value.length > 0);

const shown = computed(() => (widened.value ? looseShown.value : strictShown.value));

const countLabel = computed(() =>
  widened.value
    ? `${t('universe.characters.count')} · ${t('cardsPage.countWidened')}`
    : t('universe.characters.count'),
);

const tileQuery = computed(() =>
  faction.value.value ? { faction: faction.value.value } : undefined,
);

function clearAll(): void {
  faction.set(null);
  search.value = '';
}
</script>

<template>
  <SecondaryHero glow="70% 60% at 20% 0%" :note="t('characters.hero.pending')">
    <Breadcrumbs
      :crumbs="[
        { label: t('ia.universe.label'), to: to('universe') },
        { label: t('characters.hero.crumb') },
      ]"
    />
    <h1 class="l-page-title">{{ t('characters.hero.title') }}</h1>
    <p class="l-lede cast__lede">{{ t('characters.hero.lede') }}</p>
    <SectionIndex :sections="sections" />
  </SecondaryHero>

  <ScrollSpyRail :sections="sections" />

  <SectionBand id="characters" :heading="t('characters.sections.cast')">
    <MonoLabel tone="faint">{{ t('characters.note') }}</MonoLabel>

    <FilterBar
      :options="filterOptions"
      :active="faction.value.value"
      :count="shown.length"
      :count-label="countLabel"
      :all-label="t('characters.everyone')"
      :search="search"
      :search-label="t('characters.searchLabel')"
      :search-placeholder="t('characters.searchPlaceholder')"
      @toggle="faction.toggle($event)"
      @clear="faction.set(null)"
      @update:search="search = $event"
    />

    <p class="cast__canon">{{ t('characters.canonNote') }}</p>

    <div v-if="shown.length" class="l-grid l-grid--tiles">
      <EntityTile
        v-for="character in shown"
        :key="character.id"
        :to="to('character', { characterId: character.id }, { query: tileQuery })"
        :art="character.cardArt"
        :badge="badge(character)"
        :epithet="character.epithet"
        :name="character.name"
        :tags="factionTags(character)"
        :placeholder="t('character.cardArtPlaceholder')"
      />
    </div>

    <EmptyState
      v-else
      variant="noResults"
      :kicker="t('filters.noResults')"
      :title="t('characters.emptyTitle')"
      :body="t('characters.emptyBody')"
      :action-label="t('filters.clear')"
      @action="clearAll()"
    />

    <BandFoot :to="to('universal')" :label="t('characters.exitUniversal')" />
  </SectionBand>
</template>

<style>
.cast__lede {
  margin-top: var(--space-5);
}

.cast__canon {
  margin-top: var(--space-4);
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-faint);
}
</style>
