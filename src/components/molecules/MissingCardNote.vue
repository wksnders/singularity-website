<script setup lang="ts">
/** Shown when `?card=` names no card, on every page that lists cards: useCardParam strips the bad slug, so without this the reader is told nothing. Home strips it silently. */
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
