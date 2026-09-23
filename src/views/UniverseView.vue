<script setup lang="ts">

import { computed, ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import CardImage from '@/components/atoms/CardImage.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import ThreatBadge from '@/components/atoms/ThreatBadge.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import EntityTile from '@/components/molecules/EntityTile.vue';
import FactionTile from '@/components/molecules/FactionTile.vue';
import FilterBar from '@/components/molecules/FilterBar.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import { t } from '@/content';
import {
  characters,
  factions,
  game,
  matchesFactionFilter,
  universalCharacters,
} from '@/data/universe';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { provideSections } from '@/composables/useSections';
import { matchesQuery, nameHaystack, searchHaystack } from '@/site/cardText';
import { characterFactionOptions, factionTags } from '@/site/characters';
import { to } from '@/site/links';
import type { Character } from '@/data/types';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'factions', label: t('universe.sections.factions') },
  { id: 'characters', label: t('universe.sections.characters') },
  { id: 'universal', label: t('universe.sections.universal') },
  { id: 'incursions', label: t('universe.sections.incursions') },
  { id: 'cards', label: t('universe.sections.cards') },
]);

provideSections(sections);

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

const filterOptions = computed(() => characterFactionOptions(t('universe.anyFaction')));

function matchesSearch(character: Character): boolean {
  const parts = [character.name, character.epithet];
  return matchesQuery(searchHaystack(parts), search.value, nameHaystack(parts));
}

const shownCast = computed(() =>
  characters.filter((c) => matchesFactionFilter(c, faction.value.value) && matchesSearch(c)),
);

const castPreview = computed(() => shownCast.value.slice(0, 9));

const universal = computed(() => universalCharacters().slice(0, 3));

function clearAll(): void {
  faction.set(null);
  search.value = '';
}
</script>

<template>
  <section id="world" tabindex="-1" class="universe__hero" aria-labelledby="universe-title">
    <div class="universe__plate" aria-hidden="true">
      <span class="universe__plate-scrim"></span>
      <span class="universe__plate-fade"></span>
    </div>
    <div class="l-wrap">
      <div class="universe__hero-copy">
        <MonoLabel>{{ t('universe.hero.kicker') }}</MonoLabel>
        <h1 id="universe-title" class="universe__title">{{ t('universe.hero.title') }}</h1>
        <p class="universe__subhead">{{ t('universe.hero.subhead') }}</p>
      </div>
      <SectionIndex :sections="sections" label-hidden class="universe__chips" />
      <p class="universe__pending" aria-hidden="true">{{ t('universe.hero.pending') }}</p>
    </div>
  </section>

  <ScrollSpyRail :sections="sections" />

  <section class="universe__lead" :aria-label="t('universe.sections.world')">
    <div class="l-wrap">
      <p class="universe__standfirst">{{ t('universe.world.body1') }}</p>
      <p class="l-lede universe__body">{{ t('universe.world.body2') }}</p>
      <p class="l-lede universe__body">{{ t('universe.world.body3') }}</p>
      <p class="l-lede universe__body">{{ t('universe.world.body4') }}</p>

      <ArtFrame
        :art="null"
        ratio="4 / 5"
        radius="m"
        class="universe__relic"
        :placeholder="t('universe.world.relicPlaceholder')"
      />
      <MonoLabel tone="faint">{{ t('universe.world.relicPending') }}</MonoLabel>

      <p class="l-lede universe__body">{{ t('universe.world.body5') }}</p>

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

  <SectionBand
    id="factions"
    class="l-band--alt l-band--line-top"
    :heading="t('universe.sections.factions')"
  >
    <MonoLabel tone="faint">{{ t('universe.factions.note') }}</MonoLabel>
    <div class="l-grid">
      <FactionTile
        v-for="f in factions"
        :key="f.id"
        :faction="f"
        :placeholder="t('universe.factionArtPlaceholder')"
      />
    </div>
    <BandFoot :to="{ hash: '#characters' }" :label="t('universe.factions.exit')" />
  </SectionBand>

  <SectionBand
    id="characters"
    class="l-band--line-top"
    :heading="t('universe.sections.characters')"
  >
    <MonoLabel tone="faint">{{ t('universe.characters.note') }}</MonoLabel>

    <FilterBar
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

    <div v-if="castPreview.length" class="l-grid l-grid--tiles">
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
  </SectionBand>

  <SectionBand
    id="universal"
    class="l-band--alt l-band--line-top"
    :heading="t('universe.sections.universal')"
  >
    <MonoLabel tone="faint">{{ t('universe.universal.nameTbd') }}</MonoLabel>
    <p class="l-lede universe__body">{{ t('universe.universal.body') }}</p>

    <div class="l-grid l-grid--tiles">
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
  </SectionBand>

  <SectionBand
    id="incursions"
    class="l-band--line-top universe__threat"
    :heading="t('universe.incursions.heading')"
  >
    <ThreatBadge>
      {{ t('universe.incursions.coop') }} · {{ game.incursionsPlayers }}
      {{ t('home.incursions.players') }}
    </ThreatBadge>
    <h3 class="universe__h3">{{ t('universe.incursions.title') }}</h3>
    <p class="l-lede universe__body">{{ t('universe.incursions.body') }}</p>
    <UiButton :to="to('incursions')">
      {{ t('universe.incursions.cta') }}
    </UiButton>
    <BandFoot :to="{ hash: '#cards' }" :label="t('universe.incursions.exit')" />
  </SectionBand>

  <SectionBand
    id="cards"
    class="l-band--alt l-band--line-top"
    :heading="t('universe.sections.cards')"
  >
    <div class="l-split">
      <div class="l-split__main">
        <p class="l-lede universe__body">{{ t('universe.cards.body') }}</p>
        <UiButton :to="to('cards')" class="universe__gap">{{ t('universe.cards.cta') }}</UiButton>
      </div>
      <div class="l-split__aside universe__cards">
        <CardImage v-for="n in 3" :key="n" :art="null" :placeholder="t('cards.artPlaceholder')" />
      </div>
    </div>
  </SectionBand>

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
.universe__hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--color-bg);
}

