<script setup lang="ts">
// This area is non-faction only; a band appears here only once its contents are public.
import { computed } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import { provideSections } from '@/composables/useSections';
import { t } from '@/content';
import { brandById, characters, programsOfBrand } from '@/data/universe';
import { pad } from '@/site/format';
import { pictureSources, to } from '@/site/links';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'lux', label: 'LuX' },
  { id: 'personal-brands', label: t('universal.sections.brands') },
]);

provideSections(sections);

const lux = computed(() => characters.find((c) => c.id === 'lux') ?? null);
const luxBrand = computed(() => (lux.value?.personalBrandId ? brandById(lux.value.personalBrandId) : null));
const luxCards = computed(() => (luxBrand.value ? programsOfBrand(luxBrand.value.id) : []));
const luxAnnounced = computed(() => luxBrand.value?.announcedCount ?? null);
</script>

<template>
  <div class="una">
    <PageHero
      :placeholder="t('universal.hero.artPlaceholder')"
      :pending-note="t('universal.hero.pending')"
      glow="90% 70% at 60% 6%"
      min-height="min(72dvh, 640px)"
    >
      <Breadcrumbs
        :crumbs="[
          { label: t('ia.universe.label'), to: to('universe') },
          { label: t('ia.universe.universal.label') },
        ]"
      />
      <h1 class="l-page-title unv__title">{{ t('universal.hero.title') }}</h1>
      <p class="l-lede unv__lede">{{ t('universal.hero.lede') }}</p>
      <MonoLabel tone="faint">{{ t('universal.areaName') }}</MonoLabel>
      <SectionIndex :sections="sections" />
    </PageHero>

    <ScrollSpyRail :sections="sections" />

    <SectionBand id="lux" class="l-band--line-top" heading="LuX">
      <MonoLabel tone="faint">{{ t('universe.anyFaction') }}</MonoLabel>

      <div v-if="lux" class="unv__feature">
        <div class="unv__feature-art">
          <ArtFrame
            :art="lux.sceneArt"
            ratio="3 / 4"
            radius="m"
            :placeholder="t('universal.luxArtPlaceholder')"
            :sources="pictureSources(lux.sceneArt.src)"
            sizes="280px"
          />
        </div>
        <div class="unv__feature-body">
          <p class="unv__epithet">{{ lux.epithet }}</p>
          <h3 class="unv__name">{{ lux.name }}</h3>
          <p class="l-lede unv__body">{{ t('universal.lux.body') }}</p>
          <p v-if="luxCards.length" class="l-lede unv__body">
            {{ luxCards.length }} {{ t('universal.lux.brandLine') }}
          </p>
          <div class="l-row unv__gap">
            <UiButton :to="to('character', { characterId: lux.id })">
              {{ t('universal.lux.ctaPage') }}
            </UiButton>
            <UiButton variant="quiet" :to="{ hash: '#personal-brands' }">
              {{ t('universal.lux.ctaPrograms') }}
            </UiButton>
          </div>
        </div>
      </div>

      <BandFoot :to="{ hash: '#personal-brands' }" :label="t('universal.exitBrands')" />
    </SectionBand>

    <SectionBand
      id="personal-brands"
      class="l-band--line-top"
      :heading="t('universal.sections.brands')"
    >
      <MonoLabel tone="faint">{{ t('universal.brands.note') }}</MonoLabel>
      <p class="l-lede unv__body">{{ t('universal.brands.body') }}</p>

      <div class="l-grid l-grid--wide unv__gap">
        <article class="l-surface l-surface--pad">
          <MonoLabel tone="faint">
            LuX<template v-if="luxCards.length"> · {{ luxCards.length }} {{ t('faction.stats.programs') }}</template>
          </MonoLabel>
          <h3 class="unv__brand-title">
            <BrandMark
              :icon="luxBrand?.icon"
              :name="t('universal.brands.luxTitle')"
              :size="52"
            />
            {{ t('universal.brands.luxTitle') }}
          </h3>
          <p class="l-lede unv__body">{{ t('universal.brands.luxBody') }}</p>
          <ul class="unv__slots">
            <li v-for="(program, i) in luxCards" :key="program.slug">
              {{ pad(i + 1) }}
            </li>
          </ul>
          <MonoLabel
            v-if="luxAnnounced && luxCards.length < luxAnnounced"
            tone="faint"
            class="unv__gap"
          >
            {{ luxCards.length }} {{ t('brand.of') }} {{ luxAnnounced }} {{ t('brand.revealed') }}
          </MonoLabel>
        </article>
      </div>

      <BandFoot :to="to('universe')" :label="t('characters.exitUniverse')" />
    </SectionBand>
  </div>
</template>

<style>
.unv__title {
  max-width: 26ch;
}

.unv__lede,
.unv__body {
  margin-top: var(--space-4);
}

.unv__gap {
  margin-top: var(--space-5);
}

.unv__feature {
  margin-top: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: clamp(24px, 4vw, 48px);
  align-items: flex-start;
}

.unv__feature-art {
  flex: 0 0 min(100%, 280px);
}

.unv__feature-body {
  flex: 1 1 320px;
  min-width: 0;
}

.unv__epithet {
  font-size: var(--size-body-l);
  color: var(--color-ink-muted);
}

.unv__name {
  margin-top: var(--space-2);
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 4vw, 2.25rem);
}

.unv__brand-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 400;
}

.unv__slots {
  margin-top: var(--space-5);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: var(--space-2);
  list-style: none;
}

.unv__slots li {
  display: grid;
  place-items: center;
  aspect-ratio: var(--ratio-card);
  border: 1px dashed var(--color-line-dashed);
  border-radius: var(--radius-s);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  color: var(--color-ink-faint);
}
</style>
