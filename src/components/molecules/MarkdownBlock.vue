<script setup lang="ts">
/**
 * Rendered markdown from content/<locale>/. The only place the site uses
 * v-html: the source is our own repository files, never user input.
 */
import { computed } from 'vue';
import { docHtml, getDoc } from '@/content';

const props = defineProps<{ slug: string; measure?: boolean }>();

const html = computed(() => docHtml(getDoc(props.slug)));
</script>

<template>
  <div v-if="html" class="c-prose" :class="{ 'c-prose--measure': measure }" v-html="html" />
</template>

<style>
.c-prose {
  font-size: var(--size-body-l);
  line-height: 1.65;
  color: var(--color-ink-soft);
}

.c-prose--measure {
  max-width: var(--width-reading);
}

.c-prose > * + * {
  margin-top: var(--space-4);
}

.c-prose h2,
.c-prose h3 {
  margin-top: var(--space-8);
  color: var(--color-ink);
}

.c-prose h3 {
  font-size: var(--size-h3);
}

.c-prose blockquote {
  margin: var(--space-6) 0;
  padding-left: var(--space-4);
  border-left: 2px solid var(--color-accent-wash);
  font-style: italic;
}

.c-prose ul,
.c-prose ol {
  padding-left: 1.2em;
}

.c-prose li + li {
  margin-top: var(--space-2);
}

.c-prose strong {
  color: var(--color-ink);
}
</style>
