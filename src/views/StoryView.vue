<script setup lang="ts">
/**
 * STORY — chapters, and only chapters. Four bands: the chapter shelf, the
 * five-minute recap with per-chapter anchors (#ch-01, #ch-02 — public URLs),
 * the story graph (nodes are published stories, pins are derived from each
 * story's cast list, so it stays correct as chapters are added), and the
 * Convergence vote.
 *
 * This page does NOT sell anything. A chapter may have no product behind it at
 * all, and the editions differ by content rather than by story — box contents
 * belong wherever `products[]` is rendered.
 */
import { computed, ref } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import ContentCard from '@/components/molecules/ContentCard.vue';
import MarkdownBlock from '@/components/molecules/MarkdownBlock.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { docHtml, getDoc, metaString, t } from '@/content';
import { chapters, characterById, factionById, stories } from '@/data/universe';
import { soon, to } from '@/site/links';
import type { SectionEntry } from '@/site/sections';

/** Move to data when the first vote is scheduled. */
const voteOpen = true;

const sections = computed<SectionEntry[]>(() => [
  { id: 'chapters', label: t('story.sections.chapters') },
  { id: 'story-so-far', label: t('story.sections.soFar') },
  { id: 'story-graph', label: t('story.sections.graph') },
  {
    id: 'convergence',
    label: voteOpen ? t('story.sections.voteOpen') : t('story.sections.convergence'),
    accent: voteOpen,
  },
]);

const pad = (n: number) => String(n).padStart(2, '0');

const chapterDoc = (chapterId: string) => getDoc(`story/${chapterId}`);
const chapterTitle = (chapterId: string, fallback: string) =>
  metaString(chapterDoc(chapterId), 'title', fallback);

const lead = computed(() => chapters[0]);
const rest = computed(() => chapters.slice(1));

const leadHasNarrative = computed(() => Boolean(docHtml(chapterDoc(lead.value.id))));

const statusLabel = (status: string) => t(`story.status.${status}`);

/** Graph columns follow the story, one column per chapter. */
const graph = computed(() =>
  chapters.map((chapter) => ({
    chapter,
    stories: stories.filter((story) => story.chapterId === chapter.id),
  })),
);

const selectedId = ref<string | null>(null);
const selected = computed(() => (selectedId.value ? characterById(selectedId.value) : null));
const selectedFaction = computed(() => {
  const character = selected.value;
  if (!character || character.factionIds === 'any') return null;
  return factionById(character.factionIds[0]) ?? null;
});

function pinLabel(characterId: string): string {
  return characterById(characterId)?.name ?? characterId;
}

function pinColor(characterId: string): string | null {
  const character = characterById(characterId);
  if (!character || character.factionIds === 'any') return null;
  return factionById(character.factionIds[0])?.color ?? null;
}
</script>

