<script setup lang="ts">
/**
 * INCURSIONS: the public co-op lore page.
 */
import { computed } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import TbdValue from '@/components/atoms/TbdValue.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import MarkdownBlock from '@/components/molecules/MarkdownBlock.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import { docHtml, getDoc, t } from '@/content';
import { architechDesigns } from '@/data/programs';
import { game, rogueAIs } from '@/data/universe';
import { expandIcons } from '@/site/cardText';
import { outbound, to } from '@/site/links';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'threat', label: t('incursions.sections.threat') },
  { id: 'how', label: t('incursions.sections.how') },
  { id: 'roster', label: t('incursions.sections.roster') },
  { id: 'mutations', label: t('incursions.sections.mutations') },
  { id: 'unlocks', label: t('incursions.sections.unlocks') },
  { id: 'next', label: t('incursions.sections.next') },
]);

const loreDoc = computed(() => getDoc('universe/incursions'));
const hasLore = computed(() => Boolean(docHtml(loreDoc.value)));

const steps = computed(() =>
  ['setup', 'reveal', 'answer', 'escalate'].map((key, index) => ({
    index: String(index + 1).padStart(2, '0'),
    title: t(`incursions.how.${key}.title`),
    body: t(`incursions.how.${key}.body`),
  })),
);

const ritual = computed(() =>
  ['run', 'win', 'cut', 'play'].map((key) => t(`incursions.ritual.${key}`)),
);

const dials = computed(() =>
  ['base', 'stack', 'max'].map((key, index) => ({
    index: pad(index + 1),
    kicker: t(`incursions.mutations.${key}.kicker`),
    title: t(`incursions.mutations.${key}.title`),
    body: t(`incursions.mutations.${key}.body`),
  })),
);

const designs = computed(() => architechDesigns.slice(0, 4));

const exits = computed(() =>
  [
    { key: 'learn', to: to('learn', {}, { hash: '#paths' }) },
    { key: 'cards', to: to('cards') },
    { key: 'story', to: to('story') },
  ].map((exit) => ({
    ...exit,
    kicker: t(`incursions.next.${exit.key}.kicker`),
    title: t(`incursions.next.${exit.key}.title`),
    body: t(`incursions.next.${exit.key}.body`),
  })),
);

const pad = (n: number) => String(n).padStart(2, '0');
</script>

