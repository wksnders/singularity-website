<script setup lang="ts">
/**
 * The card at reading size
 */
import { nextTick, ref, watch } from 'vue';
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import type { Art } from '@/data/types';

export interface ZoomRow {
  label: string;
  value: string;
}

const props = defineProps<{
  open: boolean;
  kicker: string;
  name: string;
  art: Art;
  placeholder: string;
  rows: ZoomRow[];
  errataLine: string;
}>();

const emit = defineEmits<{ close: [] }>();

const dialog = ref<HTMLElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
let lastFocused: HTMLElement | null = null;

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

watch(
  () => props.open,
  async (open) => {
    const page = document.getElementById('char-page');
    if (open) {
      lastFocused = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      /* `inert` removes the page from the accessibility tree, so the
         aria-hidden is for browsers without it. */
      page?.setAttribute('inert', '');
      page?.setAttribute('aria-hidden', 'true');
      await nextTick();
      closeButton.value?.focus();
      return;
    }
    document.body.style.overflow = '';
    page?.removeAttribute('inert');
    page?.removeAttribute('aria-hidden');
    if (lastFocused?.isConnected) lastFocused.focus();
  },
);

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('close');
    return;
  }
  if (event.key !== 'Tab' || !dialog.value) return;
  const items = Array.from(dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>

<template>
  <div
    v-if="open"
    id="char-zoom"
    ref="dialog"
    class="c-zoom"
    role="dialog"
    aria-modal="true"
    :aria-label="name"
    @keydown="onKeydown"
  >
    <div class="c-zoom__backdrop" @click="emit('close')" />

    <button
      ref="closeButton"
      type="button"
      class="c-zoom__close"
      :aria-label="t('cardZoom.close')"
      @click="emit('close')"
    >
      <span aria-hidden="true">&times;</span>
    </button>

    <div class="c-zoom__shell">
      <div class="c-zoom__body">
        <div class="c-zoom__figure">
          <ArtFrame :art="art" ratio="63 / 88" :placeholder="placeholder" radius="m" fit="contain" />
        </div>

        <div class="c-zoom__meta">
          <MonoLabel tone="muted">{{ kicker }}</MonoLabel>
          <h2 class="c-zoom__name">{{ name }}</h2>

          <slot name="face" />

          <dl class="c-zoom__rows">
            <div v-for="row in rows" :key="row.label" class="c-zoom__row">
              <dt><MonoLabel tone="muted" as="span">{{ row.label }}</MonoLabel></dt>
              <dd class="c-zoom__value">{{ row.value }}</dd>
            </div>
          </dl>

          <p class="c-zoom__errata">{{ errataLine }}</p>

          <slot name="links" />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.c-zoom {
  position: fixed;
  inset: 0;
  z-index: 70;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.c-zoom__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(var(--rgb-bg), 0.94);
  backdrop-filter: blur(18px);
}

.c-zoom__close {
  position: fixed;
  top: var(--space-3);
  right: var(--space-3);
  z-index: 2;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  color: var(--color-ink);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}

.c-zoom__shell {
  position: relative;
  min-height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 76px var(--space-4) var(--space-8);
}

.c-zoom__body {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  max-width: 900px;
}

.c-zoom__figure {
  flex: 0 0 auto;
  width: min(100%, 420px);
}

.c-zoom__meta {
  flex: 1 1 280px;
  min-width: 0;
  max-width: 400px;
}

.c-zoom__name {
  margin-top: var(--space-3);
  font-size: 1.375rem;
}

.c-zoom__rows {
  margin-top: var(--space-5);
}

.c-zoom__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-line);
}

.c-zoom__row + .c-zoom__row {
  margin-top: var(--space-3);
}

.c-zoom__value {
  margin: 0;
  font-size: var(--size-m);
  text-align: right;
}

.c-zoom__errata {
  margin-top: var(--space-5);
  font-size: var(--size-m);
  line-height: 1.6;
  color: var(--color-ink-soft);
}
</style>
