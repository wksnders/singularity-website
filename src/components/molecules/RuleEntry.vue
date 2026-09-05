<script setup lang="ts">
/**
 * One glossary term: class eyebrow → term → rules → example → related → copy.
 *
 * Never an accordion. Every entry stays in the DOM so find-in-page can reach it.
 */
import { computed, ref } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import RuleText from '@/components/molecules/RuleText.vue';
import { t } from '@/content';
import { expandIcons } from '@/site/cardText';
import { brandNameOf } from '@/site/rules';
import { programBySlug } from '@/data/universe';
import type { RuleBlock, RuleEntry } from '@/site/rules';

const props = defineProps<{ entry: RuleEntry; copied: boolean }>();
defineEmits<{ copy: [] }>();

const open = ref(new Set<string>());

function toggle(id: string): void {
  const next = new Set(open.value);
  if (!next.delete(id)) next.add(id);
  open.value = next;
}
 
const chunks = computed(() => {
  const out: { key: number; kind: 'rules' | 'note' | 'example'; blocks: RuleBlock[] }[] = [];
  for (const block of props.entry.blocks) {
    if (block.kind === 'text') continue;
    const kind = block.kind === 'rule' ? 'rules' : block.kind;
    const last = out[out.length - 1];
    if (kind === 'rules' && last?.kind === 'rules') last.blocks.push(block);
    else out.push({ key: out.length, kind, blocks: [block] });
  }
  return out;
});

function cardsIn(blocks: RuleBlock[]): string[] {
  const names = blocks
    .flatMap((b) => [b.segs, ...b.items].flat())
    .filter((s) => s.kind === 'card')
    .map((s) => s.target as string);
  return [...new Set(names)].filter((id) => open.value.has(id));
}
 
const card = (id: string) => programBySlug(id);

const factLine = (id: string) => {
  const program = card(id);
  if (!program) return '';
  const brand = brandNameOf(program);
  return [program.type, `${t('cards.cost')} ${program.cost}`, brand].filter(Boolean).join(' · ');
};
</script>

<template>
  <article :id="entry.id" tabindex="-1" class="c-rule">
    <div class="c-rule__eyebrow">
      <MonoLabel :tone="entry.cls.includes('keyword') ? 'accent' : 'faint'">
        {{ entry.cls.map((name) => t(`rules.classes.${name}`)).join(' · ') }}
      </MonoLabel>
      <span v-if="entry.token" class="c-rule__token">{{ entry.token }}</span>
    </div>

    <div class="c-rule__head">
      <h3 class="c-rule__term">{{ entry.bare }}</h3>
      <button
        type="button"
        class="c-rule__copy"
        :aria-label="`${t('rules.copyLink')}: ${entry.bare}`"
        @click="$emit('copy')"
      >
        {{ copied ? t('wayfinding.copied') : t('rules.copyLabel') }}
      </button>
    </div>

    <p v-if="entry.redirect" class="c-rule__redirect">
      <a :href="`#${entry.redirect.id}`">{{ entry.redirect.label }} →</a>
    </p>

    <template v-else>
      <template v-for="chunk in chunks" :key="chunk.key">
        <ul v-if="chunk.kind === 'rules'" class="c-rule__list">
          <li v-for="(block, b) in chunk.blocks" :key="b" class="c-rule__line">
            <RuleText :segs="block.segs" @card="toggle" />
            <ul v-if="block.items.length" class="c-rule__sub">
              <li v-for="(item, n) in block.items" :key="n"><RuleText :segs="item" @card="toggle" /></li>
            </ul>
          </li>
        </ul>

        <p v-else-if="chunk.kind === 'note'" class="c-rule__note">
          <RuleText :segs="chunk.blocks[0].segs" @card="toggle" />
        </p>

        <div v-else class="c-rule__example">
          <MonoLabel tone="accent">{{ t('rules.example') }}</MonoLabel>
          <p class="c-rule__example-body"><RuleText :segs="chunk.blocks[0].segs" @card="toggle" /></p>

          <div v-for="id in cardsIn(chunk.blocks)" :key="id" class="c-rule__card">
            <div class="c-rule__card-head">
              <strong>{{ card(id)?.name }}</strong>
              <MonoLabel tone="faint">{{ factLine(id) }}</MonoLabel>
            </div>
            <p v-for="(line, i) in card(id)?.rules ?? []" :key="i" class="c-rule__card-rule">
              {{ expandIcons(line) }}
            </p>
            <button type="button" class="c-rule__card-close" @click="toggle(id)">
              {{ t('rules.cardClose') }}
            </button>
          </div>
        </div>
      </template>

      <div v-if="entry.related.length" class="c-rule__related">
        <MonoLabel tone="faint">{{ t('rules.related') }}</MonoLabel>
        <a v-for="rel in entry.related" :key="rel.id" class="c-rule__chip" :href="`#${rel.id}`">
          {{ rel.label }}
        </a>
      </div>
    </template>
  </article>
