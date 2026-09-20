<script setup lang="ts">

import { computed, nextTick, onMounted, ref, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import BaseLink from '@/components/atoms/BaseLink.vue';
import FilterChip from '@/components/atoms/FilterChip.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import JumpChip from '@/components/atoms/JumpChip.vue';
import TextField from '@/components/atoms/TextField.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import MissingCardNote from '@/components/molecules/MissingCardNote.vue';
import RuleEntryView from '@/components/molecules/RuleEntry.vue';
import RuleText from '@/components/molecules/RuleText.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SearchField from '@/components/molecules/SearchField.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import CardDetail from '@/components/organisms/CardDetail.vue';
import { t } from '@/content';
import { useChrome } from '@/composables/useChrome';
import { useCardParam } from '@/composables/useCardParam';
import { useCopy } from '@/composables/useCopy';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { useSearchQuery } from '@/composables/useSearchQuery';
import { useSlashFocus } from '@/composables/useSlashFocus';
import { cardBySlug } from '@/site/cards';
import { outbound, to } from '@/site/links';
import {
  assertRulesShape,
  CLASS_ORDER,
  INTRO_ID,
  matchesRule,
  rulesEntries,
  rulesLetters,
} from '@/site/rules';
import { game } from '@/data/universe';
import type { RuleClass } from '@/site/rules';
import type { SectionEntry } from '@/site/sections';

const route = useRoute();
const { navHidden } = useChrome();

const { draft, searching, search, clear, field: searchField } = useSearchQuery('q');

const query = computed({ get: () => draft.value, set: search });

/* useSearchQuery focuses `field` after a clear, and the / shortcut needs it too: both want the <input> inside SearchField. */
const searchBox = ref<InstanceType<typeof SearchField> | null>(null);
watchEffect(() => (searchField.value = searchBox.value?.input ?? null));
const cls = useQueryFilter('class');

/* A cited card opens THE CARD, never a second transcription. Closing returns to the anchored rule with search and class filter intact, because `useCardParam` patches the query rather than replacing it. */
const card = useCardParam({ isKnown: (slug) => Boolean(cardBySlug(slug)) });
const activeCard = computed(() => (card.slug.value ? cardBySlug(card.slug.value) : null));
const stickyField = ref<InstanceType<typeof TextField> | null>(null);

/* Matching reads only the haystacks, which no term changes, so the index is built once and the displayed pass is built from the widening it decides — the other way round would be circular. */
const index = rulesEntries();

const idsMatching = (loose: boolean) =>
  new Set(
    index.filter((entry) => entry.id !== INTRO_ID && matchesRule(entry, draft.value, loose)).map((entry) => entry.id),
  );

const strictIds = computed(() => idsMatching(false));

/* A query matching no whole word widens to a substring pass, and stays empty unless that found something, so the class filter emptying the list is never blamed on the query. */
const looseIds = computed(() =>
  searching.value && strictIds.value.size === 0 ? idsMatching(true) : new Set<string>(),
);

const widened = computed(() => looseIds.value.size > 0);

const all = computed(() => rulesEntries(draft.value, widened.value));
const intro = computed(() => all.value.find((entry) => entry.id === INTRO_ID) ?? null);
const activeClass = computed(() => (cls.value.value ?? '') as RuleClass | '');

const matched = computed(() => {
  const ids = widened.value ? looseIds.value : strictIds.value;
  return all.value.filter((entry) => ids.has(entry.id));
});

const hits = computed(() =>
  matched.value.filter((entry) => !activeClass.value || entry.cls.includes(activeClass.value)),
);

const letters = computed(() => rulesLetters(hits.value));
const total = computed(() => hits.value.length);
const noResults = computed(() => total.value === 0);

const classes = computed(() =>
  CLASS_ORDER.map((name) => ({
    name,
    count: matched.value.filter((e) => e.cls.includes(name)).length,
  })).filter((row) => row.count > 0),
);
 
const alphabet = computed(() => {
  const live = new Set(letters.value.map((band) => band.letter));
  const present = [...new Set(all.value.filter((e) => e.id !== INTRO_ID).map((e) => e.letter))];
  return present.sort().map((letter) => ({ letter, live: live.has(letter) }));
});

const sections = computed<SectionEntry[]>(() =>
  CLASS_ORDER.flatMap((name) =>
    hits.value
      .filter((entry) => entry.cls.includes(name))
      .map((entry) => ({
        id: entry.id,
        key: `${name}-${entry.id}`,
        label: entry.bare,
        group: t(`rules.classes.${name}`),
      })),
  ),
);

const countLabel = computed(() => {
  if (noResults.value) return t('rules.count.none');
  const noun = total.value === 1 ? t('rules.count.term') : t('rules.count.terms');
  const base =
    searching.value || activeClass.value
      ? `${total.value} ${t('rules.count.match')}`
      : `${total.value} ${noun}`;
  return widened.value ? `${base} · ${t('cardsPage.countWidened')}` : base;
});

const updated = computed(() => game.rulesUpdated);

const hitIds = computed(() => hits.value.map((entry) => entry.id));
const cursor = ref(0);
watch(hitIds, () => (cursor.value = 0));

function step(by: number): void {
  if (!hitIds.value.length) return;
  cursor.value = (cursor.value + by + hitIds.value.length) % hitIds.value.length;
  jump(hitIds.value[cursor.value]);
}

function jump(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'instant', block: 'start' });
  target.focus({ preventScroll: true });
}

