<script setup lang="ts">
import UiButton from '@/components/atoms/UiButton.vue';
import type { RouteLocationRaw } from 'vue-router';
import type { ResolvedLink } from '@/site/links';

defineProps<{ to?: RouteLocationRaw; link?: ResolvedLink; label: string }>();
</script>

<template>
  <div class="c-bandfoot">
    <div class="c-bandfoot__exits">
      <UiButton variant="quiet" :to="to" :link="link">{{ label }}</UiButton>
      <slot />
    </div>
  </div>
</template>

<style>
.c-bandfoot {
  margin-top: var(--space-8);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-6);
  align-items: center;
}

.c-bandfoot__exits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-6);
  align-items: center;
  min-width: 0;
}

/* An exit's label can outrun a phone's width, and a button won't wrap on its own. */
.c-bandfoot__exits > .c-btn {
  white-space: normal;
}
</style>
