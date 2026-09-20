<script setup lang="ts">

import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { environmentSources, to } from '@/site/links';
import type { Faction } from '@/data/types';

defineProps<{
  faction: Faction;
  kicker: string;
}>();
</script>

<template>
  <BaseLink
    :to="to('faction', { factionId: faction.id })"
    class="c-fstrip"
    :style="{ '--faction': faction.color, '--faction-text': faction.colorText }"
  >
    <ArtFrame
      v-if="faction.environment"
      :art="faction.environment"
      :sources="environmentSources(faction.id)"
      ratio="auto"
      sizes="(max-width: 899px) 100vw, 550px"
      class="c-fstrip__art"
    />
    <span class="c-fstrip__scrim" aria-hidden="true"></span>
    <span class="c-fstrip__body">
      <MonoLabel tone="muted" as="span">{{ kicker }}</MonoLabel>
      <span class="c-fstrip__name">{{ faction.name }}</span>
    </span>
    <span class="c-fstrip__go" aria-hidden="true">→</span>
  </BaseLink>
</template>

<style>
.c-fstrip {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-height: 92px;
  padding: var(--space-4) var(--space-5);
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-left: 3px solid var(--faction);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  color: var(--color-ink);
}

.c-fstrip:hover {
  border-color: var(--faction);
  text-decoration: none;
}

.c-fstrip__art {
  position: absolute;
  inset: 0;
}

.c-fstrip__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, var(--color-bg) 6%, rgba(var(--rgb-bg), 0.55) 62%, transparent),
    rgba(var(--rgb-bg), 0.62);
}

.c-fstrip__body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.c-fstrip__name {
  font-size: var(--size-body-s);
  font-weight: 500;
  color: var(--faction-text);
}

.c-fstrip__go {
  position: relative;
  margin-left: auto;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  color: var(--color-ink-soft);
}
</style>