/* Whichever field is on screen: the sticky one replaces the hero's once the nav retracts. */
useSlashFocus(() => (navHidden.value ? stickyField.value?.el : searchField.value), {
  enabled: () => !card.open.value,
});

/* Clear here means the class filter as well as the text. */
function clearSearch(): void {
  clear();
  cls.set(null);
}

/* A pasted #<id> clears an active search and scrolls explicitly: the router's scrollBehavior runs before this lazy route has rendered the entry, and focus() will not scroll a tabindex="-1" article. */
async function applyHash(): Promise<void> {
  const id = route.hash.replace(/^#/, '');
  if (!id || !all.value.some((entry) => entry.id === id)) return;
  if (draft.value) search('');
  if (activeClass.value) cls.set(null);
  await nextTick();

  await document.fonts?.ready; 
  jump(id);
}

const { copied, copy } = useCopy();

function copyLink(id: string): void {
  const url = `${window.location.origin}${window.location.pathname}#${id}`;
  void copy(url, id, () => (window.location.hash = id));
}

onMounted(() => {
  assertRulesShape(all.value);
  void applyHash();
});

watch(() => route.hash, applyHash);
</script>

<template>
  <SecondaryHero glow="80% 60% at 20% 0%">
    <Breadcrumbs
      :crumbs="[{ label: t('ia.learn.label'), to: to('learn') }, { label: t('rules.hero.crumb') }]"
    />
    <h1 class="l-page-title">{{ t('rules.hero.title') }}</h1>

    <p class="rules__currency">
      <MonoLabel tone="accent">{{ t('rules.current') }}</MonoLabel>
      <MonoLabel tone="faint">
        {{ updated ? `${t('rules.updated')} ${updated}` : t('rules.updatedUnset') }}
      </MonoLabel>
    </p>

    <p class="rules__router">
      {{ t('rules.router.body') }}
      <BaseLink class="rules__router-link" :to="to('learn', {}, { hash: '#paths' })">
        {{ t('rules.router.track') }}
      </BaseLink>
      ·
      <BaseLink class="rules__router-link" :link="outbound('rulebook')">
        {{ t('rules.router.book') }}
      </BaseLink>
    </p>

    <div v-if="intro" class="rules__intro">
      <p
        v-for="(block, i) in intro.blocks.filter((b) => b.kind === 'text')"
        :key="i"
        class="rules__lede"
      >
        <RuleText :segs="block.segs" />
      </p>
      <p
        v-for="(block, i) in intro.blocks.filter((b) => b.kind === 'note')"
        :key="`n${i}`"
        class="rules__precedence"
      >
        <RuleText :segs="block.segs" />
      </p>
    </div>

    <div class="rules__search">
      <SearchField
        ref="searchBox"
        v-model="query"
        :label="t('rules.search.label')"
        :placeholder="t('rules.search.placeholder')"
        :clear-label="t('rules.search.clear')"
        :can-clear="searching || Boolean(activeClass)"
        @clear="clearSearch()"
      />
      <MonoLabel tone="faint" aria-live="polite">{{ countLabel }}</MonoLabel>
    </div>

    <div class="l-row rules__filter">
      <FilterChip :active="!activeClass" @toggle="cls.set(null)">
        {{ t('rules.classes.all') }}
      </FilterChip>
      <FilterChip
        v-for="row in classes"
        :key="row.name"
        :active="activeClass === row.name"
        :count="row.count"
        @toggle="cls.toggle(row.name)"
      >
        {{ t(`rules.classes.${row.name}`) }}
      </FilterChip>
    </div>

    <nav id="on-this-page" class="l-row rules__az" :aria-label="t('rules.az')">
      <JumpChip
        v-for="row in alphabet"
        :key="row.letter"
        class="rules__az-chip"
        :class="{ 'is-quiet': !row.live }"
        :to="{ hash: `#letter-${row.letter.toLowerCase()}` }"
        :aria-disabled="!row.live"
      >
        {{ row.letter }}
      </JumpChip>
    </nav>
  </SecondaryHero>
 
  <div v-if="navHidden" class="rules__sticky">
    <div class="l-wrap rules__sticky-row">
      <TextField
        ref="stickyField"
        v-model="query"
        class="rules__sticky-input"
        type="search"
        autocomplete="off"
        :aria-label="t('rules.search.label')"
        :placeholder="t('rules.search.placeholder')"
      />
      <MonoLabel tone="faint">{{ countLabel }}</MonoLabel>
      <div v-if="total > 1" class="rules__step">
        <button type="button" :aria-label="t('rules.prevHit')" @click="step(-1)">↑</button>
        <button type="button" :aria-label="t('rules.nextHit')" @click="step(1)">↓</button>
      </div>
    </div>
  </div>

  <section v-if="card.missing.value" class="l-band">
    <div class="l-wrap l-wrap--reading">
      <MissingCardNote
        class="rules__missing"
        :slug="card.missing.value"
        @dismiss="card.dismissMissing()"
      />
    </div>
  </section>

  <ScrollSpyRail :sections="sections" />

  <section v-if="noResults" class="l-band">
    <div class="l-wrap"> 
      <EmptyState
        variant="noResults"
        :kicker="t('rules.empty.kicker')"
        :title="t('rules.empty.title')"
        :body="t('rules.empty.body')"
        :action-label="t('rules.search.clear')"
        @action="clearSearch()"
      />
      <div class="l-row rules__routes">
        <UiButton variant="quiet" :to="to('community', {}, { hash: '#discord' })">
          {{ t('rules.empty.discord') }}
        </UiButton>
      </div>
    </div>
  </section>

  <section v-for="band in letters" :id="band.id" :key="band.id" tabindex="-1" class="rules__band">
    <div class="l-wrap">
      <!-- Not aria-hidden: it would step a screen reader from the page h1 straight to a term's h3 with no band between them. -->
      <h2 class="rules__letter">
        <span aria-hidden="true">{{ band.letter }}</span>
        <span class="l-sr-only">{{ t('rules.letterGroup') }} {{ band.letter }}</span>
      </h2>

      <RuleEntryView
        v-for="entry in band.entries"
        :key="entry.id"
        :entry="entry"
        :copied="copied === entry.id"
        @copy="copyLink(entry.id)"
        @card="card.openCard($event)"
      />
    </div>
  </section>

  <section class="l-band l-band--tight l-band--line-top">
    <div class="l-wrap l-wrap--reading rules__foot">
      <p>{{ t('rules.errata.body') }}</p>
      <UiButton variant="quiet" :to="to('soon', {}, { hash: '#errata' })">
        {{ t('rules.errata.link') }}
      </UiButton>
      <UiButton variant="quiet" :link="outbound('rulesReference')">
        {{ t('rules.pdf.link') }}
      </UiButton>
    </div>
  </section>

  <CardDetail
    :open="card.open.value"
    :row="activeCard"
    :printing="card.printing.value"
    @close="card.close()"
    @printing="card.setPrinting($event)"
  />
</template>

<style>
.rules__currency {
  margin-top: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  align-items: baseline;
}

.rules__router {
  margin-top: var(--space-4);
  max-width: var(--width-reading);
  font-size: var(--size-m);
  color: var(--color-ink-soft);
}

.rules__intro {
  margin-top: var(--space-5);
  max-width: var(--width-reading);
}

.rules__lede {
  margin-top: var(--space-4);
  font-size: var(--size-body);
  line-height: 1.65;
  color: var(--color-ink-soft);
}

.rules__precedence {
  margin-top: var(--space-5);
  padding: var(--space-4);
  border-left: 2px solid var(--color-accent);
  border-radius: 0 var(--radius-m) var(--radius-m) 0;
  background: var(--color-accent-wash);
  font-size: var(--size-body);
  line-height: 1.65;
}

.rules__search {
  margin-top: var(--space-8);
  display: grid;
  gap: var(--space-3);
}

.rules__filter {
  margin-top: var(--space-5);
}

.rules__az {
  margin-top: var(--space-5);
}

.rules__az-chip {
  min-width: 44px;
  justify-content: center;
}
 
.rules__az-chip.is-quiet {
  opacity: 0.35;
}

.rules__missing {
  margin-top: var(--space-4);
}

.rules__sticky {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-sticky);
  background: rgba(var(--rgb-bg), 0.96);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-line);
}

.rules__sticky-row {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  min-height: var(--nav-height);
}

/* Two classes, so this holds whichever of the two components' CSS loads first. Shorter than the hero field, and on surface, to sit inside the bar. */
.c-field.rules__sticky-input {
  flex: 1 1 auto;
  width: auto;
  min-height: 40px;
  padding-inline: var(--space-3);
  background: var(--color-surface);
}

.rules__step {
  display: flex;
  gap: var(--space-1);
}

.rules__step button {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--color-ink-soft);
  cursor: pointer;
}

.rules__band {
  padding-block: var(--space-6);
}

.rules__letter {
  font-family: var(--font-mono);
  font-size: var(--size-mono-m);
  letter-spacing: var(--track-mono);
  color: var(--color-ink-faint);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-line-strong);
  max-width: var(--width-reading);
}

.rules__routes {
  margin-top: var(--space-5);
  justify-content: center;
}

.rules__foot {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-4);
  align-items: center;
  font-size: var(--size-m);
  color: var(--color-ink-soft);
}
</style>
