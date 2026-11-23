<script setup lang="ts">

import { computed, ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import CardImage from '@/components/atoms/CardImage.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import ThreatBadge from '@/components/atoms/ThreatBadge.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BossBackdrop from '@/components/molecules/BossBackdrop.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import EntityTile from '@/components/molecules/EntityTile.vue';
import FactionTile from '@/components/molecules/FactionTile.vue';
import FilterBar from '@/components/molecules/FilterBar.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import { t } from '@/content';
import {
  bossGroups,
  bosses,
  brandById,
  characters,
  factions,
  game,
  matchesFactionFilter,
  programsOfBrand,
  rogueAIs,
  universalCharacters,
} from '@/data/universe';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { provideSections } from '@/composables/useSections';
import { matchesQuery, nameHaystack, searchHaystack } from '@/site/cardText';
import { cardRows } from '@/site/cards';
import { characterFactionOptions, factionTags } from '@/site/characters';
import { pictureSources, to } from '@/site/links';
import type { Art, Character } from '@/data/types';
import type { CardRow } from '@/site/cards';
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
    'fractalSea',
    'brokenHeap',
    'pending1',
    'pending2',
    'pending3',
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

/* A universal character's seat fans out their own personal brand's programs; most universal characters have none. */
const universalSeats = computed(() =>
  universal.value.map((character) => {
    const brand = character.personalBrandId ? brandById(character.personalBrandId) : null;
    const programs = brand
      ? programsOfBrand(brand.id)
          .filter((card) => card.revealed && card.cardArt.src)
          .slice(0, 2)
      : [];
    return { character, brand, programs };
  }),
);

const cardBack: Art = { src: '/box-core/card-back-960.webp', alt: '' };
const backSources = pictureSources(cardBack.src);

const spectrum = [...factions, factions[0]].map((f) => f.color).join(', ');

/* Enough faces per row to run past a 3440px window's right edge; change with the wall's card width and row offsets. */
const WALL_ROW = 18;

/* Core-set program faces dealt one faction at a time, so no row, nor the phone hand cut from the first, clumps into one faction's colour. */
const wallRows = (() => {
  const lanes = new Map<string, CardRow[]>();
  for (const row of cardRows) {
    if (row.kind !== 'programs' || row.set !== 'CORE' || !row.program.revealed || !row.cardArt.src) continue;
    const lane = row.factionIds[0] ?? '';
    lanes.set(lane, [...(lanes.get(lane) ?? []), row]);
  }
  const longest = Math.max(0, ...[...lanes.values()].map((lane) => lane.length));
  const dealt = Array.from({ length: longest }, (_, i) => [...lanes.values()].map((lane) => lane[i]))
    .flat()
    .filter((row): row is CardRow => Boolean(row));
  return [dealt.slice(0, WALL_ROW), dealt.slice(WALL_ROW, WALL_ROW * 2)];
})();

const encounterFaces = rogueAIs.map((ai) => {
  const first = bossGroups.find((group) => group.encounterId === ai.id)?.bossIds[0];
  const face = bosses.find((boss) => boss.id === first);
  return { id: ai.id, name: ai.name, art: face?.art ?? null };
});

const hand = wallRows[0].slice(0, 4);

const dbCounts = [
  { label: 'cardsPage.countMany', n: cardRows.length },
  { label: 'faction.stats.programs', n: cardRows.filter((row) => row.kind === 'programs').length },
  { label: 'faction.stats.characters', n: cardRows.filter((row) => row.kind === 'characters').length },
];

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
  </SectionBand>

  <SectionBand
    id="universal"
    class="l-band--alt l-band--line-top universe__universal"
    :heading="t('universe.sections.universal')"
    :style="{ '--spectrum': spectrum }"
  >
    <p class="l-lede universe__body">{{ t('universe.universal.body') }}</p>

    <div class="universe__seats">
      <span class="universe__dots" aria-hidden="true" />
      <RouterLink
        v-for="seat in universalSeats"
        :key="seat.character.id"
        :to="to('character', { characterId: seat.character.id })"
        class="universe__seat"
        :class="{ 'universe__seat--fanned': seat.programs.length }"
        :aria-label="seat.character.name"
      >
        <span class="universe__seat-stack" aria-hidden="true">
          <span v-for="card in seat.programs" :key="card.slug" class="universe__seat-program">
            <CardImage :art="card.cardArt" :placeholder="t('cards.artPlaceholder')" sizes="200px" />
          </span>
          <span class="universe__ring">
            <CardImage :art="seat.character.cardArt" :placeholder="t('character.cardArtPlaceholder')" sizes="200px" />
          </span>
        </span>
        <span class="universe__seat-name">
          <BrandMark v-if="seat.brand" :icon="seat.brand.icon" :name="seat.brand.name" :size="28" />
          <b>{{ seat.character.name }}</b>
          <span v-if="seat.brand">{{ seat.brand.name }}</span>
        </span>
      </RouterLink>
      <div class="universe__unrevealed" aria-hidden="true">
        <span v-for="n in 6" :key="n" class="universe__ring universe__ring--back">
          <ArtFrame :art="cardBack" ratio="var(--ratio-card)" :sources="backSources" sizes="200px" />
        </span>
      </div>
    </div>

    <div class="universe__reveal">
      <UiButton variant="quiet" :to="to('universal')">{{ t('universe.universal.exitPage') }}</UiButton>
    </div>
  </SectionBand>

  <SectionBand
    id="incursions"
    class="l-band--line-top universe__threat universe__bosses"
    :heading="t('universe.incursions.heading')"
  >
    <template #before>
      <BossBackdrop />
    </template>

    <div class="universe__threat-head">
      <ul class="universe__trio">
        <li v-for="face in encounterFaces" :key="face.id">
          <RouterLink :to="to('incursion', { aiId: face.id })" class="universe__trio-face" :aria-label="face.name">
            <ArtFrame
              :art="face.art"
              ratio="1 / 1"
              :sources="pictureSources(face.art?.src ?? null)"
              sizes="80px"
              :focal="{ x: 0.5, y: 0.2 }"
            />
          </RouterLink>
        </li>
      </ul>
      <ThreatBadge>
        {{ t('universe.incursions.coop') }} · {{ game.incursionsPlayers }}
        {{ t('home.incursions.players') }}
      </ThreatBadge>
    </div>
    <p class="l-lede universe__body">{{ t('universe.incursions.body') }}</p>
    <UiButton :to="to('incursions')">
      {{ t('universe.incursions.cta') }}
    </UiButton>
  </SectionBand>

  <SectionBand
    id="cards"
    class="l-band--alt l-band--line-top universe__db"
    :heading="t('universe.sections.cards')"
  >
    <template #before>
      <div class="universe__wall" aria-hidden="true">
        <div v-for="(row, r) in wallRows" :key="r" class="universe__wall-row">
          <CardImage
            v-for="card in row"
            :key="card.slug"
            :art="card.cardArt"
            :placeholder="t('cards.artPlaceholder')"
            sizes="184px"
          />
        </div>
      </div>
      <div class="universe__wall-shade" aria-hidden="true" />
    </template>

    <div class="universe__db-copy">
      <p class="l-lede universe__body">{{ t('universe.cards.body') }}</p>
      <p class="universe__db-stats">
        <template v-for="(stat, i) in dbCounts" :key="stat.label">
          <span v-if="i" aria-hidden="true"> · </span>
          <span><b>{{ stat.n }}</b> {{ t(stat.label) }}</span>
        </template>
      </p>
      <UiButton variant="primary" :to="to('cards')" class="universe__gap">{{ t('universe.cards.cta') }}</UiButton>
    </div>
    <div class="universe__hand" aria-hidden="true">
      <CardImage
        v-for="(card, i) in hand"
        :key="card.slug"
        :art="card.cardArt"
        :placeholder="t('cards.artPlaceholder')"
        sizes="136px"
        :style="{ '--i': i }"
      />
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
      rgba(var(--rgb-ink), 0.04) 0 0.75rem,
      rgba(var(--rgb-ink), 0.015) 0.75rem 1.5rem
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
  min-height: clamp(32.5rem, 78vh, 45rem);
  padding-block: calc(var(--nav-height) + var(--space-12)) var(--space-8);
}

