<script setup lang="ts">
/** The line a page shows when `?card=` named nothing real. One component because it has to appear on all four surfaces: `useCardParam` strips the bad slug on sight, so without it the URL silently loses a parameter and the reader is told nothing. */
import { t } from '@/content';

defineProps<{ slug: string | null }>();

defineEmits<{ dismiss: [] }>();
</script>

<template>
  <p v-if="slug" class="c-missing-card" role="status">
    <span>{{ t('cardsPage.missingTitle') }} — {{ t('cardsPage.missingBody') }}</span>
    <button type="button" class="c-missing-card__dismiss" @click="$emit('dismiss')">
      {{ t('cardsPage.missingDismiss') }}
    </button>
  </p>
</template>

<style>
.c-missing-card {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  align-items: baseline;
  margin-top: var(--space-4);
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-soft);
}

.c-missing-card__dismiss {
  min-height: 44px;
  padding: 0 2px;
  border: 0;
  background: none;
  color: var(--color-ink-faint);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  cursor: pointer;
}

.c-missing-card__dismiss:hover,
.c-missing-card__dismiss:focus-visible {
  color: var(--color-ink);
}
</style>
