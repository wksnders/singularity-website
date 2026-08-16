<script setup lang="ts">
/**
 * Rules reference.
 *
 * Nothing here hard-codes a term, a letter or an ordering: the ids are public
 * URLs and live in `rules.json`.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useRoute } from 'vue-router';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import JumpChip from '@/components/atoms/JumpChip.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import EmptyState from '@/components/molecules/EmptyState.vue';
import ScrollSpyRail from '@/components/molecules/ScrollSpyRail.vue';
import SecondaryHero from '@/components/organisms/SecondaryHero.vue';
import { t } from '@/content';
import { useQueryFilter } from '@/composables/useQueryFilter';
import { markHtml, matcher } from '@/site/highlight';
import { outbound, to } from '@/site/links';
import { assertRulesShape, INTRO_ID, rulesEntries, rulesLetters } from '@/site/rules';
import type { RuleBlock, RuleEntry } from '@/site/rules';
import type { SectionEntry } from '@/site/sections';

const route = useRoute();
const searchId = useId();

const query = useQueryFilter('q');
const searchField = ref<HTMLInputElement | null>(null);

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

const all = computed(() => rulesEntries());
const intro = computed(() => all.value.find((entry) => entry.id === INTRO_ID) ?? null);

const terms = computed(() => draft.value.trim().toLowerCase().split(/\s+/).filter(Boolean));
const searching = computed(() => terms.value.length > 0);
const re = computed(() => matcher(terms.value));

const hits = computed(() =>
  all.value.filter((entry) => terms.value.every((word) => entry.haystack.includes(word))),
);

const letters = computed(() => rulesLetters(hits.value));
const total = computed(() => letters.value.reduce((n, band) => n + band.entries.length, 0));
const noResults = computed(() => searching.value && total.value === 0);

const sections = computed<SectionEntry[]>(() =>
  letters.value.map((band) => ({ id: band.id, label: band.letter })),
);

/* t() has no interpolation, so the count is composed here. */
const countLabel = computed(() => {
  if (noResults.value) return t('rules.count.none');
  const noun = total.value === 1 ? t('rules.count.term') : t('rules.count.terms');
  if (searching.value) return `${total.value} ${noun}`;
  return `${total.value} ${noun}`;
});

/** Presentation only: the printed order is `blocks` and never changes here. */
interface Chunk {
  key: number;
  kind: 'rules' | 'example' | 'note' | 'text';
  blocks: RuleBlock[];
}

function chunks(entry: RuleEntry): Chunk[] {
  const out: Chunk[] = [];
  for (const block of entry.blocks) {
    const last = out[out.length - 1];
    if (block.kind === 'rule' && last?.kind === 'rules') last.blocks.push(block);
    else out.push({ key: out.length, kind: block.kind === 'rule' ? 'rules' : block.kind, blocks: [block] });
  }
  return out;
}

/* v-html, like the FAQ: the source is a file in this repository plus the
   <mark> and <a> this page put there. Never user input. */
const mark = (html: string) => markHtml(html, re.value);

function onKeydown(event: KeyboardEvent): void {
  /* Modified presses belong to the browser and to assistive tech. */
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target as HTMLElement | null;
  if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) {
    return;
  }
  event.preventDefault();
  searchField.value?.focus();
}

function clearSearch(): void {
  search('');
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
  await nextTick();
  /* Wait for the fonts. */
  await document.fonts?.ready;
  const target = document.getElementById(id);
  if (!target) return;
  //dont use 'auto' here
  target.scrollIntoView({ behavior: 'instant', block: 'start' });
  target.focus({ preventScroll: true });
}

const copied = ref<string | null>(null);
let copyTimer: number | undefined;

