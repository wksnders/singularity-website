<script setup lang="ts">
/* The mobile up-link targets the section index's #on-this-page, so a view without an index passes `:up="false"`. */
import UiButton from '@/components/atoms/UiButton.vue';
import { t } from '@/content';
import type { RouteLocationRaw } from 'vue-router';
import type { ResolvedLink } from '@/site/links';

withDefaults(defineProps<{ to?: RouteLocationRaw; link?: ResolvedLink; label: string; up?: boolean }>(), { up: true });
</script>

<template>
  <div class="c-bandfoot">
    <div class="c-bandfoot__exits">
      <UiButton variant="quiet" :to="to" :link="link">{{ label }}</UiButton>
      <slot />
    </div>
    <a v-if="up" class="c-mono c-bandfoot__up" href="#on-this-page">↑ {{ t('wayfinding.sections') }}</a>
  </div>
</template>

<style>
.c-bandfoot {
  margin-top: var(--space-8);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-6);
  align-items: center;
  justify-content: space-between;
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

.c-bandfoot__up {
  color: var(--color-ink-faint);
}

@media (min-width: 56.25em) {
  .c-bandfoot__up {
    display: none;
  }
}
</style>
