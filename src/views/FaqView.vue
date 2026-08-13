<script setup lang="ts">
/**
 * FAQ — six bands of questions, one accordion row each, with a search that
 * lives in the URL.
 *
 * Nothing on this page hard-codes a question, a group name or a band exit.
 * Questions are one markdown file each in `content/<locale>/faq/`; the group
 * taxonomy and its order are `faqGroups` in `site/faq.ts`. Reordering the page
 * is a reordering of that array.
 *
 * Every question id is a public URL (`#faq-<id>`) printed on nothing yet but
 * pasteable everywhere. Renaming a content file breaks every copy of its link.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useRoute } from 'vue-router';
import BaseLink from '@/components/atoms/BaseLink.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BandFoot from '@/components/molecules/BandFoot.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SectionIndex from '@/components/molecules/SectionIndex.vue';
import SectionMarker from '@/components/molecules/SectionMarker.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { t } from '@/content';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { assertFaqShape, faqEntries, faqGroups } from '@/site/faq';
import { markHtml, matcher, segments } from '@/site/highlight';
import { soon, to } from '@/site/links';
import type { FaqEntry } from '@/site/faq';
import type { SectionEntry } from '@/site/sections';

const route = useRoute();
const searchId = useId();

/* `?q=` is a URL contract from the mock, and a searched FAQ is a page worth
   sending to someone. useQueryFilter owns the router.replace. */
const query = useQueryFilter('q');

const entries = computed(() => faqEntries());
const searchField = ref<HTMLInputElement | null>(null);

/* The field is driven by a local ref, not by the query param it writes to.
   Binding the input straight to the URL means every keystroke waits on a
   router.replace before the value comes back, and the caret jumps. The watch
   is what keeps the back button working. */
