<script setup lang="ts">

import { computed, ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
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
  { id: 'world', label: t('universe.sections.world') },
  { id: 'factions', label: t('universe.sections.factions') },
  { id: 'characters', label: t('universe.sections.characters') },
  { id: 'universal', label: t('universe.sections.universal') },
  { id: 'incursions', label: t('universe.sections.incursions') },
  { id: 'cards', label: t('universe.sections.cards') },
]);

const bridgeRows = computed(() =>
  ['character', 'program', 'brand'].map((key) => ({
    key,
    title: t(`universe.world.bridge.${key}.title`),
    world: t(`universe.world.bridge.${key}.world`),
    table: t(`universe.world.bridge.${key}.table`),
  })),
);

const lexicon = computed(() =>
  [
    'autumnNetwork',
    'soulCode',
    'oldCode',
    'singularity',
    'fragments',
    'fractalSea',
    'brokenHeap',
    'rogueAi',
  ].map((key) => ({
    key,
    title: t(`universe.lexicon.${key}.title`),
    body: t(`universe.lexicon.${key}.body`),
  })),
);

const faction = useQueryFilter('faction');
const search = ref('');

const filterOptions = computed<FilterOption[]>(() => [
  ...factions.map((f) => ({ id: f.id, label: f.name, color: f.color, showDot: true })),
  { id: 'universal', label: t('universe.anyFaction'), showDot: true, color: null },
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
  if (active === 'universal') return character.factionIds === 'any';
  return character.factionIds === 'any' || character.factionIds.includes(active);
}

function matchesSearch(character: Character): boolean {
  const query = search.value.trim().toLowerCase();
  if (!query) return true;
  return `${character.name} ${character.epithet}`.toLowerCase().includes(query);
}

const shownCast = computed(() => characters.filter((c) => matchesFaction(c) && matchesSearch(c)));

const castPreview = computed(() => shownCast.value.slice(0, 9));

const universal = computed(() => characters.filter((c) => c.factionIds === 'any').slice(0, 3));

function clearAll(): void {
  faction.set(null);
  search.value = '';
}
</script>

<template>
  <SecondaryHero glow="90% 70% at 78% 0%" :note="t('universe.hero.pending')">
    <MonoLabel tone="faint">{{ t('universe.hero.kicker') }}</MonoLabel>
    <h1 class="universe__title">{{ t('universe.hero.title') }}</h1>
    <p class="universe__lede">{{ t('universe.hero.lede') }}</p>
    <SectionIndex :sections="sections" />
  </SecondaryHero>

  <ScrollSpyRail :sections="sections" />

  <section id="world" tabindex="-1" class="l-band">
    <div class="l-wrap">
      <SectionMarker id="world" :index="1" :total="6" :heading="t('universe.sections.world')" />
      <p class="universe__standfirst">{{ t('universe.world.standfirst') }}</p>

      <div class="universe__beats">
        <p class="universe__body">{{ t('universe.world.body1') }}</p>

        <ArtFrame
          :art="null"
          ratio="21 / 9"
          radius="l"
          class="universe__plate"
          :placeholder="t('universe.world.platePlaceholder')"
        />
        <MonoLabel tone="faint">{{ t('universe.world.platePending') }}</MonoLabel>

        <p class="universe__body">{{ t('universe.world.body2') }}</p>
        <p class="universe__body">{{ t('universe.world.body3') }}</p>
        <p class="universe__body">{{ t('universe.world.body4') }}</p>

        <ArtFrame
          :art="null"
          ratio="4 / 5"
          radius="m"
          class="universe__relic"
          :placeholder="t('universe.world.relicPlaceholder')"
        />
        <MonoLabel tone="faint">{{ t('universe.world.relicPending') }}</MonoLabel>

        <p class="universe__body">{{ t('universe.world.body5') }}</p>
      </div>

      <p class="universe__closer">{{ t('universe.world.closer') }}</p>

      <div class="universe__bridge">
        <MonoLabel tone="faint">{{ t('universe.world.bridge.kicker') }}</MonoLabel>
        <div class="l-grid universe__gap">
          <article v-for="row in bridgeRows" :key="row.key" class="universe__bridge-row">
            <h3 class="universe__bridge-title">{{ row.title }}</h3>
            <MonoLabel tone="faint">{{ t('universe.world.bridge.worldLabel') }}</MonoLabel>
            <p class="universe__bridge-body">{{ row.world }}</p>
            <MonoLabel tone="faint">{{ t('universe.world.bridge.tableLabel') }}</MonoLabel>
            <p class="universe__bridge-body">{{ row.table }}</p>
          </article>
        </div>
      </div>

      <BandFoot :to="{ hash: '#factions' }" :label="t('universe.world.exit')" />
    </div>
  </section>

  <section id="factions" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <SectionMarker id="factions" :index="2" :total="6" :heading="t('universe.sections.factions')" />
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

  <section id="characters" tabindex="-1" class="l-band l-band--line-top">
    <div class="l-wrap">
      <SectionMarker
        id="characters"
        :index="3"
        :total="6"
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
          :art="character.cardArt"
          :epithet="character.epithet"
          :name="character.name"
          :tags="factionTags(character)"
          :placeholder="t('character.cardArtPlaceholder')"
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

      <BandFoot :to="{ hash: '#universal' }" :label="t('universe.characters.exit')" />
    </div>
  </section>

  <section id="universal" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <SectionMarker
        id="universal"
        :index="4"
        :total="6"
        :heading="t('universe.sections.universal')"
      />
      <MonoLabel tone="faint">{{ t('universe.universal.nameTbd') }}</MonoLabel>
      <p class="universe__body">{{ t('universe.universal.body') }}</p>

      <div class="l-grid l-grid--tiles universe__gap">
        <EntityTile
          v-for="character in universal"
          :key="character.id"
          :to="to('character', { characterId: character.id })"
          :art="character.cardArt"
          :epithet="character.epithet"
          :name="character.name"
          :tags="factionTags(character)"
          :placeholder="t('character.cardArtPlaceholder')"
        />
      </div>

      <div class="universe__reveal">
        <UiButton variant="quiet" :to="to('universal')">{{ t('universe.universal.exitPage') }}</UiButton>
      </div>

      <BandFoot :to="{ hash: '#incursions' }" :label="t('universe.universal.exit')" />
    </div>
  </section>

  <section id="incursions" tabindex="-1" class="l-band l-band--line-top universe__threat">
    <div class="l-wrap">
      <SectionMarker
        id="incursions"
        :index="5"
        :total="6"
        :heading="t('universe.incursions.heading')"
      />
      <span class="universe__badge">
        {{ t('universe.incursions.coop') }} · {{ game.incursionsPlayers }}
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

  <section id="cards" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <SectionMarker id="cards" :index="6" :total="6" :heading="t('universe.sections.cards')" />
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

  <section id="lexicon" tabindex="-1" class="l-band l-band--line-top">
    <div class="l-wrap">
      <MonoLabel tone="faint">
        {{ t('universe.lexicon.kicker') }} · {{ lexicon.length }}
        {{ t('universe.lexicon.termsLabel') }}
      </MonoLabel>
      <h2 class="universe__h2">{{ t('universe.sections.lexicon') }}</h2>

      <dl class="l-grid universe__gap">
        <div v-for="term in lexicon" :key="term.key" class="universe__term">
          <dt class="universe__term-title">{{ term.title }}</dt>
          <dd class="universe__term-body">{{ term.body }}</dd>
        </div>
      </dl>
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

.universe__h2 {
  margin-top: var(--space-3);
  font-size: clamp(1.5rem, 3.8vw, 2.25rem);
}

.universe__h3 {
  margin-top: var(--space-4);
  font-size: clamp(1.375rem, 3.4vw, 2rem);
  max-width: 24ch;
}

.universe__standfirst {
  max-width: 40ch;
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  line-height: 1.35;
  color: var(--color-ink);
}

.universe__beats {
  margin-top: var(--space-8);
}

.universe__plate,
.universe__relic {
  margin-top: var(--space-5);
}

.universe__relic {
  max-width: 320px;
}

.universe__closer {
  margin-top: var(--space-7);
  max-width: 40ch;
  font-size: var(--size-body-l);
  line-height: 1.5;
  color: var(--color-ink);
}

.universe__bridge {
  margin-top: var(--space-10);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-line);
}

.universe__bridge-row {
  padding: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-m);
  background: var(--color-surface-raised);
}

.universe__bridge-title {
  margin-bottom: var(--space-4);
  font-size: var(--size-body-l);
}

.universe__bridge-body {
  margin-top: var(--space-2);
  margin-bottom: var(--space-4);
  font-size: var(--size-body);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.universe__bridge-body:last-child {
  margin-bottom: 0;
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

.universe__term {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-line);
}

.universe__term-title {
  font-size: var(--size-body-l);
  color: var(--color-ink);
}

.universe__term-body {
  margin: var(--space-2) 0 0;
  font-size: var(--size-body);
  line-height: 1.6;
  color: var(--color-ink-soft);
}
</style>
