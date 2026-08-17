<script setup lang="ts">
/**
 * INCURSIONS — the public co-op lore page. Readable by anyone who has not
 * bought the expansion. The threat accent is deliberately NOT a faction colour:
 * rogue AIs sit outside the faction system.
 */
import { computed } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import MarkdownBlock from '@/components/molecules/MarkdownBlock.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import { docHtml, getDoc, t } from '@/content';
import { game, rogueAIs } from '@/data/universe';
import { outbound, to } from '@/site/links';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'threat', label: t('incursions.sections.threat') },
  { id: 'how', label: t('incursions.sections.how') },
  { id: 'roster', label: t('incursions.sections.roster') },
  { id: 'unlocks', label: t('incursions.sections.unlocks') },
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
        <SectionMarker id="threat" :index="1" :total="4" :heading="t('incursions.sections.threat')" />
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
        <SectionMarker id="how" :index="2" :total="4" :heading="t('incursions.sections.how')" />
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
        <SectionMarker id="roster" :index="3" :total="4" :heading="t('incursions.sections.roster')" />
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
                {{ ai.name }}
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

    <section id="unlocks" tabindex="-1" class="l-band l-band--alt l-band--line-top">
      <div class="l-wrap">
        <SectionMarker
          id="unlocks"
          :index="4"
          :total="4"
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
  </div>
</template>

<style>
/* Rogue AIs get the threat accent — never a faction colour. */
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
