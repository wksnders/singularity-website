<script setup lang="ts">
import ThreatBadge from '@/components/atoms/ThreatBadge.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import BossBackdrop from '@/components/molecules/BossBackdrop.vue';
import { t } from '@/content';
import { game } from '@/data/universe';
import { to } from '@/site/links';
</script>

<template>
  <section class="l-band l-band--line-top c-boss-wall">
    <BossBackdrop />
    <div class="l-wrap c-boss-wall__copy">
      <ThreatBadge>{{ t('home.incursions.badge') }}</ThreatBadge>
      <h2 class="c-boss-wall__title">
        {{ t('home.incursions.title', { players: game.incursionsPlayers }) }}
      </h2>
      <p class="l-lede l-lede--narrow c-boss-wall__body">
        {{ t('home.incursions.body') }}
      </p>
      <UiButton :to="to('incursions')" class="c-boss-wall__cta">
        {{ t('home.incursions.cta') }}
      </UiButton>
    </div>
  </section>
</template>

<style>
.c-boss-wall {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.c-boss-wall__copy {
  position: relative;
}

.c-boss-wall__title {
  max-width: 22ch;
  margin-top: var(--space-5);
  font-size: clamp(1.706rem, 4.83vw, 2.888rem);
  line-height: 1.08;
}

/* Two classes, so this beats .l-lede whichever stylesheet loads first. */
.l-lede.c-boss-wall__body {
  margin-top: var(--space-5);
  color: var(--color-ink-muted);
}

.c-boss-wall__cta {
  margin-top: var(--space-7);
}
</style>
