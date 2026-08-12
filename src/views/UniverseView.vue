<script setup lang="ts">
/**
 * UNIVERSE HUB — five deep-linkable bands: factions · characters · unaligned ·
 * incursions · cards. Carries the full wayfinding kit (header index, desktop
 * scroll-spy rail, per-band marker with a copyable anchor, band feet).
 */
import { computed, ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import EntityTile from '@/components/molecules/EntityTile.vue';
import FactionTile from '@/components/molecules/FactionTile.vue';
import FilterBar from '@/components/molecules/FilterBar.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { t } from '@/content';
import { characters, factionById, factions, game } from '@/data/universe';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { to } from '@/site/links';
import type { Character } from '@/data/types';
import type { FilterOption } from '@/site/filters';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'factions', label: t('universe.sections.factions') },
  { id: 'characters', label: t('universe.sections.characters') },
  { id: 'unaligned', label: t('universe.sections.unaligned') },
  { id: 'incursions', label: t('universe.sections.incursions') },
  { id: 'cards', label: t('universe.sections.cards') },
]);

const faction = useQueryFilter('faction');
const search = ref('');

const filterOptions = computed<FilterOption[]>(() => [
  ...factions.map((f) => ({ id: f.id, label: f.name, color: f.color, showDot: true })),
  { id: 'unaligned', label: t('universe.anyFaction'), showDot: true, color: null },
]);

const factionTags = (character: Character) =>
  character.factionIds === 'any'
    ? [{ label: t('universe.anyFaction'), color: null }]
    : character.factionIds
        .map((id) => factionById(id))
        .filter((f): f is NonNullable<ReturnType<typeof factionById>> => Boolean(f))
        .map((f) => ({ label: f.name, color: f.color }));

/** Any-faction characters are exempt from the faction filter, not excluded. */
function matchesFaction(character: Character): boolean {
  const active = faction.value.value;
  if (!active) return true;
  if (active === 'unaligned') return character.factionIds === 'any';
  return character.factionIds === 'any' || character.factionIds.includes(active);
}

function matchesSearch(character: Character): boolean {
  const query = search.value.trim().toLowerCase();
  if (!query) return true;
  return `${character.name} ${character.epithet}`.toLowerCase().includes(query);
}

const shownCast = computed(() => characters.filter((c) => matchesFaction(c) && matchesSearch(c)));
/** The hub shows a taste of the cast; the index page shows all of it. */
const castPreview = computed(() => shownCast.value.slice(0, 9));

const unaligned = computed(() => characters.filter((c) => c.factionIds === 'any').slice(0, 3));

function clearAll(): void {
  faction.set(null);
  search.value = '';
}
</script>

