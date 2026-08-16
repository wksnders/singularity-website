<script setup lang="ts">
/** The card or the art, never both. */
import { t } from '@/content';

defineProps<{ modelValue: 'card' | 'art' }>();
defineEmits<{ 'update:modelValue': [face: 'card' | 'art'] }>();
</script>

<template>
  <div class="c-face-toggle">
    <button
      type="button"
      class="c-face-toggle__btn"
      :aria-pressed="modelValue === 'card'"
      @click="$emit('update:modelValue', 'card')"
    >
      {{ t('character.faceCard') }}
    </button>
    <button
      type="button"
      class="c-face-toggle__btn"
      :aria-pressed="modelValue === 'art'"
      @click="$emit('update:modelValue', 'art')"
    >
      {{ t('character.faceArt') }}
    </button>
  </div>
</template>

<style>
.c-face-toggle {
  margin-top: 14px;
  display: flex;
  max-width: 300px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.c-face-toggle__btn {
  flex: 1 1 0;
  min-width: 0;
  min-height: 44px;
  padding-inline: var(--space-3);
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}

.c-face-toggle__btn + .c-face-toggle__btn {
  border-left: 1px solid var(--color-line-strong);
}

.c-face-toggle__btn[aria-pressed='true'] {
  background: var(--color-accent-wash);
  color: var(--color-ink);
}
</style>
