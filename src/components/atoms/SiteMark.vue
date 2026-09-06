<script setup lang="ts">
/* singularity-logo-flat.svg must be authored black: .c-sitemark inverts it so one file serves print and light sheets. */
import { t } from '@/content';
import { asset } from '@/site/links';

withDefaults(defineProps<{ alt?: string }>(), { alt: '' });
</script>

<template>
  <img
    class="c-sitemark"
    :src="asset('/logo/singularity-logo-flat.svg')"
    :alt="alt || t('chrome.logoAlt')"
    width="646"
    height="178"
    decoding="async"
  />
</template>

<style>
.c-sitemark {
  display: block;
  height: clamp(22px, 6dvw, 34px);
  width: auto;
  filter: invert(1);
}
</style>
