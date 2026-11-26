<script setup lang="ts">

import { computed } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import JumpChip from '@/components/atoms/JumpChip.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import TbdValue from '@/components/atoms/TbdValue.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import FilterBar from '@/components/molecules/FilterBar.vue';
import MarkdownBlock from '@/components/molecules/MarkdownBlock.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionBand from '@/components/molecules/SectionBand.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import SupportForm from '@/components/organisms/SupportForm.vue';
import { t } from '@/content';
import {
  avatarZip,
  avatars,
  bosses,
  buyStoreName,
  characterById,
  communityHeroArt,
  coreBox,
  game,
  pressGroups,
  pressKit,
  teamGroups,
  teamOf,
  wallpaperKinds,
  wallpapers,
} from '@/data/universe';
import { useCopy } from '@/composables/useCopy';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { provideSections } from '@/composables/useSections';
import { pad } from '@/site/format';
import { asset, outbound, pictureSources, to } from '@/site/links';
import { scaledSizes } from '@/site/pageScale';
import type { PressGroup } from '@/data/types';
import type { FilterOption } from '@/site/filters';
import type { SectionEntry } from '@/site/sections';

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;
const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

const pressSources = (src: string | null) => pictureSources(src);

const heroSources = pictureSources(communityHeroArt.src);
const HERO_MIN_HEIGHT = 'max(min(100svh, 70.8vw), min(72svh, 155vw))';
/* The cover-cropped art's drawn width: wider than the window wherever the hero is taller than the art's 1.41:1 allows; change with HERO_MIN_HEIGHT. */
const HERO_SIZES = '(orientation: portrait) 219vw, 100vw';

const groupMeta = (group: PressGroup) => {
  if (group.state === 'pending') return t('community.press.pending');
  if (group.state === 'empty') return `0 ${t('community.wallpapers.count')}`;
  return [`${group.files} ${t('community.wallpapers.count')}`, group.size, group.formats]
    .filter(Boolean)
    .join(' · ');
};

/* One source, so the page and the clipboard cannot disagree. */
const boilerplate = computed(
  () => `${game.name} ${t('community.press.boilerplateBody')}`,
);

const { copied, copy } = useCopy();
const copyBoilerplate = () => void copy(boilerplate.value);

const sections = computed<SectionEntry[]>(() => [
  { id: 'discord', label: t('community.sections.discord') },
  { id: 'wallpapers', label: t('community.sections.wallpapers') },
  { id: 'press', label: t('community.sections.press') },
  { id: 'support', label: t('community.sections.support') },
  { id: 'team', label: t('community.sections.team') },
]);

provideSections(sections);

const kind = useQueryFilter('kind');

const kindOptions = computed<FilterOption[]>(() =>
  wallpaperKinds.map((k) => ({ id: k.id, label: k.name })),
);

const shownWallpapers = computed(() =>
  kind.value.value ? wallpapers.filter((w) => w.kind === kind.value.value) : wallpapers,
);

const showAvatars = computed(() => !kind.value.value || kind.value.value === 'avatar');

/* Matches .comm__avatar-grid's columns: two on phones, up to seven inside the 70rem content column. */
const AVATAR_SIZES = '(min-width: 70em) 150px, (min-width: 40em) 22vw, 45vw';

/* One label per tile, read by the visible name, the alt text and the download button: several avatars share a character, so a label that still repeats gets a number. */
const avatarTiles = computed(() => {
  const labelled = avatars.map((avatar) => {
    const name = (avatar.characterId ? characterById(avatar.characterId)?.name : bosses.find((boss) => boss.id === avatar.bossId)?.name) ?? avatar.id;
    return { avatar, base: avatar.framed ? `${name} · ${t('community.wallpapers.framed')}` : name };
  });
  const seen = new Map<string, number>();
  return labelled.map(({ avatar, base }) => {
    const repeats = labelled.filter((other) => other.base === base).length > 1;
    const number = (seen.get(base) ?? 0) + 1;
    seen.set(base, number);
    return {
      ...avatar,
      label: repeats ? `${base} ${number}` : base,
      preview: avatar.framed ? `/community/avatars-framed/${avatar.id}-184.webp` : `/community/avatars/${avatar.id}-512.webp`,
      file: `/downloads/avatars/singularity-avatar-${avatar.id}.png`,
    };
  });
});

