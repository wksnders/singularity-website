<script setup lang="ts">
/**
 * A reserved slot for a fact that exists but has not been given to us yet
 * (price, release date, rating marks). Visible on purpose: an empty layout
 * hides the gap, a dashed [ TBD ] admits it.
 */
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
}
</style>
