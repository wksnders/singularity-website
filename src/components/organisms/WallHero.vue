<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue';
import { useScrollRatchet } from '@/composables/useScrollRatchet';
import type { Crumb } from '@/site/sections';

export interface WallColumn {
  pace: number;
  width: number;
  height: number;
  style: Record<string, string | number>;
  cells: (string | null)[];
}

const props = withDefaults(
  defineProps<{
    columns: WallColumn[];
    crumbs?: Crumb[];
    lazy?: boolean;
    /** Px the wall runs on below the hero. */
    extend?: number;
  }>(),
  { lazy: false, extend: 0 },
);

const wall = ref<HTMLElement | null>(null);
const { refresh } = useScrollRatchet(wall);

watch(
  () => props.columns,
  () => nextTick(refresh),
);
</script>

<template>
  <section
    class="c-wall-hero"
    :class="{ 'c-wall-hero--extended': extend }"
    :style="extend ? { '--wall-extend': `${extend}px` } : undefined"
  >
    <div class="c-wall-hero__backdrop" aria-hidden="true">
      <div class="c-wall-hero__wall">
        <div ref="wall" class="c-wall-hero__columns">
          <div
            v-for="(column, c) in columns"
            :key="c"
            class="c-wall-hero__column"
            :data-pace="column.pace"
            :style="column.style"
          >
            <div v-for="copy in 2" :key="copy" class="c-wall-hero__stack">
              <template v-for="(src, k) in column.cells" :key="k">
                <img
                  v-if="src"
                  class="c-wall-hero__item"
                  :src="src"
                  alt=""
                  :width="column.width"
                  :height="column.height"
                  :loading="lazy ? 'lazy' : undefined"
                  decoding="async"
                  draggable="false"
                />
                <span v-else class="c-wall-hero__item"></span>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div class="c-wall-hero__layer c-wall-hero__wash"></div>
      <div class="c-wall-hero__layer c-wall-hero__dim"></div>
      <div class="c-wall-hero__layer c-wall-hero__glow"></div>
    </div>

    <div v-if="crumbs?.length" class="c-wall-hero__bar">
      <div class="l-wrap">
        <Breadcrumbs :crumbs="crumbs" />
      </div>
    </div>

    <slot />
  </section>
</template>

<style>
.c-wall-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.c-wall-hero__backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

@supports (overflow: clip) {
  .c-wall-hero__backdrop {
    bottom: calc(var(--wall-extend, 0px) * -1);
  }
}

.c-wall-hero--extended {
  overflow: clip visible;
}

.c-wall-hero__wall {
  position: absolute;
  inset: -22% -18%;
  z-index: -4;
  transform: rotate(-12deg);
}

.c-wall-hero__columns {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  overflow: hidden;
  pointer-events: none;
}

.c-wall-hero__column {
  display: flex;
  flex-direction: column;
  transform: translateY(-50%);
  will-change: transform;
}

.c-wall-hero__stack {
  display: flex;
  flex-direction: column;
  gap: var(--wall-gap);
  padding-bottom: var(--wall-gap);
}

.c-wall-hero__item {
  display: block;
  flex: 0 0 auto;
  width: var(--wall-size);
  height: var(--wall-item-h, var(--wall-size));
  border-radius: var(--wall-radius, 0);
  object-fit: contain;
  user-select: none;
}

.c-wall-hero__layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.c-wall-hero__wash {
  z-index: -3;
  background: #2a3160;
  mix-blend-mode: color;
}

.c-wall-hero__dim {
  z-index: -2;
  background: rgba(var(--rgb-bg), 0.62);
}

.c-wall-hero__glow {
  z-index: -1;
  background:
    radial-gradient(55% 45% at var(--wall-glow-at, 50% 50%), rgba(var(--rgb-accent), 0.16), transparent 70%),
    linear-gradient(to top, var(--color-bg) 0%, rgba(var(--rgb-bg), 0) var(--wall-fade, 30%));
}

.c-wall-hero__bar {
  position: absolute;
  top: var(--nav-height);
  left: 0;
  right: 0;
  border-bottom: 1px solid rgba(var(--rgb-ink), 0.08);
  background: linear-gradient(to bottom, rgba(var(--rgb-bg), 0.55), rgba(var(--rgb-bg), 0.25));
}

.c-wall-hero__bar .c-crumbs__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgba(var(--rgb-ink), 0.78);
}

.c-wall-hero__bar .c-crumbs__current {
  color: var(--color-accent-text);
}
</style>
