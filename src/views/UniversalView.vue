<script setup lang="ts">
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import CardImage from '@/components/atoms/CardImage.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import { t } from '@/content';
import { brandById, characters, factions, programsOfBrand, universalHeroArt } from '@/data/universe';
import { pictureSources, to } from '@/site/links';
import { scaledSizes } from '@/site/pageScale';
import type { Program } from '@/data/types';

/* Same as LearnView's: both heroes' art is 14:9, so the crop and the drawn width match. */
const HERO_MIN_HEIGHT = 'max(min(100svh, 64.3vw), min(72svh, 155vw))';
const HERO_SIZES = '(orientation: portrait) 241vw, 100vw';
const heroSources = pictureSources(universalHeroArt.src);

const lux = characters.find((c) => c.id === 'lux') ?? null;
const vault = lux?.personalBrandId ? brandById(lux.personalBrandId) : null;
const vaultCards = vault ? programsOfBrand(vault.id).filter((card) => card.revealed) : [];

const spectrum = [...factions, factions[0]].map((f) => f.color).join(', ');

const typeLine = (card: Program) => (card.subType ? `${card.type} · ${card.subType}` : card.type);
</script>

<template>
  <div class="una" :style="{ '--spectrum': spectrum }">
    <PageHero
      id="universal-hero"
      class="unv__hero"
      :art="universalHeroArt"
      :sources="heroSources"
      :sizes="HERO_SIZES"
      :min-height="HERO_MIN_HEIGHT"
      tone="bright"
    >
      <Breadcrumbs
        :crumbs="[
          { label: t('ia.universe.label'), to: to('universe') },
          { label: t('ia.universe.universal.label') },
        ]"
      />
      <h1 class="l-page-title unv__title">{{ t('universal.hero.title') }}</h1>
      <p class="l-lede unv__lede">{{ t('universal.hero.lede') }}</p>
    </PageHero>

    <SectionBand v-if="lux" id="lux" class="l-band--line-top" :heading="lux.name">
      <div class="unv__feature">
        <RouterLink
          :to="to('character', { characterId: lux.id })"
          class="unv__feature-art"
          :aria-label="t('universal.lux.ctaPage')"
        >
          <ArtFrame
            :art="lux.sceneArt"
            ratio="auto"
            radius="l"
            :focal="{ x: 0.45, y: 0.55 }"
            :placeholder="t('universal.luxArtPlaceholder')"
            :sources="pictureSources(lux.sceneArt.src)"
            :sizes="scaledSizes('(min-width: 720px) 420px, 100vw')"
          />
        </RouterLink>

        <div class="unv__feature-body">
          <p class="unv__hook">{{ t('universal.lux.hook') }}</p>

          <div v-if="vault" id="personal-brands" tabindex="-1" class="unv__vault">
            <RouterLink :to="to('brand', { brandId: vault.id })" class="unv__vault-link">
              <BrandMark :icon="vault.icon" :name="vault.name" :size="40" />
              <span>{{ vault.name }}</span>
              <span aria-hidden="true">→</span>
            </RouterLink>

            <ul class="unv__cards">
              <li v-for="card in vaultCards" :key="card.slug">
                <CardImage
                  v-if="card.cardArt.src"
                  :art="card.cardArt"
                  :placeholder="t('cards.artPlaceholder')"
                  :sizes="scaledSizes('(min-width: 720px) 120px, 33vw')"
                />
                <div v-else class="unv__faceless">
                  <span class="unv__cost">{{ card.cost }}</span>
                  <span class="unv__faceless-name">{{ card.name }}</span>
                  <span>{{ typeLine(card) }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </SectionBand>
  </div>
</template>

<style>
/* The breadcrumb sits above the bright tone's dark band, so this hero's scrim rises to hold it at 4.5:1 over this art. */
.unv__hero.c-hero--bright .c-hero__scrim {
  background: linear-gradient(
    to top,
    var(--color-bg) 0%,
    rgba(var(--rgb-bg), 0.9) 24%,
    rgba(var(--rgb-bg), 0.82) 42%,
    rgba(var(--rgb-bg), 0.35) 60%,
    transparent 76%
  );
}

.unv__title {
  max-width: 16ch;
}

.unv__lede {
  margin-top: var(--space-4);
  max-width: 36rem;
}

.unv__feature {
  display: grid;
  gap: var(--space-8);
}

.unv__feature-art {
  display: block;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-l);
  overflow: hidden;
  box-shadow: 0 1.5rem 3rem rgba(0, 0, 0, 0.45);
}

.unv__feature-art > .c-art {
  height: 100%;
}

.unv__hook {
  max-width: 24ch;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  line-height: 1.15;
}

.unv__vault {
  margin-top: var(--space-8);
}

.unv__vault-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--size-h3);
  color: var(--color-ink);
  text-decoration: none;
}

.unv__vault-link:hover > span:first-of-type {
  text-decoration: underline;
}

.unv__cards {
  margin-top: var(--space-5);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  list-style: none;
}

.unv__faceless {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  aspect-ratio: var(--ratio-card);
  padding: 0.6rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-s);
  background: var(--color-surface-raised);
  font-size: var(--size-label-xs);
  line-height: 1.3;
  color: var(--color-ink-soft);
}

.unv__faceless-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--size-s);
  line-height: 1.15;
  color: var(--color-ink);
}

.unv__cost {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid transparent;
  border-radius: 50%;
  background:
    linear-gradient(var(--color-surface-raised), var(--color-surface-raised)) padding-box,
    conic-gradient(from 200deg, var(--spectrum)) border-box;
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-ink);
}

@media (min-width: 45em) {
  .unv__feature {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: center;
    gap: var(--space-12);
  }

  .unv__feature-art {
    aspect-ratio: 4 / 5;
  }

  .unv__cards {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
