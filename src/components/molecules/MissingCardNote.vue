<script setup lang="ts">
/** The line a page shows when `?card=` named nothing real. One component because it has to appear on all four surfaces: `useCardParam` strips the bad slug on sight, so without it the URL silently loses a parameter and the reader is told nothing. */
import UiButton from '@/components/atoms/UiButton.vue';
import { t } from '@/content';

defineProps<{ slug: string | null }>();

defineEmits<{ dismiss: [] }>();
</script>

<template>
  <p v-if="slug" class="c-missing-card" role="status">
    <span>{{ t('cardsPage.missingTitle') }} — {{ t('cardsPage.missingBody') }}</span>
    <UiButton variant="text" @click="$emit('dismiss')">
      {{ t('cardsPage.missingDismiss') }}
    </UiButton>
  </p>
</template>

<style>
.c-missing-card {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  align-items: baseline;
  max-width: 68ch;
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-soft);
}
</style>