</template>

<style>
.c-rule {
  padding-block: var(--space-8);
  border-bottom: 1px solid var(--color-line);
  max-width: var(--width-reading);
}

.c-rule__eyebrow {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.c-rule__token {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  color: var(--color-accent-text);
}

.c-rule__head {
  margin-top: var(--space-2);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
}

.c-rule__term {
  font-size: 1.375rem;
  font-weight: 500;
  line-height: 1.3;
}
 
.c-rule__copy {
  opacity: 0;
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
  transition: opacity var(--dur-2) var(--ease-out);
}

.c-rule:hover .c-rule__copy,
.c-rule:focus-within .c-rule__copy {
  opacity: 1;
}

.c-rule__copy:hover {
  color: var(--color-accent-text);
}

.c-rule__redirect {
  margin-top: var(--space-3);
  font-size: var(--size-body);
}

.c-rule__redirect a {
  color: var(--color-accent-text);
}

.c-rule__list {
  margin-top: var(--space-4);
  padding-left: var(--space-5);
  list-style: none;
}

.c-rule__line {
  position: relative;
  margin-top: var(--space-3);
  font-size: var(--size-body);
  line-height: 1.7;
  color: var(--color-ink);
}

.c-rule__line::before {
  content: '›';
  position: absolute;
  left: calc(var(--space-5) * -1);
  color: var(--color-ink-faint);
}

.c-rule__sub {
  margin-top: var(--space-2);
  padding-left: var(--space-5);
  font-size: 0.9375rem;
  color: var(--color-ink-muted);
}

.c-rule__sub li {
  margin-top: var(--space-2);
}

.c-rule__note {
  margin-top: var(--space-4);
  padding-left: var(--space-4);
  border-left: 1px solid var(--color-line-strong);
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--color-ink-muted);
}

.c-rule__example {
  margin-top: var(--space-5);
  padding: var(--space-4);
  border: 1px solid rgba(var(--rgb-accent), 0.28);
  border-radius: var(--radius-m);
  background: var(--color-accent-wash);
}

.c-rule__example-body {
  margin-top: var(--space-2);
  font-size: var(--size-body);
  line-height: 1.7;
  color: var(--color-ink);
}

.c-rule__card {
  margin-top: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-s);
  background: var(--color-bg);
}

.c-rule__card-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  align-items: baseline;
}

.c-rule__card-rule {
  margin-top: var(--space-2);
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-ink-muted);
}

.c-rule__card-close {
  margin-top: var(--space-3);
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-ink-faint);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  cursor: pointer;
}

.c-rule__related {
  margin-top: var(--space-5);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  align-items: center;
}

.c-rule__chip {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding-inline: var(--space-3);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  color: var(--color-ink-muted);
  font-size: var(--size-s);
}

.c-rule__chip:hover {
  border-color: var(--color-accent);
  color: var(--color-ink);
}

@media (prefers-reduced-motion: reduce) {
  .c-rule__copy {
    transition: none;
  }
}
</style>
