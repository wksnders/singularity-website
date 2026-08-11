<script setup lang="ts">
/**
 * The brand mark — a glyph inside a faction-coloured ring.
 *
 * It is allowed to stand in for FactionDot, and only because of what the art
 * is: colour never travels alone here either, because every mark carries a
 * distinct SHAPE as well as its ring colour. Where no mark has shipped yet the
 * component falls back to the dot rather than to a gap, so a brand without art
 * still reads as belonging to its faction.
 *
 * Marks are decorative by default: they sit beside the brand's name in most
 * placements on the site, and a second reading of the same word is noise.
 *
 * Several marks are deliberately not circles — Mega Byte has a bite out of it,
 * Zodiac Reliquary is a gate. Nothing here clips them; the transparent PNG is
 * its own silhouette.
 */
import { computed } from 'vue';
import FactionDot from '@/components/atoms/FactionDot.vue';
import { asset } from '@/site/links';

const props = withDefaults(
  defineProps<{
    /** `brand.icon` — null until the mark exists. */
    icon?: string | null;
    /** Brand name. Used for alt text, and for the dot fallback's title. */
    name: string;
    /** Rendered box in CSS px. Source art is 256px, so 128 is the 2x ceiling. */
    size?: number;
    /** Faction colour, for the dot fallback. */
    color?: string | null;
    /** True when the mark stands alone and must name itself. */
    labelled?: boolean;
    /** The one mark above the fold on a brand page. */
    eager?: boolean;
  }>(),
  { size: 40, labelled: false, eager: false },
);

/* `brand.icon` is written as the path INSIDE public/ ("/brands/x.png"), so it
   has to be joined to the deploy base — the site is served from a subpath
   today. See asset(). */
const src = computed(() => (props.icon ? asset(props.icon) : null));

const dotSize = () => Math.max(8, Math.round(props.size * 0.32));
</script>

<template>
  <img
    v-if="src"
    class="c-mark"
    :src="src"
    :alt="labelled ? name : ''"
    :width="size"
    :height="size"
    :loading="eager ? 'eager' : 'lazy'"
    :fetchpriority="eager ? 'high' : 'auto'"
    decoding="async"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
  <FactionDot v-else :color="color" :size="dotSize()" />
</template>

<style>
.c-mark {
  display: inline-block;
  flex: 0 0 auto;
  object-fit: contain;
  vertical-align: middle;
  /* The glyph is WHITE on a transparent interior, so the mark reads only on a
     dark surface. Afterlight is a dark-only identity (tokens.css) and every
     surface it lands on is #07070f–#12121e, so nothing is needed here. The one
     thing that would break it is placing a mark on `--color-accent`, which is
     near-white — do not put a mark on a featured card without a dark plate. */
}
</style>
