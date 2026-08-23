<script setup lang="ts">
/**
 * COMMUNITY — five deep-linkable bands.
 */
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
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import SupportForm from '@/components/organisms/SupportForm.vue';
import { t } from '@/content';
import { coreBox, game, teamGroups, teamOf, wallpaperKinds, wallpapers } from '@/data/universe';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { outbound, soon, to } from '@/site/links';
import type { FilterOption } from '@/site/filters';
import type { SectionEntry } from '@/site/sections';

const pad = (n: number) => String(n).padStart(2, '0');
const sections = computed<SectionEntry[]>(() => [
  { id: 'discord', label: t('community.sections.discord') },
  { id: 'wallpapers', label: t('community.sections.wallpapers') },
  { id: 'press', label: t('community.sections.press') },
  { id: 'support', label: t('community.sections.support') },
  { id: 'team', label: t('community.sections.team') },
]);

const kind = useQueryFilter('kind');

const kindOptions = computed<FilterOption[]>(() =>
  wallpaperKinds.map((k) => ({ id: k.id, label: k.name })),
);

const shownWallpapers = computed(() =>
  kind.value.value ? wallpapers.filter((w) => w.kind === kind.value.value) : wallpapers,
);

const kindName = (id: string) => wallpaperKinds.find((k) => k.id === id)?.name ?? id;
const kindSize = (id: string) => wallpaperKinds.find((k) => k.id === id)?.size ?? '';

const channels = ['rules-desk', 'incursion-logs', 'deck-lab', 'convergence'];

const factSheet = computed(() => [
  { label: t('community.facts.players'), value: game.players, reserved: false },
  { label: t('community.facts.length'), value: game.playTime, reserved: false },
  { label: t('community.facts.ages'), value: game.ageRating, reserved: true },
  { label: t('community.facts.release'), value: game.releaseDate, reserved: true },
  { label: t('community.facts.box'), value: coreBox.summary, reserved: true },
  { label: t('community.facts.ships'), value: game.shipsTo, reserved: true },
  {
    label: t('community.facts.publisher'),
    value: `${game.studio} · ${t('footer.publishedBy').toLowerCase()} ${game.publisher}`,
    reserved: false,
  },
]);
</script>

<template>
  <SecondaryHero glow="70% 60% at 84% 0%" :note="t('community.hero.pending')">
    <h1 class="comm__title">{{ t('community.hero.title') }}</h1>
    <p class="comm__lede">{{ t('community.hero.lede') }}</p>

    <!-- Weighted hub index: Discord is the destination most people want. -->
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
  </SecondaryHero>

  <ScrollSpyRail :sections="sections" />

  <section id="discord" tabindex="-1" class="l-band">
    <div class="l-wrap l-split">
      <div class="l-split__main">
        <SectionMarker
          id="discord"
          :index="1"
          :total="5"
          :heading="t('community.discord.heading')"
        />
        <p class="comm__body">{{ t('community.discord.body') }}</p>
        <UiButton :link="outbound('discord')" class="comm__gap">
          {{ t('community.discord.cta') }}
        </UiButton>
      </div>
      <div class="l-split__aside comm__channels">
        <span v-for="channel in channels" :key="channel"># {{ channel }}</span>
      </div>
    </div>
  </section>

  <section id="wallpapers" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <SectionMarker
        id="wallpapers"
        :index="2"
        :total="5"
        :heading="t('community.sections.wallpapers')"
      />
      <MonoLabel tone="faint">{{ t('community.wallpapers.sizesTbd') }}</MonoLabel>

      <FilterBar
        class="comm__gap"
        :options="kindOptions"
        :active="kind.value.value"
        :count="shownWallpapers.length"
        :count-label="t('community.wallpapers.count')"
        :all-label="t('filters.all')"
        @toggle="kind.toggle($event)"
        @clear="kind.set(null)"
      />

      <div class="l-grid comm__gap">
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
    </div>
  </section>

  <section id="press" tabindex="-1" class="l-band l-band--line-top">
    <div class="l-wrap">
      <SectionMarker id="press" :index="3" :total="5" :heading="t('community.sections.press')" />

      <div class="l-grid l-grid--wide comm__gap">
        <div class="comm__card">
          <h3 class="comm__h3">{{ t('community.press.whatTitle') }}</h3>
          <p class="comm__body">{{ t('community.press.whatBody') }}</p>
          <UiButton :to="soon('#press-kit')" class="comm__gap">
            {{ t('community.press.cta') }}
          </UiButton>
          <p class="comm__meta comm__gap">
            {{ t('community.press.contact') }}
            <a :href="`mailto:${game.enquiriesEmail}`">{{ game.enquiriesEmail }}</a>
          </p>
        </div>

        <div class="comm__card">
          <MonoLabel tone="faint">{{ t('community.press.boilerplate') }}</MonoLabel>
          <p class="comm__body">
            {{ game.name }} {{ t('community.press.boilerplateBody') }}
          </p>
          <p class="comm__meta">
            {{ t('footer.publishedBy') }} {{ game.publisher }}.
            {{ t('community.press.crossover') }} {{ game.crossoverGame }}.
          </p>
        </div>

        <div class="comm__card">
          <MonoLabel tone="faint">{{ t('community.press.factSheet') }}</MonoLabel>
          <dl class="comm__facts">
            <div v-for="fact in factSheet" :key="fact.label">
              <dt>{{ fact.label }}</dt>
              <dd>
                <TbdValue v-if="fact.reserved" :value="fact.value" />
                <template v-else>{{ fact.value }}</template>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <BandFoot :to="{ hash: '#support' }" :label="t('community.press.exit')" />
    </div>
  </section>

  <section id="support" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap l-wrap--reading">
      <SectionMarker id="support" :index="4" :total="5" :heading="t('community.sections.support')" />
      <p class="comm__body">
        {{ t('community.support.triage1') }}
        <BaseLink :to="to('faq')">{{ t('ia.learn.faq.label') }}</BaseLink>
        {{ t('community.support.and') }}
        <BaseLink :link="outbound('discord')">{{ t('chrome.social.discord') }}</BaseLink>
        {{ t('community.support.triage2') }}
      </p>

      <SupportForm class="comm__gap" />

      <BandFoot :to="to('faq')" :label="t('community.support.exit')" />
    </div>
  </section>

  <section id="team" tabindex="-1" class="l-band l-band--line-top">
    <div class="l-wrap">
      <SectionMarker id="team" :index="5" :total="5" :heading="t('community.sections.team')" />
      <p class="comm__body">{{ t('community.team.body') }}</p>
      <MonoLabel tone="faint">{{ t('community.team.pending') }}</MonoLabel>

      <nav :aria-label="t('community.team.groupNav')" class="comm__team-nav">
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
        <p class="comm__body">{{ t(`community.team.groups.${group}.body`) }}</p>

        <div class="comm__roster">
          <div v-for="member in teamOf(group)" :key="member.id" class="comm__member">
            <ArtFrame
              v-if="group !== 'friends'"
              class="comm__portrait"
              :art="null"
              ratio="1 / 1"
              radius="m"
              :placeholder="t('community.team.portrait')"
            />
            <div class="comm__member-text">
              <h4 class="comm__member-name">{{ member.name }}</h4>
              <p class="comm__member-role">{{ member.role }}</p>
              <BaseLink v-if="'artTo' in member" :to="to(member.artTo)" class="comm__member-art">
                {{ t('community.team.seeTheArt') }}
              </BaseLink>
            </div>
          </div>
        </div>

        <details v-if="group === 'artists'" class="comm__statement">
          <summary class="comm__statement-summary">
            <span class="comm__statement-text">
              <MonoLabel tone="faint">{{ t('community.team.aiKicker') }}</MonoLabel>
              <span class="comm__statement-line">{{ t('community.team.aiSummary') }}</span>
            </span>
            <span class="comm__chevron" aria-hidden="true">▾</span>
          </summary>
          <MarkdownBlock slug="community/ai-statement" measure class="comm__statement-body" />
          <BaseLink :to="to('faq', {}, { hash: '#faq-ai-art' })" class="comm__member-art">
            {{ t('community.team.aiFaq') }}
          </BaseLink>
        </details>
      </div>

      <div class="comm__credit-note">
        <MonoLabel tone="faint">{{ t('community.team.creditKicker') }}</MonoLabel>
        <p class="comm__body">{{ t('community.team.credits') }}</p>
      </div>

      <p class="comm__meta">{{ t('footer.publishedBy') }} {{ game.publisher }}.</p>

      <BandFoot :to="to('community', {}, { hash: '#discord' })" :label="t('community.team.exit')" />
    </div>
  </section>