const draft = ref(query.value.value ?? '');
watch(
  () => query.value.value,
  (next) => {
    /* Compared trimmed, because the URL carries the trimmed value: matching on
       the raw one would eat the space the reader just typed between words. */
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
const re = computed(() => matcher(terms.value));

const matches = (entry: FaqEntry) => terms.value.every((word) => entry.haystack.includes(word));

/** Groups in page order, each with the questions that survive the search. */
const bands = computed(() =>
  faqGroups
    .map((group, i) => ({
      id: group.id,
      exit: group.exit,
      index: i + 1,
      label: t(`faq.groups.${group.id}.label`),
      short: t(`faq.groups.${group.id}.short`),
      /* Empty for five of the six, and empty on purpose: t() answers a miss
         with the key itself, so a group with no `standfirst` key at all would
         print "faq.groups.box.standfirst" at the top of its band. */
      standfirst: t(`faq.groups.${group.id}.standfirst`),
      exitLabel: t(`faq.groups.${group.id}.exit`),
      items: entries.value.filter((e) => e.group === group.id && matches(e)),
    }))
    .filter((band) => band.items.length > 0),
);

const total = computed(() => bands.value.reduce((n, band) => n + band.items.length, 0));
const noResults = computed(() => searching.value && total.value === 0);

/* A group with no hits is dropped from the index rather than greyed out: the
   count line already says how many matched, and JumpChip has no dead state. */
const sections = computed<SectionEntry[]>(() =>
  bands.value.map((band) => ({
    id: band.id,
    label: searching.value ? `${band.short} · ${band.items.length}` : band.short,
  })),
);

/** The line under each band's heading: hits while filtering, size otherwise. */
function bandCount(n: number): string {
  if (!searching.value) return `${n} ${t('faq.count.questions')}`;
  return `${n} ${n === 1 ? t('faq.count.match') : t('faq.count.matches')}`;
}

/* t() has no interpolation, so the count is composed here. If interpolation
   ever lands, this collapses into one key. */
const countLabel = computed(() => {
  if (noResults.value) return t('faq.count.none');
  if (searching.value) {
    const noun = total.value === 1 ? t('faq.count.match') : t('faq.count.matches');
    return `${total.value} ${noun}`;
  }
  return `${entries.value.length} ${t('faq.count.questions')} · ${faqGroups.length} ${t('faq.count.groups')}`;
});

/* ---------------------------------------------------------------- open state
   Several things can open a row — a search hit, expand-all, a pasted link, or
   being first on the page. Closing one writes that choice down and it sticks,
   with one exception noted in isOpen(). */
const opened = ref(new Set<string>());
const closed = ref(new Set<string>());
const expandAll = ref(false);
const linked = ref<string | null>(null);

const firstId = computed(() => bands.value[0]?.items[0]?.id ?? null);

function isOpen(entry: FaqEntry): boolean {
  /* Searching outranks a remembered close: a hit the reader cannot read is
     the same as no hit at all. */
  if (searching.value) return true;
  if (closed.value.has(entry.id)) return false;
  if (opened.value.has(entry.id)) return true;
  if (expandAll.value) return true;
  if (linked.value === entry.id) return true;
  return linked.value === null && entry.id === firstId.value;
}

function onToggle(entry: FaqEntry, event: Event): void {
  const open = (event.target as HTMLDetailsElement).open;
  const next = new Set(open ? opened.value : closed.value);
  next.add(entry.id);
  if (open) {
    opened.value = next;
    closed.value = new Set([...closed.value].filter((id) => id !== entry.id));
  } else {
    closed.value = next;
    opened.value = new Set([...opened.value].filter((id) => id !== entry.id));
  }
}

function toggleAll(): void {
  expandAll.value = !expandAll.value;
  opened.value = new Set();
  closed.value = new Set();
  linked.value = null;
}

/* ------------------------------------------------------------------- anchors
   A pasted #faq-<id> must open its row, clear the nav and take focus — on cold
   load and on every later hashchange in the same tab. Focus does the scrolling:
   base.css puts scroll-margin-top on every [id], so the browser lands it below
   the nav without a second calculation here. */
async function applyHash(): Promise<void> {
  const hash = route.hash.replace(/^#/, '');
  if (!hash.startsWith('faq-')) return;
  const id = hash.slice(4);
  if (!entries.value.some((entry) => entry.id === id)) return;

  linked.value = id;
  closed.value = new Set([...closed.value].filter((other) => other !== id));
  /* A pasted link outranks a stale search: without this the linked row is
     filtered out of the DOM and the link resolves to nothing. */
  if (draft.value) search('');

  await nextTick();
  document.getElementById(`faq-${id}`)?.focus();
}

/** `/` focuses the search, the way a search-first page is expected to behave. */
function onKeydown(event: KeyboardEvent): void {
  /* Modified presses belong to the browser and to assistive tech — Ctrl+/ and
     Cmd+/ are shortcuts somewhere, and a page-level key handler that swallows
     them is the kind of thing nobody reports, they just stop using the app. */
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target as HTMLElement | null;
  if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) {
    return;
  }
  event.preventDefault();
  searchField.value?.focus();
}

/** Clearing removes the button that was clicked, so focus has to be placed. */
function clearSearch(): void {
  search('');
  searchField.value?.focus();
}

onMounted(() => {
  assertFaqShape(entries.value);
  window.addEventListener('keydown', onKeydown);
  void applyHash();
});

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

watch(() => route.hash, applyHash);

/* ------------------------------------------------------------------ per-item */
const question = (entry: FaqEntry) => segments(entry.question, re.value);
const answer = (entry: FaqEntry) => markHtml(entry.answerHtml, re.value);

/**
 * Which words only matched a keyword. Saying so is the difference between a
 * result that looks wrong and one that explains itself.
 */
function matchNote(entry: FaqEntry): string {
  if (!searching.value) return '';
  const hidden = terms.value.filter((word) => !entry.text.includes(word));
  if (!hidden.length) return '';
  const shown = hidden.map((word) => entry.keywords.find((k) => k.includes(word)) ?? word);
  return `${t('faq.matchedOn')}: ${shown.join(', ')}`;
}

const copied = ref<string | null>(null);
let copyTimer: number | undefined;

async function copyQuestionLink(entry: FaqEntry): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${entry.anchor}`;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    window.location.hash = entry.anchor;
  }
  copied.value = entry.id;
  window.clearTimeout(copyTimer);
  copyTimer = window.setTimeout(() => (copied.value = null), 1600);
}

onBeforeUnmount(() => window.clearTimeout(copyTimer));

const routing = [
  { key: 'order', to: to('community', {}, { hash: '#support' }) },
  { key: 'rules', to: soon('#rules-reference') },
  { key: 'press', to: to('community', {}, { hash: '#press' }) },
] as const;
</script>

<template>
  <SecondaryHero glow="80% 60% at 25% 0%" :note="t('faq.hero.pending')">
    <Breadcrumbs
      :crumbs="[{ label: t('ia.learn.label'), to: to('learn') }, { label: t('faq.hero.crumb') }]"
    />
    <h1 class="faq__title">{{ t('faq.hero.title') }}</h1>
    <p class="faq__lede">{{ t('faq.hero.lede') }}</p>

    <div class="faq__search">
      <label class="l-sr-only" :for="searchId">{{ t('faq.search.label') }}</label>
      <div class="faq__field">
        <input
          :id="searchId"
          ref="searchField"
          class="faq__input"
          type="search"
          autocomplete="off"
          :value="draft"
          :placeholder="t('faq.search.placeholder')"
          @input="search(($event.target as HTMLInputElement).value)"
        />
        <button v-if="searching" type="button" class="faq__clear" @click="clearSearch()">
          {{ t('faq.search.clear') }}
        </button>
      </div>
      <div class="faq__meter">
        <MonoLabel tone="faint" aria-live="polite">{{ countLabel }}</MonoLabel>
        <button
          v-if="!searching"
          type="button"
          class="faq__expand"
          :aria-pressed="expandAll"
          @click="toggleAll()"
        >
          {{ expandAll ? t('faq.collapseAll') : t('faq.expandAll') }}
        </button>
      </div>
    </div>

    <SectionIndex v-if="sections.length" :sections="sections" />

    <div class="faq__routing">
      <MonoLabel tone="faint">{{ t('faq.routing.kicker') }}</MonoLabel>
      <div class="l-grid l-grid--wide faq__routing-grid">
        <div v-for="row in routing" :key="row.key" class="faq__route">
          <p class="faq__route-case">{{ t(`faq.routing.${row.key}Case`) }}</p>
          <BaseLink :to="row.to" class="faq__route-link">
            {{ t(`faq.routing.${row.key}Link`) }} →
          </BaseLink>
        </div>
      </div>
    </div>
  </SecondaryHero>

  <!-- Remounted when the visible set changes: the rail observes its sections
       once, on mount, so a changed list would leave it spying on stale ids. -->
  <ScrollSpyRail :key="sections.map((s) => s.id).join(',')" :sections="sections" />

  <section v-if="noResults" class="l-band">
    <div class="l-wrap">
      <EmptyState
        variant="noResults"
        :kicker="t('faq.empty.kicker')"
        :title="t('faq.empty.title')"
        :body="t('faq.empty.body')"
        :action-label="t('faq.empty.clear')"
        @action="clearSearch()"
      />
      <!-- EmptyState carries one action, and clearing the search is not an
           answer to the question that missed. The three routes the copy names
           sit beside it. -->
      <div class="l-row faq__routes">
        <UiButton variant="quiet" :to="soon('#rules-reference')">
          {{ t('faq.empty.rules') }}
        </UiButton>
        <UiButton variant="quiet" :to="to('community', {}, { hash: '#discord' })">
          {{ t('faq.stuck.discord') }}
        </UiButton>
        <UiButton variant="quiet" :to="to('community', {}, { hash: '#support' })">
          {{ t('faq.stuck.support') }}
        </UiButton>
      </div>
    </div>
  </section>

  <section
    v-for="(band, i) in bands"
    :id="band.id"
    :key="band.id"
    tabindex="-1"
    class="l-band"
    :class="{ 'l-band--alt': i % 2 === 1, 'l-band--line-top': i > 0 }"
  >
    <div class="l-wrap">
      <SectionMarker
        :id="band.id"
        :index="band.index"
        :total="faqGroups.length"
        :heading="band.label"
      />
      <div class="faq__bandhead">
        <MonoLabel tone="faint">{{ bandCount(band.items.length) }}</MonoLabel>
        <p v-if="band.standfirst && !searching" class="faq__standfirst">{{ band.standfirst }}</p>
      </div>

      <div class="faq__list">
        <details
          v-for="entry in band.items"
          :id="entry.anchor"
          :key="entry.id"
          class="faq__item"
          tabindex="-1"
          :open="isOpen(entry)"
          @toggle="onToggle(entry, $event)"
        >
          <!-- A summary takes phrasing content OR one heading, not both, so the
               chevron is a ::after rather than a second child element. -->
          <summary class="faq__summary">
            <h3 class="faq__question">
              <template v-for="part in question(entry)" :key="part.key"
                ><mark v-if="part.hit" class="faq__hit">{{ part.text }}</mark
                ><template v-else>{{ part.text }}</template></template
              >
            </h3>
          </summary>

          <div class="faq__answer">
            <!-- v-html, like MarkdownBlock: the source is a file in this repo,
                 plus <mark> this page inserted. Never user input. -->
            <div class="c-prose faq__prose" v-html="answer(entry)" />

            <MonoLabel v-if="matchNote(entry)" tone="faint" class="faq__note">
              {{ matchNote(entry) }}
            </MonoLabel>

            <div class="faq__actions">
              <UiButton v-if="entry.link" variant="quiet" :to="entry.link.to" :link="entry.link.link">
                {{ entry.link.label }}
              </UiButton>
              <button
                type="button"
                class="faq__copy"
                :aria-label="`${t('faq.copyQuestion')}: ${entry.question}`"
                @click="copyQuestionLink(entry)"
              >
                {{ copied === entry.id ? t('wayfinding.copied') : t('faq.copyLabel') }}
              </button>
            </div>
          </div>
        </details>
      </div>

      <BandFoot :to="band.exit" :label="band.exitLabel" />
    </div>
  </section>

  <section class="l-band l-band--tight l-band--line-top">
    <div class="l-wrap l-wrap--reading faq__stuck">
      <h2 class="faq__stuck-title">{{ t('faq.stuck.title') }}</h2>
      <p class="faq__stuck-body">{{ t('faq.stuck.body') }}</p>
      <div class="l-row faq__stuck-row">
        <UiButton variant="secondary" :to="to('community', {}, { hash: '#discord' })">
          {{ t('faq.stuck.discord') }}
        </UiButton>
        <UiButton variant="secondary" :to="to('community', {}, { hash: '#support' })">
          {{ t('faq.stuck.support') }}
        </UiButton>
      </div>
    </div>
  </section>
</template>

<style>
.faq__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
}

.faq__lede {
  margin-top: var(--space-5);
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.faq__search {
  margin-top: var(--space-8);
  display: grid;
  gap: var(--space-3);
}

.faq__field {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.faq__input {
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

.faq__meter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  align-items: baseline;
  justify-content: space-between;
}

.faq__clear,
.faq__expand,
.faq__copy {
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

.faq__clear:hover,
.faq__expand:hover,
.faq__copy:hover {
  color: var(--color-accent-text);
}

.faq__routing {
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-line);
}

.faq__routing-grid {
  margin-top: var(--space-4);
}

.faq__route-case {
  font-size: var(--size-m);
  line-height: 1.5;
  color: var(--color-ink-soft);
}

.faq__route-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: var(--size-m);
  color: var(--color-accent-text);
}

/* Pulled up under SectionMarker, which owns the gap below the heading. */
.faq__bandhead {
  margin-top: calc(var(--space-6) * -1);
  margin-bottom: var(--space-6);
}

.faq__standfirst {
  margin-top: var(--space-3);
  max-width: 60ch;
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.faq__list {
  border-top: 1px solid var(--color-line);
}

.faq__item {
  border-bottom: 1px solid var(--color-line);
}

.faq__summary {
  display: flex;
  gap: var(--space-4);
  align-items: baseline;
  justify-content: space-between;
  min-height: 44px;
  padding-block: var(--space-4);
  cursor: pointer;
  list-style: none;
}

/* Safari still paints the default triangle without this. */
.faq__summary::-webkit-details-marker {
  display: none;
}

.faq__summary::after {
  content: '▾';
  flex: 0 0 auto;
  color: var(--color-ink-faint);
  font-size: var(--size-mono-m);
  transition: rotate var(--dur-2) var(--ease-out);
}

.faq__item[open] .faq__summary::after {
  rotate: 180deg;
}

.faq__question {
  font-size: var(--size-h3);
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-ink);
}

.faq__answer {
  padding-bottom: var(--space-6);
  max-width: var(--width-reading);
}

.faq__prose {
  font-size: var(--size-body);
}

.faq__note {
  margin-top: var(--space-3);
}

.faq__actions {
  margin-top: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  align-items: center;
}

.faq__hit,
.faq__prose mark {
  background: var(--color-accent-wash);
  color: var(--color-ink);
  border-radius: var(--radius-s);
  padding-inline: 2px;
}

.faq__stuck-title {
  font-size: var(--size-h3);
}

.faq__stuck-body {
  margin-top: var(--space-3);
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.faq__stuck-row {
  margin-top: var(--space-5);
}

.faq__routes {
  margin-top: var(--space-5);
  justify-content: center;
}

@media (prefers-reduced-motion: reduce) {
  .faq__summary::after {
    transition: none;
  }
}
</style>
