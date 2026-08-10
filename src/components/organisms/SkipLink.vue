<script setup lang="ts">
import { t } from '@/content';
</script>

<template>
  <a href="#main" class="c-skip">{{ t('chrome.skip') }}</a>
</template>

<style>
.c-skip {
  position: absolute;
  left: -9999px;
  top: var(--space-2);
  z-index: 60;
  padding: 10px 14px;
  border-radius: var(--radius-s);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 700;
}

.c-skip:focus {
  left: var(--space-3);
}
</style>
