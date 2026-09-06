<script setup lang="ts">
// Faction-scoped bands keep one colour in view at a time.
import { computed } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import BrandTile from '@/components/molecules/BrandTile.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { getDoc, metaString, t } from '@/content';
import {
  brands,
  brandsOfFaction,
  factions,
  programs,
  programsOfBrand,
} from '@/data/universe';
import { brandOneLiner, brandRowNote } from '@/site/brands';
import { to } from '@/site/links';
import type { Brand, Faction } from '@/data/types';
import type { SectionEntry } from '@/site/sections';

/* A public anchor, like the faction ids the other bands use. */
const UNIVERSAL = 'universal';

const universal = computed(() => brands.filter((brand) => !brand.factionId));

const shortName = (faction: Faction) =>
  metaString(getDoc(`universe/factions/${faction.id}`), 'shortName', faction.name);

const sections = computed<SectionEntry[]>(() => [
  ...factions.map((faction) => ({
    id: faction.id,
    label: faction.name,
    short: shortName(faction),
    color: faction.color,
  })),
  { id: UNIVERSAL, label: t('brands.universal.title') },
]);

/* Every figure derives; the roster is data. */
const factLine = computed(() => {
  const sizes = new Set(factions.map((faction) => brandsOfFaction(faction.id).length));
  return [
    t('brands.count', { count: brands.length }),
    ...(sizes.size === 1 ? [t('brands.stat.perFaction', { count: [...sizes][0] })] : []),
    t('brands.stat.universal', { count: universal.value.length }),
    t('brands.stat.cards', { count: programs.length }),
  ].join(' · ');
});

/* Keyed on how a brand opens, not on who plays it. */
const conditionOf = (brand: Brand): string => {
  if (brand.kind === 'universal') return t('brands.condition.anySquad');
  if (!brand.unlock) return '';
  return t(`brands.condition.unlock.${brand.unlock}`, {
    count: brand.announcedCount ?? programsOfBrand(brand.id).length,
  });
};
</script>

<template>
  <SecondaryHero glow="80% 60% at 20% 0%">
    <Breadcrumbs
      :crumbs="[
        { label: t('ia.universe.label'), to: to('universe') },
        { label: t('brands.hero.crumb') },
      ]"
    />
    <h1 class="brands__title">{{ t('brands.hero.title') }}</h1>
    <p class="brands__lede">{{ t('brands.hero.lede') }}</p>
    <MonoLabel tone="faint" class="brands__stat">{{ factLine }}</MonoLabel>
    <SectionIndex :sections="sections" />
  </SecondaryHero>

  <ScrollSpyRail :sections="sections" />

  <section
    v-for="(faction, i) in factions"
    :id="faction.id"
    :key="faction.id"
    tabindex="-1"
    class="l-band brands__band"
    :class="{ 'l-band--alt': i % 2 === 1 }"
    :style="{ '--faction': faction.color, '--faction-text': faction.colorText }"
  >
    <div class="l-wrap">
      <SectionMarker
        :id="faction.id"
        :index="i + 1"
        :total="sections.length"
        :heading="faction.name"
        :color="faction.color"
      />
      <MonoLabel tone="faint">
        {{ t('brands.count', { count: brandsOfFaction(faction.id).length }) }}
      </MonoLabel>
      <p class="brands__tagline">{{ faction.tagline }}</p>

      <div class="brands__grid">
        <!-- `brand-<id>` is a public anchor: News and errata deep-link one row. -->
        <BrandTile
          v-for="brand in brandsOfFaction(faction.id)"
          :id="`brand-${brand.id}`"
          :key="brand.id"
          :brand="brand"
          :faction="faction"
          :descriptor="brandOneLiner(brand)"
          :note="brandRowNote(brand)"
        />
      </div>

      <BandFoot
        :to="to('faction', { factionId: faction.id })"
        :label="t('brands.exitFaction', { name: faction.name })"
      />
    </div>
  </section>

  <section :id="UNIVERSAL" tabindex="-1" class="l-band brands__band brands__band--neutral">
    <div class="l-wrap">
      <SectionMarker
        :id="UNIVERSAL"
        :index="sections.length"
        :total="sections.length"
        :heading="t('brands.universal.title')"
      />
      <MonoLabel tone="faint">{{ t('brands.count', { count: universal.length }) }}</MonoLabel>

      <div class="brands__grid">
        <BrandTile
          v-for="brand in universal"
          :id="`brand-${brand.id}`"
          :key="brand.id"
          :brand="brand"
          :descriptor="brandOneLiner(brand)"
          :condition="conditionOf(brand)"
          :note="brandRowNote(brand)"
        />
      </div>

      <BandFoot :to="to('universal')" :label="t('brands.exitUniversal')">
        <UiButton variant="quiet" :to="to('cards', {}, { query: { faction: 'any' } })">
          {{ t('brands.exitAnyFaction') }}
        </UiButton>
      </BandFoot>
    </div>
  </section>
</template>

<style>
.brands__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
}

.brands__lede {
  margin-top: var(--space-5);
  max-width: 62ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.brands__stat {
  margin-top: var(--space-5);
}

.brands__band {
  border-top: 3px solid var(--faction);
}

.brands__band--neutral {
  border-top: 1px solid var(--color-line);
}

.brands__tagline {
  margin-top: var(--space-3);
  max-width: 62ch;
  font-size: var(--size-body);
  line-height: 1.6;
  color: var(--faction-text);
}

.brands__grid {
  margin-top: var(--space-6);
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
}
</style>
