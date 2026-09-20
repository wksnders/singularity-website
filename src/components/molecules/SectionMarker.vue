<script setup lang="ts">

import { computed } from 'vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { useSectionPosition } from '@/composables/useSections';
import { pad } from '@/site/format';

const props = defineProps<{
  /** The section this marks. Looked up in the page's provided section list for the ordinal; never rendered as an `id`, because the <section> already carries it. */
  sectionId?: string;
  heading: string;
  color?: string | null;

  /* LEGACY, for call sites not yet converted: `id` is read as `sectionId`, and `index`/`total` are used only when the page provides no section list. `id` must stay DECLARED until the last caller stops passing it — undeclared, it falls through onto the root and duplicates the section's public anchor. */
  id?: string;
  index?: number;
  total?: number;
}>();

const found = useSectionPosition(() => props.sectionId ?? props.id);

const position = computed(
  () =>
    found.value ??
    (props.index !== undefined && props.total !== undefined
      ? { index: props.index, total: props.total }
      : null),
);
</script>

<template>
  <div class="c-marker">
    <span class="c-marker__rule" aria-hidden="true" />
    <MonoLabel v-if="position" tone="faint" class="c-marker__count">
      {{ pad(position.index) }} / {{ pad(position.total) }}
    </MonoLabel>
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
