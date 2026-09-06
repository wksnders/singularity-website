<script setup lang="ts">

import { computed } from 'vue';
import BrandMark from '@/components/atoms/BrandMark.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import TbdValue from '@/components/atoms/TbdValue.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import MarkdownBlock from '@/components/molecules/MarkdownBlock.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import { useDocumentTitle } from '@/composables/useDocumentTitle';
import { docHtml, getDoc, metaString, t } from '@/content';
import { game, rogueAIById, rogueAIs } from '@/data/universe';
import { to } from '@/site/links';
import type { SectionEntry } from '@/site/sections';

const props = defineProps<{ aiId: string }>();

const ai = computed(() => rogueAIById(props.aiId));
const position = computed(() => rogueAIs.findIndex((entry) => entry.id === props.aiId) + 1);

const others = computed(() => rogueAIs.filter((entry) => entry.id !== props.aiId));

const slug = computed(() => `universe/incursions/${props.aiId}`);
const doc = computed(() => getDoc(slug.value));
const hasLore = computed(() => Boolean(docHtml(doc.value)));
const challenge = computed(() =>
  metaString(doc.value, 'challenge', t('incursion.challengePlaceholder')),
);

const sections = computed<SectionEntry[]>(() => [
  { id: 'lore', label: t('incursion.sections.lore') },
  { id: 'challenge', label: t('incursion.sections.challenge') },
  { id: 'fights', label: t('incursion.sections.fights') },
  { id: 'exits', label: t('incursion.sections.exits') },
]);

const pad = (n: number) => String(n).padStart(2, '0');

useDocumentTitle(() => ai.value?.name ?? t('incursion.missingTitle'));
</script>