</template>

<style>
.comm__team-nav {
  margin-top: var(--space-5);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
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

/* Portrait beside the name, never above it. The artists sit a size larger. */
.comm__roster {
  margin-top: var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(304px, 100%), 1fr));
  gap: var(--space-5) var(--space-7);
}

.comm__team-group--artists .comm__roster {
  grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
}

.comm__member {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  min-width: 0;
}

.comm__portrait {
  flex: 0 0 88px;
  width: 88px;
}

.comm__team-group--artists .comm__portrait {
  flex-basis: 104px;
  width: 104px;
}

.comm__member-text {
  min-width: 0;
}

.comm__member-role {
  margin-top: var(--space-1);
  font-size: var(--size-s);
  color: var(--color-ink-muted);
}

/* No portraits here, so each name is a ruled row instead of a card. */
.comm__team-group--friends .comm__roster {
  grid-template-columns: repeat(auto-fill, minmax(min(272px, 100%), 1fr));
  gap: 0 var(--space-7);
}

.comm__team-group--friends .comm__member {
  padding: var(--space-4) 0;
  border-top: 1px solid var(--color-line);
}

.comm__member-art {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
}

.comm__statement {
  margin-top: var(--space-6);
  max-width: 760px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
  background: var(--color-surface);
}

.comm__statement-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  min-height: 44px;
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
  width: 28px;
  height: 28px;
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
  padding: var(--space-5) var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
  background: var(--color-surface);
}

.comm__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
}

.comm__lede,
.comm__body {
  margin-top: var(--space-4);
  max-width: 62ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.comm__gap {
  margin-top: var(--space-6);
}

.comm__hub {
  margin-top: var(--space-8);
  display: grid;
  gap: var(--space-3);
}

.comm__hub-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  padding: var(--space-2) 10px;
  border: 1px solid rgba(var(--rgb-ink), 0.14);
  border-radius: var(--radius-s);
  font-family: var(--font-mono);
  font-size: var(--size-mono-m);
  color: var(--color-ink-faint);
  white-space: nowrap;
}

.comm__card {
  padding: clamp(20px, 3vw, 28px);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
}

.comm__h3 {
  font-family: var(--font-display);
  font-size: var(--size-h3);
  font-weight: 400;
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
  grid-template-columns: 120px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: baseline;
}

.comm__facts dt {
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
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

.comm__member-name {
  font-family: var(--font-display);
  font-size: var(--size-body);
  font-weight: 400;
}

</style>
