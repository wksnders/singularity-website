<script setup lang="ts">
// Colour alone never conveys faction: the dot is aria-hidden, so callers must render the faction name beside it.
withDefaults(defineProps<{ color?: string | null; size?: number }>(), { size: 8 });
</script>

<template>
  <span
    class="c-dot"
    :class="{ 'c-dot--any': !color }"
    :style="{ width: `${size}px`, height: `${size}px`, background: color || 'transparent' }"
    aria-hidden="true"
  />
</template>

<style>
.c-dot {
  display: inline-block;
  flex: 0 0 auto;
  border-radius: var(--radius-pill);
}

.c-dot--any {
  border: 1.5px solid rgba(var(--rgb-ink), 0.6);
}
</style>
