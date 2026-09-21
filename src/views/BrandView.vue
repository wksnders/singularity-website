<script setup lang="ts">

import { computed } from 'vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import EntityTile from '@/components/molecules/EntityTile.vue';
import FilterChip from '@/components/atoms/FilterChip.vue';
import MarkdownBlock from '@/components/molecules/MarkdownBlock.vue';
import ProgramCard from '@/components/molecules/ProgramCard.vue';
import MissingCardNote from '@/components/molecules/MissingCardNote.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import BrandHero from '@/components/organisms/BrandHero.vue';
import CardDetail from '@/components/organisms/CardDetail.vue';
import { useCardParam } from '@/composables/useCardParam';
import { useDocumentTitle } from '@/composables/useDocumentTitle';
import { useEntityDoc } from '@/composables/useEntityDoc';
import { provideSections } from '@/composables/useSections';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { hasSubType } from '@/site/cardText';
import { cardBySlug } from '@/site/cards';
import { t } from '@/content';
import {
  brandById,
  brandsOfFaction,
  charactersOfBrand,
  factionById,
  programsOfBrand,
  universalTone,
} from '@/data/universe';
import { factionTags } from '@/site/characters';
import { pad } from '@/site/format';
import { to } from '@/site/links';
import type { Program } from '@/data/types';
import type { SectionEntry } from '@/site/sections';

const props = defineProps<{ brandId: string }>();

const brand = computed(() => brandById(props.brandId));
const faction = computed(() => (brand.value?.factionId ? factionById(brand.value.factionId) : null));
const { has: hasStory, meta } = useEntityDoc(() => `universe/brands/${props.brandId}`);

const name = computed(() => meta('name', brand.value?.name ?? ''));
const oneLiner = computed(() => meta('oneLiner', t('brand.oneLinerPlaceholder')));

useDocumentTitle(() => name.value);
const inWorldQuote = computed(() => meta('quote', t('brand.quotePlaceholder')));
const quoteBy = computed(() => meta('quoteBy'));

const sections = computed<SectionEntry[]>(() => [
  { id: 'story', label: t('brand.sections.story') },
  { id: 'programs', label: t('brand.sections.programs') },
  { id: 'characters', label: t('brand.sections.cast') },
]);

provideSections(sections);

const facet = computed(() => brand.value?.facetSubType ?? null);
const isFacet = (program: Program) => hasSubType(program.subType, facet.value ?? '');

const cards = useQueryFilter('cards');
const showingFacet = computed(() => Boolean(facet.value) && cards.value.value === 'facet');

const written = computed(() => programsOfBrand(props.brandId));

const programs = computed<Program[]>(() =>
  /* Facet-first ordering is display only. */
  facet.value
    ? [...written.value.filter(isFacet), ...written.value.filter((p) => !isFacet(p))]
    : written.value,
);

const shown = computed(() =>
  showingFacet.value ? programs.value.filter(isFacet) : programs.value,
);

const facetCount = computed(() => programs.value.filter(isFacet).length);

const announced = computed(() => brand.value?.announcedCount ?? null);

const siblings = computed(() => {
  if (!faction.value) return { prev: null, next: null, index: 0, total: 0 };
  const pool = brandsOfFaction(faction.value.id);
  const index = pool.findIndex((b) => b.id === props.brandId);
  if (index < 0) return { prev: null, next: null, index: 0, total: pool.length };
  const prev = pool[(index - 1 + pool.length) % pool.length];
  const next = pool[(index + 1) % pool.length];
  return {
    prev: { label: prev.name, to: to('brand', { brandId: prev.id }) },
    next: { label: next.name, to: to('brand', { brandId: next.id }) },
    index: index + 1,
    total: pool.length,
  };
});

const eyebrow = computed(() =>
  faction.value
    ? `${t('brand.hero.position')} ${pad(siblings.value.index)} / ${pad(siblings.value.total)} · ${faction.value.name}`
    : null,
);

const cast = computed(() => charactersOfBrand(props.brandId));

/* `isKnown` means EXISTS, not "is in the list on screen": a facet filter must not turn an open card into a missing one. */
const card = useCardParam({ isKnown: (slug) => Boolean(cardBySlug(slug)) });
const activeRow = computed(() => (card.slug.value ? cardBySlug(card.slug.value) : null));
</script>

