<script setup lang="ts">
/**
 * The art-first hero used on Home, Faction and Character: full-bleed art, a
 * scrim heavy enough to carry type at 4.5:1 against the lightest overlapped
 * pixel, and the copy in the bottom-left. Art pages get this; index pages get
 * SecondaryHero instead.
 */
import ArtFrame from '@/components/atoms/ArtFrame.vue';
import type { Art } from '@/data/types';

withDefaults(
  defineProps<{
    art?: Art | null;
    placeholder?: string;
    /** Mono note naming the art that is still missing. */
    pendingNote?: string;
    /** Slow drift on the art. Disabled under reduced motion by base.css. */
    drift?: boolean;
    /** Radial glow origin, so no two heroes on the site look identical. */
    glow?: string;
    minHeight?: string;
  }>(),
  {
    placeholder: '[ key art ]',
    drift: false,
    glow: '120% 80% at 20% 10%',
    minHeight: 'min(92dvh, 860px)',
  },
);
</script>

<template>
  <section class="c-hero" :style="{ minHeight }">
    <div class="c-hero__art" :class="{ 'c-hero__art--drift': drift }">
      <ArtFrame :art="art" ratio="auto" :placeholder="placeholder" eager />
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

.c-hero__art--drift {
  animation: sx-drift 24s var(--ease-in-out) infinite alternate;
}

@keyframes sx-drift {
  from {
    transform: translate3d(0, 0, 0) scale(1.02);
  }
  to {
    transform: translate3d(0, -14px, 0) scale(1.06);
  }
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

.c-hero__pending {
  position: absolute;
  right: var(--gutter);
  bottom: 14px;
  z-index: 3;
  pointer-events: none;
  font-family: var(--font-mono);
  font-size: var(--size-mono-xs);
  letter-spacing: 0.12em;
  color: rgba(var(--rgb-ink), 0.32);
}

.c-hero__body {
  position: relative;
  z-index: 3;
  padding-block: 120px clamp(48px, 7vw, 88px);
}
</style>
