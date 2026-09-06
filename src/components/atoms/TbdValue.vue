<script setup lang="ts">
// Unsettled commercial facts (price, release date, ratings) must render as a visible [ TBD ] placeholder, never hidden or guessed.
defineProps<{ value?: string | null }>();
</script>

<template>
  <span v-if="value" class="c-tbd c-tbd--filled">{{ value }}</span>
  <span v-else class="c-tbd">[ TBD ]</span>
</template>

<style>
.c-tbd {
  display: inline-block;
  padding: 3px 8px;
  border: 1px dashed var(--color-line-dashed);
  border-radius: 6px;
  color: var(--color-ink-soft);
  font-family: var(--font-mono);
  font-size: var(--size-s);
  white-space: nowrap;
}

.c-tbd--filled {
  border-style: solid;
  border-color: var(--color-line);
  color: var(--color-ink);
  white-space: normal;
}
</style>