<template>
  <div v-if="ai" class="inc1">
    <PageHero
      :art="ai.art"
      :placeholder="t('incursion.hero.artPlaceholder')"
      :pending-note="t('incursion.hero.pending')"
      glow="100% 80% at 24% 6%"
      min-height="min(72dvh, 640px)"
    >
      <Breadcrumbs
        :crumbs="[
          { label: t('ia.universe.label'), to: to('universe') },
          { label: t('ia.universe.incursions.label'), to: to('incursions') },
          { label: ai.name },
        ]"
      />
      <MonoLabel tone="faint">{{ t('incursion.hero.kind') }}</MonoLabel>
      <h1 class="inc1__title">
        <BrandMark :icon="ai.brand" :name="ai.name" :size="44" />
        {{ ai.name }}
      </h1>
      <p class="inc1__lede">{{ t('incursion.hero.taglinePlaceholder') }}</p>

      <p class="inc1__facts">
        <span>{{ t('ia.universe.incursions.label') }}</span>
        <span>{{ game.incursionsPlayers }} {{ t('home.incursions.players') }}</span>
        <span>{{ game.playTime }}</span>
        <span>
          {{ t('incursion.hero.position') }} {{ pad(position) }}
          {{ t('brand.of') }} {{ pad(rogueAIs.length) }}
        </span>
      </p>

      <SectionIndex :sections="sections" />
    </PageHero>

    <ScrollSpyRail :sections="sections" />

    <section id="lore" tabindex="-1" class="l-band l-band--line-top">
      <div class="l-wrap">
        <SectionMarker id="lore" :index="1" :total="4" :heading="t('incursion.sections.lore')" />
        <MonoLabel tone="faint">{{ t('incursion.loreNote') }}</MonoLabel>
        <MarkdownBlock v-if="hasLore" :slug="slug" measure class="inc1__lore" />
        <p v-else class="inc1__body">{{ t('incursion.lorePlaceholder') }}</p>

        <BandFoot :to="to('incursions', {}, { hash: '#threat' })" :label="t('incursions.exitHow')" />
      </div>
    </section>

    <section id="challenge" tabindex="-1" class="l-band l-band--alt l-band--line-top">
      <div class="l-wrap">
        <SectionMarker
          id="challenge"
          :index="2"
          :total="4"
          :heading="t('incursion.sections.challenge')"
        />
        <MonoLabel tone="faint">{{ t('incursion.challengeNote') }}</MonoLabel>
        <p class="inc1__body inc1__challenge">{{ challenge }}</p>
      </div>
    </section>

    <section id="fights" tabindex="-1" class="l-band l-band--line-top">
      <div class="l-wrap">
        <SectionMarker
          id="fights"
          :index="3"
          :total="4"
          :heading="t('incursion.sections.fights')"
        />
        <MonoLabel tone="faint">{{ t('incursion.fightsNote') }}</MonoLabel>
        <p class="inc1__body">{{ t('incursion.fightsPlaceholder') }}</p>

        <div class="l-split inc1__gap">
          <div class="l-split__main">
            <MonoLabel tone="faint">{{ t('incursion.decidesNote') }}</MonoLabel>
            <p class="inc1__body">{{ t('incursion.decidesPlaceholder') }}</p>
          </div>

          <div class="l-split__aside inc1__mutations">
            <MonoLabel tone="faint">{{ t('incursion.mutationsLabel') }}</MonoLabel>
            <TbdValue />
            <p class="inc1__aside">{{ t('incursion.mutationsNote') }}</p>
          </div>
        </div>

        <BandFoot
          :to="to('incursions', {}, { hash: '#mutations' })"
          :label="t('incursions.sections.mutations')"
        />
      </div>
    </section>

    <section id="exits" tabindex="-1" class="l-band l-band--alt l-band--line-top">
      <div class="l-wrap">
        <SectionMarker id="exits" :index="4" :total="4" :heading="t('incursion.sections.exits')" />
        <MonoLabel tone="faint">{{ t('incursion.exitsOthers') }}</MonoLabel>

        <ul class="l-grid inc1__gap">
          <li v-for="other in others" :key="other.id" class="inc1__exit">
            <MonoLabel tone="faint">{{ t('incursion.hero.kind') }}</MonoLabel>
            <h3 class="inc1__exit-name">
              <RouterLink :to="to('incursion', { aiId: other.id })">{{ other.name }}</RouterLink>
            </h3>
            <p class="inc1__body">{{ t('incursion.hero.taglinePlaceholder') }}</p>
          </li>

          <li class="inc1__exit">
            <MonoLabel tone="faint">{{ t('incursion.exitsMode') }}</MonoLabel>
            <h3 class="inc1__exit-name">
              <RouterLink :to="to('incursions')">{{ t('incursion.modeTitle') }}</RouterLink>
            </h3>
            <p class="inc1__body">{{ t('incursion.modeBody') }}</p>
          </li>
        </ul>

        <BandFoot
          :to="to('learn', {}, { hash: '#paths' })"
          :label="t('incursion.exitLearn')"
        />
      </div>
    </section>
  </div>

  <section v-else class="l-band">
    <div class="l-wrap l-wrap--reading">
      <EmptyState :title="t('incursion.missingTitle')" :body="t('incursion.missingBody')" />
    </div>
  </section>
</template>

<style>
.inc1 {
  --faction: var(--color-threat);
  --faction-text: var(--color-threat-text);
}

.inc1__title {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
  font-size: clamp(2rem, 6.4vw, 4rem);
}

.inc1__lede {
  margin-top: var(--space-4);
  max-width: 60ch;
  font-size: var(--size-body-l);
  color: var(--color-ink-muted);
}

.inc1__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
  margin-top: var(--space-5);
  font-family: var(--font-mono);
  font-size: var(--size-s);
  color: var(--color-ink-soft);
}

.inc1__body,
.inc1__lore {
  margin-top: var(--space-4);
  max-width: 62ch;
}

.inc1__gap {
  margin-top: var(--space-6);
}

.inc1__mutations {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
}

.inc1__aside {
  color: var(--color-ink-soft);
}

.inc1__exit {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.inc1__exit-name {
  font-size: var(--size-body-l);
}

.inc1__challenge {
  font-size: var(--size-body-l);
  color: var(--color-ink);
}
</style>
