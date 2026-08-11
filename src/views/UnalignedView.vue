<script setup lang="ts">
/**
 * UNALIGNED — the non-faction area: LuX, the cast you earn by beating an
 * Incursion, and their personal brands. Locks here are editorial: there are no
 * accounts, so the site never tracks what a player has opened.
 */
import { computed } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import EntityTile from '@/components/molecules/EntityTile.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import { t } from '@/content';
import { brandById, characters, rogueAIs } from '@/data/universe';
import { to } from '@/site/links';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'lux', label: 'LuX' },
  { id: 'earned', label: t('unaligned.sections.earned') },
  { id: 'personal-brands', label: t('unaligned.sections.brands') },
]);

const lux = computed(() => characters.find((c) => c.id === 'lux') ?? null);
const luxBrand = computed(() => (lux.value?.personalBrandId ? brandById(lux.value.personalBrandId) : null));

const earned = computed(() => characters.filter((c) => c.unlockedVia === 'incursions'));

const sealedBadge = (fromRogueAIId?: string | null) => {
  const index = rogueAIs.findIndex((ai) => ai.id === fromRogueAIId);
  return `${t('characters.sealed')} · ${t('characters.incursion')} ${String(index + 1).padStart(2, '0')}`;
};
</script>

<template>
  <div class="una">
    <PageHero
      :placeholder="t('unaligned.hero.artPlaceholder')"
      :pending-note="t('unaligned.hero.pending')"
      glow="90% 70% at 60% 6%"
      min-height="min(72vh, 640px)"
    >
      <Breadcrumbs
        :crumbs="[
          { label: t('ia.universe.label'), to: to('universe') },
          { label: t('ia.universe.unaligned.label') },
        ]"
      />
      <h1 class="una__title">{{ t('unaligned.hero.title') }}</h1>
      <p class="una__lede">{{ t('unaligned.hero.lede') }}</p>
      <MonoLabel tone="faint">{{ t('unaligned.areaName') }}</MonoLabel>
      <SectionIndex :sections="sections" />
    </PageHero>

    <ScrollSpyRail :sections="sections" />

    <section id="lux" tabindex="-1" class="l-band l-band--line-top">
      <div class="l-wrap">
        <SectionMarker id="lux" :index="1" :total="3" heading="LuX" />
        <MonoLabel tone="faint">{{ t('universe.anyFaction') }}</MonoLabel>

        <div v-if="lux" class="una__feature">
          <div class="una__feature-art">
            <ArtFrame
              :art="lux.art"
              ratio="3 / 4"
              radius="m"
              :placeholder="t('unaligned.luxArtPlaceholder')"
            />
          </div>
          <div class="una__feature-body">
            <p class="una__epithet">{{ lux.epithet }}</p>
            <h3 class="una__name">{{ lux.name }}</h3>
            <p class="una__body">{{ t('unaligned.lux.body') }}</p>
            <p class="una__body">
              {{ luxBrand?.programCount ?? 10 }} {{ t('unaligned.lux.brandLine') }}
            </p>
            <div class="l-row una__gap">
              <UiButton :to="to('character', { characterId: lux.id })">
                {{ t('unaligned.lux.ctaPage') }}
              </UiButton>
              <UiButton variant="quiet" :to="{ hash: '#personal-brands' }">
                {{ t('unaligned.lux.ctaPrograms') }}
              </UiButton>
            </div>
          </div>
        </div>

        <BandFoot :to="{ hash: '#earned' }" :label="t('unaligned.exitEarned')" />
      </div>
    </section>

    <section id="earned" tabindex="-1" class="l-band l-band--alt l-band--line-top">
      <div class="l-wrap">
        <SectionMarker id="earned" :index="2" :total="3" :heading="t('unaligned.sections.earned')" />
        <MonoLabel tone="faint">{{ t('unaligned.collectiveTerm') }}</MonoLabel>
        <p class="una__body">{{ t('unaligned.earned.body') }}</p>

        <div class="l-grid l-grid--tiles una__gap">
          <EntityTile
            v-for="character in earned"
            :key="character.id"
            :to="to('character', { characterId: character.id })"
            :art="character.art"
            :badge="sealedBadge(character.fromRogueAIId)"
            :epithet="character.epithet"
            :name="character.name"
            :tags="[{ label: t('universe.anyFaction'), color: null }]"
            :placeholder="t('universe.artPlaceholder')"
          />
          <div class="una__more">
            <MonoLabel tone="faint">{{ t('unaligned.earned.moreKicker') }}</MonoLabel>
            <p class="una__more-count">{{ t('unaligned.earned.moreCount') }}</p>
          </div>
        </div>

        <p class="una__note">{{ t('unaligned.earned.note') }}</p>

        <BandFoot :to="to('incursions')" :label="t('unaligned.exitIncursions')" />
      </div>
    </section>

    <section id="personal-brands" tabindex="-1" class="l-band l-band--line-top">
      <div class="l-wrap">
        <SectionMarker
          id="personal-brands"
          :index="3"
          :total="3"
          :heading="t('unaligned.sections.brands')"
        />
        <MonoLabel tone="faint">{{ t('unaligned.brands.note') }}</MonoLabel>
        <p class="una__body">{{ t('unaligned.brands.body') }}</p>

        <div class="l-grid l-grid--wide una__gap">
          <article class="una__brand">
            <MonoLabel tone="faint">
              LuX · {{ luxBrand?.programCount ?? 10 }} {{ t('faction.stats.programs') }}
            </MonoLabel>
            <h3 class="una__brand-title">
              <BrandMark
                :icon="luxBrand?.icon"
                :name="t('unaligned.brands.luxTitle')"
                :size="52"
              />
              {{ t('unaligned.brands.luxTitle') }}
            </h3>
            <p class="una__body">{{ t('unaligned.brands.luxBody') }}</p>
            <ul class="una__slots">
              <li v-for="n in luxBrand?.programCount ?? 10" :key="n">
                {{ String(n).padStart(2, '0') }}
              </li>
            </ul>
          </article>

          <article class="una__brand">
            <MonoLabel tone="faint">{{ t('unaligned.brands.miniKicker') }}</MonoLabel>
            <h3 class="una__brand-title">{{ t('unaligned.brands.miniTitle') }}</h3>
            <p class="una__body">{{ t('unaligned.brands.miniBody') }}</p>
            <MonoLabel tone="faint" class="una__gap">{{ t('unaligned.brands.miniCount') }}</MonoLabel>
            <UiButton
              variant="quiet"
              :to="to('cards', {}, { query: { faction: 'unaligned' } })"
              class="una__gap"
            >
              {{ t('unaligned.brands.ctaGallery') }}
            </UiButton>
          </article>
        </div>

        <BandFoot :to="to('universe')" :label="t('characters.exitUniverse')" />
      </div>
    </section>
  </div>
