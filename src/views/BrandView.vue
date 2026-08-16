<script setup lang="ts">
/**
 * BRAND — three bands: the brand's own story (a brand is a body of work, not a
 * colour swatch), its programs as printed cards with their wording as text,
 * and the characters who play it.
 */
import { computed } from 'vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import EntityTile from '@/components/molecules/EntityTile.vue';
import FilterChip from '@/components/atoms/FilterChip.vue';
import MarkdownBlock from '@/components/molecules/MarkdownBlock.vue';
import ProgramCard from '@/components/molecules/ProgramCard.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import { useDocumentTitle } from '@/composables/useDocumentTitle';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { hasSubType } from '@/site/cardText';
import { docHtml, getDoc, metaString, t } from '@/content';
import {
  brandById,
  brandSlotCount,
  brandsOfFaction,
  characters,
  factionById,
  programsOfBrand,
} from '@/data/universe';
import { soon, to } from '@/site/links';
import type { Character, Program } from '@/data/types';
import type { SectionEntry } from '@/site/sections';

const props = defineProps<{ brandId: string }>();

const brand = computed(() => brandById(props.brandId));
const faction = computed(() => (brand.value?.factionId ? factionById(brand.value.factionId) : null));
const doc = computed(() => getDoc(`universe/brands/${props.brandId}`));
const hasStory = computed(() => Boolean(docHtml(doc.value)));

const name = computed(() => metaString(doc.value, 'name', brand.value?.name ?? ''));
const oneLiner = computed(() => metaString(doc.value, 'oneLiner', t('brand.oneLinerPlaceholder')));

useDocumentTitle(() => name.value);
const inWorldQuote = computed(() => metaString(doc.value, 'quote', t('brand.quotePlaceholder')));

const sections = computed<SectionEntry[]>(() => [
  { id: 'story', label: t('brand.sections.story') },
  { id: 'programs', label: t('brand.sections.programs') },
  { id: 'cast', label: t('brand.sections.cast') },
]);

const facet = computed(() => brand.value?.facetSubType ?? null);
const isFacet = (program: Program) => hasSubType(program.subType, facet.value ?? '');

const cards = useQueryFilter('cards');
const showingFacet = computed(() => Boolean(facet.value) && cards.value.value === 'facet');

const programs = computed<Program[]>(() => {
  const written = programsOfBrand(props.brandId);
  const total = brand.value ? brandSlotCount(brand.value) : written.length;
  const filler: Program[] = Array.from({ length: Math.max(total - written.length, 0) }, (_, i) => ({
    id: `${props.brandId}-slot-${written.length + i + 1}`,
    brandId: props.brandId,
    name: '',
    cost: '',
    type: '',
    rules: [],
    flavour: '',
    revealed: false,
    /* A sealed slot is a hole in the grid, not a card: `set` only satisfies the
       type and is never rendered, and the alts are "" because the slot is
       decorative — there is no card here to describe. */
    set: 'CORE',
    art: { src: null, alt: '' },
    cardArt: { src: null, alt: '' },
  }));
  /* Facet cards lead, so filtering to them is a page that shortens rather than
     one that reshuffles. Display order only*/
  const ordered = facet.value
    ? [...written.filter(isFacet), ...written.filter((p) => !isFacet(p))]
    : written;
  return [...ordered, ...filler];
});

const shown = computed(() =>
  showingFacet.value ? programs.value.filter(isFacet) : programs.value,
);

const facetCount = computed(() => programs.value.filter(isFacet).length);

const revealed = computed(() => shown.value.filter((p) => p.revealed).length);

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

const cast = computed(() => characters.filter((c) => c.brandIds.includes(props.brandId)));


const tags = (character: Character) =>
  Array.isArray(character.factionIds)
    ? character.factionIds
        .map((id) => factionById(id))
        .filter((f): f is NonNullable<ReturnType<typeof factionById>> => Boolean(f))
        .map((f) => ({ label: f.name, color: f.color }))
    : [{ label: t('universe.anyFaction'), color: null }];

const pad = (n: number) => String(n).padStart(2, '0');
</script>

