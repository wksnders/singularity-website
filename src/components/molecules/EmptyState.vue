<script setup lang="ts">
/**
 * ONE empty state, three variants:
 * - unrevealed: content exists but is deliberately sealed (Incursion unlocks)
 * - notYet:     content is coming (an announced chapter)
 * - noResults:  the reader's filter or search found nothing
 * Never a shrug: each variant says what to do next.
 */
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';

defineProps<{
  variant: 'unrevealed' | 'notYet' | 'noResults';
  kicker?: string;
  title: string;
  body?: string;
  actionLabel?: string;
}>();

defineEmits<{ action: [] }>();
</script>

<template>
  <div class="c-empty" :class="`c-empty--${variant}`" role="status">
    <MonoLabel v-if="kicker" tone="faint">{{ kicker }}</MonoLabel>
    <p class="c-empty__title">{{ title }}</p>
    <p v-if="body" class="c-empty__body">{{ body }}</p>
    <UiButton v-if="actionLabel" variant="secondary" @click="$emit('action')">
      {{ actionLabel }}
    </UiButton>
  </div>
</template>

<style>
.c-empty {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
  padding: clamp(20px, 4vw, 32px);
  border: 1px dashed var(--color-line-dashed);
  border-radius: var(--radius-l);
}

.c-empty--noResults {
  justify-items: center;
  text-align: center;
}

.c-empty__title {
  font-family: var(--font-display);
  font-size: var(--size-body-l);
  color: var(--color-ink);
}

.c-empty__body {
  max-width: 52ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-soft);
}
</style>