const kindName = (id: string) => wallpaperKinds.find((k) => k.id === id)?.name ?? id;
const kindSize = (id: string) => wallpaperKinds.find((k) => k.id === id)?.size ?? '';

const channels = ['rules-desk', 'incursion-logs', 'deck-lab', 'convergence'];

const factSheet = computed(() => [
  { label: t('community.facts.players'), value: game.players, reserved: false },
  { label: t('community.facts.length'), value: t('community.facts.lengthValue', { minutes: game.minutesPerPlayer }), reserved: false },
  { label: t('community.facts.ages'), value: game.ageRating, reserved: true },
  { label: t('community.facts.box'), value: coreBox.summary, reserved: true },
  { label: t('community.facts.available'), value: buyStoreName, reserved: false, link: outbound('buy') },
  {
    label: t('community.facts.publisher'),
    value: `${game.studio} · ${t('footer.publishedBy').toLowerCase()} ${game.publisher}`,
    reserved: false,
  },
]);
</script>

<template>
  <PageHero
    id="community-hero"
    :art="communityHeroArt"
    :sources="heroSources"
    :sizes="HERO_SIZES"
    :min-height="HERO_MIN_HEIGHT"
    tone="bright"
  >
    <h1 class="l-page-title">{{ t('community.hero.title') }}</h1>
    <p class="l-lede l-lede--wide comm__lede">{{ t('community.hero.lede') }}</p>
  </PageHero>

  <section class="l-band">
    <div class="l-wrap">
      <nav id="on-this-page" class="comm__hub" :aria-label="t('wayfinding.onThisPage')">
        <a href="#discord" class="comm__hub-card comm__hub-card--wide">
          <MonoLabel tone="faint">01 {{ t('community.sections.discord') }}</MonoLabel>
          <span class="comm__hub-body">{{ t('community.hub.discord') }}</span>
        </a>
        <div class="comm__hub-row">
          <a href="#wallpapers" class="comm__hub-card">
            <MonoLabel tone="faint">02 {{ t('community.sections.wallpapers') }}</MonoLabel>
            <MonoLabel tone="faint">{{ t('community.hub.wallpapers') }}</MonoLabel>
          </a>
          <a href="#press" class="comm__hub-card">
            <MonoLabel tone="faint">03 {{ t('community.sections.press') }}</MonoLabel>
            <MonoLabel tone="faint">{{ t('community.hub.press') }}</MonoLabel>
          </a>
          <a href="#support" class="comm__hub-card">
            <MonoLabel tone="faint">04 {{ t('community.sections.support') }}</MonoLabel>
            <MonoLabel tone="faint">{{ t('community.hub.support') }}</MonoLabel>
          </a>
          <a href="#team" class="comm__hub-card">
            <MonoLabel tone="faint">05 {{ t('community.sections.team') }}</MonoLabel>
            <MonoLabel tone="faint">{{ t('community.hub.team') }}</MonoLabel>
          </a>
        </div>
      </nav>
    </div>
  </section>

  <ScrollSpyRail :sections="sections" />

  <section id="discord" tabindex="-1" class="l-band">
    <div class="l-wrap l-split">
      <div class="l-split__main">
        <SectionMarker section-id="discord" :heading="t('community.discord.heading')" />
        <p class="l-lede l-lede--wide comm__body">{{ t('community.discord.body') }}</p>
        <UiButton :link="outbound('discord')" class="comm__gap">
          {{ t('community.discord.cta') }}
        </UiButton>
      </div>
      <div class="l-split__aside comm__channels">
        <span v-for="channel in channels" :key="channel"># {{ channel }}</span>
      </div>
    </div>
  </section>

  <SectionBand
    id="wallpapers"
    class="l-band--alt l-band--line-top"
    :heading="t('community.sections.wallpapers')"
  >
    <MonoLabel tone="faint">{{ t('community.wallpapers.sizesTbd') }}</MonoLabel>

    <FilterBar
      :options="kindOptions"
      :active="kind.value.value"
      :count="shownWallpapers.length + (showAvatars ? avatars.length : 0)"
      :count-label="t('community.wallpapers.count')"
      :all-label="t('filters.all')"
      @toggle="kind.toggle($event)"
      @clear="kind.set(null)"
    />

    <div v-if="showAvatars" class="comm__avatars">
      <div class="comm__avatars-head">
        <h3 class="comm__avatars-title">{{ t('community.wallpapers.avatars') }}</h3>
        <UiButton variant="quiet" :href="asset(avatarZip.href)" download>{{ t('community.wallpapers.allAvatars') }}</UiButton>
        <MonoLabel tone="faint">ZIP · {{ avatarZip.files }} {{ t('community.wallpapers.count') }} · {{ mb(avatarZip.zipBytes) }}</MonoLabel>
      </div>
      <div class="comm__avatar-terms">
        <p>{{ t('community.wallpapers.usageWelcome') }}</p>
        <p>
          {{ t('community.wallpapers.usageLimits') }}
          <RouterLink :to="{ hash: '#support' }">{{ t('community.wallpapers.usageAsk') }}</RouterLink>
        </p>
      </div>
      <ul class="l-grid comm__avatar-grid">
        <li v-for="avatar in avatarTiles" :key="avatar.id" class="comm__wall">
          <ArtFrame
            :art="{ src: avatar.preview, alt: t('community.wallpapers.avatarAlt', { name: avatar.label }) }"
            ratio="1 / 1"
            radius="m"
            placeholder=""
            :sources="pictureSources(avatar.preview)"
            :sizes="scaledSizes(AVATAR_SIZES)"
          />
          <p class="comm__avatar-name">{{ avatar.label }}</p>
          <MonoLabel tone="faint">PNG · {{ avatar.px }} × {{ avatar.px }} · {{ kb(avatar.bytes) }}</MonoLabel>
          <UiButton variant="quiet" :href="asset(avatar.file)" download>
            {{ t('community.wallpapers.download') }}<span class="l-sr-only"> {{ avatar.label }}</span>
          </UiButton>
        </li>
      </ul>
    </div>

    <div v-if="shownWallpapers.length" class="l-grid">
      <div v-for="wallpaper in shownWallpapers" :key="wallpaper.id" class="comm__wall">
        <ArtFrame
          :art="null"
          :ratio="wallpaper.kind === 'avatar' ? '1 / 1' : wallpaper.kind === 'mobile' ? '9 / 16' : '16 / 9'"
          radius="m"
          :placeholder="`[ ${kindName(wallpaper.kind).toLowerCase()} ]`"
        />
        <MonoLabel tone="faint">
          {{ kindName(wallpaper.kind) }} · {{ kindSize(wallpaper.kind) }}
        </MonoLabel>
      </div>
    </div>

    <BandFoot :to="{ hash: '#press' }" :label="t('community.wallpapers.exit')" />
  </SectionBand>

  <SectionBand id="press" class="l-band--line-top" :heading="t('community.sections.press')">
    <div class="comm__press-head">
      <div class="comm__press-lede">
        <p class="l-lede l-lede--wide comm__body">{{ t('community.press.intro') }}</p>
      </div>
      <div class="comm__press-get">
        <UiButton variant="primary" :href="asset(pressKit.href)">
          {{ t('community.press.cta') }}
        </UiButton>
        <MonoLabel tone="faint">
          {{ pressKit.files }} {{ t('community.press.kitMeta') }} · {{ mb(pressKit.zipBytes) }}
        </MonoLabel>
      </div>
    </div>

    <ul class="l-grid l-grid--wide comm__press-groups">
      <li
        v-for="group in pressGroups"
        :key="group.id"
        class="comm__press-card"
        :class="{ 'is-waiting': group.state !== 'ready' }"
      >
        <div class="comm__press-cover" :class="{ 'is-empty': !group.cover }">
          <ArtFrame
            v-if="group.cover"
            :art="group.cover"
            ratio="16 / 9"
            :fit="group.fit"
            sizes="(min-width: 900px) 360px, 100vw"
            :sources="pressSources(group.cover.src)"
            :placeholder="t('community.press.pending')"
          />
        </div>
        <div class="comm__press-body">
          <h3 class="comm__h3">{{ t(`community.press.groups.${group.id}.name`) }}</h3>
          <p class="l-lede l-lede--wide comm__body comm__press-grow">{{ t(`community.press.groups.${group.id}.body`) }}</p>
          <MonoLabel tone="faint">{{ groupMeta(group) }}</MonoLabel>
          <UiButton v-if="group.zipBytes" :href="asset(`/press/${group.id}.zip`)">
            {{ t('community.press.zipVerb') }} · {{ mb(group.zipBytes) }}
          </UiButton>
        </div>
      </li>
    </ul>

    <div class="l-grid l-grid--wide">
      <div class="l-surface l-surface--pad">
        <div class="comm__press-row">
          <MonoLabel tone="faint">{{ t('community.press.boilerplate') }}</MonoLabel>
          <UiButton variant="text" @click="copyBoilerplate">
            {{ copied ? t('community.press.copied') : t('community.press.copy') }}
          </UiButton>
        </div>
        <p class="l-lede l-lede--wide comm__body">{{ boilerplate }}</p>
        <p class="comm__meta">
          {{ t('footer.publishedBy') }} {{ game.publisher }}.
          {{ t('community.press.crossover') }} {{ game.crossoverGame }}.
        </p>
        <p class="comm__meta comm__gap">
          {{ t('community.press.contact') }}
          <a :href="`mailto:${game.enquiriesEmail}`">{{ game.enquiriesEmail }}</a>
        </p>
      </div>

      <div class="l-surface l-surface--pad">
        <MonoLabel tone="faint">{{ t('community.press.factSheet') }}</MonoLabel>
        <dl class="comm__facts">
          <div v-for="fact in factSheet" :key="fact.label">
            <MonoLabel as="dt" size="xs" tone="faint">{{ fact.label }}</MonoLabel>
            <dd>
              <TbdValue v-if="fact.reserved" :value="fact.value" />
              <BaseLink v-else-if="fact.link" :link="fact.link">{{ fact.value }}</BaseLink>
              <template v-else>{{ fact.value }}</template>
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <BandFoot :to="{ hash: '#support' }" :label="t('community.press.exit')" />
  </SectionBand>

  <SectionBand
    id="support"
    class="l-band--alt l-band--line-top"
    wrap="reading"
    :heading="t('community.sections.support')"
  >
    <p class="l-lede l-lede--wide comm__body">
      {{ t('community.support.triage1') }}
      <BaseLink :to="to('faq')">{{ t('ia.learn.faq.label') }}</BaseLink>
      {{ t('community.support.and') }}
      <BaseLink :link="outbound('discord')">{{ t('chrome.social.discord') }}</BaseLink>
      {{ t('community.support.triage2') }}
    </p>

    <SupportForm />

    <BandFoot :to="to('faq')" :label="t('community.support.exit')" />
  </SectionBand>

  <SectionBand id="team" class="l-band--line-top" :heading="t('community.sections.team')">
    <p class="l-lede l-lede--wide comm__body">{{ t('community.team.body') }}</p>

    <nav :aria-label="t('community.team.groupNav')" class="l-row comm__team-nav">
      <JumpChip
        v-for="(group, index) in teamGroups"
        :key="group"
        :to="{ hash: `#team-${group}` }"
        :index="pad(index + 1)"
      >
        {{ t(`community.team.groups.${group}.title`) }}
      </JumpChip>
    </nav>

    <div
      v-for="group in teamGroups"
      :id="`team-${group}`"
      :key="group"
      tabindex="-1"
      class="comm__team-group"
      :class="`comm__team-group--${group}`"
    >
      <div class="comm__team-head">
        <h3 class="comm__team-title">{{ t(`community.team.groups.${group}.title`) }}</h3>
        <MonoLabel tone="faint">
          {{ pad(teamOf(group).length) }} · {{ t(`community.team.groups.${group}.kicker`) }}
        </MonoLabel>
      </div>
      <p class="l-lede l-lede--wide comm__body">{{ t(`community.team.groups.${group}.body`) }}</p>

      <div class="comm__roster">
        <div v-for="member in teamOf(group)" :key="member.id" class="comm__member">
          <div class="comm__member-text">
            <h4 class="comm__member-name">{{ member.name }}</h4>
            <p class="comm__member-role">{{ member.role }}</p>
            <BaseLink v-if="'artTo' in member" :to="to(member.artTo, {}, { query: member.artQuery })" class="c-mono c-mono--xs comm__member-art">
              {{ t('community.team.seeTheArt') }}
            </BaseLink>
          </div>
        </div>
      </div>

      <details v-if="group === 'artists'" class="l-surface comm__statement">
        <summary class="comm__statement-summary">
          <span class="comm__statement-text">
            <MonoLabel tone="faint">{{ t('community.team.aiKicker') }}</MonoLabel>
            <span class="comm__statement-line">{{ t('community.team.aiSummary') }}</span>
          </span>
          <span class="comm__chevron" aria-hidden="true">▾</span>
        </summary>
        <MarkdownBlock slug="community/ai-statement" measure class="comm__statement-body" />
        <BaseLink :to="to('faq', {}, { hash: '#faq-ai-art' })" class="c-mono c-mono--xs comm__member-art">
          {{ t('community.team.aiFaq') }}
        </BaseLink>
      </details>
    </div>

    <div class="l-surface comm__credit-note">
      <MonoLabel tone="faint">{{ t('community.team.creditKicker') }}</MonoLabel>
      <p class="l-lede l-lede--wide comm__body">{{ t('community.team.credits') }}</p>
    </div>

    <p class="comm__meta">{{ t('footer.publishedBy') }} {{ game.publisher }}.</p>

    <BandFoot :to="to('community', {}, { hash: '#discord' })" :label="t('community.team.exit')" />
  </SectionBand>
