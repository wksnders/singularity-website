<script setup lang="ts">
// Desktop-only: on narrower viewports the site nav, not this rail, carries section wayfinding.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { t } from '@/content';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { pad } from '@/site/format';
import type { SectionEntry } from '@/site/sections';

// 94.5em (1512px at the default font) is where (--width-content + 2 * (--rail-width + --rail-gap)) from tokens.css, times the page scale at that width (pageScale.ts), first fits; below it the rail overlaps the content column.
const FITS_QUERY = '(min-width: 94.5em)';

const props = defineProps<{ sections: SectionEntry[]; hideOverId?: string }>();

const active = ref<string>(props.sections[0]?.id ?? '');
const shown = useMediaQuery(FITS_QUERY);

let observer: IntersectionObserver | null = null;

const over = ref(false);
let overObserver: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) active.value = visible.target.id;
    },
    { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
  );

  observe();

  const cover = props.hideOverId ? document.getElementById(props.hideOverId) : null;
  if (cover) {
    over.value = true;
    /* The middle fifth of the window is where the rail sits (`top: 50%` below); change with it. */
    overObserver = new IntersectionObserver(([entry]) => (over.value = entry.isIntersecting), {
      rootMargin: '-40% 0px -40% 0px',
    });
    overObserver.observe(cover);
  }
});

function observe(): void {
  if (!observer) return;
  observer.disconnect();
  if (!props.sections.some((section) => section.id === active.value)) {
    active.value = props.sections[0]?.id ?? '';
  }
  for (const section of props.sections) {
    const el = document.getElementById(section.id);
    if (el) observer.observe(el);
  }
}

/* A filter that changes the list also changes which bands exist: re-observe once they have rendered. */
watch(() => props.sections.map((section) => section.id).join(','), observe, { flush: 'post' });

onBeforeUnmount(() => {
  observer?.disconnect();
  overObserver?.disconnect();
});

const grouped = computed(() => props.sections.some((section) => section.group));

const heading = (i: number) =>
  props.sections[i].group !== props.sections[i - 1]?.group ? props.sections[i].group : '';
</script>

<template>
  <nav v-if="shown" class="c-rail" :class="{ 'c-rail--index': grouped, 'c-rail--away': over }" :aria-label="t('wayfinding.sectionRail')">
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
  z-index: var(--z-rail);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: var(--rail-width);
  transition:
    opacity var(--dur-2) var(--ease-out),
    visibility var(--dur-2);
}

/* `visibility` also takes the hidden links out of the tab order. */
.c-rail--away {
  opacity: 0;
  visibility: hidden;
}
 
.c-rail--index {
  max-height: calc(78vh);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.c-rail__group {
  margin-top: var(--space-3);
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--size-label-xs);
  letter-spacing: var(--track-label);
  text-transform: uppercase;
  color: var(--color-ink-faint);
  opacity: 0.7;
}

.c-rail--index .c-rail__link {
  text-transform: none;
  letter-spacing: 0;
  font-family: var(--font-body);
  font-weight: 400;
  font-size: var(--size-s);
}

.c-rail__link {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--size-label-s);
  letter-spacing: var(--track-label-tight);
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
