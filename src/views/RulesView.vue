<script setup lang="ts">
/**
 * Rules reference `rules.json`.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useRoute } from 'vue-router';
import BaseLink from '@/components/atoms/BaseLink.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import JumpChip from '@/components/atoms/JumpChip.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import RuleEntryView from '@/components/molecules/RuleEntry.vue';
import RuleText from '@/components/molecules/RuleText.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { t } from '@/content';
import { useChrome } from '@/composables/useChrome';
import { useQueryFilter } from '@/composables/useQueryFilter';
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
const searchId = useId();
const { navHidden } = useChrome();

const query = useQueryFilter('q');
const cls = useQueryFilter('class');
const searchField = ref<HTMLInputElement | null>(null);
const stickyField = ref<HTMLInputElement | null>(null);

/* Driven by a local ref, not by the param it writes to: binding straight to the
   URL makes every keystroke wait on a router.replace and the caret jumps. */
const draft = ref(query.value.value ?? '');
watch(
  () => query.value.value,
  (next) => {
    const incoming = next ?? '';
    if (incoming !== draft.value.trim()) draft.value = incoming;
  },
);

function search(next: string): void {
  draft.value = next;
  query.set(next.trim() ? next.trim() : null);
}

const terms = computed(() => draft.value.trim().toLowerCase().split(/\s+/).filter(Boolean));
const searching = computed(() => terms.value.length > 0);

const all = computed(() => rulesEntries(terms.value));
const intro = computed(() => all.value.find((entry) => entry.id === INTRO_ID) ?? null);
const activeClass = computed(() => (cls.value.value ?? '') as RuleClass | '');

const matched = computed(() =>
  all.value.filter((entry) => entry.id !== INTRO_ID && matchesRule(entry, terms.value)),
);

const hits = computed(() =>
  matched.value.filter((entry) => !activeClass.value || entry.cls === activeClass.value),
);

const letters = computed(() => rulesLetters(hits.value));
const total = computed(() => hits.value.length);
const noResults = computed(() => total.value === 0);

