<script setup lang="ts">

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import BaseLink from '@/components/atoms/BaseLink.vue';
import JumpChip from '@/components/atoms/JumpChip.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import { primaryNav, socialKeys } from '@/site/ia';
import { outbound, resolveLink } from '@/site/links';
import { useChrome } from '@/composables/useChrome';
import { useModal } from '@/composables/useModal';

const { menuOpen, toggleMenu } = useChrome();

const closeButton = ref<HTMLElement | null>(null);

const { dialog } = useModal({
  open: () => menuOpen.value,
  close: () => {
    menuOpen.value = false;
  },
  initialFocus: () => closeButton.value,
});

/* Back-button navigation never calls toggleMenu(), so the sheet must close on route change. */
const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    if (menuOpen.value) menuOpen.value = false;
  },
);
</script>

<template>
  <!-- TELEPORTED so the sheet is a direct child of <body>: useModal inerts every body child except the dialog, and inside #app the sheet would be inert with it. -->
  <Teleport to="body">
    <div
      v-if="menuOpen"
      ref="dialog"
      class="c-sheet"
      role="dialog"
      aria-modal="true"
      :aria-label="t('chrome.menu')"
    >
      <div class="c-sheet__head">
        <MonoLabel tone="faint">{{ t('chrome.menu') }}</MonoLabel>
        <button
          ref="closeButton"
          type="button"
          class="c-sheet__close"
          :aria-label="t('chrome.close')"
          @click="toggleMenu()"
        >
          ×
        </button>
      </div>

      <nav class="c-sheet__nav" :aria-label="t('chrome.siteNav')">
        <div v-for="section in primaryNav" :key="section.key" class="c-sheet__section">
          <RouterLink :to="section.to" class="c-sheet__link" @click="toggleMenu()">
            {{ t(`ia.${section.key}.label`) }}
          </RouterLink>
          <div v-if="section.jumps" class="c-sheet__jumps">
            <JumpChip
              v-for="jump in section.jumps"
              :key="jump.key"
              :link="resolveLink(jump)"
              @click="toggleMenu()"
            >
              {{ t(`ia.${jump.key}.label`) }}
            </JumpChip>
          </div>
        </div>
      </nav>

      <div class="c-sheet__foot">
        <div class="l-row">
          <BaseLink
            v-for="key in socialKeys"
            :key="key"
            :link="outbound(key)"
            class="c-sheet__social"
          >
            {{ t(`chrome.social.${key}`) }}
          </BaseLink>
        </div>
        <BaseLink :link="outbound('buy')" class="c-sheet__cta">{{ t('chrome.buy') }}</BaseLink>
      </div>
    </div>
  </Teleport>
</template>

<style>
.c-sheet {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  background: rgba(var(--rgb-bg), 0.92);
  backdrop-filter: blur(22px);
  overflow-y: auto;
}

.c-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--nav-height);
  padding-inline: var(--gutter);
  border-bottom: 1px solid var(--color-line);
}

.c-sheet__close {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(var(--rgb-ink), 0.16);
  border-radius: 10px;
  background: transparent;
  color: var(--color-ink);
  font-size: 1.125rem;
  cursor: pointer;
}

.c-sheet__nav {
  display: flex;
  flex-direction: column;
  padding: var(--space-3) var(--gutter);
}

.c-sheet__section {
  padding-bottom: var(--space-3);
  border-bottom: 1px solid rgba(var(--rgb-ink), 0.08);
}

.c-sheet__link {
  display: block;
  padding: var(--space-4) var(--space-1) var(--space-2);
  font-family: var(--font-display);
  font-size: 1.375rem;
  color: var(--color-ink);
}

.c-sheet__link:hover {
  text-decoration: none;
}

.c-sheet__jumps {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-inline: var(--space-1);
}

.c-sheet__foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--gutter);
}

.c-sheet__social {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  padding-inline: var(--space-4);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: var(--track-mono-tight);
  color: var(--color-ink-muted);
  white-space: nowrap;
}

.c-sheet__cta {
  display: block;
  padding: var(--space-4);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
}

.c-sheet__cta:hover {
  color: var(--color-on-accent);
  text-decoration: none;
}
</style>
