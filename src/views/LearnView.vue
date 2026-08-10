<script setup lang="ts">
/**
 * LEARN — the most linked-to page on the site, so it carries the full
 * wayfinding kit. Five bands: pick your path · modes · videos · rules hub ·
 * try it free. The thesis: zero randomness raises the bar on the rules, so the
 * reference is a first-class citizen, not a PDF at the bottom.
 */
import { computed } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import ContentCard from '@/components/molecules/ContentCard.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import { t } from '@/content';
import { modes, videos } from '@/data/universe';
import { outbound, soon, to } from '@/site/links';
import type { SectionEntry } from '@/site/sections';

const sections = computed<SectionEntry[]>(() => [
  { id: 'paths', label: t('learn.sections.paths') },
  { id: 'modes', label: t('learn.sections.modes') },
  { id: 'videos', label: t('learn.sections.videos') },
  { id: 'rules', label: t('learn.sections.rules') },
  { id: 'try', label: t('learn.sections.try') },
]);

/** Three tracks. The co-op track assumes the base game — say so. */
const tracks = ['new', 'veteran', 'coop'] as const;

const rulesHub = [
  { key: 'reference', to: soon('#rules-reference') },
  { key: 'errata', to: soon('#errata') },
  { key: 'competition', to: soon('#competition') },
  { key: 'faq', to: soon('#faq') },
] as const;

const tryIt = [
  { key: 'pnp', link: outbound('printAndPlay') },
  { key: 'tts', link: outbound('tabletopSimulator') },
  { key: 'buy', link: outbound('buy') },
] as const;
</script>

<template>
  <SecondaryHero glow="85% 70% at 40% 0%" :note="t('learn.hero.pending')">
    <Breadcrumbs :crumbs="[{ label: t('ia.learn.label') }]" />
    <h1 class="learn__title">{{ t('learn.hero.title') }}</h1>
    <p class="learn__lede">{{ t('learn.hero.lede') }}</p>
    <SectionIndex :sections="sections" />
  </SecondaryHero>

  <ScrollSpyRail :sections="sections" />

  <section id="paths" tabindex="-1" class="l-band">
    <div class="l-wrap">
      <SectionMarker id="paths" :index="1" :total="5" :heading="t('learn.paths.heading')" />
      <div class="l-grid l-grid--wide learn__gap">
        <ContentCard
          v-for="track in tracks"
          :key="track"
          :to="soon('#learn-track')"
          :kicker="t(`learn.tracks.${track}.kicker`)"
          :title="t(`learn.tracks.${track}.title`)"
          :body="t(`learn.tracks.${track}.body`)"
        />
      </div>
      <BandFoot :to="{ hash: '#modes' }" :label="t('learn.paths.exit')" />
    </div>
  </section>

  <section id="modes" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <SectionMarker id="modes" :index="2" :total="5" :heading="t('learn.sections.modes')" />
      <div class="l-grid learn__gap">
        <div
          v-for="mode in modes"
          :key="mode.id"
          class="learn__mode"
          :class="{ 'learn__mode--coop': mode.id === 'incursions' }"
        >
          <h3 class="learn__mode-name">{{ mode.name }}</h3>
          <MonoLabel tone="faint">
            {{ mode.players || t(`learn.modes.${mode.id}.players`) }}
          </MonoLabel>
          <p class="learn__mode-body">{{ t(`learn.modes.${mode.id}.blurb`) }}</p>
        </div>
      </div>
      <BandFoot :to="to('incursions')" :label="t('learn.modes.exit')" />
    </div>
  </section>

  <section id="videos" tabindex="-1" class="l-band l-band--line-top">
    <div class="l-wrap">
      <SectionMarker id="videos" :index="3" :total="5" :heading="t('learn.videos.heading')" />
      <MonoLabel tone="faint">{{ t('learn.videos.note') }}</MonoLabel>

      <div class="l-grid l-grid--wide learn__gap">
        <BaseLink
          v-for="video in videos"
          :key="video.id"
          :to="soon('#video')"
          class="learn__video"
        >
          <span class="learn__video-art">
            <ArtFrame :art="null" ratio="16 / 9" :placeholder="t('learn.videos.posterPlaceholder')" />
            <span v-if="video.captioned" class="learn__cc">CC</span>
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
    </div>
  </section>

  <section id="rules" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <SectionMarker id="rules" :index="4" :total="5" :heading="t('learn.sections.rules')" />
      <p class="learn__body">{{ t('learn.rules.lede') }}</p>

      <div class="l-grid learn__gap">
        <ContentCard
          v-for="item in rulesHub"
          :key="item.key"
          :to="item.to"
          :kicker="t(`learn.rules.${item.key}.kicker`)"
          :title="t(`learn.rules.${item.key}.title`)"
          :body="t(`learn.rules.${item.key}.body`)"
        />
      </div>

      <!-- Both documents live, so this line carries two links. It sits BESIDE
           the rules-reference card, which still points at /soon: the searchable
           HTML reference is being written, and a PDF beside it is the standing
           rule, not a substitute for it. -->
      <p class="learn__note">
        {{ t('learn.rules.booklet') }}
        <BaseLink :link="outbound('rulebook')">{{ t('learn.rules.bookletLink') }}</BaseLink>
        ·
        <BaseLink :link="outbound('rulesReference')">
          {{ t('learn.rules.referenceLink') }}
        </BaseLink>
      </p>

      <BandFoot :to="{ hash: '#try' }" :label="t('learn.rules.exit')" />
    </div>
  </section>

  <section id="try" tabindex="-1" class="l-band l-band--line-top">
    <div class="l-wrap">
      <SectionMarker id="try" :index="5" :total="5" :heading="t('learn.try.heading')" />
      <div class="l-grid l-grid--wide learn__gap">
        <ContentCard
          v-for="item in tryIt"
          :key="item.key"
          :link="item.link"
          :kicker="t(`learn.try.${item.key}.kicker`)"
          :title="t(`learn.try.${item.key}.title`)"
          :body="t(`learn.try.${item.key}.body`)"
        />
      </div>
      <BandFoot :to="to('story', {}, { hash: '#chapters' })" :label="t('learn.try.exit')" />
    </div>
  </section>
</template>

<style>
.learn__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
}

.learn__lede,
.learn__body {
  margin-top: var(--space-4);
  max-width: 62ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.learn__gap {
  margin-top: var(--space-6);
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
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
}

/* Co-op is a headline seller: it gets the threat edge, not a faction colour. */
.learn__mode--coop {
  border-bottom: 2px solid var(--color-threat);
}

.learn__mode-name {
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 400;
  margin-bottom: var(--space-2);
}

.learn__mode-body {
  margin-top: var(--space-3);
  font-size: var(--size-m);
  line-height: 1.55;
  color: var(--color-ink-soft);
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
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(var(--rgb-bg), 0.8);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: 0.1em;
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
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  color: var(--color-ink-faint);
}
</style>
