<script setup lang="ts">
/* One primary CTA per screen; `text` is not a CTA but the small mono control (clear, dismiss, copy, expand) that acts on the page and never navigates. */
import BaseLink from './BaseLink.vue';
import type { RouteLocationRaw } from 'vue-router';
import type { ResolvedLink } from '@/site/links';

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'quiet' | 'text';
    to?: RouteLocationRaw;
    href?: string;
    link?: ResolvedLink;
    type?: 'button' | 'submit';
  }>(),
  { variant: 'secondary', type: 'button' },
);
</script>

<template>
  <BaseLink
    v-if="to || href || link"
    :to="to"
    :href="href"
    :link="link"
    class="c-btn"
    :class="`c-btn--${variant}`"
  >
    <slot />
  </BaseLink>
  <button v-else :type="type" class="c-btn" :class="`c-btn--${variant}`">
    <slot />
  </button>
</template>

<style>
.c-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding-inline: var(--space-6);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font-size: var(--size-body);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  transition:
    background var(--dur-2) var(--ease-out),
    box-shadow var(--dur-2) var(--ease-out),
    border-color var(--dur-2) var(--ease-out);
}

.c-btn:hover {
  text-decoration: none;
}

.c-btn--primary {
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 700;
  box-shadow: var(--glow-accent-strong);
}

.c-btn--primary:hover {
  color: var(--color-on-accent);
  box-shadow: 0 0 56px rgba(var(--rgb-accent), 0.6);
}

.c-btn--secondary {
  background: transparent;
  border-color: var(--color-line-strong);
  color: var(--color-ink);
}

.c-btn--secondary:hover {
  background: rgba(var(--rgb-ink), 0.08);
  color: var(--color-ink);
}

.c-btn--quiet {
  min-height: 0;
  padding: 0 0 2px;
  border: 0;
  border-bottom: 1px solid rgba(var(--rgb-accent), 0.4);
  border-radius: 0;
  background: none;
  color: var(--color-accent-text);
  font-size: var(--size-m);
}

.c-btn--quiet:hover {
  color: var(--color-ink-bright);
}

/* min-width as well as min-height: a label as short as "#" still has to be a 44px target. */
.c-btn--text {
  min-width: 44px;
  min-height: 44px;
  padding-inline: var(--space-1);
  border: 0;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-ink-faint);
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  font-weight: 400;
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
}

.c-btn--text:hover {
  color: var(--color-accent-text);
}

/* Quieted with ink/line roles rather than opacity, so the label keeps a known contrast ratio. After the variants on purpose: disabled wins over any of them. */
.c-btn:disabled {
  border-color: var(--color-line);
  background: transparent;
  box-shadow: none;
  color: var(--color-ink-faint);
  cursor: not-allowed;
}
</style>
