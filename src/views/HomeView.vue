<script setup lang="ts">
/**
 * HOME - a lobby, not a page. Hero, then the modules marked A–I below, in that
 * order. Nine is a ceiling, not a target, and G holds the only filled CTA below
 * the fold.
 */
import { computed, ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import ContentCard from '@/components/molecules/ContentCard.vue';
import TryRouteCard from '@/components/molecules/TryRouteCard.vue';
import EntityTile from '@/components/molecules/EntityTile.vue';
import FactionTile from '@/components/molecules/FactionTile.vue';
import StatRow from '@/components/molecules/StatRow.vue';
import PageHero from '@/components/organisms/PageHero.vue';
import TrailerPlayer from '@/components/organisms/TrailerPlayer.vue';
import NewsletterForm from '@/components/organisms/NewsletterForm.vue';
import { getDoc, getDocs, metaString, t } from '@/content';
import {
  chapters,
  characters,
  coreBox,
  tryRoutes,
  factionById,
  factions,
  game,
  modes,
} from '@/data/universe';
import { outbound, to } from '@/site/links';
import type { Stat } from '@/site/stats';

/* The CORE EDITION's facts, not the game's — the strip's title has to say so or
   it lies by omission. No price row: three editions, three prices, and the store
   is the authority on all of them. */
const boxFacts = computed<Stat[]>(() => [
  { label: t('home.facts.release'), value: game.releaseDate, reserved: true },
  { label: t('home.facts.box'), value: coreBox.summary, reserved: true },
  { label: t('home.facts.ships'), value: game.shipsTo, reserved: true },
  { label: t('home.facts.ages'), value: game.ageRating, reserved: true },
]);

const pitchStats = computed<Stat[]>(() => [
  { label: t('home.pitch.players'), value: game.players },
  { label: t('home.pitch.length'), value: game.playTime },
  { label: t('home.pitch.solo'), value: t('home.pitch.soloValue') },
]);

/** The rotator shows one character per faction plus the any-faction bonus. */
const rotatorCast = computed(() => {
  const perFaction = factions
    .map((faction) =>
      characters.find((c) => Array.isArray(c.factionIds) && c.factionIds[0] === faction.id),
    )
    .filter((c): c is (typeof characters)[number] => Boolean(c));
  const lux = characters.find((c) => c.id === 'lux');
  return lux ? [...perFaction, lux] : perFaction;
});

const factionTags = (character: (typeof characters)[number]) =>
  character.factionIds === 'any'
    ? [{ label: t('universe.anyFaction'), color: null }]
    : character.factionIds
        .map((id) => factionById(id))
        .filter((f): f is NonNullable<ReturnType<typeof factionById>> => Boolean(f))
        .map((f) => ({ label: f.name, color: f.color }));

/* The newest PUBLISHED chapter, which is not necessarily the newest product —
   that is the whole point of keeping the two arrays apart. */
const currentChapter = computed(
  () => [...chapters].reverse().find((c) => c.status === 'published') ?? chapters[0],
);
const currentChapterTitle = computed(() =>
  metaString(getDoc(`story/${currentChapter.value.id}`), 'title', currentChapter.value.title),
);

/** News is a conditional module: it only earns space while it is fresh. */
const latestNews = computed(() =>
  getDocs('news/')
    .sort((a, b) => String(b.meta.date ?? '').localeCompare(String(a.meta.date ?? '')))
    .slice(0, 3),
);

const rotator = ref<HTMLElement | null>(null);
function scrollCast(direction: 1 | -1): void {
  const el = rotator.value;
  if (!el) return;
  el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.8, 640), behavior: 'smooth' });
}
</script>

