<script setup lang="ts">
/**
 * W3 — the section marker that opens every band: hairline, NN / TOTAL, the
 * heading, and a copyable "#" that puts the deep link on the clipboard.
 * Section ids are public URLs. They are never renamed.
 */
import { ref } from 'vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';

const props = defineProps<{
  id: string;
  index: number;
  total: number;
  heading: string;
}>();

const copied = ref(false);
let timer: number | undefined;

const pad = (n: number) => String(n).padStart(2, '0');

async function copyLink(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${props.id}`;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Clipboard denied — the anchor in the address bar is the fallback.
    window.location.hash = props.id;
  }
  copied.value = true;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => (copied.value = false), 1600);
}
</script>

<template>
  <div class="c-marker">
    <span class="c-marker__rule" aria-hidden="true" />
    <MonoLabel tone="faint" class="c-marker__count">{{ pad(index) }} / {{ pad(total) }}</MonoLabel>
    <div class="c-marker__head">
      <h2 class="c-marker__heading">{{ heading }}</h2>
      <button
        type="button"
        class="c-marker__copy"
        :aria-label="`${t('wayfinding.copyLink')}: ${heading}`"
        @click="copyLink()"
      >
        {{ copied ? t('wayfinding.copied') : '#' }}
      </button>
    </div>
  </div>
</template>

<style>
.c-marker {
  margin-bottom: var(--space-6);
}

.c-marker__rule {
  display: block;
  height: 1px;
  background: var(--color-line);
}

.c-marker__count {
  display: block;
  margin-top: var(--space-3);
}

.c-marker__head {
  margin-top: var(--space-3);
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.c-marker__heading {
  font-size: var(--size-h2);
}

.c-marker__copy {
  min-width: 44px;
  min-height: 44px;
  border: 0;
  background: none;
  color: var(--color-ink-faint);
  font-family: var(--font-mono);
  font-size: var(--size-mono-m);
  letter-spacing: 0.1em;
  cursor: pointer;
}

.c-marker__copy:hover {
  color: var(--color-accent-text);
}
</style>