<template>
  <SecondaryHero glow="90% 70% at 78% 0%" :note="t('universe.hero.pending')">
    <Breadcrumbs :crumbs="[{ label: t('ia.universe.label') }]" />
    <h1 class="universe__title">{{ t('universe.hero.title') }}</h1>
    <p class="universe__lede">{{ t('universe.hero.lede') }}</p>
    <SectionIndex :sections="sections" />
  </SecondaryHero>

  <ScrollSpyRail :sections="sections" />

  <!-- 01 · factions -->
  <section id="factions" tabindex="-1" class="l-band">
    <div class="l-wrap">
      <SectionMarker id="factions" :index="1" :total="5" :heading="t('universe.sections.factions')" />
      <MonoLabel tone="faint">{{ t('universe.factions.note') }}</MonoLabel>
      <div class="l-grid universe__gap">
        <FactionTile
          v-for="f in factions"
          :key="f.id"
          :faction="f"
          :placeholder="t('universe.factionArtPlaceholder')"
        />
      </div>
      <BandFoot :to="{ hash: '#characters' }" :label="t('universe.factions.exit')" />
    </div>
  </section>

  <!-- 02 · characters -->
  <section id="characters" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <SectionMarker
        id="characters"
        :index="2"
        :total="5"
        :heading="t('universe.sections.characters')"
      />
      <MonoLabel tone="faint">{{ t('universe.characters.note') }}</MonoLabel>

      <FilterBar
        class="universe__gap"
        :options="filterOptions"
        :active="faction.value.value"
        :count="shownCast.length"
        :count-label="t('universe.characters.count')"
        :all-label="t('filters.all')"
        :search="search"
        :search-label="t('universe.characters.searchLabel')"
        :search-placeholder="t('universe.characters.searchPlaceholder')"
        @toggle="faction.toggle($event)"
        @clear="faction.set(null)"
        @update:search="search = $event"
      />

      <div v-if="castPreview.length" class="l-grid l-grid--tiles universe__gap">
        <EntityTile
          v-for="character in castPreview"
          :key="character.id"
          :to="to('character', { characterId: character.id })"
          :art="character.art"
          :epithet="character.epithet"
          :name="character.name"
          :tags="factionTags(character)"
          :placeholder="t('universe.artPlaceholder')"
        />
      </div>

      <EmptyState
        v-else
        class="universe__gap"
        variant="noResults"
        :kicker="t('filters.noResults')"
        :title="t('universe.characters.emptyTitle')"
        :body="t('universe.characters.emptyBody')"
        :action-label="t('filters.clear')"
        @action="clearAll()"
      />

      <div class="universe__reveal">
        <MonoLabel tone="faint">{{ t('universe.characters.revealNote') }}</MonoLabel>
        <UiButton variant="quiet" :to="to('characters')">
          {{ t('universe.characters.exitIndex') }}
        </UiButton>
      </div>

      <BandFoot :to="{ hash: '#unaligned' }" :label="t('universe.characters.exit')" />
    </div>
  </section>

  <!-- 03 · unaligned -->
  <section id="unaligned" tabindex="-1" class="l-band">
    <div class="l-wrap">
      <SectionMarker
        id="unaligned"
        :index="3"
        :total="5"
        :heading="t('universe.sections.unaligned')"
      />
      <MonoLabel tone="faint">{{ t('universe.unaligned.nameTbd') }}</MonoLabel>
      <p class="universe__body">{{ t('universe.unaligned.body') }}</p>

      <div class="l-grid l-grid--tiles universe__gap">
        <EntityTile
          v-for="character in unaligned"
          :key="character.id"
          :to="to('character', { characterId: character.id })"
          :art="character.art"
          :epithet="character.epithet"
          :name="character.name"
          :tags="factionTags(character)"
          :placeholder="t('universe.artPlaceholder')"
        />
      </div>

      <div class="universe__reveal">
        <UiButton variant="quiet" :to="to('unaligned')">{{ t('universe.unaligned.exitPage') }}</UiButton>
      </div>

      <BandFoot :to="{ hash: '#incursions' }" :label="t('universe.unaligned.exit')" />
    </div>
  </section>

  <!-- 04 · incursions -->
  <section id="incursions" tabindex="-1" class="l-band l-band--line-top universe__threat">
    <div class="l-wrap">
      <SectionMarker
        id="incursions"
        :index="4"
        :total="5"
        :heading="t('universe.sections.incursions')"
      />
      <span class="universe__badge">
        {{ t('ia.universe.incursions.label') }} · {{ game.incursionsPlayers }}
        {{ t('home.incursions.players') }}
      </span>
      <h3 class="universe__h3">{{ t('universe.incursions.title') }}</h3>
      <p class="universe__body">{{ t('universe.incursions.body') }}</p>
      <UiButton :to="to('incursions')" class="universe__gap">
        {{ t('universe.incursions.cta') }}
      </UiButton>
      <BandFoot :to="{ hash: '#cards' }" :label="t('universe.incursions.exit')" />
    </div>
  </section>

  <!-- 05 · card gallery -->
  <section id="cards" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <SectionMarker id="cards" :index="5" :total="5" :heading="t('universe.sections.cards')" />
      <div class="l-split">
        <div class="l-split__main">
          <p class="universe__body">{{ t('universe.cards.body') }}</p>
          <UiButton :to="to('cards')" class="universe__gap">{{ t('universe.cards.cta') }}</UiButton>
        </div>
        <div class="l-split__aside universe__cards">
          <ArtFrame
            v-for="n in 3"
            :key="n"
            :art="null"
            ratio="63 / 88"
            radius="s"
            :placeholder="t('cards.artPlaceholder')"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.universe__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
}

.universe__lede {
  margin-top: var(--space-5);
  max-width: 56ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.universe__body {
  margin-top: var(--space-4);
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.universe__h3 {
  margin-top: var(--space-4);
  font-size: clamp(1.375rem, 3.4vw, 2rem);
  max-width: 24ch;
}

.universe__gap {
  margin-top: var(--space-6);
}

.universe__reveal {
  margin-top: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  align-items: center;
  justify-content: space-between;
}

.universe__threat {
  --faction: var(--color-threat);
}

.universe__badge {
  display: inline-block;
  padding: 6px var(--space-3);
  border: 1px solid rgba(var(--rgb-threat), 0.65);
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  color: var(--color-threat-text);
  white-space: nowrap;
}

.universe__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  align-content: start;
}
</style>
