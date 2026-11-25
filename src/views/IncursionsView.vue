<script setup lang="ts">

import { computed } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import IncursionsHero from '@/components/organisms/IncursionsHero.vue';
import { getDoc, metaString, t } from '@/content';
import { firstParagraph } from '@/content/excerpt';
import { architechDesigns } from '@/data/programs';
import { bossGroups, bosses, dominationPack, rogueAIs } from '@/data/universe';
import { pad } from '@/site/format';
import { isHidden, pictureSources, to } from '@/site/links';
import { scaledSizes } from '@/site/pageScale';
import type { SectionEntry } from '@/site/sections';

/* Matches .inc__bosses: two columns, four from 47.5em, inside the 70rem content column. */
const BOSS_SIZES = '(min-width: 70em) 266px, (min-width: 47.5em) 23vw, 45vw';
const PACK_SIZES = '(min-width: 387px) 240px, 62vw';

const encounters = computed(() =>
  rogueAIs.map((ai) => {
    const doc = getDoc(`universe/incursions/${ai.id}`);
    const ids = bossGroups.find((group) => group.encounterId === ai.id)?.bossIds ?? [];
    return {
      id: ai.id,
      name: ai.name,
      brand: ai.brand,
      challenge: metaString(doc, 'challenge'),
      lore: firstParagraph(doc?.body ?? ''),
      bosses: ids.flatMap((id) => bosses.filter((boss) => boss.id === id)),
    };
  }),
);

const sections = computed<SectionEntry[]>(() => [
  ...encounters.value.map((encounter) => ({ id: encounter.id, label: encounter.name })),
  { id: 'mutations', label: t('incursions.sections.mutations') },
  { id: 'unlocks', label: t('incursions.sections.unlocks') },
  { id: 'next', label: t('incursions.sections.next') },
]);

const dials = computed(() =>
  ['base', 'stack', 'max'].map((key, index) => ({
    index: pad(index + 1),
    kicker: t(`incursions.mutations.${key}.kicker`),
    title: t(`incursions.mutations.${key}.title`),
    body: t(`incursions.mutations.${key}.body`),
  })),
);

const exits = computed(() =>
  [
    { key: 'learn', to: to('learn', {}, { hash: '#paths' }) },
    { key: 'cards', to: to('cards') },
    { key: 'story', to: to('story') },
  ]
    .filter((exit) => !isHidden(exit.to))
    .map((exit) => ({
      ...exit,
      kicker: t(`incursions.next.${exit.key}.kicker`),
      title: t(`incursions.next.${exit.key}.title`),
      body: t(`incursions.next.${exit.key}.body`),
    })),
);
</script>

