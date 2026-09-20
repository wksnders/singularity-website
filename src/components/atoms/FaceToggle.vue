<script setup lang="ts">
/* Labels are per-surface — the database calls the other face ART, the zoom calls it ART ONLY — so there is no default to fall back to. */
defineProps<{
  modelValue: 'card' | 'art';
  cardLabel: string;
  artLabel: string;
}>();
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
      {{ cardLabel }}
    </button>
    <button
      type="button"
      class="c-face-toggle__btn"
      :aria-pressed="modelValue === 'art'"
      @click="$emit('update:modelValue', 'art')"
    >
      {{ artLabel }}
    </button>
  </div>
</template>

<style>
.c-face-toggle {
  display: flex;
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
  letter-spacing: var(--track-mono-tight);
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