/** Counts per class */
const classes = computed(() =>
  CLASS_ORDER.map((name) => ({
    name,
    count: matched.value.filter((e) => e.cls === name).length,
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
      .filter((entry) => entry.cls === name)
      .map((entry) => ({ id: entry.id, label: entry.bare, group: t(`rules.classes.${name}`) })),
  ),
);

/* t() has no interpolation, so the count is composed here. */
const countLabel = computed(() => {
  if (noResults.value) return t('rules.count.none');
  const noun = total.value === 1 ? t('rules.count.term') : t('rules.count.terms');
  if (searching.value || activeClass.value) return `${total.value} ${t('rules.count.match')}`;
  return `${total.value} ${noun}`;
});

const updated = computed(() => game.rulesUpdated);

/* ------------------------------------------------------------- hit stepping */
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

/* -------------------------------------------------------------------- keys */
function onKeydown(event: KeyboardEvent): void {
  /* Modified presses belong to the browser and to assistive tech. */
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target as HTMLElement | null;
  if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) {
    return;
  }
  event.preventDefault();
  (navHidden.value ? stickyField.value : searchField.value)?.focus();
}

function clearSearch(): void {
  search('');
  cls.set(null);
  searchField.value?.focus();
}

/* A pasted #<id> outranks a stale search, which would otherwise have filtered
   its entry out of the DOM and left the link resolving to nothing.

   The scroll has to be explicit. The router's scrollBehavior runs before this
   lazy route has rendered an entry, so its target does not exist yet, and
   focus() does not scroll a tabindex="-1" article. */
async function applyHash(): Promise<void> {
  const id = route.hash.replace(/^#/, '');
  if (!id || !all.value.some((entry) => entry.id === id)) return;
  if (draft.value) search('');
  if (activeClass.value) cls.set(null);
  await nextTick();
  /* Wait for the fonts. */
  await document.fonts?.ready; 
  jump(id);
}

const copied = ref<string | null>(null);
let copyTimer: number | undefined;

async function copyLink(id: string): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${id}`;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    window.location.hash = id;
  }
  copied.value = id;
  window.clearTimeout(copyTimer);
  copyTimer = window.setTimeout(() => (copied.value = null), 1600);
}

onMounted(() => {
  assertRulesShape(all.value);
  window.addEventListener('keydown', onKeydown);
  void applyHash();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  window.clearTimeout(copyTimer);
});

watch(() => route.hash, applyHash);
</script>

<template>
  <SecondaryHero glow="80% 60% at 20% 0%">
    <Breadcrumbs
      :crumbs="[{ label: t('ia.learn.label'), to: to('learn') }, { label: t('rules.hero.crumb') }]"
    />
    <h1 class="rules__title">{{ t('rules.hero.title') }}</h1>

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
      <label class="l-sr-only" :for="searchId">{{ t('rules.search.label') }}</label>
      <div class="rules__field">
        <input
          :id="searchId"
          ref="searchField"
          class="rules__input"
          type="search"
          autocomplete="off"
          :value="draft"
          :placeholder="t('rules.search.placeholder')"
          @input="search(($event.target as HTMLInputElement).value)"
        />
        <button v-if="searching || activeClass" type="button" class="rules__clear" @click="clearSearch()">
          {{ t('rules.search.clear') }}
        </button>
      </div>
      <MonoLabel tone="faint" aria-live="polite">{{ countLabel }}</MonoLabel>
    </div>

    <div class="rules__filter">
      <button
        type="button"
        class="rules__cls"
        :aria-pressed="!activeClass"
        @click="cls.set(null)"
      >
        {{ t('rules.classes.all') }}
      </button>
      <button
        v-for="row in classes"
        :key="row.name"
        type="button"
        class="rules__cls"
        :aria-pressed="activeClass === row.name"
        @click="cls.set(activeClass === row.name ? null : row.name)"
      >
        {{ t(`rules.classes.${row.name}`) }} <span class="rules__cls-n">{{ row.count }}</span>
      </button>
    </div>

    <nav id="on-this-page" class="rules__az" :aria-label="t('rules.az')">
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
      <input
        ref="stickyField"
        class="rules__sticky-input"
        type="search"
        autocomplete="off"
        :value="draft"
        :aria-label="t('rules.search.label')"
        :placeholder="t('rules.search.placeholder')"
        @input="search(($event.target as HTMLInputElement).value)"
      />
      <MonoLabel tone="faint">{{ countLabel }}</MonoLabel>
      <div v-if="total > 1" class="rules__step">
        <button type="button" :aria-label="t('rules.prevHit')" @click="step(-1)">↑</button>
        <button type="button" :aria-label="t('rules.nextHit')" @click="step(1)">↓</button>
      </div>
    </div>
  </div>

  <!-- Remounted when the visible set changes: the rail observes its sections
       once, on mount, so a changed list would leave it spying on stale ids. -->
  <ScrollSpyRail :key="sections.map((s) => s.id).join(',')" :sections="sections" />

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
      <!-- Not aria-hidden: that would step a screen reader from the page h1
           straight to a term's h3 with no band between them. -->
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
</template>

<style>
.rules__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
}

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

.rules__field {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.rules__input {
  width: 100%;
  max-width: 420px;
  min-height: 48px;
  padding-inline: var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  color: var(--color-ink);
  font-size: var(--size-field);
}

.rules__clear {
  min-height: 44px;
  padding-inline: var(--space-3);
  border: 0;
  background: none;
  color: var(--color-ink-faint);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  cursor: pointer;
}

.rules__clear:hover {
  color: var(--color-accent-text);
}

.rules__filter {
  margin-top: var(--space-5);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.rules__cls {
  min-height: 44px;
  padding-inline: var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink-soft);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  cursor: pointer;
}

.rules__cls[aria-pressed='true'] {
  background: var(--color-accent-wash);
  border-color: var(--color-accent);
  color: var(--color-ink);
}

.rules__cls-n {
  opacity: 0.6;
}

.rules__az {
  margin-top: var(--space-5);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.rules__az-chip {
  min-width: 44px;
  justify-content: center;
}
 
.rules__az-chip.is-quiet {
  opacity: 0.35;
}

.rules__sticky {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
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

.rules__sticky-input {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 40px;
  padding-inline: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  color: var(--color-ink);
  font-size: var(--size-field);
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
