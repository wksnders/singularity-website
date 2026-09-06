<script setup lang="ts">

import MonoLabel from '@/components/atoms/MonoLabel.vue';
import TbdValue from '@/components/atoms/TbdValue.vue';
import type { Stat } from '@/site/stats';

defineProps<{ stats: Stat[]; bordered?: boolean }>();
</script>

<template>
  <div class="c-stats" :class="{ 'c-stats--bordered': bordered }">
    <div v-for="stat in stats" :key="stat.label" class="c-stats__item">
      <MonoLabel tone="faint">{{ stat.label }}</MonoLabel>
      <p class="c-stats__value">
        <TbdValue v-if="stat.reserved" :value="stat.value" />
        <template v-else>{{ stat.value }}</template>
      </p>
    </div>
  </div>
</template>

<style>
.c-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 22px var(--space-6);
}

.c-stats--bordered .c-stats__item {
  padding: 14px;
  border: 1px solid rgba(var(--rgb-ink), 0.16);
  border-radius: var(--radius-m);
}

.c-stats__value {
  margin-top: var(--space-2);
  font-size: var(--size-body);
  font-weight: 500;
  color: rgba(var(--rgb-ink), 0.9);
}

.c-stats--bordered .c-stats__value {
  font-size: 1.25rem;
  font-weight: 700;
}
</style>
