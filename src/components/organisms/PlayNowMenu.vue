<script setup lang="ts">
/** Play Now is a menu, not a link: buy · print & play · Tabletop Simulator. */
import BaseLink from '@/components/atoms/BaseLink.vue';
import { t } from '@/content';
import { outbound } from '@/site/links';
import { useChrome } from '@/composables/useChrome';

const { playOpen, togglePlay } = useChrome();

const options = [
  { key: 'buy', link: outbound('buy') },
  { key: 'printAndPlay', link: outbound('printAndPlay') },
  { key: 'tabletopSimulator', link: outbound('tabletopSimulator') },
] as const;
</script>

<template>
  <div class="c-play">
    <button
      type="button"
      class="c-play__trigger"
      :aria-expanded="playOpen"
      @click="togglePlay()"
    >
      {{ t('chrome.playNow') }}
    </button>
    <div v-if="playOpen" class="c-play__menu">
      <BaseLink v-for="option in options" :key="option.key" :link="option.link" class="c-play__item">
        <span class="c-play__label">{{ t(`chrome.play.${option.key}.label`) }}</span>
        <span class="c-play__note">{{ t(`chrome.play.${option.key}.note`) }}</span>
      </BaseLink>
    </div>
  </div>
</template>

<style>
.c-play {
  position: relative;
  flex: 0 0 auto;
}

.c-play__trigger {
  min-height: 44px;
  padding-inline: 18px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: var(--size-m);
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: var(--glow-accent);
  transition: box-shadow var(--dur-2) var(--ease-out);
}

.c-play__trigger:hover {
  box-shadow: 0 0 34px rgba(var(--rgb-accent), 0.55);
}

.c-play__menu {
  position: absolute;
  right: 0;
  top: 54px;
  width: 264px;
  padding: var(--space-2);
  background: var(--color-surface-raised);
  border: 1px solid rgba(var(--rgb-ink), 0.12);
  border-radius: var(--radius-m);
  box-shadow: var(--elevation-2);
  z-index: 2;
}

.c-play__item {
  display: block;
  padding: var(--space-3);
  border-radius: 10px;
  color: var(--color-ink);
}

.c-play__item:hover {
  background: var(--color-accent-wash);
  color: var(--color-ink);
  text-decoration: none;
}

.c-play__label {
  display: block;
  font-size: var(--size-m);
  font-weight: 700;
}

.c-play__note {
  display: block;
  font-size: var(--size-mono-m);
  color: var(--color-ink-soft);
}
</style>
