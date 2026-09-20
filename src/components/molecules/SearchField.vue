<script setup lang="ts">
/* CLEAR IS THE CALLER'S TO PERFORM: the field only emits it, and what clearing does is page state — on the rules page Clear also drops the class filter. */
import { computed, ref, useId } from 'vue';
import TextField from '@/components/atoms/TextField.vue';
import UiButton from '@/components/atoms/UiButton.vue';

const model = defineModel<string>({ required: true });

const props = withDefaults(
  defineProps<{
    label: string;
    placeholder?: string;
    clearLabel: string;

    canClear?: boolean;
  }>(),
  { placeholder: undefined, canClear: undefined },
);

defineEmits<{ clear: [] }>();

/* useId(), never a translated string: a space or non-ASCII character invalidates the id and silently unlinks the label. */
const id = useId();

const clearable = computed(() => props.canClear ?? model.value !== '');

const field = ref<InstanceType<typeof TextField> | null>(null);

const input = computed(() => (field.value?.el ?? null) as HTMLInputElement | null);

defineExpose({ input });
</script>

<template>
  <div class="c-search">
    <label class="l-sr-only" :for="id">{{ label }}</label>
    <TextField
      :id="id"
      ref="field"
      v-model="model"
      class="c-search__input"
      type="search"
      autocomplete="off"
      :placeholder="placeholder"
    />
    <UiButton v-if="clearable" variant="text" class="c-search__clear" @click="$emit('clear')">
      {{ clearLabel }}
    </UiButton>
  </div>
</template>

<style>
.c-search {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

/* Two classes, so this holds whichever of the two components' CSS loads first. */
.c-search .c-search__input {
  flex: 1 1 240px;
  max-width: 420px;
}

.c-search .c-search__clear {
  padding-inline: var(--space-3);
}
</style>
