<script setup lang="ts">
/* Width and label are the caller's: the field fills its box and names nothing. */
import { ref } from 'vue';

const model = defineModel<string>({ required: true });

withDefaults(
  defineProps<{
    as?: 'input' | 'textarea';
    /** `pill` for a single line beside other controls, `box` for a stacked form; a textarea is always a box, because a pill cannot hold one. */
    shape?: 'pill' | 'box';
  }>(),
  { as: 'input', shape: 'pill' },
);

const el = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);

defineExpose({ el });
</script>

<template>
  <component
    :is="as"
    ref="el"
    class="c-field"
    :class="`c-field--${shape}`"
    :value="model"
    @input="model = ($event.target as HTMLInputElement).value"
  />
</template>

<style>
.c-field {
  width: 100%;
  min-width: 0;
  min-height: 48px;
  padding-inline: var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  color: var(--color-ink);
  font-size: var(--size-field);
}

.c-field--box,
textarea.c-field {
  padding-block: var(--space-3);
  border-radius: var(--radius-m);
}

textarea.c-field {
  resize: vertical;
  line-height: 1.5;
}

/* Quieted with ink/line roles rather than opacity, so the text keeps a known contrast ratio. `:disabled` also matches inside a disabled <fieldset>. */
.c-field:disabled {
  border-color: var(--color-line);
  color: var(--color-ink-faint);
  cursor: not-allowed;
}
</style>