<template>
  <div class="inc">
    <PageHero
      :placeholder="t('incursions.hero.artPlaceholder')"
      :pending-note="t('incursions.hero.pending')"
      glow="100% 80% at 24% 6%"
      min-height="min(78dvh, 700px)"
    >
      <Breadcrumbs
        :crumbs="[
          { label: t('ia.universe.label'), to: to('universe') },
          { label: t('ia.universe.incursions.label') },
        ]"
      />
      <span class="inc__badge">
        {{ t('ia.universe.incursions.label') }} · {{ game.incursionsPlayers }}
        {{ t('home.incursions.players') }} · {{ t('home.incursions.badge') }}
      </span>
      <h1 class="inc__title">{{ t('incursions.hero.title') }}</h1>
      <p class="inc__lede">{{ t('incursions.hero.lede') }}</p>
      <SectionIndex :sections="sections" />
    </PageHero>

    <ScrollSpyRail :sections="sections" />

    <section id="threat" tabindex="-1" class="l-band l-band--line-top">
      <div class="l-wrap">
        <SectionMarker id="threat" :index="1" :total="6" :heading="t('incursions.sections.threat')" />
        <MonoLabel tone="faint">{{ t('incursions.loreNote') }}</MonoLabel>

        <MarkdownBlock v-if="hasLore" slug="universe/incursions" measure class="inc__gap" />
        <div v-else class="inc__prose">
          <p>{{ t('incursions.threat.body1') }}</p>
          <p>{{ t('incursions.threat.body2') }}</p>
        </div>

        <div class="inc__stats">
          <div>
            <p class="inc__stat-value">{{ game.incursionsPlayers }}</p>
            <MonoLabel tone="faint">{{ t('home.incursions.players') }}</MonoLabel>
          </div>
          <div>
            <p class="inc__stat-value">30 min</p>
            <MonoLabel tone="faint">{{ t('incursions.perPlayer') }}</MonoLabel>
          </div>
          <div>
            <p class="inc__stat-value">{{ t('incursions.noGm') }}</p>
            <MonoLabel tone="faint">{{ t('incursions.bossPlaysItself') }}</MonoLabel>
          </div>
        </div>

        <BandFoot :to="{ hash: '#how' }" :label="t('incursions.exitHow')" />
      </div>
    </section>

    <section id="how" tabindex="-1" class="l-band l-band--alt l-band--line-top">
      <div class="l-wrap">
        <SectionMarker id="how" :index="2" :total="6" :heading="t('incursions.sections.how')" />
        <MonoLabel tone="faint">{{ t('incursions.how.note') }}</MonoLabel>
        <p class="inc__body">{{ t('incursions.how.body') }}</p>

        <ol class="inc__steps">
          <li v-for="step in steps" :key="step.index">
            <MonoLabel tone="faint">{{ step.index }}</MonoLabel>
            <h3 class="inc__step-title">{{ step.title }}</h3>
            <p class="inc__step-body">{{ step.body }}</p>
          </li>
        </ol>

        <p class="inc__aside">{{ t('incursions.how.prereq') }}</p>

        <BandFoot :to="to('learn', {}, { hash: '#paths' })" :label="t('incursions.exitTrack')" />
      </div>
    </section>

    <section id="roster" tabindex="-1" class="l-band l-band--line-top">
      <div class="l-wrap">
        <SectionMarker id="roster" :index="3" :total="6" :heading="t('incursions.sections.roster')" />
        <MonoLabel tone="faint">{{ t('incursions.roster.note') }}</MonoLabel>
        <p class="inc__body">{{ t('incursions.roster.body') }}</p>

        <div class="l-grid inc__gap">
          <article v-for="(ai, index) in rogueAIs" :key="ai.id" class="inc__boss">
            <ArtFrame
              :art="ai.art"
              ratio="3 / 4"
              radius="m"
              :placeholder="t('incursions.roster.artPlaceholder')"
            />
            <div class="inc__boss-body">
              <MonoLabel tone="faint">
                {{ t('characters.incursion') }} {{ pad(index + 1) }}
              </MonoLabel>
              <h3 class="inc__boss-name">
                <BrandMark :icon="ai.brand" :name="ai.name" :size="34" />
                <RouterLink :to="to('incursion', { aiId: ai.id })">{{ ai.name }}</RouterLink>
              </h3>
              <p class="inc__step-body">{{ t('incursions.roster.linePlaceholder') }}</p>
            </div>
          </article>
          <div class="inc__more">
            <MonoLabel tone="faint">{{ t('incursions.roster.moreKicker') }}</MonoLabel>
            <p class="inc__more-count">{{ t('incursions.roster.moreCount') }}</p>
          </div>
        </div>

        <BandFoot :to="to('story', {}, { hash: '#ch-02' })" :label="t('incursions.exitChapter')" />
      </div>
    </section>

    <section id="mutations" tabindex="-1" class="l-band l-band--line-top">
      <div class="l-wrap">
        <SectionMarker
          id="mutations"
          :index="4"
          :total="6"
          :heading="t('incursions.sections.mutations')"
        />
        <MonoLabel tone="faint">{{ t('incursions.mutations.note') }}</MonoLabel>
        <p class="inc__body">{{ t('incursions.mutations.body') }}</p>

        <ol class="inc__steps">
          <li v-for="dial in dials" :key="dial.index">
            <MonoLabel tone="faint">{{ dial.index }} · {{ dial.kicker }}</MonoLabel>
            <h3 class="inc__step-title">{{ dial.title }}</h3>
            <p class="inc__step-body">{{ dial.body }}</p>
          </li>
        </ol>

        <ul class="inc__counts">
          <li v-for="ai in rogueAIs" :key="ai.id">
            <TbdValue />
            <MonoLabel tone="faint">
              {{ t('incursions.mutations.countsLabel') }} · {{ ai.name }}
            </MonoLabel>
          </li>
        </ul>
        <p class="inc__aside">{{ t('incursions.mutations.countsNote') }}</p>

        <div class="inc__designs">
          <MonoLabel tone="faint">
            {{ architechDesigns.length }} {{ t('incursions.mutations.designs.designs') }} ·
            {{ t('incursions.mutations.designs.setNote') }}
          </MonoLabel>
          <h3 class="inc__step-title">{{ t('incursions.mutations.designs.title') }}</h3>
          <p class="inc__body">{{ t('incursions.mutations.designs.body') }}</p>

          <ul class="l-grid inc__gap">
            <li v-for="card in designs" :key="card.name" class="inc__design">
              <MonoLabel tone="faint">
                {{ card.type }}<template v-if="card.subType"> · {{ card.subType }}</template>
              </MonoLabel>
              <h4 class="inc__design-name">
                {{ card.name }}
                <span class="inc__design-cost">{{ card.cost }}</span>
              </h4>
              <p v-for="(line, i) in card.rules" :key="i" class="inc__step-body">
                {{ expandIcons(line) }}
              </p>
            </li>
          </ul>
        </div>

        <BandFoot :to="to('cards')" :label="t('incursions.mutations.designs.exit')" />
      </div>
    </section>

    <section id="unlocks" tabindex="-1" class="l-band l-band--alt l-band--line-top">
      <div class="l-wrap">
        <SectionMarker
          id="unlocks"
          :index="5"
          :total="6"
          :heading="t('incursions.sections.unlocks')"
        />
        <MonoLabel tone="faint">{{ t('incursions.unlocks.note') }}</MonoLabel>

        <div class="l-split inc__gap">
          <div class="l-split__main">
            <p class="inc__prose-line">{{ t('incursions.unlocks.body1') }}</p>
            <p class="inc__prose-line">{{ t('incursions.unlocks.body2') }}</p>
            <div class="l-row inc__gap">
              <UiButton :link="outbound('buy')">
                {{ t('incursions.unlocks.ctaBuy') }}
              </UiButton>
            </div>
          </div>

          <div class="l-split__aside inc__ritual">
            <MonoLabel tone="faint">{{ t('incursions.ritual.title') }}</MonoLabel>
            <ol class="inc__ritual-list">
              <li v-for="(step, i) in ritual" :key="i">{{ step }}</li>
            </ol>
            <MonoLabel tone="faint">{{ t('incursions.ritual.note') }}</MonoLabel>
          </div>
        </div>

        <BandFoot :to="to('universe')" :label="t('characters.exitUniverse')" />
      </div>
    </section>

    <section id="next" tabindex="-1" class="l-band l-band--line-top">
      <div class="l-wrap">
        <SectionMarker
          id="next"
          :index="6"
          :total="6"
          :heading="t('incursions.sections.next')"
        />
        <MonoLabel tone="faint">{{ t('incursions.next.note') }}</MonoLabel>

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
      </div>
    </section>
  </div>
