<script setup lang="ts">
/* Each band id is the public URL /learn/modes#<id>. */
import { computed, onMounted } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { t } from '@/content';
import { provideSections } from '@/composables/useSections';
import { to } from '@/site/links';
import { assertModesShape, modeGuides } from '@/site/modes';
import type { SectionEntry } from '@/site/sections';

const guides = computed(() => modeGuides());

const sections = computed<SectionEntry[]>(() =>
  guides.value.map((guide) => ({ id: guide.id, label: guide.name })),
);

provideSections(sections);

onMounted(assertModesShape);
</script>

<template>
  <SecondaryHero glow="80% 60% at 30% 0%">
    <Breadcrumbs
      :crumbs="[{ label: t('ia.learn.label'), to: to('learn') }, { label: t('modes.hero.crumb') }]"
    />
    <h1 class="l-page-title">{{ t('modes.hero.title') }}</h1>
    <p class="l-lede l-lede--wide modes__lede">{{ t('modes.hero.lede') }}</p>
    <SectionIndex :sections="sections" />
  </SecondaryHero>

  <ScrollSpyRail :sections="sections" />

  <SectionBand
    v-for="(guide, i) in guides"
    :id="guide.id"
    :key="guide.id"
    class="l-band--line-top"
    :class="{ 'l-band--alt': i % 2 === 1 }"
    :heading="guide.name"
  >
    <MonoLabel tone="faint">{{ guide.players }}</MonoLabel>
    <p v-for="(text, n) in guide.intro" :key="n" class="l-lede l-lede--wide modes__intro">
      {{ text }}
    </p>

    <div class="modes__parts">
      <div v-for="(part, p) in guide.parts" :key="p" class="modes__part">
        <h3 v-if="part.title" class="modes__title">{{ part.title }}</h3>

        <div class="modes__body">
          <template v-for="(block, b) in part.blocks" :key="b">
            <p v-if="block.kind === 'text'" class="modes__text">{{ block.text }}</p>

            <component
              :is="block.kind === 'steps' ? 'ol' : 'ul'"
              v-else-if="block.kind === 'steps' || block.kind === 'points'"
              class="modes__list"
              :class="`modes__list--${block.kind}`"
            >
              <li v-for="(item, n) in block.items" :key="n" class="modes__item">
                {{ item.text }}
                <ul v-if="item.items?.length" class="modes__sub">
                  <li v-for="(line, s) in item.items" :key="s">{{ line }}</li>
                </ul>
              </li>
            </component>

            <div v-else-if="block.kind === 'note'" class="modes__note">
              <MonoLabel tone="faint">{{ t('modes.note') }}</MonoLabel>
              <p class="modes__note-body">{{ block.text }}</p>
            </div>

            <div v-else class="modes__strategy">
              <MonoLabel tone="accent">{{ t('modes.strategy') }}</MonoLabel>
              <p v-if="block.title" class="modes__strategy-title">{{ block.title }}</p>
              <p class="modes__strategy-body">{{ block.text }}</p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <BandFoot :to="to('rules')" :label="t('modes.exit')" />
  </SectionBand>
</template>

<style>
.modes__lede {
  margin-top: var(--space-5);
}

.modes__intro {
  margin-top: var(--space-3);
}

.modes__parts {
  margin-top: var(--space-8);
  border-bottom: 1px solid var(--color-line);
}

.modes__part {
  display: grid;
  gap: var(--space-3) var(--space-8);
  padding-block: var(--space-6);
  border-top: 1px solid var(--color-line);
}

.modes__title {
  font-size: var(--size-h3);
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  line-height: 1.3;
}

.modes__body {
  max-width: var(--width-reading);
}

.modes__body > * + * {
  margin-top: var(--space-4);
}

.modes__text,
.modes__item {
  font-size: var(--size-body);
  line-height: 1.7;
  color: var(--color-ink);
}

.modes__list {
  padding-left: var(--space-8);
  list-style: none;
}

.modes__list--steps {
  counter-reset: modes-step;
}

.modes__item {
  position: relative;
}

.modes__item + .modes__item {
  margin-top: var(--space-3);
}

.modes__item::before {
  position: absolute;
  left: calc(var(--space-8) * -1);
  color: var(--color-ink-faint);
}

.modes__list--points > .modes__item::before {
  content: '›';
}

/* Never zero-padded: the rules text cites these numerals ("continue from step 1"). */
.modes__list--steps > .modes__item::before {
  counter-increment: modes-step;
  content: counter(modes-step);
  font-family: var(--font-label);
  font-weight: 600;
  letter-spacing: var(--track-label);
}

.modes__sub {
  margin-top: var(--space-2);
  padding-left: var(--space-4);
  border-left: 1px solid var(--color-line-strong);
  list-style: none;
  font-size: var(--size-body-s);
  color: var(--color-ink-muted);
}

.modes__sub li + li {
  margin-top: var(--space-1);
}

.modes__note {
  padding-left: var(--space-4);
  border-left: 1px solid var(--color-line-strong);
}

.modes__note-body {
  margin-top: var(--space-1);
  font-size: var(--size-body-s);
  line-height: 1.65;
  color: var(--color-ink-muted);
}

.modes__strategy {
  padding: var(--space-4);
  border: 1px solid rgba(var(--rgb-accent), 0.28);
  border-radius: var(--radius-m);
  background: var(--color-accent-wash);
}

.modes__strategy-title {
  margin-top: var(--space-2);
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 700;
  line-height: 1.3;
}

.modes__strategy-body {
  margin-top: var(--space-2);
  font-size: var(--size-body);
  line-height: 1.7;
  color: var(--color-ink);
}

@media (min-width: 60em) {
  .modes__part {
    grid-template-columns: 14rem minmax(0, 1fr);
  }

  .modes__body {
    grid-column: 2;
  }
}
</style>