<template>
  <div class="inc">
    <IncursionsHero />

    <ScrollSpyRail :sections="sections" />

    <!-- #roster is a public anchor: the hero and outside links land on the first encounter through it. -->
    <div id="roster" tabindex="-1">
      <SectionBand
        v-for="(encounter, index) in encounters"
        :id="encounter.id"
        :key="encounter.id"
        class="l-band--line-top"
        :class="{ 'l-band--alt': index % 2 }"
        :heading="encounter.name"
      >
        <p v-if="encounter.challenge" class="l-lede inc__body">{{ encounter.challenge }}</p>
        <p v-if="encounter.lore" class="inc__lore">{{ encounter.lore }}</p>

        <ul class="inc__bosses">
          <li v-for="boss in encounter.bosses" :key="boss.id" class="inc__boss">
            <ArtFrame
              :art="boss.art"
              ratio="5 / 7"
              radius="m"
              :placeholder="t('incursions.roster.artPlaceholder')"
              :sources="pictureSources(boss.art.src)"
              :sizes="scaledSizes(BOSS_SIZES)"
            />
            <h3 class="inc__boss-name">
              {{ boss.name }}
              <span class="inc__boss-epithet">{{ boss.epithet }}</span>
            </h3>
          </li>
        </ul>

        <BandFoot :to="to('incursion', { aiId: encounter.id })" :label="t('incursions.encounterMore')" />
      </SectionBand>
    </div>

    <SectionBand
      id="mutations"
      class="l-band--alt l-band--line-top"
      :heading="t('incursions.sections.mutations')"
    >
      <p class="l-lede inc__body">{{ t('incursions.mutations.body') }}</p>

      <ol class="inc__steps">
        <li v-for="dial in dials" :key="dial.index" class="l-surface">
          <MonoLabel tone="faint">{{ dial.index }} · {{ dial.kicker }}</MonoLabel>
          <h3 class="inc__step-title">{{ dial.title }}</h3>
          <p class="inc__step-body">{{ dial.body }}</p>
        </li>
      </ol>

      <div class="inc__designs">
        <MonoLabel tone="faint">
          {{ architechDesigns.length }} {{ t('incursions.mutations.designs.designs') }} ·
          {{ t('incursions.mutations.designs.setNote') }}
        </MonoLabel>
        <h3 class="inc__step-title">{{ t('incursions.mutations.designs.title') }}</h3>
        <p class="l-lede inc__body">{{ t('incursions.mutations.designs.body') }}</p>
      </div>

      <BandFoot :to="to('cards')" :label="t('incursions.mutations.designs.exit')" />
    </SectionBand>

    <SectionBand
      id="unlocks"
      class="l-band--line-top inc__prize-band"
      :heading="t('incursions.sections.unlocks')"
    >
      <div class="inc__prize">
        <MonoLabel tone="faint">{{ t('incursions.unlocks.note') }}</MonoLabel>
        <div class="inc__prize-stage">
          <ArtFrame
            class="inc__pack"
            :class="{ 'inc__pack--render': dominationPack.src }"
            :art="{ ...dominationPack, alt: t('incursions.unlocks.packAlt') }"
            ratio="63 / 88"
            :radius="dominationPack.src ? 'none' : 'm'"
            :placeholder="t('incursions.unlocks.packPlaceholder')"
            :sources="pictureSources(dominationPack.src)"
            :sizes="PACK_SIZES"
          />
        </div>
        <h3 class="inc__prize-title">{{ t('incursions.unlocks.packTitle') }}</h3>
        <p class="inc__prize-lede">{{ t('incursions.unlocks.body1') }}</p>
        <ol class="inc__trials">
          <li v-for="encounter in encounters" :key="encounter.id">
            <RouterLink :to="{ hash: `#${encounter.id}` }" class="inc__trial">
              <BrandMark :icon="encounter.brand" :name="encounter.name" :size="44" />
              <span><span class="inc__trial-kicker">{{ t('incursions.unlocks.defeat') }}</span> {{ encounter.name }}</span>
              <span class="inc__trial-go" aria-hidden="true">↑</span>
            </RouterLink>
          </li>
        </ol>
        <p class="inc__prize-small">{{ t('incursions.unlocks.body2') }}</p>
      </div>
    </SectionBand>

    <SectionBand id="next" class="l-band--alt l-band--line-top" :heading="t('incursions.sections.next')">
      <MonoLabel tone="faint">{{ t('incursions.next.note') }}</MonoLabel>
      <p class="inc__aside">{{ t('incursions.next.prereq') }}</p>

      <ul class="l-grid inc__gap">
        <li v-for="exit in exits" :key="exit.key" class="inc__exit">
          <MonoLabel tone="faint">{{ exit.kicker }}</MonoLabel>
          <h3 class="inc__step-title">
            <RouterLink :to="exit.to">{{ exit.title }}</RouterLink>
          </h3>
          <p class="inc__step-body">{{ exit.body }}</p>
        </li>
      </ul>

      <BandFoot :to="to('universe')" :label="t('characters.exitUniverse')" />
    </SectionBand>
  </div>
</template>

<style>
.inc__designs {
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-line);
}

