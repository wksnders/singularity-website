<script setup lang="ts">
/* Module order below the hero is fixed and the count is a ceiling, not a target: adding one is an editorial decision. */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import ContentCard from '@/components/molecules/ContentCard.vue';
import TryRouteCard from '@/components/molecules/TryRouteCard.vue';
import EntityTile from '@/components/molecules/EntityTile.vue';
import FactionTile from '@/components/molecules/FactionTile.vue';
import HomeHero from '@/components/organisms/HomeHero.vue';
import HomeTrailerCast from '@/components/organisms/HomeTrailerCast.vue';
import IncursionsBand from '@/components/organisms/IncursionsBand.vue';
import WaysToPlayBand from '@/components/organisms/WaysToPlayBand.vue';
import TrailerPlayer from '@/components/organisms/TrailerPlayer.vue';
import NewsletterForm from '@/components/organisms/NewsletterForm.vue';
import { useChrome } from '@/composables/useChrome';
import { viewHeight } from '@/composables/useMediaQuery';
import { getDoc, getDocs, metaString, t } from '@/content';
import {
  chapters,
  characters,
  coreProduct,
  tryRoutes,
  factions,
  game,
} from '@/data/universe';
import { factionTags } from '@/site/characters';
import { pad } from '@/site/format';
import { afterGlide, glideToElement } from '@/site/glide';
import { chapterHash, outbound, to } from '@/site/links';
import { tokenPx } from '@/site/tokens';

/* Capped for page weight. */
const ROTATOR_MAX = 20;

const rotatorCast = computed(() => {
  const lead = factions
    .map((faction) =>
      characters.find((c) => Array.isArray(c.factionIds) && c.factionIds[0] === faction.id),
    )
    .filter((c): c is (typeof characters)[number] => Boolean(c));
  const seen = new Set(lead.map((c) => c.id));
  return [...lead, ...characters.filter((c) => !seen.has(c.id))].slice(0, ROTATOR_MAX);
});

/* The newest PUBLISHED chapter, deliberately not the newest product. */
const currentChapter = computed(
  () => [...chapters].reverse().find((c) => c.status === 'published') ?? chapters[0],
);
const currentChapterTitle = computed(() =>
  metaString(getDoc(`story/${currentChapter.value.id}`), 'title', currentChapter.value.title),
);

const latestNews = computed(() =>
  getDocs('news/')
    .sort((a, b) => String(b.meta.date ?? '').localeCompare(String(a.meta.date ?? '')))
    .slice(0, 3),
);

const route = useRoute();
const { heroIntro } = useChrome();
const trailer = ref<InstanceType<typeof TrailerPlayer> | null>(null);

/* Where the heading would push the player below the fold, the section's scroll margin aims the player instead; glides and anchor jumps read it. */
function aimTrailer(): void {
  const section = document.getElementById('trailer');
  const player = trailer.value?.$el as HTMLElement | undefined;
  if (!section || !player) return;
  section.style.removeProperty('scroll-margin-top');
  const css = getComputedStyle(section);
  const nav = tokenPx('--nav-height');
  /* Flush once its own padding clears the nav: a margin would leave the lid's foot under the header. */
  const margin = parseFloat(css.paddingTop) >= nav ? 0 : parseFloat(css.scrollMarginTop) || 0;
  const offset = player.getBoundingClientRect().top - section.getBoundingClientRect().top;
  const room = viewHeight();
  if (margin + offset + player.offsetHeight <= room) {
    section.style.scrollMarginTop = `${margin}px`;
    return;
  }
  /* Centred, and below the nav when it fits there: the nav hides on the way down. */
  const top = Math.max(player.offsetHeight <= room - nav ? nav : 0, (room - player.offsetHeight) / 2);
  section.style.scrollMarginTop = `${top - offset}px`;
}

/* After Vue's update: the hero's overhang, which pads the section, follows the same resize. */
function aimLater(): void {
  void nextTick(aimTrailer);
}

