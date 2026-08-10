<script setup lang="ts">
/**
 * A faction tile: art, a scrim, then the name with its identifier dot and a
 * 2px faction edge. Used on Home and on the Universe hub — the two places the
 * whole faction shelf appears — and rendered from data, so faction five needs
 * no layout change.
 */
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import { to } from '@/site/links';
import type { Faction } from '@/data/types';

defineProps<{ faction: Faction; placeholder: string }>();
</script>

<template>
  <BaseLink
    :to="to('faction', { factionId: faction.id })"
    class="c-faction"
    :style="{ '--faction': faction.color, '--faction-text': faction.colorText }"
  >
    <span class="c-faction__art">
      <ArtFrame :art="null" ratio="4 / 3" :placeholder="placeholder" />
      <span class="c-faction__scrim" aria-hidden="true" />
    </span>
    <span class="c-faction__body">
      <h3 class="c-faction__name">
        <FactionDot :color="faction.color" :size="9" />
        {{ faction.name }}
      </h3>
      <span class="c-faction__tagline">{{ faction.tagline }}</span>
    </span>
  </BaseLink>
</template>

<style>
.c-faction {
  display: block;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-l);
  overflow: hidden;
  color: var(--color-ink);
}

.c-faction:hover {
  color: var(--color-ink);
  text-decoration: none;
}

.c-faction__art {
  position: relative;
  display: block;
}

.c-faction__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(var(--rgb-bg-alt), 0.95) 0%, rgba(var(--rgb-bg-alt), 0.1) 70%);
}

.c-faction__body {
  display: block;
  padding: 18px;
  border-top: 2px solid var(--faction);
}

.c-faction__name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-display);
  font-size: var(--size-body-l);
  font-weight: 400;
}

.c-faction__tagline {
  display: block;
  margin-top: var(--space-2);
  font-size: var(--size-m);
  color: var(--color-ink-soft);
}
</style>
