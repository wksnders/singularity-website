<script setup lang="ts">
// Section ids are public URLs; never rename them.
import FactionDot from '@/components/atoms/FactionDot.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';

defineProps<{
  id: string;
  index: number;
  total: number;
  heading: string;
  color?: string | null;
}>();

const pad = (n: number) => String(n).padStart(2, '0');
</script>

<template>
  <div class="c-marker">
    <span class="c-marker__rule" aria-hidden="true" />
    <MonoLabel tone="faint" class="c-marker__count">{{ pad(index) }} / {{ pad(total) }}</MonoLabel>
    <div class="c-marker__head">
      <FactionDot v-if="color" :color="color" :size="12" />
      <h2 class="c-marker__heading">{{ heading }}</h2>
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
</style>
