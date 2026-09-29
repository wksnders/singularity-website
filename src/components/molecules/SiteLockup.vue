<script setup lang="ts">
/* The wordmark and badge images must be cut on the same size canvas; the badge is overlaid on top at the same width. A new canvas size must also go into lidArt.ts's MARK. */
import { t } from '@/content';
import { asset, logoSrcset } from '@/site/links';

defineProps<{
  sizes: string;
  /** Shows the `.exe` badge. */
  signed: boolean;
  /** Fades the badge out in place. */
  faded?: boolean;
}>();

const src = (name: string, ext: 'webp' | 'png') => asset(`/logo/${name}.${ext}`);
</script>

<template>
  <span class="c-lockup" :class="{ 'is-signed': signed, 'is-faded': faded }">
    <picture>
      <source type="image/webp" :srcset="logoSrcset('singularity-logo', 'webp')" :sizes="sizes" />
      <img
        class="c-lockup__word"
        :src="src('singularity-logo', 'png')"
        :srcset="logoSrcset('singularity-logo', 'png')"
        :sizes="sizes"
        :alt="t('chrome.logoAlt')"
        width="720"
        height="254"
        fetchpriority="high"
        decoding="async"
      />
    </picture>

    <!-- alt="" : the wordmark above already carries the name. -->
    <picture>
      <source type="image/webp" :srcset="logoSrcset('singularity-exe-badge-center', 'webp')" :sizes="sizes" />
      <img
        class="c-lockup__badge"
        :src="src('singularity-exe-badge-center', 'png')"
        :srcset="logoSrcset('singularity-exe-badge-center', 'png')"
        :sizes="sizes"
        alt=""
        width="720"
        height="254"
        decoding="async"
      />
    </picture>
  </span>
</template>

<style>
.c-lockup {
  position: relative;
  display: block;
  width: 100%;
  filter: drop-shadow(0 10px 30px rgba(var(--rgb-bg), 0.7));
}

.c-lockup__word {
  display: block;
  width: 100%;
  height: auto;
}

.c-lockup__badge {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: auto;
  opacity: 0;
  transform: translateY(6px) scale(0.88);
  transform-origin: 51.4% 83.5%;
  transition:
    opacity var(--dur-4) var(--ease-out),
    transform var(--dur-4) var(--ease-out);
}

.c-lockup.is-signed .c-lockup__badge {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.c-lockup.is-faded .c-lockup__badge {
  opacity: 0;
}

/* Undoes base.css's reduced-motion cut for the badge's fade; its movement stays off. */
@media (prefers-reduced-motion: reduce) {
  .c-lockup__badge {
    transition-property: opacity;
    transition-duration: var(--dur-4) !important;
  }
}
</style>