<template>
  <SecondaryHero glow="80% 70% at 22% 0%" :note="t('story.hero.pending')">
    <Breadcrumbs :crumbs="[{ label: t('ia.story.label') }]" />
    <h1 class="story__title">{{ t('story.hero.title') }}</h1>
    <p class="story__lede">{{ t('story.hero.lede') }}</p>
    <SectionIndex :sections="sections" />
  </SecondaryHero>

  <ScrollSpyRail :sections="sections" />

  <section id="chapters" tabindex="-1" class="l-band">
    <div class="l-wrap">
      <SectionMarker id="chapters" :index="1" :total="4" :heading="t('story.sections.chapters')" />
      <MonoLabel tone="faint">{{ t('story.chapters.note') }}</MonoLabel>

      <article class="story__lead">
        <div class="story__lead-art">
          <ArtFrame
            :art="null"
            ratio="4 / 3"
            radius="m"
            :placeholder="t('story.chapters.leadArtPlaceholder')"
          />
        </div>
        <div class="story__lead-body">
          <MonoLabel tone="muted">
            {{ t('home.chapter.label') }} {{ pad(lead.number) }} · {{ statusLabel(lead.status) }}
          </MonoLabel>
          <h3 class="story__lead-title">{{ chapterTitle(lead.id, lead.title) }}</h3>

          <MarkdownBlock v-if="leadHasNarrative" :slug="`story/${lead.id}`" measure class="story__gap" />
          <p v-else class="story__body">{{ t('story.chapters.narrativePlaceholder') }}</p>

          <div class="l-row story__gap">
            <UiButton :to="soon('#story-chapter')">{{ t('story.chapters.read') }}</UiButton>
            <a class="story__recap" :href="`#ch-${pad(lead.number)}`">
              {{ t('story.chapters.recap') }} ↓
            </a>
          </div>
        </div>
      </article>

      <div class="l-grid l-grid--wide story__gap">
        <ContentCard
          v-for="chapter in rest"
          :key="chapter.id"
          :to="soon('#story-chapter')"
          :kicker="`${t('home.chapter.label')} ${pad(chapter.number)} · ${statusLabel(chapter.status)}`"
          :title="chapterTitle(chapter.id, chapter.title)"
          :body="t('story.chapters.teaser')"
          :placeholder="t('story.chapters.setArtPlaceholder')"
        />
      </div>

      <BandFoot :to="{ hash: '#story-so-far' }" :label="t('story.chapters.exit')" />
    </div>
  </section>

  <section id="story-so-far" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <SectionMarker
        id="story-so-far"
        :index="2"
        :total="4"
        :heading="t('story.sections.soFar')"
      />
      <p class="story__body">{{ t('story.soFar.lede') }}</p>

      <ol class="story__timeline">
        <li class="story__beat">
          <span class="story__beat-rail" aria-hidden="true" />
          <div>
            <MonoLabel tone="faint">{{ t('story.soFar.beforeKicker') }}</MonoLabel>
            <h3 class="story__beat-title">{{ t('story.soFar.migrationTitle') }}</h3>
            <p class="story__beat-body">{{ t('story.soFar.migrationBody') }}</p>
          </div>
        </li>
        <li
          v-for="chapter in chapters.filter((c) => c.status === 'published')"
          :key="chapter.id"
          class="story__beat"
        >
          <span class="story__beat-rail" aria-hidden="true" />
          <div :id="`ch-${pad(chapter.number)}`" tabindex="-1">
            <a class="story__beat-anchor" :href="`#ch-${pad(chapter.number)}`">
              {{ t('home.chapter.label') }} {{ pad(chapter.number) }} <span>#</span>
            </a>
            <h3 class="story__beat-title">{{ chapterTitle(chapter.id, chapter.title) }}</h3>
            <p class="story__beat-body">
              {{ metaString(chapterDoc(chapter.id), 'recap', t('story.soFar.recapPlaceholder')) }}
            </p>
          </div>
        </li>
      </ol>

      <BandFoot :to="{ hash: '#story-graph' }" :label="t('story.soFar.exit')" />
    </div>
  </section>

  <section id="story-graph" tabindex="-1" class="l-band l-band--line-top">
    <div class="l-wrap">
      <SectionMarker id="story-graph" :index="3" :total="4" :heading="t('story.sections.graph')" />
      <MonoLabel tone="faint">{{ t('story.graph.note') }}</MonoLabel>
      <p class="story__body">{{ t('story.graph.lede') }}</p>

      <div class="story__pin-panel" aria-live="polite">
        <p v-if="!selected" class="story__pin-empty">{{ t('story.graph.noPin') }}</p>
        <template v-else>
          <div class="story__pin-who">
            <FactionDot :color="selectedFaction?.color ?? null" :size="10" />
            <div>
              <p class="story__pin-epithet">{{ selected.epithet }}</p>
              <h3 class="story__pin-name">{{ selected.name }}</h3>
              <p class="story__pin-faction">
                {{ selectedFaction?.name ?? t('universe.anyFaction') }}
              </p>
            </div>
          </div>
          <div class="l-row">
            <UiButton :to="to('character', { characterId: selected.id })">
              {{ t('story.graph.details') }}
            </UiButton>
            <UiButton variant="quiet" @click="selectedId = null">{{ t('story.graph.clear') }}</UiButton>
          </div>
        </template>
      </div>

      <div class="story__graph">
        <div v-for="column in graph" :key="column.chapter.id" class="story__column">
          <div class="story__column-head">
            <a :href="`#ch-${pad(column.chapter.number)}`">
              {{ t('home.chapter.label') }} {{ pad(column.chapter.number) }} ·
              {{ statusLabel(column.chapter.status) }}
            </a>
          </div>

          <article v-for="story in column.stories" :key="story.id" class="story__node">
            <MonoLabel tone="faint">
              {{ t('story.graph.storyKicker') }} · {{ t('home.chapter.label') }}
              {{ pad(column.chapter.number) }}
            </MonoLabel>
            <h3 class="story__node-title">{{ story.title }}</h3>
            <p class="story__beat-body">{{ t('story.graph.linePlaceholder') }}</p>
            <div class="story__pins">
              <MonoLabel tone="faint">{{ t('story.graph.cast') }}</MonoLabel>
              <button
                v-for="castId in story.castIds"
                :key="castId"
                type="button"
                class="story__pin"
                :aria-pressed="selectedId === castId"
                :class="{ 'is-active': selectedId === castId }"
                @click="selectedId = selectedId === castId ? null : castId"
              >
                <FactionDot :color="pinColor(castId)" />
                <span>{{ pinLabel(castId) }}</span>
              </button>
            </div>
          </article>

          <div v-if="!column.stories.length" class="story__node story__node--empty">
            <MonoLabel tone="faint">{{ t('story.graph.emptyColumn') }}</MonoLabel>
          </div>
        </div>
      </div>

      <p class="story__note">{{ t('story.graph.derivedNote') }}</p>

      <BandFoot :to="{ hash: '#convergence' }" :label="t('story.graph.exit')" />
    </div>
  </section>

  <section id="convergence" tabindex="-1" class="l-band l-band--alt l-band--line-top">
    <div class="l-wrap">
      <SectionMarker
        id="convergence"
        :index="4"
        :total="4"
        :heading="t('story.sections.convergence')"
      />
      <span v-if="voteOpen" class="story__vote-badge">{{ t('story.convergence.badge') }}</span>
      <h3 class="story__vote-title">{{ t('story.convergence.title') }}</h3>
      <p class="story__body">{{ t('story.convergence.body') }}</p>
      <div class="l-row story__gap">
        <UiButton variant="primary" :to="soon('#vote')">{{ t('story.convergence.cta') }}</UiButton>
        <UiButton variant="quiet" :to="soon('#vote')">{{ t('story.convergence.past') }}</UiButton>
      </div>
      <p class="story__note">{{ t('story.convergence.identity') }}</p>
    </div>
  </section>
