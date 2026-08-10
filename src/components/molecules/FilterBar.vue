<script setup lang="ts">
/**
 * The filter bar: chips from data (never a hard-coded faction list), an
 * optional search field, and a live result count announced to screen readers.
 * Deliberately NOT sticky — below 600px the nav owns the only sticky slot.
 */
import { useId } from 'vue';
import FilterChip from '@/components/atoms/FilterChip.vue';
import { t } from '@/content';
import type { FilterOption } from '@/site/filters';

/* The search field's id used to be built from the TRANSLATED count label
   (`search-${countLabel}`). That happens to be valid in English, but the
   moment a translation contains a space or a non-ASCII character the id is
   invalid and the label silently stops being associated with the input.
   useId() is locale-independent and unique per instance, so two filter bars on
   one page cannot collide either. */
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
      {{ count }} {{ countLabel }}<template v-if="active"> {{ t('filters.in') }}</template>
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
