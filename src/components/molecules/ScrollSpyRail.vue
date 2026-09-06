<script setup lang="ts">
// Desktop-only: on narrower viewports the site nav, not this rail, carries section wayfinding.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { t } from '@/content';
import type { SectionEntry } from '@/site/sections';

// 1488px = --width-content + 2 * (--rail-width + --rail-gap) from tokens.css; below it the rail overlaps the content column.
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
 
const grouped = computed(() => props.sections.some((section) => section.group));

const heading = (i: number) =>
  props.sections[i].group !== props.sections[i - 1]?.group ? props.sections[i].group : '';
</script>

<template>
  <nav v-if="shown" class="c-rail" :class="{ 'c-rail--index': grouped }" :aria-label="t('wayfinding.sectionRail')">
    <template v-for="(section, i) in sections" :key="section.key ?? section.id">
      <p v-if="heading(i)" class="c-rail__group">{{ heading(i) }}</p>
      <a
        class="c-rail__link"
        :class="{ 'is-active': active === section.id }"
        :href="`#${section.id}`"
        :aria-current="active === section.id ? 'true' : undefined"
      >
        <span v-if="!grouped" class="c-rail__index">{{ pad(i + 1) }}</span>
        <span class="c-rail__label">{{ section.short ?? section.label }}</span>
      </a>
    </template>
  </nav>
</template>

<style>
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
 
.c-rail--index {
  max-height: 78vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.c-rail__group {
  margin-top: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  color: var(--color-ink-faint);
  opacity: 0.7;
}

.c-rail--index .c-rail__link {
  text-transform: none;
  letter-spacing: 0;
  font-family: var(--font-body);
  font-size: var(--size-s);
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
