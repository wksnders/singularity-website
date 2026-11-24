<script setup lang="ts">
import BrandMark from '@/components/atoms/BrandMark.vue';
import CardImage from '@/components/atoms/CardImage.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import { t } from '@/content';
import { brandById, characters, factions, programsOfBrand, universalHeroArt } from '@/data/universe';
import { CARD_PARAM } from '@/composables/useCardParam';
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
const spectrumText = [...factions, factions[0]].map((f) => f.colorText).join(', ');

const typeLine = (card: Program) => (card.subType ? `${card.type} · ${card.subType}` : card.type);
</script>

<template>
  <div class="una" :style="{ '--spectrum': spectrum, '--spectrum-text': spectrumText }">
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
      <p class="l-lede unv__band-lede">{{ t('universal.lux.hook') }}</p>

      <div class="unv__split">
        <RouterLink
          :to="to('character', { characterId: lux.id })"
          class="unv__tile unv__tile--lux"
          :aria-label="t('universal.lux.ctaPage')"
        >
          <span class="unv__ring">
            <CardImage
              :art="lux.cardArt"
              :placeholder="t('character.cardArtPlaceholder')"
              radius="m"
              :sizes="scaledSizes('(min-width: 760px) 300px, 320px')"
            />
          </span>
          <span class="unv__tile-name">{{ lux.name }} <span class="unv__go" aria-hidden="true">→</span></span>
          <span class="unv__tile-sub unv__tile-sub--spectrum">{{ lux.epithet }}</span>
        </RouterLink>

        <div v-if="vault" id="personal-brands" tabindex="-1">
          <RouterLink :to="to('brand', { brandId: vault.id })" class="unv__vault-link">
            <BrandMark :icon="vault.icon" :name="vault.name" :size="40" />
            <span>{{ vault.name }}</span>
            <span aria-hidden="true">→</span>
          </RouterLink>

          <ul class="unv__cards">
            <li v-for="card in vaultCards" :key="card.slug">
              <RouterLink
                :to="to('brand', { brandId: vault.id }, { query: { [CARD_PARAM]: card.slug } })"
                class="unv__tile"
              >
                <CardImage
                  v-if="card.cardArt.src"
                  :art="card.cardArt"
                  :placeholder="t('cards.artPlaceholder')"
                  radius="m"
                  :sizes="scaledSizes('(min-width: 1024px) 150px, (min-width: 760px) 20vw, 50vw')"
                />
                <span v-else class="unv__faceless" aria-hidden="true">
                  <span class="unv__cost">{{ card.cost }}</span>
                  <span class="unv__faceless-name">{{ card.name }}</span>
                  <span>{{ typeLine(card) }}</span>
                </span>
                <span class="unv__tile-name unv__tile-name--card">{{ card.name }}</span>
                <span class="unv__tile-sub">{{ typeLine(card) }}</span>
              </RouterLink>
            </li>
          </ul>
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

.unv__band-lede {
  margin-top: var(--space-5);
  max-width: 36rem;
}

.unv__split {
  display: grid;
  gap: var(--space-10);
  margin-top: var(--space-8);
}

.unv__tile {
  display: block;
  color: var(--color-ink);
  text-decoration: none;
}

.unv__tile > .c-art,
.unv__tile > .unv__ring,
.unv__tile > .unv__faceless {
  box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.45);
  transition: transform 0.2s ease;
}

.unv__tile:hover > .c-art,
.unv__tile:hover > .unv__ring,
.unv__tile:hover > .unv__faceless {
  transform: translateY(-0.25rem);
}

.unv__tile--lux {
  max-width: 20rem;
}

.unv__ring {
  display: block;
  padding: 3px;
  border-radius: calc(var(--radius-m) + 3px);
  background: conic-gradient(from 200deg, var(--spectrum));
}

.unv__tile-name {
  display: block;
  margin-top: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 700;
}

.unv__tile-name--card {
  font-size: var(--size-body-l);
}

.unv__go {
  display: inline-block;
  margin-left: 0.25rem;
  font-family: var(--font-body);
  font-weight: 400;
  color: var(--color-accent);
  transition: transform 0.2s ease;
}

.unv__tile:hover .unv__go {
  transform: translateX(0.25rem);
}

.unv__tile-sub {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--size-s);
  color: var(--color-ink-soft);
}

/* The text tints, not the brand colours: the purple alone falls under 4.5:1 at this size. */
.unv__tile-sub--spectrum {
  font-size: var(--size-m);
  background: linear-gradient(90deg, var(--spectrum-text));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-6) var(--space-4);
  list-style: none;
}

.unv__faceless {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  aspect-ratio: var(--ratio-card);
  padding: 0.85rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-m);
  background: var(--color-surface-raised);
  font-size: var(--size-s);
  line-height: 1.3;
  color: var(--color-ink-soft);
}

.unv__faceless-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--size-body-l);
  line-height: 1.15;
  color: var(--color-ink);
}

.unv__cost {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 2px solid transparent;
  border-radius: 50%;
  background:
    linear-gradient(var(--color-surface-raised), var(--color-surface-raised)) padding-box,
    conic-gradient(from 200deg, var(--spectrum)) border-box;
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-ink);
}

@media (prefers-reduced-motion: reduce) {
  .unv__tile > *,
  .unv__go {
    transition: none;
  }
}

@media (min-width: 47.5em) {
  .unv__split {
    grid-template-columns: minmax(0, 4fr) minmax(0, 9fr);
    align-items: start;
  }

  .unv__tile--lux {
    max-width: none;
  }

  .unv__cards {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 64em) {
  .unv__cards {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