<template>
  <PageHero
    drift
    :placeholder="t('home.hero.placeholder')"
    :pending-note="t('home.hero.pending')"
    glow="120% 80% at 20% 10%"
  >
    <MonoLabel tone="accent">{{ t('home.hero.kicker') }}</MonoLabel>
    <h1 class="home__title">SINGULARITY<span class="home__title-suffix">.EXE</span></h1>
    <p class="home__lede">{{ t('home.hero.lede') }}</p>
    <div class="home__cta l-row">
      <UiButton variant="primary" :link="outbound('buy')">{{ t('home.hero.ctaPlay') }}</UiButton>
      <UiButton :to="to('universe')">{{ t('home.hero.ctaUniverse') }}</UiButton>
    </div>
    <p class="home__hero-secondary">
      <BaseLink :to="to('learn', {}, { hash: '#try' })">{{ t('home.hero.secondary') }} →</BaseLink>
    </p>
    <!-- "1–4" alone does not tell anyone solo is supported, so the modes are
         named beside it. Four items is the ceiling before this wraps on a
         phone. -->
    <p class="home__hero-stats">
      <span>{{ game.players }} {{ t('home.hero.players') }}</span>
      <span>{{ t('home.hero.modes') }}</span>
      <span>{{ t('home.hero.length') }}</span>
    </p>
  </PageHero>

  <!-- A0 · the box at a glance -->
  <section class="l-band l-band--tight l-band--alt l-band--line-top l-band--line-bottom">
    <div class="l-wrap">
      <h2 class="l-sr-only">{{ t('home.facts.title') }}</h2>
      <StatRow :stats="boxFacts" />
    </div>
  </section>

  <!-- A · pitch and ways to play -->
  <section class="l-band">
    <div class="l-wrap l-split">
      <div class="l-split__main">
        <MonoLabel tone="accent">{{ t('home.pitch.kicker') }}</MonoLabel>
        <h2 class="home__h2">{{ t('home.pitch.title') }}</h2>
        <p class="home__body">{{ t('home.pitch.body') }}</p>
      </div>
      <div class="l-split__aside">
        <StatRow bordered :stats="pitchStats" />
        <MonoLabel tone="muted" class="home__spacer">{{ t('home.pitch.modesKicker') }}</MonoLabel>
        <div class="home__modes l-row">
          <template v-for="mode in modes" :key="mode.id">
            <BaseLink
              v-if="mode.id === 'incursions'"
              :to="to('incursions')"
              class="home__mode home__mode--exit"
            >
              {{ mode.name }} →
            </BaseLink>
            <span v-else class="home__mode">{{ mode.name }}</span>
          </template>
        </div>
        <UiButton variant="quiet" :to="to('learn', {}, { hash: '#modes' })" class="home__spacer">
          {{ t('home.pitch.modesLink') }}
        </UiButton>
      </div>
    </div>
  </section>

  <!-- B · the claim + trailer -->
  <section class="l-band l-band--line-top l-band--line-bottom home__claim">
    <div class="l-wrap l-wrap--reading home__center">
      <h2 class="home__h2">{{ t('home.zero.title') }}</h2>
      <p class="home__body home__body--center">{{ t('home.zero.body') }}</p>
      <TrailerPlayer
        class="home__trailer"
        :you-tube-id="game.trailerYouTubeId"
        :title="t('home.zero.trailerTitle')"
        :placeholder="t('home.zero.trailerPlaceholder')"
      />
      <MonoLabel tone="faint" class="home__spacer">{{ t('home.zero.caption') }}</MonoLabel>
      <UiButton variant="quiet" :to="to('learn')">{{ t('home.zero.link') }}</UiButton>
    </div>
  </section>

  <!-- C · cast rotator -->
  <section class="l-band">
    <div class="l-wrap home__rotator-head">
      <div>
        <MonoLabel tone="accent">{{ t('home.cast.kicker') }}</MonoLabel>
        <h2 class="home__h2">{{ t('home.cast.title') }}</h2>
      </div>
      <div class="home__rotator-nav">
        <button type="button" :aria-label="t('home.cast.prev')" @click="scrollCast(-1)">←</button>
        <button type="button" :aria-label="t('home.cast.next')" @click="scrollCast(1)">→</button>
      </div>
    </div>
    <div ref="rotator" class="home__rotator">
      <EntityTile
        v-for="character in rotatorCast"
        :key="character.id"
        class="home__rotator-item"
        :to="to('character', { characterId: character.id })"
        :art="character.art"
        :epithet="character.epithet"
        :name="character.name"
        :tags="factionTags(character)"
        :placeholder="t('universe.artPlaceholder')"
      />
    </div>
    <div class="l-wrap home__spacer">
      <UiButton variant="quiet" :to="to('characters')">{{ t('home.cast.link') }}</UiButton>
    </div>
  </section>

  <!-- D · faction shelf -->
  <section class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <MonoLabel tone="accent">{{ t('home.factions.kicker') }}</MonoLabel>
      <h2 class="home__h2">{{ t('home.factions.title') }}</h2>
      <div class="l-grid home__spacer">
        <FactionTile
          v-for="faction in factions"
          :key="faction.id"
          :faction="faction"
          :placeholder="t('universe.factionArtPlaceholder')"
        />
      </div>
    </div>
  </section>

  <!-- E · Incursions -->
  <section class="l-band l-band--line-top home__incursions">
    <div class="l-wrap">
      <span class="home__threat">{{ t('home.incursions.badge') }}</span>
      <h2 class="home__h2 home__h2--tight">{{ t('home.incursions.title') }}</h2>
      <p class="home__body">{{ t('home.incursions.body') }}</p>
      <p class="home__facts">
        <span>{{ game.incursionsPlayers }} {{ t('home.incursions.players') }}</span>
        <span>{{ t('home.incursions.solo') }}</span>
        <span>{{ t('home.incursions.inBox') }}</span>
      </p>
      <UiButton :to="to('incursions')" class="home__spacer">
        {{ t('home.incursions.cta') }}
      </UiButton>
    </div>
  </section>

  <!-- F · current chapter -->
  <section id="story" class="l-band">
    <div class="l-wrap">
      <MonoLabel tone="accent">{{ t('home.chapter.kicker') }}</MonoLabel>
      <div class="home__chapter">
        <div class="home__chapter-art">
          <ArtFrame :art="null" ratio="4 / 3" radius="m" :placeholder="t('home.chapter.artPlaceholder')" />
        </div>
        <div class="home__chapter-body">
          <MonoLabel tone="muted">
            {{ t('home.chapter.label') }} {{ String(currentChapter.number).padStart(2, '0') }}
          </MonoLabel>
          <h2 class="home__h3">{{ currentChapterTitle }}</h2>
          <p class="home__body">{{ t('home.chapter.body') }}</p>
          <UiButton
            :to="to('story', {}, { hash: `#ch-${String(currentChapter.number).padStart(2, '0')}` })"
            class="home__spacer"
          >
            {{ t('home.chapter.cta') }}
          </UiButton>
        </div>
      </div>
    </div>
  </section>

  <!-- G · ways in — the only filled CTA below the fold -->
  <section id="learn" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <h2 class="home__h2">{{ t('home.ways.title') }}</h2>
      <div class="l-grid l-grid--wide home__spacer">
        <ContentCard
          featured
          :title="t('home.ways.buy.title')"
          :body="t('home.ways.buy.body')"
          :link="outbound('buy')"
        />
        <TryRouteCard v-for="route in tryRoutes" :key="route.id" :route="route" />
      </div>
    </div>
  </section>

  <!-- H · news 3-up -->
  <section v-if="latestNews.length" id="news" class="l-band">
    <div class="l-wrap">
      <div class="home__news-head">
        <h2 class="home__h2">{{ t('home.news.title') }}</h2>
        <UiButton variant="quiet" :to="to('news')">{{ t('home.news.link') }}</UiButton>
      </div>
      <div class="l-grid l-grid--wide home__spacer">
        <ContentCard
          v-for="post in latestNews"
          :key="post.slug"
          :to="to('news')"
          :kicker="`${metaString(post, 'category')} · ${metaString(post, 'date', t('home.news.dateTbd'))}`"
          :title="metaString(post, 'title')"
          :placeholder="t('home.news.artPlaceholder')"
        />
      </div>
    </div>
  </section>

  <!-- I · Discord + newsletter -->
  <section id="community" class="l-band l-band--line-top">
    <div class="l-wrap l-split">
      <div class="l-split__main">
        <h2 class="home__h3">{{ t('home.community.title') }}</h2>
        <p class="home__body">{{ t('home.community.body') }}</p>
        <p class="home__channels">
          <span>#rules-desk</span><span>#incursion-logs</span><span>#deck-lab</span>
        </p>
        <UiButton :link="outbound('discord')" class="home__spacer">
          {{ t('home.community.cta') }}
        </UiButton>
      </div>
      <div class="l-split__aside">
        <NewsletterForm />
      </div>
    </div>
  </section>
