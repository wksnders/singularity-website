<script setup lang="ts">
/** W1 — the index in the page header. Numbered mono chips that navigate. */
import JumpChip from '@/components/atoms/JumpChip.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import type { SectionEntry } from '@/site/sections';

defineProps<{ sections: SectionEntry[] }>();

const pad = (n: number) => String(n).padStart(2, '0');
</script>

<template>
  <nav id="on-this-page" class="c-index" :aria-label="t('wayfinding.onThisPage')">
    <MonoLabel tone="faint">{{ t('wayfinding.onThisPage') }}</MonoLabel>
    <div class="c-index__chips">
      <JumpChip
        v-for="(section, i) in sections"
        :key="section.id"
        :to="{ hash: `#${section.id}` }"
        :index="pad(i + 1)"
        :accent="section.accent"
      >
        {{ section.label }}
      </JumpChip>
    </div>
  </nav>
</template>

<style>
.c-index {
  margin-top: var(--space-6);
}

.c-index__chips {
  margin-top: var(--space-3);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