</template>

<style>
.inc__counts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
  margin-top: var(--space-6);
  padding: 0;
  list-style: none;
}

.inc__counts li {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.inc__designs {
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-line);
}

.inc__design,
.inc__exit {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.inc__design-name {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
  font-size: var(--size-body-l);
}

.inc__design-cost {
  flex: 0 0 auto;
  font-family: var(--font-mono);
  color: var(--faction-text);
}

.inc {
  --faction: var(--color-threat);
  --faction-text: var(--color-threat-text);
}

.inc__badge {
  display: inline-block;
  margin-top: var(--space-6);
  padding: 6px var(--space-3);
  border: 1px solid rgba(var(--rgb-threat), 0.65);
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  color: var(--color-threat-text);
  white-space: nowrap;
}

.inc__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
  max-width: 26ch;
}

.inc__lede,
.inc__body {
  margin-top: var(--space-5);
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.inc__gap {
  margin-top: var(--space-6);
}

.inc__prose,
.inc__ritual-list {
  margin-top: var(--space-6);
  display: grid;
  gap: var(--space-4);
  max-width: var(--width-reading);
  font-size: var(--size-body-l);
  line-height: 1.65;
  color: var(--color-ink-soft);
}

.inc__prose-line {
  margin-top: var(--space-4);
  max-width: 56ch;
  font-size: var(--size-body-l);
  line-height: 1.65;
  color: var(--color-ink-soft);
}

.inc__stats {
  margin-top: var(--space-8);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
}

.inc__stats > div {
  padding: var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-m);
  border-bottom: 2px solid var(--faction);
}

.inc__stat-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 500;
}

.inc__steps {
  margin-top: var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
  list-style: none;
  counter-reset: none;
}

.inc__steps li {
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
}

.inc__step-title {
  margin-top: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 400;
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
  border-left: 2px solid var(--faction);
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-muted);
}

.inc__boss {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
  overflow: hidden;
  border-bottom: 2px solid var(--faction);
}

.inc__boss-body {
  padding: var(--space-5);
}

.inc__boss-name {
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 400;
}

.inc__more {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: var(--space-2);
  min-height: 200px;
  border: 1px dashed var(--color-line-strong);
  border-radius: var(--radius-l);
  text-align: center;
}

.inc__more-count {
  font-size: var(--size-s);
  color: var(--color-ink-faint);
}

.inc__ritual {
  padding: clamp(20px, 3vw, 28px);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
}

.inc__ritual-list {
  padding-left: 1.2em;
  font-size: var(--size-body);
  list-style: decimal;
}
</style>