<template>
  <div
    v-if="brand"
    class="brand"
    :style="{
      '--faction': faction?.color,
      '--faction-text': faction?.colorText,
    }"
  >
    <PageHero
      :placeholder="t('brand.hero.artPlaceholder')"
      :pending-note="t('brand.hero.pending')"
      glow="100% 80% at 70% 6%"
      min-height="min(72vh, 640px)"
    >
      <Breadcrumbs
        :crumbs="[
          { label: t('ia.universe.label'), to: to('universe') },
          ...(faction ? [{ label: faction.name, to: to('faction', { factionId: faction.id }) }] : []),
          { label: name },
        ]"
        :prev="siblings.prev"
        :next="siblings.next"
      />

      <div class="brand__identity">
        <div class="brand__mark">
          <BrandMark
            :icon="brand.icon"
            :name="name"
            :color="faction?.color"
            :size="112"
            eager
          />
        </div>
        <div>
          <MonoLabel tone="faint">
            {{ t('brand.hero.position') }} {{ pad(siblings.index) }} / {{ pad(siblings.total) }}
            <template v-if="faction"> · {{ faction.name }}</template>
          </MonoLabel>
          <h1 class="brand__name">{{ name }}</h1>
        </div>
      </div>

      <p class="brand__oneliner">{{ oneLiner }}</p>
      <SectionIndex :sections="sections" />
    </PageHero>

    <ScrollSpyRail :sections="sections" />

    <section id="story" tabindex="-1" class="l-band l-band--line-top">
      <div class="l-wrap">
        <SectionMarker id="story" :index="1" :total="3" :heading="t('brand.sections.story')" />
        <MonoLabel tone="faint">{{ t('brand.storyNote') }}</MonoLabel>
        <MarkdownBlock
          v-if="hasStory"
          :slug="`universe/brands/${brandId}`"
          measure
          class="brand__gap"
        />
        <div v-else class="brand__story-placeholder">
          <p>{{ t('brand.storyPlaceholder1') }}</p>
          <p>{{ t('brand.storyPlaceholder2') }}</p>
          <p>{{ t('brand.storyPlaceholder3') }}</p>
        </div>
        <blockquote class="brand__quote">{{ inWorldQuote }}</blockquote>
        <BandFoot :to="{ hash: '#programs' }" :label="t('brand.exitPrograms')" />
      </div>
    </section>

    <section id="programs" tabindex="-1" class="l-band l-band--alt l-band--line-top">
      <div class="l-wrap">
        <SectionMarker id="programs" :index="2" :total="3" :heading="t('brand.sections.programs')" />
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
          <BaseLink :to="soon('#rules-reference')">{{ t('brand.rulesLink') }}</BaseLink>.
        </p>

        <ul class="l-grid l-grid--cards brand__gap">
          <li v-for="program in shown" :key="program.id">
            <ProgramCard
              branded
              :program="program"
              :brand-label="name"
              :brand-icon="brand.icon"
              :color="faction?.color"
              :sealed-label="t('brand.unrevealed')"
            />
          </li>
        </ul>

        <MonoLabel v-if="revealed < shown.length" tone="faint" class="brand__gap">
          {{ revealed }} {{ t('brand.of') }} {{ shown.length }} {{ t('brand.revealed') }}
        </MonoLabel>

        <BandFoot
          :to="to('cards', {}, { query: faction ? { faction: faction.id } : undefined })"
          :label="t('brand.exitGallery')"
        />
      </div>
    </section>

    <section id="cast" tabindex="-1" class="l-band l-band--line-top">
      <div class="l-wrap">
        <SectionMarker id="cast" :index="3" :total="3" :heading="t('brand.sections.cast')" />
        <div v-if="cast.length" class="l-grid l-grid--tiles brand__gap">
          <EntityTile
            v-for="character in cast"
            :key="character.id"
            :to="to('character', { characterId: character.id })"
            :art="character.art"
            :epithet="character.epithet"
            :name="character.name"
            :tags="tags(character)"
            :placeholder="t('universe.artPlaceholder')"
          />
        </div>
        <EmptyState
          v-else
          class="brand__gap"
          :title="t('brand.noCastTitle')"
          :body="t('brand.noCastBody')"
        />
        <BandFoot
          :to="faction ? to('faction', { factionId: faction.id }) : to('universe')"
          :label="`${t('brand.exitFaction')} ${faction?.name ?? ''} →`"
        />
      </div>
    </section>
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
.brand__identity {
  margin-top: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
  align-items: center;
}

/* No frame, no faction underline: the mark carries its own coloured ring. */
.brand__mark {
  display: flex;
  flex: 0 0 auto;
}

.brand__name {
  margin-top: var(--space-2);
  font-size: clamp(1.875rem, 5.6vw, 3.25rem);
}

.brand__oneliner {
  margin-top: var(--space-5);
  max-width: 52ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.brand__body,
.brand__gap {
  margin-top: var(--space-6);
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

.brand__body {
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-faint);
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


</style>
