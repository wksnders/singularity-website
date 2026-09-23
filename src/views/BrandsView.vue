<script setup lang="ts">
// Faction-scoped bands keep one colour in view at a time.
import { computed } from 'vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import BrandTile from '@/components/molecules/BrandTile.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import BrandsHero from '@/components/organisms/BrandsHero.vue';
import { getDoc, metaString, t } from '@/content';
import {
  brands,
  brandsOfFaction,
  factions,
  programsOfBrand,
  universalTone,
} from '@/data/universe';
import { brandOneLiner, brandRowNote } from '@/site/brands';
import { pad } from '@/site/format';
import { asset, to } from '@/site/links';
import { patternUrl } from '@/site/patterns';
import type { Brand, Faction } from '@/data/types';
import { provideSections } from '@/composables/useSections';
import type { SectionEntry } from '@/site/sections';

/* A public anchor, like the faction ids the other bands use. */
const UNIVERSAL = 'universal';

interface Shelf {
  id: string;
  name: string;
  short?: string;
  color: string;
  colorText: string;
  tagline: string | null;
  pattern: string;
  faction: Faction | null;
  brands: Brand[];
}

const shortName = (faction: Faction) =>
  metaString(getDoc(`universe/factions/${faction.id}`), 'shortName', faction.name);

const shelves = computed<Shelf[]>(() => [
  ...factions.map((faction) => ({
    id: faction.id,
    name: faction.name,
    short: shortName(faction),
    color: faction.color,
    colorText: faction.colorText,
    tagline: faction.tagline,
    pattern: faction.id,
    faction,
    brands: brandsOfFaction(faction.id),
  })),
  {
    id: UNIVERSAL,
    name: t('brands.universal.title'),
    color: universalTone.color,
    colorText: universalTone.colorText,
    tagline: null,
    pattern: 'common',
    faction: null,
    brands: brands.filter((brand) => !brand.factionId),
  },
]);

const sections = computed<SectionEntry[]>(() =>
  shelves.value.map((shelf) => ({
    id: shelf.id,
    label: shelf.name,
    short: shelf.short,
    color: shelf.color,
  })),
);

provideSections(sections);

const marks = computed(() =>
  brands.flatMap((brand) => (brand.icon ? [asset(brand.icon)] : [])),
);

