<script setup lang="ts">
// Scrim must stay dark enough for hero copy to hold 4.5:1 against the lightest overlapped art pixel.
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import type { ArtSource } from '@/components/atoms/ArtFrame.vue';
import type { Art } from '@/data/types';

withDefaults(
  defineProps<{
    art?: Art | null;
    placeholder?: string;

    pendingNote?: string;

    glow?: string;
    minHeight?: string;
    sources?: ArtSource[];
    focal?: { x: number; y: number };
    sizes?: string;
    bright?: boolean;
  }>(),
  {
    placeholder: '[ key art ]',
    glow: '120% 80% at 20% 10%',
    minHeight: 'min(92dvh, 53.75rem)',
  },
);
</script>

<template>
  <section class="c-hero" :class="{ 'c-hero--bright': bright }" :style="{ minHeight }">
    <div class="c-hero__art">
      <ArtFrame
        :art="art"
        ratio="auto"
        :placeholder="placeholder"
        :sources="sources"
        :focal="focal"
        :sizes="sizes"
        eager
      />
    </div>
    <div class="c-hero__glow" :style="{ '--glow-origin': glow }" aria-hidden="true" />
    <div class="c-hero__scrim" aria-hidden="true" />
    <p v-if="pendingNote" class="c-hero__pending" aria-hidden="true">{{ pendingNote }}</p>
    <div class="c-hero__body l-wrap">
      <slot />
    </div>
  </section>
</template>

<style>
.c-hero {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.c-hero__art {
  position: absolute;
  inset: 0;
}

.c-hero__art > .c-art {
  height: 100%;
}

.c-hero__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    var(--glow-origin),
    rgba(var(--rgb-accent), 0.22) 0%,
    rgba(var(--rgb-bg), 0) 60%
  );
}

.c-hero__scrim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to top,
    var(--color-bg) 4%,
    rgba(var(--rgb-bg), 0.88) 34%,
    rgba(var(--rgb-bg), 0.35) 68%,
    rgba(var(--rgb-bg), 0.55) 100%
  );
}

/* Only the foot is darkened, so the copy must stay low enough to sit inside the scrim's dark band. */
.c-hero--bright .c-hero__glow {
  display: none;
}

.c-hero--bright .c-hero__scrim {
  background: linear-gradient(
    to top,
    var(--color-bg) 0%,
    rgba(var(--rgb-bg), 0.9) 30%,
    rgba(var(--rgb-bg), 0.3) 55%,
    transparent 70%
  );
}

@media (min-width: 45em) {
  .c-hero--bright .c-hero__scrim {
    background: linear-gradient(
      to top,
      var(--color-bg) 0%,
      rgba(var(--rgb-bg), 0.86) 20%,
      rgba(var(--rgb-bg), 0.25) 44%,
      transparent 62%
    );
  }
}

.c-hero__pending {
  position: absolute;
  right: var(--gutter);
  bottom: 0.875rem;
  z-index: var(--z-raised);
  pointer-events: none;
  font-family: var(--font-label);
  font-weight: 600;
  font-size: var(--size-label-xs);
  letter-spacing: var(--track-label);
  color: rgba(var(--rgb-ink), 0.32);
}

.c-hero__body {
  position: relative;
  z-index: var(--z-raised);
  padding-block: 7.5rem clamp(3rem, 7vw, 5.5rem);
}
</style>