</template>

<style>
.comm__team-nav {
  margin-top: var(--space-5);
}

.comm__team-group {
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-line);
  scroll-margin-top: calc(var(--nav-height) + var(--space-4));
}

.comm__team-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2) var(--space-4);
}

.comm__team-title {
  font-size: var(--size-h3);
}

.comm__roster {
  margin-top: var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(19rem, 100%), 1fr));
  gap: var(--space-5) var(--space-7);
}

.comm__team-group--artists .comm__roster {
  grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));
}

.comm__member {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  min-width: 0;
}

.comm__member-text {
  min-width: 0;
}

.comm__member-role {
  margin-top: var(--space-1);
  font-size: var(--size-s);
  color: var(--color-ink-muted);
}

.comm__team-group--friends .comm__roster {
  grid-template-columns: repeat(auto-fill, minmax(min(17rem, 100%), 1fr));
  gap: 0 var(--space-7);
}

.comm__team-group--friends .comm__member {
  padding: var(--space-4) 0;
  border-top: 1px solid var(--color-line);
}

.comm__member-art {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
}

.comm__statement {
  margin-top: var(--space-6);
  max-width: 47.5rem;
}

.comm__statement-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  min-height: 2.75rem;
  cursor: pointer;
  list-style: none;
}

.comm__statement-summary::-webkit-details-marker {
  display: none;
}

