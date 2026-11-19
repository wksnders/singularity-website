<script setup lang="ts">

import BaseLink from '@/components/atoms/BaseLink.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import { t } from '@/content';
import { plainClick } from '@/site/glide';
import { outbound, to } from '@/site/links';

const emit = defineEmits<{ watch: [] }>();
</script>

<template>
  <div class="c-home-band">
    <UiButton
      variant="primary"
      class="c-home-band__watch"
      :to="to('home', {}, { hash: '#trailer' })"
      @click="plainClick($event) && emit('watch')"
    >
      <span class="c-home-band__play" aria-hidden="true" />{{ t('home.hero.watch') }}
    </UiButton>
    <BaseLink :link="outbound('buy')" class="c-home-band__buy">{{ t('home.hero.buy') }} →</BaseLink>
  </div>
</template>

<style>
.c-home-band {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  max-width: var(--width-reading);
  margin: 0 auto;
  padding: var(--space-6) var(--gutter) var(--space-4);
}

/* Large text sizes: wraps rather than overflowing the band. */
.c-btn.c-home-band__watch {
  align-self: stretch;
  white-space: normal;
  text-align: center;
}

.c-home-band__play {
  width: 0;
  height: 0;
  margin-right: var(--space-2);
  border-left: 0.5625rem solid currentColor;
  border-top: 0.3438rem solid transparent;
  border-bottom: 0.3438rem solid transparent;
}

.c-home-band__buy {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  font-size: var(--size-body-l);
  font-weight: 700;
  white-space: nowrap;
  text-shadow:
    0 1px 0.1875rem var(--color-bg),
    0 0 0.75rem var(--color-bg);
}

/* The hero's half of the phone spine (HomeView draws the rest): the insets must match the band's gap and bottom padding, and the tile is anchored to the foot so the hex runs on across the seam. */
.c-home-band__buy::before,
.c-home-band__buy::after {
  content: '';
  position: absolute;
  z-index: -1;
  top: calc(-1 * var(--space-2));
  bottom: calc(-1 * var(--space-4));
  pointer-events: none;
}

.c-home-band__buy::before {
  left: calc(50% - 2.25rem);
  width: 4.5rem;
  background: var(--spine-grille);
  background-position: left center, right center, center, 0.375rem 100%;
}

/* Scrim over the grille, so the label stays readable. */
.c-home-band__buy::after {
  left: calc(50% - 4.75rem);
  width: 9.5rem;
  background: radial-gradient(55% 32% at 50% calc(var(--space-2) + 1.375rem), rgba(var(--rgb-bg), 0.92), rgba(var(--rgb-bg), 0.6) 60%, transparent);
}
</style>