</template>

<style>
.una__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
  max-width: 26ch;
}

.una__lede,
.una__body {
  margin-top: var(--space-4);
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.una__gap {
  margin-top: var(--space-5);
}

.una__feature {
  margin-top: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: clamp(24px, 4vw, 48px);
  align-items: flex-start;
}

.una__feature-art {
  flex: 0 0 min(100%, 280px);
}

.una__feature-body {
  flex: 1 1 320px;
  min-width: 0;
}

.una__epithet {
  font-size: var(--size-body-l);
  color: var(--color-ink-muted);
}

.una__name {
  margin-top: var(--space-2);
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 4vw, 2.25rem);
}

.una__note {
  margin-top: var(--space-6);
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-faint);
}

.una__more {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: var(--space-2);
  min-height: 200px;
  border: 1px dashed var(--color-line-strong);
  border-radius: var(--radius-l);
  text-align: center;
}

.una__more-count {
  font-size: var(--size-s);
  color: var(--color-ink-faint);
}

.una__brand {
  padding: clamp(20px, 3vw, 28px);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
}

.una__brand-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 400;
}

.una__slots {
  margin-top: var(--space-5);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: var(--space-2);
  list-style: none;
}

.una__slots li {
  display: grid;
  place-items: center;
  aspect-ratio: 63 / 88;
  border: 1px dashed var(--color-line-dashed);
  border-radius: var(--radius-s);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  color: var(--color-ink-faint);
}
</style>