.universe__plate {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(
      90% 70% at 78% 0%,
      rgba(var(--rgb-accent), 0.18) 0%,
      rgba(var(--rgb-bg), 0) 60%
    ),
    repeating-linear-gradient(
      135deg,
      rgba(var(--rgb-ink), 0.04) 0 12px,
      rgba(var(--rgb-ink), 0.015) 12px 24px
    );
}

/* Sized for the plate that will sit under them: a flat wash, then the fade that hands the page its own background back. */
.universe__plate-scrim,
.universe__plate-fade {
  position: absolute;
  inset: 0;
}

.universe__plate-scrim {
  background: rgba(var(--rgb-bg), 0.55);
}

.universe__plate-fade {
  background: linear-gradient(
    to bottom,
    rgba(var(--rgb-bg), 0) 0%,
    rgba(var(--rgb-bg), 0.3) 40%,
    rgba(var(--rgb-bg), 0.8) 62%,
    rgba(var(--rgb-bg), 0.94) 74%,
    var(--color-bg) 86%
  );
}

.universe__hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: clamp(520px, 78vh, 720px);
  padding-block: calc(var(--nav-height) + var(--space-12)) var(--space-8);
}

.universe__title {
  margin-top: var(--space-5);
  font-size: clamp(2rem, 6vw, 3.75rem);
}

.universe__subhead {
  margin-top: var(--space-5);
  max-width: 24ch;
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: var(--color-ink);
}

.universe__chips {
  margin-top: 0;
  padding-bottom: var(--space-2);
}

.universe__pending {
  padding-block: var(--space-4) var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: 0.12em;
  color: rgba(var(--rgb-ink), 0.32);
}

.universe__lead {
  padding-block: var(--space-8) var(--band-y);
}

.universe__body {
  margin-top: var(--space-4);
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
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-muted);
}

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