.comm__statement-text {
  min-width: 0;
}

.comm__statement-line {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--size-body-l);
}

.comm__chevron {
  flex: 0 0 auto;
  width: 1.75rem;
  height: 1.75rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  color: var(--color-ink-muted);
  transition: transform var(--dur-2) var(--ease-out);
}

.comm__statement[open] .comm__chevron {
  transform: rotate(180deg);
}

.comm__statement-body,
.comm__statement > .comm__member-art {
  margin: 0 var(--space-5);
}

.comm__statement-body {
  padding-bottom: var(--space-2);
}

.comm__credit-note {
  margin-top: var(--space-7);
  padding: var(--space-5);
}

.comm__lede,
.comm__body {
  margin-top: var(--space-4);
}

.comm__gap {
  margin-top: var(--space-6);
}

.comm__hub {
  display: grid;
  gap: var(--space-3);
}

.comm__hub-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11.25rem, 1fr));
  gap: var(--space-3);
}

.comm__hub-card {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-m);
  color: var(--color-ink);
}

.comm__hub-card:hover {
  background: rgba(var(--rgb-ink), 0.06);
  color: var(--color-ink);
  text-decoration: none;
}

.comm__hub-card--wide {
  border-color: rgba(var(--rgb-accent), 0.45);
  background: var(--color-accent-wash);
}

