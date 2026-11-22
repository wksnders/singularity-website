<script setup lang="ts">

import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import ContentCard from '@/components/molecules/ContentCard.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import TryFreeCard from '@/components/molecules/TryFreeCard.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import { t } from '@/content';
import { learnHeroArt, modes, videos } from '@/data/universe';
import { isHidden, outbound, pictureSources, soon, to } from '@/site/links';
import { guideLinks } from '@/site/modes';
import { provideSections } from '@/composables/useSections';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'paths', label: t('learn.sections.paths') },
  { id: 'modes', label: t('learn.sections.modes') },
  { id: 'videos', label: t('learn.sections.videos') },
  { id: 'rules', label: t('learn.sections.rules') },
  { id: 'try', label: t('learn.sections.try') },
]);

provideSections(sections);

const tracks = ['new', 'veteran', 'coop'] as const;

const heroSources = pictureSources(learnHeroArt.src);
/* Capped at the art's full-width height (64.3vw is 9/14), so landscape screens crop little and phones, at 72% of the screen, crop the sides. */
const HERO_MIN_HEIGHT = 'max(min(100svh, 64.3vw), min(72svh, 155vw))';
/* The cover-cropped art's drawn width: wider than the window wherever the hero is taller than the art's 14:9 allows; change with HERO_MIN_HEIGHT. */
const HERO_SIZES = '(orientation: portrait) 241vw, 100vw';

const route = useRoute();
const currentTrack = computed(() => route.hash.replace(/^#path-/, ''));

const guides = computed(() => guideLinks());

const rulesHub = [
  { key: 'reference', to: to('rules') },
  { key: 'errata', to: soon('#errata') },
  { key: 'competition', to: soon('#competition') },
  { key: 'faq', to: to('faq') },
] as const;

</script>

<template>
  <PageHero
    id="learn-hero"
    :art="learnHeroArt"
    :sources="heroSources"
    :sizes="HERO_SIZES"
    :min-height="HERO_MIN_HEIGHT"
    bright
  >
    <h1 class="l-page-title">{{ t('learn.hero.title') }}</h1>
    <SectionIndex :sections="sections" />
  </PageHero>

  <ScrollSpyRail :sections="sections" hide-over-id="learn-hero" />

  <SectionBand id="paths" :heading="t('learn.paths.heading')">
    <div class="l-grid l-grid--wide">
      <div
        v-for="track in tracks"
        :id="`path-${track}`"
        :key="track"
        tabindex="-1"
        class="learn__track"
      >
        <ContentCard
          :to="soon('#learn-track')"
          :current="currentTrack === track"
          :kicker="t(`learn.tracks.${track}.kicker`)"
          :title="t(`learn.tracks.${track}.title`)"
          :body="t(`learn.tracks.${track}.body`)"
        />
      </div>
    </div>
    <BandFoot :to="{ hash: '#modes' }" :label="t('learn.paths.exit')" />
  </SectionBand>

  <SectionBand id="modes" class="l-band--alt l-band--line-top" :heading="t('learn.sections.modes')">
    <div class="l-grid">
      <component
        :is="guides.get(mode.id) ? BaseLink : 'div'"
        v-for="mode in modes"
        :key="mode.id"
        :to="guides.get(mode.id)"
        class="l-surface learn__mode"
        :class="{
          'learn__mode--coop': mode.id === 'incursions',
          'learn__mode--link': guides.get(mode.id),
        }"
      >
        <h3 class="learn__mode-name">{{ mode.name }}</h3>
        <MonoLabel tone="faint">
          {{ mode.players || t(`learn.modes.${mode.id}.players`) }}
        </MonoLabel>
        <p class="learn__mode-body">{{ t(`learn.modes.${mode.id}.blurb`) }}</p>
        <p v-if="guides.get(mode.id)" class="learn__mode-more">{{ t('learn.modes.rules') }}</p>
      </component>
    </div>
    <BandFoot :to="to('incursions')" :label="t('learn.modes.exit')" />
  </SectionBand>

  <SectionBand id="videos" class="l-band--line-top" :heading="t('learn.videos.heading')">
    <MonoLabel tone="faint">{{ t('learn.videos.note') }}</MonoLabel>

    <div class="l-grid l-grid--wide">
      <BaseLink
        v-for="video in videos"
        :key="video.id"
        :to="soon('#video')"
        class="learn__video"
      >
        <span class="learn__video-art">
          <ArtFrame :art="null" ratio="16 / 9" :placeholder="t('learn.videos.posterPlaceholder')" />
          <span v-if="video.captioned" class="learn__cc">{{ t('video.captioned') }}</span>
        </span>
        <span class="learn__video-body">
          <span class="learn__video-title">{{ video.title }}</span>
          <span class="learn__video-meta">
            {{ video.youTubeId ? video.qrSlug : t('learn.videos.idTbd') }}
          </span>
        </span>
      </BaseLink>
    </div>

    <p class="learn__note">{{ t('learn.videos.captionNote') }}</p>
    <BandFoot :to="{ hash: '#rules' }" :label="t('learn.videos.exit')" />
  </SectionBand>

  <SectionBand id="rules" class="l-band--alt l-band--line-top" :heading="t('learn.sections.rules')">
    <p class="l-lede l-lede--wide">{{ t('learn.rules.lede') }}</p>

    <div class="l-grid">
      <ContentCard
        v-for="item in rulesHub"
        :key="item.key"
        :to="item.to"
        :kicker="t(`learn.rules.${item.key}.kicker`)"
        :title="t(`learn.rules.${item.key}.title`)"
        :body="t(`learn.rules.${item.key}.body`)"
      />
    </div>

    <p class="learn__note">
      {{ t('learn.rules.booklet') }}
      <BaseLink :link="outbound('rulebook')">{{ t('learn.rules.bookletLink') }}</BaseLink>
      ·
      <BaseLink :link="outbound('rulesReference')">
        {{ t('learn.rules.referenceLink') }}
      </BaseLink>
    </p>

    <BandFoot :to="{ hash: '#try' }" :label="t('learn.rules.exit')" />
  </SectionBand>

  <SectionBand id="try" class="l-band--line-top" :heading="t('learn.try.heading')">
    <div class="learn__try">
      <TryFreeCard route="tts" />
      <TryFreeCard route="printAndPlay" />
    </div>
    <BandFoot v-if="!isHidden(to('story'))" :to="to('story', {}, { hash: '#chapters' })" :label="t('learn.try.exit')" />
    <BandFoot v-else :to="to('cards')" :label="t('learn.try.cardsExit')" />
  </SectionBand>
</template>

<style>
.learn__track {
  display: flex;
  scroll-margin-top: var(--scroll-offset);
}

.learn__track > .c-card {
  flex: 1 1 auto;
}

.learn__try {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.625rem;
}

@media (min-width: 45em) {
  .learn__try {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-4);
  }
}