.universe__title {
  margin-top: var(--space-5);
  font-size: clamp(2.1rem, 6.3vw, 3.938rem);
}

.universe__subhead {
  margin-top: var(--space-5);
  max-width: 24ch;
  font-family: var(--font-body);
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 500;
  line-height: 1.3;
  color: var(--color-ink);
}

.universe__chips {
  margin-top: 0;
  padding-bottom: var(--space-2);
}

.universe__pending {
  padding-block: var(--space-4) var(--space-2);
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--size-label-xs);
  letter-spacing: var(--track-label);
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
  font-size: clamp(1.575rem, 3.99vw, 2.363rem);
}

.universe__h3 {
  margin-top: var(--space-4);
  font-size: clamp(1.444rem, 3.57vw, 2.1rem);
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
  max-width: 20rem;
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

/* --spectrum is set from the factions' data, so a new faction colour reaches this band without a CSS edit. */
.universe__universal {
  --seat-w: 8rem;

  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.universe__universal::before {
  content: '';
  position: absolute;
  inset: -1px 0 auto;
  height: 2px;
  background: linear-gradient(90deg, var(--spectrum));
}

.universe__seats {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: flex-start;
  padding-top: var(--space-4);
}

.universe__dots {
  position: absolute;
  inset: -1rem -10% 0;
  z-index: -1;
  background: conic-gradient(from 200deg, var(--spectrum));
  opacity: 0.45;
  -webkit-mask:
    radial-gradient(circle, #000 0 2px, transparent 2.6px) 0 0 / 11px 11px,
    radial-gradient(closest-side, #000 15%, transparent);
  -webkit-mask-composite: source-in;
  mask:
    radial-gradient(circle, #000 0 2px, transparent 2.6px) 0 0 / 11px 11px,
    radial-gradient(closest-side, #000 15%, transparent);
  mask-composite: intersect;
}

.universe__seat {
  flex: none;
  margin-right: var(--space-4);
  color: var(--color-ink);
  text-decoration: none;
}

.universe__seat--fanned {
  margin-right: 2.5rem;
}

.universe__seat-stack {
  position: relative;
  display: block;
  width: var(--seat-w);
  aspect-ratio: var(--ratio-card);
  transition: transform 0.2s ease;
}

.universe__seat:hover .universe__seat-stack {
  transform: translateY(-0.25rem);
}

.universe__seat-program {
  position: absolute;
  inset: 0;
  box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.5);
}

.universe__seat-program:nth-child(1) {
  transform: translate(34%, -5%) rotate(9deg);
}

.universe__seat-program:nth-child(2) {
  transform: translate(18%, -2.5%) rotate(4.5deg);
}

.universe__ring {
  display: block;
  padding: 3px;
  border-radius: calc(var(--radius-s) + 3px);
  background: conic-gradient(from 200deg, var(--spectrum));
  box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.55);
}

.universe__seat-stack > .universe__ring {
  position: absolute;
  inset: 0;
}

.universe__seat-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  font-size: var(--size-s);
  color: var(--color-ink-soft);
}

.universe__seat-name b {
  font-family: var(--font-display);
  font-size: var(--size-body-l);
  color: var(--color-ink);
}

/* The fade, not a count, says more are coming: the number of unrevealed universal characters is not public. */
.universe__unrevealed {
  display: flex;
  gap: var(--space-4);
  -webkit-mask-image: linear-gradient(to right, #000 0, #000 10rem, transparent 26rem);
  mask-image: linear-gradient(to right, #000 0, #000 10rem, transparent 26rem);
}

.universe__ring--back {
  flex: none;
  width: var(--seat-w);
}

.universe__ring--back .c-art {
  filter: brightness(0.55) saturate(0.6);
}

.universe__threat {
  --faction: var(--color-threat);
}

/* This band's lede runs wider than BossBackdrop's scrim assumes, so the lift keeps that line at 4.5:1. */
.universe__bosses {
  --boss-scrim-lift: 0.1;

  position: relative;
  isolation: isolate;
}

.universe__bosses .c-boss-backdrop {
  display: none;
}

.universe__threat-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.universe__trio {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

.universe__trio > li + li {
  margin-left: -0.9rem;
}

.universe__trio-face {
  display: block;
  width: 3.25rem;
  height: 3.25rem;
  border: 2px solid var(--color-threat);
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 0 3px var(--color-bg);
}

.universe__threat-head + .universe__body {
  margin-top: var(--space-5);
}

.universe__db {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

/* Four cards at these steps and overlap span about 2.86 times --hand-w, which is why it caps at 33vw. */
.universe__hand {
  --hand-w: min(8rem, 33vw);

  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline: calc(var(--gutter) * -1);
}

.universe__hand > .c-art {
  --w: calc(var(--hand-w) * (0.62 + var(--i) * 0.127));

  flex: none;
  width: var(--w);
  transform: rotate(-1.5deg);
  box-shadow: -0.5rem 0.75rem 1.5rem rgba(0, 0, 0, 0.6);
}

.universe__hand > .c-art + .c-art {
  margin-left: calc(var(--w) * -0.14);
}

.universe__wall {
  display: none;
  position: absolute;
  inset: -2rem -4rem;
  z-index: -2;
  align-content: center;
  gap: 1rem;
  transform: rotate(-4deg);
}

.universe__wall-row {
  display: flex;
  gap: 1rem;
  margin-left: -4%;
}

.universe__wall-row + .universe__wall-row {
  margin-left: -14%;
}

.universe__wall-row > .c-art {
  flex: none;
  width: clamp(9rem, 12vw, 11.5rem);
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.5);
}

/* The shade holds the copy at 4.5:1 over the brightest card face; widen .universe__db-copy only with it. */
.universe__wall-shade {
  display: none;
  position: absolute;
  inset: 0;
  z-index: -1;
}

.universe__db-copy {
  max-width: 30rem;
}

.universe__db-stats {
  margin-top: var(--space-5);
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--size-label-s);
  letter-spacing: var(--track-label);
  text-transform: uppercase;
  color: var(--color-ink-soft);
}

.universe__db-stats b {
  font-weight: 700;
  color: var(--color-ink);
}

@media (min-width: 45em) {
  .universe__universal {
    --seat-w: 12.5rem;
  }

  .universe__seat {
    margin-right: var(--space-8);
  }

  .universe__seat--fanned {
    margin-right: 4.5rem;
  }

  .universe__unrevealed {
    gap: var(--space-8);
    -webkit-mask-image: linear-gradient(to right, #000 0, #000 12rem, transparent 44rem);
    mask-image: linear-gradient(to right, #000 0, #000 12rem, transparent 44rem);
  }

  .universe__bosses .c-boss-backdrop {
    display: block;
  }

  .universe__trio,
  .universe__hand {
    display: none;
  }

  /* A marker's rule never runs across art. */
  .universe__bosses .c-marker__rule,
  .universe__db .c-marker__rule {
    display: none;
  }

  .universe__db {
    min-height: clamp(30rem, 44vw, 38rem);
  }

  .universe__wall {
    display: grid;
  }

  .universe__wall-shade {
    display: block;
    background:
      linear-gradient(
        to right,
        rgba(var(--rgb-bg), 0.96) 0%,
        rgba(var(--rgb-bg), 0.92) 44%,
        rgba(var(--rgb-bg), 0.4) 66%,
        rgba(var(--rgb-bg), 0.15) 100%
      ),
      linear-gradient(
        to bottom,
        rgba(var(--rgb-bg), 0.5),
        transparent 25%,
        transparent 75%,
        rgba(var(--rgb-bg), 0.6)
      );
  }
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