.comm__hub-body {
  font-size: var(--size-m);
  line-height: 1.5;
  color: var(--color-ink-soft);
}

.comm__channels {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-content: start;
  align-items: flex-start;
}

.comm__channels span {
  padding: var(--space-2) var(--space-3);
  border: 1px solid rgba(var(--rgb-ink), 0.14);
  border-radius: var(--radius-s);
  font-family: var(--font-label);
  font-weight: 500;
  font-size: var(--size-label-m);
  color: var(--color-ink-faint);
  white-space: nowrap;
}

.comm__press-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.comm__press-lede {
  max-width: 56ch;
}

.comm__press-get {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}

.comm__press-groups {
  list-style: none;
  padding: 0;
}

.comm__press-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-m);
  overflow: hidden;
  background: var(--color-surface);
}

.comm__press-card.is-waiting {
  border-style: dashed;
  background: transparent;
}

.comm__press-cover.is-empty {
  aspect-ratio: 16 / 9;
  background: repeating-linear-gradient(
    135deg,
    var(--color-line) 0 0.625rem,
    transparent 0.625rem 1.25rem
  );
}

.comm__press-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  flex: 1;
  padding: var(--space-4);
}

.comm__press-grow {
  flex: 1;
}

.comm__press-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.comm__h3 {
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 700;
}

.comm__meta {
  margin-top: var(--space-4);
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-faint);
}

.comm__facts {
  margin: var(--space-4) 0 0;
  display: grid;
  gap: var(--space-3);
}

.comm__facts > div {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr);
  gap: var(--space-3);
  align-items: baseline;
}

.comm__facts dd {
  margin: 0;
  font-size: var(--size-m);
  color: var(--color-ink-soft);
}

.comm__wall {
  display: grid;
  gap: var(--space-2);
}

.comm__wall > .c-btn {
  justify-self: start;
}

.comm__avatars {
  margin-top: var(--space-6);
  margin-bottom: var(--space-10);
}

.comm__avatars-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-5);
  margin-bottom: var(--space-5);
}

.comm__avatars-title {
  margin-right: auto;
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 700;
}

.comm__avatar-terms {
  margin-bottom: var(--space-5);
  max-width: var(--width-reading);
  font-size: var(--size-s);
  line-height: 1.6;
  color: var(--color-ink-muted);
}

.comm__avatar-grid {
  grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
  padding: 0;
  list-style: none;
}

.comm__avatar-name {
  font-weight: 600;
}

.comm__member-name {
  font-family: var(--font-display);
  font-size: var(--size-body);
  font-weight: 700;
}

</style>