</template>

<style>
.story__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
}

.story__lede,
.story__body {
  margin-top: var(--space-4);
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.story__gap {
  margin-top: var(--space-5);
}

.story__lead {
  margin-top: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: clamp(24px, 4vw, 48px);
  padding: clamp(20px, 3vw, 32px);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
}

.story__lead-art {
  flex: 0 0 min(100%, 320px);
}

.story__lead-body {
  flex: 1 1 320px;
  min-width: 0;
}

.story__lead-title {
  margin-top: var(--space-3);
  font-size: clamp(1.375rem, 3.4vw, 2rem);
}

.story__recap {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.story__timeline {
  margin-top: var(--space-8);
  display: grid;
  gap: var(--space-8);
  list-style: none;
}

.story__beat {
  display: flex;
  gap: var(--space-4);
}

.story__beat-rail {
  flex: 0 0 auto;
  width: 2px;
  background: linear-gradient(to bottom, var(--color-accent-wash), transparent);
}

.story__beat-anchor {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.story__beat-title {
  margin-top: var(--space-2);
  font-size: var(--size-h3);
}

.story__beat-body {
  margin-top: var(--space-2);
  max-width: 60ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.story__pin-panel {
  margin-top: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  min-height: 96px;
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
}

.story__pin-empty {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.story__pin-who {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.story__pin-epithet {
  font-size: var(--size-mono-m);
  color: var(--color-ink-muted);
}

.story__pin-name {
  font-family: var(--font-display);
  font-size: var(--size-h3);
}

.story__pin-faction {
  margin-top: var(--space-1);
  font-size: var(--size-mono-m);
  color: var(--color-ink-faint);
}

.story__graph {
  margin-top: var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
}

.story__column {
  display: grid;
  gap: var(--space-3);
  align-content: start;
}

.story__column-head a {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.story__node {
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-m);
}

.story__node--empty {
  display: grid;
  place-items: center;
  min-height: 160px;
  background: none;
  border-style: dashed;
  text-align: center;
}

.story__node-title {
  margin-top: var(--space-2);
  font-family: var(--font-display);
  font-size: var(--size-body-l);
  font-weight: 400;
}

.story__pins {
  margin-top: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.story__pin {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
  padding-inline: 10px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink-muted);
  font-size: var(--size-mono-m);
  cursor: pointer;
  white-space: nowrap;
}

.story__pin.is-active {
  background: var(--color-accent-wash);
  border-color: rgba(var(--rgb-accent), 0.45);
  color: var(--color-ink);
}

.story__note {
  margin-top: var(--space-6);
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-faint);
}

.story__vote-badge {
  display: inline-block;
  padding: 6px var(--space-3);
  border: 1px solid rgba(var(--rgb-accent), 0.55);
  border-radius: var(--radius-pill);
  background: var(--color-accent-wash);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  white-space: nowrap;
}

.story__vote-title {
  margin-top: var(--space-4);
  font-size: clamp(1.375rem, 3.4vw, 2rem);
  max-width: 28ch;
}
</style>
