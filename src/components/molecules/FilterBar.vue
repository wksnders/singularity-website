<script setup lang="ts">
// Chips must come from data, and this bar is deliberately not sticky: the fixed site header already owns the pinned slot.
import { computed, useId } from 'vue';
import FilterChip from '@/components/atoms/FilterChip.vue';
import { t } from '@/content';
import type { FilterOption } from '@/site/filters';

/* The input id must come from useId(), never a translated string: a space or non-ASCII character invalidates it and silently unlinks the label. */
const searchId = useId();

const props = defineProps<{
  options: FilterOption[];
  active: string | null;
  count: number;
  countLabel: string;
  allLabel: string;
  search?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
}>();

defineEmits<{ toggle: [string]; clear: []; 'update:search': [string] }>();

const isActive = (id: string | null) => props.active === id;

const activeLabel = computed(
  () => props.options.find((option) => option.id === props.active)?.label ?? null,
);
</script>

<template>
  <div class="c-filters">
    <div class="c-filters__chips">
      <FilterChip :active="active === null" @toggle="$emit('clear')">{{ allLabel }}</FilterChip>
      <FilterChip
        v-for="option in options"
        :key="option.id"
        :active="isActive(option.id)"
        :color="option.color"
        :show-dot="option.showDot"
        @toggle="$emit('toggle', option.id)"
      >
        {{ option.label }}
      </FilterChip>
    </div>

    <div v-if="searchLabel" class="c-filters__search">
      <label class="l-sr-only" :for="searchId">{{ searchLabel }}</label>
      <input
        :id="searchId"
        class="c-filters__input"
        type="search"
        :value="search"
        :placeholder="searchPlaceholder"
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <p class="c-filters__count" aria-live="polite">
      {{ count }} {{ countLabel
      }}<template v-if="activeLabel"> {{ t('filters.in') }} {{ activeLabel }}</template>
    </p>
  </div>
</template>

<style>
.c-filters {
  display: grid;
  gap: var(--space-4);
}

.c-filters__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.c-filters__input {
  width: 100%;
  max-width: 360px;
  min-height: 48px;
  padding-inline: var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  color: var(--color-ink);
  font-size: var(--size-field);
}

.c-filters__count {
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}
</style>
