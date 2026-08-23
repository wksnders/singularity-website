<script setup lang="ts">
/**
 * CHARACTERS — the full cast index. Faction filter (in the URL), search over
 * name, epithet and ability, and a live count. Characters with no faction are
 * exempt from the filter rather than excluded by it. TODO: should we offer a 
 * way to exclude them, question for design research.
 */
import { computed, ref } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import EntityTile from '@/components/molecules/EntityTile.vue';
import FilterBar from '@/components/molecules/FilterBar.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { t } from '@/content';
import { brandById, characters, factionById, factions } from '@/data/universe';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { matchesQuery, searchHaystack } from '@/site/cardText';
import { to } from '@/site/links';
import type { Character } from '@/data/types';
import type { FilterOption } from '@/site/filters';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'cast', label: t('characters.sections.cast') },
]);

const faction = useQueryFilter('faction');
const search = ref('');

const filterOptions = computed<FilterOption[]>(() => [
  ...factions.map((f) => ({ id: f.id, label: f.name, color: f.color, showDot: true })),
  { id: 'unaligned', label: t('ia.universe.unaligned.label'), showDot: true, color: null },
]);

const tags = (character: Character) =>
  character.factionIds === 'any'
    ? [{ label: t('universe.anyFaction'), color: null }]
    : character.factionIds
        .map((id) => factionById(id))
        .filter((f): f is NonNullable<ReturnType<typeof factionById>> => Boolean(f))
        .map((f) => ({ label: f.name, color: f.color }));

/** Brands are a printed slot on the card, so they are searchable too. */
const brandNames = (character: Character) =>
  [...character.brandIds, ...(character.personalBrandId ? [character.personalBrandId] : [])]
    .map((id) => brandById(id)?.name)
    .filter(Boolean);

function badge(character: Character): string | undefined {
  if (character.factionIds === 'any') return t('characters.anyFactionBadge');
  return undefined;
}

function matches(character: Character): boolean {
  const active = faction.value.value;
  const factionOk =
    !active ||
    (active === 'unaligned'
      ? character.factionIds === 'any'
      : character.factionIds === 'any' || character.factionIds.includes(active));
  const query = search.value.trim().toLowerCase();
  /* Every printed slot except flavour, same rule as the card gallery: name,
     epithet, health, ability, the brands they play, set. Health is indexed WITH
     its label — "health 11", never a bare 11 — because a bare number matches
     every ability line containing it. */
  const haystack = searchHaystack([
    character.name,
    character.epithet,
    `${t('character.statHp')} ${character.hp}`,
    character.abilityName,
    character.abilityText,
    ...brandNames(character),
    t(`cards.sets.${character.set}`),
  ]);
  const searchOk = matchesQuery(haystack, query);
  return factionOk && searchOk;
}

const shown = computed(() => characters.filter(matches));

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
    <h1 class="cast__title">{{ t('characters.hero.title') }}</h1>
    <p class="cast__lede">{{ t('characters.hero.lede') }}</p>
    <SectionIndex :sections="sections" />
  </SecondaryHero>

  <ScrollSpyRail :sections="sections" />

  <section id="cast" tabindex="-1" class="l-band">
    <div class="l-wrap">
      <SectionMarker id="cast" :index="1" :total="1" :heading="t('characters.sections.cast')" />
      <MonoLabel tone="faint">{{ t('characters.note') }}</MonoLabel>

      <FilterBar
        class="cast__gap"
        :options="filterOptions"
        :active="faction.value.value"
        :count="shown.length"
        :count-label="t('universe.characters.count')"
        :all-label="t('characters.everyone')"
        :search="search"
        :search-label="t('characters.searchLabel')"
        :search-placeholder="t('characters.searchPlaceholder')"
        @toggle="faction.toggle($event)"
        @clear="faction.set(null)"
        @update:search="search = $event"
      />

      <p class="cast__canon">{{ t('characters.canonNote') }}</p>

      <div v-if="shown.length" class="l-grid l-grid--tiles cast__gap">
        <EntityTile
          v-for="character in shown"
          :key="character.id"
          :to="to('character', { characterId: character.id }, { query: tileQuery })"
          :art="character.cardArt"
          :badge="badge(character)"
          :epithet="character.epithet"
          :name="character.name"
          :tags="tags(character)"
          :placeholder="t('character.cardArtPlaceholder')"
        />
      </div>

      <EmptyState
        v-else
        class="cast__gap"
        variant="noResults"
        :kicker="t('filters.noResults')"
        :title="t('characters.emptyTitle')"
        :body="t('characters.emptyBody')"
        :action-label="t('filters.clear')"
        @action="clearAll()"
      />

      <BandFoot :to="to('unaligned')" :label="t('characters.exitUnaligned')" />
    </div>
  </section>
</template>

<style>
.cast__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
}

.cast__lede {
  margin-top: var(--space-5);
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.cast__canon {
  margin-top: var(--space-4);
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-faint);
}

.cast__gap {
  margin-top: var(--space-6);
}
</style>