/* Already at #trailer, the router won't navigate, so the glide starts here. */
async function watchTrailer(): Promise<void> {
  aimTrailer();
  const target = document.getElementById('trailer');
  const arrived = route.hash === '#trailer' && target ? await glideToElement(target) : await afterGlide();
  if (arrived) trailer.value?.play();
}

onMounted(() => {
  aimTrailer();
  window.addEventListener('resize', aimLater);
  void document.fonts?.ready.then(aimTrailer);
});

onBeforeUnmount(() => window.removeEventListener('resize', aimLater));

const rotator = ref<HTMLElement | null>(null);
function scrollCast(direction: 1 | -1): void {
  const el = rotator.value;
  if (!el) return;
  el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.8, 640), behavior: 'smooth' });
}
</script>

<template>
  <HomeHero @watch="watchTrailer">
    <section id="trailer" tabindex="-1" class="l-band l-band--line-bottom home__claim">
      <div class="l-wrap l-wrap--reading home__center home__claim-head">
        <MonoLabel>{{ t('home.zero.kicker') }}</MonoLabel>
        <h2 class="home__h2 home__h2--claim">{{ t('home.zero.title') }}</h2>
      </div>
      <HomeTrailerCast>
        <TrailerPlayer
          ref="trailer"
          :you-tube-id="game.trailerYouTubeId"
          :poster="game.trailerPoster"
          :defer-poster="heroIntro !== null"
          :title="t('home.zero.trailerTitle')"
          :placeholder="t('home.zero.trailerPlaceholder')"
        />
        <MonoLabel class="home__center home__caption">
          <span class="home__caption-pad">{{ t('home.zero.caption') }}</span>
        </MonoLabel>
      </HomeTrailerCast>
      <div class="l-wrap home__center">
        <UiButton variant="quiet" :to="to('learn', {}, { hash: '#videos' })">{{ t('home.zero.link') }}</UiButton>
      </div>
    </section>

    <section class="home__offer">
      <h2 class="l-sr-only">{{ t('home.offer.title') }}</h2>
      <p class="l-wrap home__offer-line">
        <span class="home__offer-state">
          <span class="home__offer-dot" aria-hidden="true"></span>{{ t('home.offer.badge') }}
        </span>
        <span v-if="coreProduct.price" class="home__offer-price">
          <strong>{{ t('home.offer.from') }} {{ coreProduct.price }}</strong>
          {{ t('home.offer.priceQualifier') }}
        </span>
        <BaseLink :link="outbound('buy')" class="home__offer-cta">
          {{ t('home.offer.cta') }} →
        </BaseLink>
      </p>
    </section>

    <WaysToPlayBand />

    <section class="l-band">
      <div class="l-wrap home__rotator-head">
        <div>
          <MonoLabel tone="accent">{{ t('home.cast.kicker') }}</MonoLabel>
          <h2 class="home__h2">{{ t('home.cast.title') }}</h2>
          <MonoLabel tone="faint">
            {{ characters.length }} {{ t('universe.characters.count') }}
          </MonoLabel>
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
          :art="character.cardArt"
          :epithet="character.epithet"
          :name="character.name"
          :tags="factionTags(character)"
          :placeholder="t('character.cardArtPlaceholder')"
        />
      </div>
      <div class="l-wrap home__spacer">
        <UiButton variant="quiet" :to="to('characters')">{{ t('home.cast.link') }}</UiButton>
      </div>
    </section>

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

    <IncursionsBand />

    <section id="story" class="l-band">
      <div class="l-wrap">
        <MonoLabel tone="accent">{{ t('home.chapter.kicker') }}</MonoLabel>
        <div class="l-surface l-surface--pad home__chapter">
          <div class="home__chapter-art">
            <ArtFrame :art="null" ratio="4 / 3" radius="m" :placeholder="t('home.chapter.artPlaceholder')" />
          </div>
          <div class="home__chapter-body">
            <MonoLabel tone="muted">
              {{ t('home.chapter.label') }} {{ pad(currentChapter.number) }}
            </MonoLabel>
            <h2 class="home__h3">{{ currentChapterTitle }}</h2>
            <p class="l-lede home__body">{{ t('home.chapter.body') }}</p>
            <UiButton
              :to="to('story', {}, { hash: chapterHash(currentChapter.number) })"
              class="home__spacer"
            >
              {{ t('home.chapter.cta') }}
            </UiButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Holds the only filled CTA below the fold. -->
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

    <section id="community" class="l-band l-band--line-top">
      <div class="l-wrap l-split">
        <div class="l-split__main">
          <h2 class="home__h3">{{ t('home.community.title') }}</h2>
          <p class="l-lede home__body">{{ t('home.community.body') }}</p>
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
  </HomeHero>