<template>
  <div
    v-if="brand"
    class="brand"
    :style="{
      '--faction': faction?.color ?? universalTone.color,
      '--faction-text': faction?.colorText ?? universalTone.colorText,
    }"
  >
    <!-- The faction is not a crumb: faction-less brands have none. -->
    <BrandHero
      :name="name"
      :icon="brand.icon"
      :programs="written"
      :pattern="faction?.id ?? 'common'"
      :eyebrow="eyebrow"
      :crumbs="[
        { label: t('ia.universe.label'), to: to('universe') },
        { label: t('brands.hero.crumb'), to: to('brands') },
        { label: name },
      ]"
      :prev="siblings.prev"
      :next="siblings.next"
    >
      <p class="l-lede l-lede--narrow brand__oneliner">{{ oneLiner }}</p>
      <SectionIndex :sections="sections" />
    </BrandHero>

    <ScrollSpyRail :sections="sections" />

    <SectionBand id="story" class="l-band--line-top" :heading="t('brand.sections.story')">
      <MonoLabel tone="faint">{{ t('brand.storyNote') }}</MonoLabel>
      <MarkdownBlock v-if="hasStory" :slug="`universe/brands/${brandId}`" measure />
      <div v-else class="brand__story-placeholder">
        <p>{{ t('brand.storyPlaceholder1') }}</p>
        <p>{{ t('brand.storyPlaceholder2') }}</p>
        <p>{{ t('brand.storyPlaceholder3') }}</p>
      </div>
      <blockquote class="brand__quote">
        {{ inWorldQuote }}
        <cite v-if="quoteBy" class="brand__quote-by">{{ quoteBy }}</cite>
      </blockquote>
      <BandFoot :to="{ hash: '#programs' }" :label="t('brand.exitPrograms')" />
    </SectionBand>

    <SectionBand
      id="programs"
      class="l-band--alt l-band--line-top"
      :heading="t('brand.sections.programs')"
    >
      <template #before>
        <MissingCardNote
          class="brand__missing"
          :slug="card.missing.value"
          @dismiss="card.dismissMissing()"
        />
      </template>

      <MonoLabel v-if="!facet" tone="faint">
        {{ programs.length }} {{ t('brand.cardsNote') }}
      </MonoLabel>

      <div v-if="facet" class="l-row brand__facets" role="group" :aria-label="t('brand.showLabel')">
        <FilterChip :active="!showingFacet" :count="programs.length" @toggle="cards.set(null)">
          {{ t('filters.all') }}
        </FilterChip>
        <FilterChip
          :active="showingFacet"
          :count="facetCount"
          show-dot
          @toggle="cards.set('facet')"
        >
          {{ t(`cards.subTypes.${facet}`) }}
        </FilterChip>
      </div>

      <p v-if="showingFacet" class="brand__facet-note">
        {{ t(`cards.subTypeNotes.${facet}`) }}
        <BaseLink :to="to('learn', {}, { hash: '#paths' })">{{ t('brand.learnLink') }}</BaseLink>.
      </p>

      <ul class="l-grid l-grid--cards">
        <li v-for="program in shown" :key="program.slug">
          <ProgramCard
            branded
            :program="program"
            :brand-label="name"
            :brand-icon="brand.icon"
            :color="faction?.color"
            :sealed-label="t('brand.unrevealed')"
            @select="card.openCard(program.slug)"
          />
        </li>
      </ul>

      <MonoLabel v-if="announced && shown.length < announced" tone="faint">
        {{ shown.length }} {{ t('brand.of') }} {{ announced }} {{ t('brand.revealed') }}
      </MonoLabel>

      <BandFoot
        :to="to('cards', {}, { query: faction ? { faction: faction.id } : undefined })"
        :label="t('brand.exitGallery')"
      />
    </SectionBand>

    <SectionBand id="characters" class="l-band--line-top" :heading="t('brand.sections.cast')">
      <div v-if="cast.length" class="l-grid l-grid--tiles">
        <EntityTile
          v-for="character in cast"
          :key="character.id"
          :to="to('character', { characterId: character.id })"
          :art="character.cardArt"
          :epithet="character.epithet"
          :name="character.name"
          :tags="factionTags(character)"
          :placeholder="t('character.cardArtPlaceholder')"
        />
      </div>
      <EmptyState v-else :title="t('brand.noCastTitle')" :body="t('brand.noCastBody')" />
      <BandFoot
        :to="faction ? to('faction', { factionId: faction.id }) : to('universe')"
        :label="`${t('brand.exitFaction')} ${faction?.name ?? ''} →`"
      />
    </SectionBand>

    <CardDetail
      :open="card.open.value"
      :row="activeRow"
      :printing="card.printing.value"
      @close="card.close()"
      @printing="card.setPrinting($event)"
    />
  </div>

  <section v-else class="l-band">
    <div class="l-wrap l-wrap--reading">
      <EmptyState
        :title="t('brand.missingTitle')"
        :body="t('brand.missingBody')"
      />
    </div>
  </section>
</template>

<style>
.brand__missing {
  margin-top: var(--space-4);
}

.brand__oneliner {
  font-size: clamp(1.0625rem, 1.6vw, 1.25rem);
  line-height: 1.55;
  color: rgba(var(--rgb-ink), 0.84);
}

.brand__facets {
  margin-top: var(--space-6);
  align-items: center;
}

.brand__facet-note {
  margin-top: var(--space-4);
  max-width: 60ch;
  padding-left: var(--space-4);
  border-left: 2px solid var(--faction);
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-muted);
}

.brand__story-placeholder {
  margin-top: var(--space-6);
  display: grid;
  gap: var(--space-4);
  max-width: var(--width-reading);
  font-size: var(--size-body-l);
  line-height: 1.65;
  color: var(--color-ink-soft);
}

.brand__quote {
  margin: var(--space-8) 0 0;
  padding-left: var(--space-4);
  border-left: 2px solid var(--faction);
  max-width: 52ch;
  font-size: var(--size-body-l);
  font-style: italic;
  color: var(--faction-text);
}

.brand__quote-by {
  display: block;
  margin-top: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  font-style: normal;
  letter-spacing: var(--track-mono);
  color: var(--color-ink-soft);
}

</style>
