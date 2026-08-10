<script setup lang="ts">
/**
 * W2 — the scroll-spy rail. Desktop only, and only once the margin outside the
 * 1120px content column is genuinely wide enough to hold it. The nav owns the
 * single sticky slot on mobile.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { t } from '@/content';
import type { SectionEntry } from '@/site/sections';

/**
 * Derived, not chosen: --width-content + 2 × (--rail-width + --rail-gap)
 *                      = 1120 + 2 × (160 + 24) = 1488.
 *
 * It used to be 1400, which is 88px short — between 1400 and 1488 the rail sat
 * on top of the right-hand end of the copy it was supposed to index. Change
 * either token in tokens.css and this number has to move with it.
 */
const FITS_QUERY = '(min-width: 1488px)';

const props = defineProps<{ sections: SectionEntry[] }>();

const active = ref<string>(props.sections[0]?.id ?? '');
const shown = ref(false);

let observer: IntersectionObserver | null = null;
let media: MediaQueryList | null = null;

const onMedia = () => (shown.value = Boolean(media?.matches));

onMounted(() => {
  media = window.matchMedia(FITS_QUERY);
  media.addEventListener('change', onMedia);
  onMedia();

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) active.value = visible.target.id;
    },
    { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
  );

  for (const section of props.sections) {
    const el = document.getElementById(section.id);
    if (el) observer.observe(el);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
  media?.removeEventListener('change', onMedia);
});

const pad = (n: number) => String(n).padStart(2, '0');
</script>

<template>
  <nav v-if="shown" class="c-rail" :aria-label="t('wayfinding.sectionRail')">
    <a
      v-for="(section, i) in sections"
      :key="section.id"
      class="c-rail__link"
      :class="{ 'is-active': active === section.id }"
      :href="`#${section.id}`"
      :aria-current="active === section.id ? 'true' : undefined"
    >
      <span class="c-rail__index">{{ pad(i + 1) }}</span>
      <span class="c-rail__label">{{ section.label }}</span>
    </a>
  </nav>
</template>

<style>
/* Anchored to the right-hand edge of the CONTENT COLUMN, not to the viewport.
   Pinned to the viewport it drifted further from the copy the wider the screen
   got, and — worse — it could never be reasoned about: whether it cleared the
   text depended on the viewport width instead of on the column it belongs to.
   Anchored here, the only failure left is running off a too-narrow screen,
   which FITS_QUERY prevents. */
.c-rail {
  position: fixed;
  top: 50%;
  left: calc(50% + var(--width-content) / 2 + var(--rail-gap));
  translate: 0 -50%;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: var(--rail-width);
}

.c-rail__link {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: var(--size-mono-s);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.c-rail__link:hover,
.c-rail__link.is-active {
  color: var(--color-ink);
  text-decoration: none;
}

.c-rail__index {
  opacity: 0.6;
}
</style>