</template>

<style>
/* Height is set by the 44px tap target inside, so this bar never takes --band-y padding. */
.home__offer {
  border-top: 1px solid rgba(var(--rgb-accent), 0.2);
  border-bottom: 1px solid rgba(var(--rgb-accent), 0.2);
  background: rgba(var(--rgb-accent), 0.07);
}

.home__offer-line {
  padding-block: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-1) var(--space-4);
  text-align: center;
  font-size: var(--size-body);
  line-height: 1.5;
  color: var(--color-ink-muted);
}

.home__offer-state {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 700;
  white-space: nowrap;
}

.home__offer-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  box-shadow: 0 0 10px 1px rgba(var(--rgb-accent), 0.7);
}

.home__offer-price {
  color: var(--color-ink-soft);
}

.home__offer-price::before {
  content: '·';
  margin-inline-end: var(--space-4);
  color: rgba(var(--rgb-ink), 0.28);
}

.home__offer-price strong {
  font-weight: 700;
  color: var(--color-ink-muted);
}

.home__offer-cta {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-weight: 500;
  white-space: nowrap;
}

.home__h2 {
  margin-top: var(--space-4);
  font-size: var(--size-h2);
}

.home__h3 {
  margin-top: var(--space-3);
  font-size: clamp(1.375rem, 3.4vw, 2rem);
}

.home__body {
  margin-top: var(--space-5);
}

.home__center {
  text-align: center;
}

.home__claim {
  /* Clears the art HomeHero hangs over this band's top. */
  --claim-pad: max(var(--band-y), calc(var(--hero-overhang, 0px) + var(--space-6)));

  position: relative;
  /* The trailer's traces and spine run past the page edge. Clip, not hidden: hidden makes a scroll container. */
  overflow-x: clip;
  padding-top: var(--claim-pad);
  background: var(--color-bg);
}

.home__claim-head {
  position: relative;
  z-index: var(--z-raised);
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.85);
}

/* Phones: the spine from the band's top to the player (HomeHeroBand draws the hero's half); the bottom inset must equal the cast grid's top margin. Off under HomeHero's SIDE_QUERY, below. */
.home__claim-head::before,
.home__claim-head::after {
  content: '';
  position: absolute;
  z-index: -1;
  top: calc(-1 * var(--claim-pad));
  bottom: calc(-1 * var(--space-7));
  pointer-events: none;
}

.home__claim-head::before {
  left: calc(50% - 36px);
  width: 72px;
  background: var(--spine-grille);
}

/* Scrim: keeps the heading readable over the grille. */
.home__claim-head::after {
  left: calc(50% - 76px);
  width: 152px;
  background: radial-gradient(60% 40% at 50% 62%, rgba(var(--rgb-bg), 0.9), rgba(var(--rgb-bg), 0.55) 60%, transparent);
}

/* HomeHero's SIDE_QUERY. */
@media (min-width: 47.5em), (orientation: landscape) and (min-width: 34em) {
  .home__claim-head::before,
  .home__claim-head::after {
    content: none;
  }
}

.home__h2--claim {
  margin-top: var(--space-3);
}

/* Above the trunks that run down behind it. */
.home__caption {
  position: relative;
  z-index: var(--z-raised);
  margin-top: var(--space-3);
}

.home__caption-pad {
  padding: 0 10px;
  background: var(--color-bg);
}

.home__spacer {
  margin-top: var(--space-5);
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
  margin-top: var(--space-7);
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

.home__channels {
  margin-top: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: var(--track-mono-tight);
  color: var(--color-ink-faint);
}

.home__channels span {
  padding: 6px var(--space-3);
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