.inc__exit {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.inc {
  --faction: var(--color-threat);
  --faction-text: var(--color-threat-text);
}

.inc__body {
  margin-top: var(--space-5);
}

.inc__gap {
  margin-top: var(--space-6);
}

.inc__steps {
  margin-top: var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13.75rem, 1fr));
  gap: var(--space-4);
  list-style: none;
  counter-reset: none;
}

.inc__steps li {
  padding: var(--space-5);
}

.inc__step-title {
  margin-top: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 700;
}

.inc__step-body {
  margin-top: var(--space-2);
  font-size: var(--size-m);
  line-height: 1.55;
  color: var(--color-ink-soft);
}

.inc__aside {
  margin-top: var(--space-6);
  padding: var(--space-4) var(--space-5);
  border-left: 0.125rem solid var(--faction);
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-muted);
}

.inc__lore {
  margin-top: var(--space-4);
  max-width: var(--width-reading);
  font-size: var(--size-body);
  line-height: 1.65;
  color: var(--color-ink-soft);
}

.inc__bosses {
  margin-top: var(--space-8);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-6) var(--space-4);
  padding: 0;
  list-style: none;
}

.inc__boss-name {
  margin-top: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 700;
}

.inc__boss-epithet {
  display: block;
  margin-top: var(--space-1);
  font-family: var(--font-body);
  font-size: var(--size-m);
  font-weight: 400;
  color: var(--faction-text);
}

@media (min-width: 47.5em) {
  .inc__bosses {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* The glow behind the pack spills past the column; clipped at the band, not the page, or phones scroll sideways. */
.inc__prize-band {
  overflow-x: clip;
}

.inc__prize {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  text-align: center;
}

.inc__prize-stage {
  position: relative;
  display: grid;
  place-items: center;
  padding-block: var(--space-6);
}

.inc__prize-stage::before {
  content: '';
  position: absolute;
  inset: -10% -60%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(var(--rgb-threat), 0.5), rgba(var(--rgb-threat), 0.12) 60%, transparent);
  filter: blur(1.5rem);
  pointer-events: none;
}

.inc__pack {
  position: relative;
  width: min(62vw, 15rem);
  rotate: -4deg;
  box-shadow: var(--elevation-2), 0 0 2rem rgba(var(--rgb-threat), 0.55), 0 0 0 1px rgba(var(--rgb-threat), 0.6);
}

.inc__pack.inc__pack--render {
  rotate: none;
  background: transparent;
  box-shadow: none;
  filter: drop-shadow(0 1rem 1.25rem rgba(0, 0, 0, 0.55));
}

.inc__prize-title {
  font-family: var(--font-display);
  font-size: clamp(2.25rem, 6vw, 3.75rem);
  font-weight: 700;
  line-height: 0.95;
  color: var(--color-threat-text);
}

.inc__prize-lede {
  max-width: 34rem;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.inc__trials {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
  padding: 0;
  list-style: none;
}

.inc__trial {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-5) var(--space-2) var(--space-2);
  border: 1px solid rgba(var(--rgb-threat), 0.5);
  border-radius: var(--radius-pill);
  background: rgba(var(--rgb-threat), 0.08);
  font-weight: 600;
  color: var(--color-ink);
  text-decoration: none;
  transition:
    background-color var(--dur-2) var(--ease-out),
    border-color var(--dur-2) var(--ease-out);
}

.inc__trial:hover {
  border-color: var(--color-threat);
  background: rgba(var(--rgb-threat), 0.2);
}

.inc__trial-go {
  color: var(--color-threat-text);
}

.inc__trial-kicker {
  margin-right: var(--space-1);
  font-family: var(--font-label);
  font-size: var(--size-label-xs);
  font-weight: 500;
  letter-spacing: var(--track-label);
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.inc__prize-small {
  font-size: var(--size-s);
  color: var(--color-ink-muted);
}
</style>
