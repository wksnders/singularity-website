<script setup lang="ts">
/**
 * One way into the game, with its price of entry on the card that makes the
 * offer rather than at the destination.
 */
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import ContentCard from '@/components/molecules/ContentCard.vue';
import { t } from '@/content';
import { tryRouteLink } from '@/site/links';
import type { TryRoute } from '@/data/types';

const props = defineProps<{ route: TryRoute }>();

const conditions = [
  ...props.route.requiresKeys.map((key) => t(key)),
  ...(props.route.costNote ? [t(`try.cost.${props.route.costNote}`)] : []),
].join(' · ');
</script>

<template>
  <ContentCard
    :link="tryRouteLink(route)"
    :kicker="t(`try.routes.${route.id}.kicker`)"
    :title="t(`try.routes.${route.id}.title`)"
    :body="t(`try.routes.${route.id}.body`)"
  >
    <MonoLabel v-if="conditions" tone="muted" class="c-try__requires">{{ conditions }}</MonoLabel>
    <MonoLabel v-if="route.caveatKey" tone="faint" class="c-try__caveat">
      {{ t(route.caveatKey) }}
    </MonoLabel>
  </ContentCard>
</template>

<style>
.c-try__requires {
  margin-top: var(--space-4);
}

.c-try__caveat {
  margin-top: var(--space-2);
}
</style>
