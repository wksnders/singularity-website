<script setup lang="ts">
/**
 * The one link primitive. Internal routes keep the locale prefix, outbound
 * URLs open in a new tab, and an unresolved destination degrades to plain text
 * rather than a dead anchor.
 */
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { ResolvedLink } from '@/site/links';

const props = defineProps<{
  to?: RouteLocationRaw;
  href?: string;
  link?: ResolvedLink;
}>();

const resolved = computed<ResolvedLink>(() => {
  if (props.link) return props.link;
  if (props.href) return { href: props.href, external: true };
  return { to: props.to, external: false };
});
</script>

<template>
  <a v-if="resolved.external" :href="resolved.href" target="_blank" rel="noopener noreferrer">
    <slot />
  </a>
  <RouterLink v-else-if="resolved.to" :to="resolved.to">
    <slot />
  </RouterLink>
  <span v-else><slot /></span>
</template>