/* `common` is drawn denser than the faction sheets, so it tiles smaller to match them by eye. */
const patternStyle = (shelf: Shelf) => ({
  '--brands-pattern': `url(${patternUrl(`${shelf.pattern}-texture`)})`,
  '--brands-tile': shelf.pattern === 'common' ? '390px' : '520px',
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
  <BrandsHero
    :marks="marks"
    :crumbs="[
      { label: t('ia.universe.label'), to: to('universe') },
      { label: t('brands.hero.crumb') },
    ]"
    :lead="t('brands.hero.titleLead')"
    :logo-alt="t('brands.hero.logoAlt')"
  />

  <div class="l-wrap brands__intro">
    <SectionIndex :sections="sections" />
    <p class="brands__lede">{{ t('brands.hero.lede') }}</p>
  </div>

  <ScrollSpyRail :sections="sections" />

  <section
    v-for="(shelf, i) in shelves"
    :id="shelf.id"
    :key="shelf.id"
    tabindex="-1"
    class="brands__band"
    :class="{ 'brands__band--alt': i % 2 === 1, 'brands__band--last': i === shelves.length - 1 }"
    :style="{ '--faction': shelf.color, '--faction-text': shelf.colorText }"
  >
    <!-- Only with a file: with no mask the ink floods the band. -->
    <div
      v-if="patternUrl(`${shelf.pattern}-texture`)"
      class="brands__pattern"
      :style="patternStyle(shelf)"
      aria-hidden="true"
    ></div>

    <div class="l-wrap brands__head">
      <MonoLabel class="brands__ordinal">{{ pad(i + 1) }} / {{ pad(shelves.length) }}</MonoLabel>
      <h2 class="brands__heading">
        <FactionDot :color="shelf.color" :size="12" />
        {{ shelf.name }}
      </h2>
      <p v-if="shelf.tagline" class="brands__tagline">{{ shelf.tagline }}</p>
    </div>

    <div class="l-wrap">
      <div class="brands__grid">
        <!-- `brand-<id>` is a public anchor: News and errata deep-link one row. -->
        <BrandTile
          v-for="brand in shelf.brands"
          :id="`brand-${brand.id}`"
          :key="brand.id"
          :brand="brand"
          :faction="shelf.faction"
          :color="shelf.color"
          :descriptor="brandOneLiner(brand)"
          :condition="conditionOf(brand)"
          :note="brandRowNote(brand)"
          :mark-size="104"
        />
      </div>

      <BandFoot
        v-if="shelf.faction"
        :to="to('faction', { factionId: shelf.faction.id })"
        :label="t('brands.exitFaction', { name: shelf.faction.name })"
      />
      <BandFoot v-else :to="to('universal')" :label="t('brands.exitUniversal')">
        <UiButton variant="quiet" :to="to('cards', {}, { query: { faction: 'any' } })">
          {{ t('brands.exitAnyFaction') }}
        </UiButton>
      </BandFoot>
    </div>
  </section>
</template>

<style>
.brands__intro {
  padding-block: var(--space-2) clamp(40px, 5vw, 64px);
}

.brands__intro .c-index {
  margin-top: 0;
}

.brands__lede {
  margin-top: var(--space-7);
  max-width: 52ch;
  font-size: clamp(1.0625rem, 2.2vw, 1.25rem);
  line-height: 1.55;
  color: rgba(var(--rgb-ink), 0.86);
}

.brands__band {
  --brands-strip: clamp(72px, 10vw, 128px);
  --brands-fade: clamp(160px, 20vw, 240px);
  --brands-band: #11111e;

  position: relative;
  isolation: isolate;
  border-top: 3px solid var(--faction);
  padding-top: var(--brands-strip);
  padding-bottom: clamp(28px, 4vw, 40px);
  background: linear-gradient(
    to bottom,
    var(--color-bg) calc(var(--brands-strip) * 0.55),
    var(--brands-band) var(--brands-strip)
  );
}

.brands__band--alt {
  --brands-band: #0d0d19;
}

.brands__band--last {
  padding-bottom: clamp(48px, 6vw, 72px);
}

.brands__pattern {
  position: absolute;
  inset: 0 0 auto;
  z-index: -1;
  height: calc(var(--brands-strip) + var(--brands-fade));
  pointer-events: none;
  background: var(--color-ink);
  opacity: 0.1;
  mask-image: var(--brands-pattern),
    linear-gradient(to bottom, #000 0, #000 var(--brands-strip), transparent 100%);
  mask-size:
    var(--brands-tile) auto,
    100% 100%;
  mask-repeat: repeat, no-repeat;
  mask-composite: intersect;
  -webkit-mask-image: var(--brands-pattern),
    linear-gradient(to bottom, #000 0, #000 var(--brands-strip), transparent 100%);
  -webkit-mask-size:
    var(--brands-tile) auto,
    100% 100%;
  -webkit-mask-repeat: repeat, no-repeat;
  -webkit-mask-composite: source-in;
}

.brands__head {
  padding-block: clamp(24px, 3vw, 32px) clamp(20px, 3vw, 28px);
}

.brands__ordinal {
  color: var(--color-ink-soft);
  letter-spacing: 0.14em;
}

.brands__heading {
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: clamp(1.5rem, 3.8vw, 2.125rem);
}

.brands__tagline {
  margin-top: var(--space-3);
  max-width: 62ch;
  font-size: var(--size-body);
  line-height: 1.6;
  color: var(--faction-text);
}

.brands__grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
}

.brands__band .c-bandfoot {
  margin-top: var(--space-7);
}
</style>