async function copyLink(entry: RuleEntry): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${entry.id}`;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    window.location.hash = entry.id;
  }
  copied.value = entry.id;
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

    <div v-if="intro" class="rules__intro">
      <template v-for="chunk in chunks(intro)" :key="chunk.key">
        <p v-if="chunk.kind === 'text'" class="rules__lede" v-html="chunk.blocks[0].html" />
        <p v-else-if="chunk.kind === 'note'" class="rules__precedence" v-html="chunk.blocks[0].html" />
      </template>
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
        <button v-if="searching" type="button" class="rules__clear" @click="clearSearch()">
          {{ t('rules.search.clear') }}
        </button>
      </div>
      <MonoLabel tone="faint" aria-live="polite">{{ countLabel }}</MonoLabel>
    </div>

    <nav v-if="sections.length" id="on-this-page" class="rules__az" :aria-label="t('rules.az')">
      <JumpChip
        v-for="band in sections"
        :key="band.id"
        :to="{ hash: `#${band.id}` }"
        class="rules__az-chip"
      >
        {{ band.label }}
      </JumpChip>
    </nav>

    <p class="rules__pdf">
      {{ t('rules.pdf.body') }}
      <UiButton variant="quiet" :link="outbound('rulesReference')">
        {{ t('rules.pdf.link') }}
      </UiButton>
    </p>
  </SecondaryHero>

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
    </div>
  </section>

  <section
    v-for="(band, i) in letters"
    :id="band.id"
    :key="band.id"
    tabindex="-1"
    class="l-band l-band--tight"
    :class="{ 'l-band--alt': i % 2 === 1, 'l-band--line-top': i > 0 }"
  >
    <div class="l-wrap">
      <!-- Not aria-hidden: that would step a screen reader from the page h1
           straight to a term's h3 with no band between them. -->
      <h2 class="rules__letter">
        <span aria-hidden="true">{{ band.letter }}</span>
        <span class="l-sr-only">{{ t('rules.letterGroup') }} {{ band.letter }}</span>
      </h2>

      <article v-for="entry in band.entries" :id="entry.id" :key="entry.id" tabindex="-1" class="rules__entry">
        <div class="rules__head">
          <h3 class="rules__term" v-html="mark(entry.title)" />
          <button
            type="button"
            class="rules__copy"
            :aria-label="`${t('rules.copyLink')}: ${entry.title}`"
            @click="copyLink(entry)"
          >
            {{ copied === entry.id ? t('wayfinding.copied') : t('rules.copyLabel') }}
          </button>
        </div>

        <template v-for="chunk in chunks(entry)" :key="chunk.key">
          <ul v-if="chunk.kind === 'rules'" class="rules__list">
            <li v-for="(block, b) in chunk.blocks" :key="b" class="rules__rule">
              <span v-html="mark(block.html)" />
              <ul v-if="block.items.length" class="rules__sublist">
                <li v-for="(item, n) in block.items" :key="n" v-html="mark(item)" />
              </ul>
            </li>
          </ul>
          <p v-else-if="chunk.kind === 'example'" class="rules__example">
            <MonoLabel tone="faint">{{ t('rules.example') }}</MonoLabel>
            <span v-html="mark(chunk.blocks[0].html)" />
          </p>
          <p v-else class="rules__note" v-html="mark(chunk.blocks[0].html)" />
        </template>
      </article>
    </div>
  </section>
</template>

<style>
.rules__title {
  margin-top: var(--space-5);
  font-size: clamp(1.875rem, 5.6vw, 3.5rem);
}

.rules__intro {
  margin-top: var(--space-5);
  max-width: var(--width-reading);
}

.rules__lede {
  margin-top: var(--space-4);
  font-size: var(--size-body-l);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.rules__precedence {
  margin-top: var(--space-5);
  padding: var(--space-4);
  border-left: 2px solid var(--color-accent);
  border-radius: 0 var(--radius-m) var(--radius-m) 0;
  background: var(--color-accent-wash);
  font-size: var(--size-m);
  line-height: 1.6;
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

.rules__clear,
.rules__copy {
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

.rules__clear:hover,
.rules__copy:hover {
  color: var(--color-accent-text);
}

.rules__az {
  margin-top: var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.rules__az-chip {
  min-width: 44px;
  justify-content: center;
}

.rules__pdf {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-line);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  align-items: center;
  max-width: var(--width-reading);
  font-size: var(--size-m);
  color: var(--color-ink-soft);
}

.rules__letter {
  font-family: var(--font-mono);
  font-size: var(--size-mono-m);
  letter-spacing: var(--track-mono);
  color: var(--color-ink-faint);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-line);
}

.rules__entry {
  padding-block: var(--space-6);
  border-bottom: 1px solid var(--color-line);
  max-width: var(--width-reading);
}

.rules__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
}

.rules__term {
  font-size: var(--size-h3);
  font-weight: 500;
  line-height: 1.35;
}

.rules__copy {
  opacity: 0;
  transition: opacity var(--dur-2) var(--ease-out);
}

.rules__entry:hover .rules__copy,
.rules__entry:focus-within .rules__copy {
  opacity: 1;
}

.rules__list {
  margin-top: var(--space-4);
  padding-left: var(--space-5);
  list-style: none;
}

.rules__rule {
  position: relative;
  margin-top: var(--space-3);
  font-size: var(--size-m);
  line-height: 1.65;
  color: var(--color-ink-muted);
}

.rules__rule::before {
  content: '›';
  position: absolute;
  left: calc(var(--space-5) * -1);
  color: var(--color-ink-faint);
}

.rules__sublist {
  margin-top: var(--space-2);
  padding-left: var(--space-5);
}

.rules__sublist li {
  margin-top: var(--space-2);
}

.rules__example,
.rules__note {
  margin-top: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  font-size: var(--size-m);
  line-height: 1.65;
  color: var(--color-ink-muted);
}

.rules__example > span {
  display: block;
  margin-top: var(--space-2);
}

.c-rules__ref {
  color: var(--color-accent-text);
}

.rules__entry mark {
  background: var(--color-accent-wash);
  color: var(--color-ink);
  border-radius: var(--radius-s);
  padding-inline: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .rules__copy {
    transition: none;
  }
}
</style>