.learn__note {
  margin-top: var(--space-6);
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-faint);
}

.learn__mode {
  padding: var(--space-5);
}

/* Co-op mode takes the threat edge, not a faction colour. */
.learn__mode--coop {
  border-bottom: 0.125rem solid var(--color-threat);
}

.learn__mode-name {
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 700;
  margin-bottom: var(--space-2);
}

.learn__mode-body {
  margin-top: var(--space-3);
  font-size: var(--size-m);
  line-height: 1.55;
  color: var(--color-ink-soft);
}

.learn__mode--link {
  display: flex;
  flex-direction: column;
  color: var(--color-ink);
  transition: border-color var(--dur-2) var(--ease-out);
}

.learn__mode--link:hover {
  border-color: rgba(var(--rgb-accent), 0.5);
  color: var(--color-ink);
  text-decoration: none;
}

.learn__mode-more {
  margin-top: auto;
  padding-top: var(--space-4);
  font-size: var(--size-m);
  color: var(--color-accent-text);
}

.learn__video {
  display: block;
  color: var(--color-ink);
}

.learn__video:hover {
  color: var(--color-ink);
  text-decoration: none;
}

.learn__video-art {
  position: relative;
  display: block;
  border-radius: var(--radius-m);
  overflow: hidden;
}

.learn__cc {
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: rgba(var(--rgb-bg), 0.8);
  font-family: var(--font-label);
  font-weight: 500;
  font-size: var(--size-label-xs);
  letter-spacing: var(--track-label);
  color: var(--color-ink);
}

.learn__video-body {
  display: block;
  padding-top: var(--space-3);
}

.learn__video-title {
  display: block;
  font-size: var(--size-body);
  font-weight: 500;
}

.learn__video-meta {
  display: block;
  margin-top: var(--space-1);
  font-family: var(--font-label);
  font-weight: 500;
  font-size: var(--size-label-s);
  color: var(--color-ink-faint);
}
</style>
