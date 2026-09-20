<script setup lang="ts">
/** The Incursions marker. Threat colour, never a faction's: the rogue AIs sit outside the faction system. Sets no margin. */
import MonoLabel from '@/components/atoms/MonoLabel.vue';
</script>

<template>
  <MonoLabel as="span" size="xs" class="c-threat"><slot /></MonoLabel>
</template>

<style>
/* Two classes, so the colour beats MonoLabel's tone whichever stylesheet loads first. */
.c-mono.c-threat {
  display: inline-block;
  padding: 6px var(--space-3);
  border: 1px solid rgba(var(--rgb-threat), 0.65);
  border-radius: var(--radius-pill);
  color: var(--color-threat-text);
  white-space: nowrap;
}
</style>