</template>

<style>
.home__title {
  font-size: var(--size-h1);
  line-height: 0.94;
  font-weight: 700;
  white-space: nowrap;
}

.home__title-suffix {
  color: rgba(var(--rgb-ink), 0.42);
}

.home__lede {
  margin-top: var(--space-6);
  max-width: 52ch;
  font-size: clamp(1rem, 2.4vw, 1.3125rem);
  line-height: 1.5;
  color: rgba(var(--rgb-ink), 0.82);
}

.home__hero-secondary {
  margin-top: var(--space-4);
  font-size: var(--size-body);
  font-weight: 500;
}

.home__cta {
  margin-top: var(--space-8);
  gap: var(--space-3);
}

.home__hero-stats {
  margin-top: var(--space-9);
  display: flex;
  flex-wrap: wrap;
  gap: 10px 28px;
  font-family: var(--font-mono);
  font-size: var(--size-mono-m);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-soft);
}

.home__h2 {
  margin-top: var(--space-4);
  font-size: var(--size-h2);
}

.home__h2--tight {
  max-width: 22ch;
}

.home__h3 {
  margin-top: var(--space-3);
  font-size: clamp(1.375rem, 3.4vw, 2rem);
}

.home__body {
  margin-top: var(--space-5);
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.home__body--center {
  margin-inline: auto;
  max-width: 48ch;
}

.home__center {
  text-align: center;
}

.home__claim {
  background: linear-gradient(180deg, var(--color-bg-alt) 0%, var(--color-bg) 100%);
}

.home__trailer {
  margin-top: 28px;
  text-align: left;
}

.home__spacer {
  margin-top: var(--space-5);
}

.home__modes {
  margin-top: var(--space-4);
}

.home__mode {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding-inline: var(--space-4);
  border: 1px solid rgba(var(--rgb-ink), 0.16);
  border-radius: var(--radius-pill);
  font-size: var(--size-m);
  white-space: nowrap;
}

.home__mode--exit {
  border-color: rgba(var(--rgb-accent), 0.45);
  background: var(--color-accent-wash);
  color: var(--color-ink);
}

.home__rotator-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.home__rotator-nav {
  display: flex;
  gap: var(--space-2);
  flex: 0 0 auto;
}

.home__rotator-nav button {
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
}

.home__rotator {
  margin-top: 28px;
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 0 var(--gutter) var(--space-2);
  scrollbar-width: none;
}

.home__rotator-item {
  flex: 0 0 min(72vw, 300px);
  scroll-snap-align: start;
}

.home__incursions {
  --faction: var(--color-threat);
}

.home__threat {
  display: inline-block;
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

.home__facts,
.home__channels {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.home__facts span {
  padding: var(--space-2) 14px;
  border: 1px solid rgba(var(--rgb-ink), 0.2);
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.home__channels {
  text-transform: none;
  color: var(--color-ink-faint);
}

.home__channels span {
  padding: 6px 10px;
  border: 1px solid rgba(var(--rgb-ink), 0.14);
  border-radius: var(--radius-s);
  white-space: nowrap;
}

.home__chapter {
  margin-top: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: clamp(24px, 4vw, 48px);
  align-items: center;
  padding: clamp(20px, 3vw, 32px);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
}

.home__chapter-art {
  flex: 0 0 min(100%, 300px);
}

.home__chapter-body {
  flex: 1 1 320px;
  min-width: 0;
}

.home__news-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-end;
  justify-content: space-between;
}
</style>
