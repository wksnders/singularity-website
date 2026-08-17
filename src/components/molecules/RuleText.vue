<script setup lang="ts"> 
import BaseLink from '@/components/atoms/BaseLink.vue';
import { outbound } from '@/site/links';
import type { RuleSeg } from '@/site/rules';

defineProps<{ segs: RuleSeg[] }>();
defineEmits<{ card: [id: string] }>();
</script>

<template>
  <template v-for="seg in segs" :key="seg.key">
    <a v-if="seg.kind === 'ref'" class="c-rt__ref" :href="`#${seg.target}`">
      <component :is="seg.hit ? 'mark' : 'span'">{{ seg.text }}</component>
    </a>
    <BaseLink v-else-if="seg.kind === 'guide'" class="c-rt__ref" :link="outbound('rulebook')">
      <component :is="seg.hit ? 'mark' : 'span'">{{ seg.text }}</component>
    </BaseLink>
    <button
      v-else-if="seg.kind === 'card'"
      type="button"
      class="c-rt__card"
      @click="$emit('card', seg.target as string)"
    >
      <component :is="seg.hit ? 'mark' : 'span'">{{ seg.text }}</component>
    </button>
    <span v-else-if="seg.kind === 'token' && seg.word" class="c-rt__tok">
      <component :is="seg.target ? 'a' : 'span'" :href="seg.target ? `#${seg.target}` : undefined">
        <span aria-hidden="true">{{ seg.text }}</span>
        <span class="l-sr-only">{{ seg.word }}</span>
      </component>
    </span>
    <component v-else :is="seg.hit ? 'mark' : 'span'">{{ seg.text }}</component>
  </template>
</template>

<style>
.c-rt__ref {
  color: var(--color-accent-text);
  text-decoration: underline;
  text-decoration-color: rgba(var(--rgb-accent), 0.35);
  text-underline-offset: 3px;
}

.c-rt__ref:hover {
  color: var(--color-ink-bright);
}

.c-rt__tok {
  font-family: var(--font-mono);
  font-size: 0.9em;
}
 
.c-rt__card {
  padding: 0;
  border: 0;
  border-bottom: 1px dashed var(--color-line-dashed);
  background: none;
  color: var(--color-ink);
  font: inherit;
  cursor: pointer;
}

.c-rt__card:hover {
  border-bottom-color: var(--color-accent);
  color: var(--color-ink-bright);
}

.c-rt__card::after {
  content: ' ⌄';
  font-family: var(--font-mono);
  font-size: 0.8em;
  color: var(--color-ink-faint);
}

mark {
  background: var(--color-accent-wash);
  color: var(--color-ink);
  border-radius: var(--radius-s);
  padding-inline: 2px;
}
</style>
