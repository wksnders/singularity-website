<script lang="ts">
/* Module scope: the pop plays once per page load. */
let popped = false;
</script>

<script setup lang="ts">

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import CardGlyph from '@/components/atoms/CardGlyph.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import { fitLine, useHeldReadout, type FitSteps } from '@/composables/useHeldReadout';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { game } from '@/data/universe';
import { FOOT, type LidReadout } from '@/site/lidSplitScene';
import { asset } from '@/site/links';
import { token, tokenMs, tokenPx } from '@/site/tokens';

const props = defineProps<{
  /** 'scroll' points down to a Watch button that isn't whole on screen. */
  line: 'category' | 'modes' | 'scroll' | 'named';
  named: LidReadout | null;
  /** The premise link is hovered. */
  cue: boolean;
  /** Px: the lid's width and left edge on the page. */
  width: number;
  left: number;
  /** Px: the foot's height, and the lid width the srcset `sizes` follow. */
  height: number;
  sizedWidth: number;
  /** The page-wide cable run under the bar. */
  cables: boolean;
  /** Px: the page width the run's srcset `sizes` follow. */
  sizedPage: number;
  /** Deg the tray windows turn; null leaves them as painted. */
  trayHue: number | null;
  /** Sizes the plate for the longest name. */
  cast: LidReadout[] | null;
  away: boolean;
  pop: 'scroll' | 'now' | 'wait';
  /** Hides the foot from assistive tech. */
  quiet: boolean;
}>();

const emit = defineEmits<{ plateHover: [on: boolean] }>();

const BAR_WIDTHS = [960, 1920, 2560, 3840];
const TRAY_WIDTHS = [520, 1040];
const RUN_WIDTHS = [800, 1200, 2315];

const TRAY_TINT_SAT = 1.05;
const srcset = (name: string, widths: number[], ext = 'webp') =>
  widths.map((w) => `${asset(`/box-frame/${name}-${w}.${ext}`)} ${w}w`).join(', ');

/* Px per character: Plex Mono's 0.6em advance plus the tracking. */
const monoAdvance = tokenPx('--size-mono-s') * (0.6 + parseFloat(token('--track-mono')));
/** Px: the plate's width beyond its text, and the air kept from the lid's edges. */
const PLATE = { pad: 52, edge: 8 };
/** The player glyph's width, in characters. */
const GLYPH_CHARS = 2;
/** Px: .c-home-foot__chain's gap, once each side of "/". */
const chainGaps = tokenPx('--space-2') * 2;

const s = computed(() => props.width / FOOT.ref);
const sizedS = computed(() => props.sizedWidth / FOOT.ref);

const modesLine = computed(() => t('home.hero.modesLine', { modes: t('home.hero.readout.modes'), players: game.players }));

const plateWidth = computed(() => {
  const labelChars = Math.max(
    t('home.hero.category').length,
    modesLine.value.length + GLYPH_CHARS,
    t('home.hero.readout.cue').length,
    t('home.hero.readout.scroll').length,
  );
  const cap = Math.floor(props.width - PLATE.edge * 2);
  let w = Math.round(labelChars * monoAdvance + PLATE.pad);
  if (props.cast) {
    const chainChars = Math.max(...props.cast.map((r) => r.character.length + r.faction.length + 1));
    w = Math.max(w, Math.round(chainChars * monoAdvance + chainGaps + PLATE.pad));
  }
  return Math.min(cap, Math.max(w, FOOT.plateMin, Math.round(FOOT.plateW * s.value)));
});
const shownLine = computed(() => (props.line !== 'named' && props.cue ? 'cue' : props.line));

const plate = ref<HTMLElement | null>(null);
const images = ref<HTMLElement | null>(null);
defineExpose({ plate, images });

const namedBox = ref<HTMLElement | null>(null);
const namedText = ref<HTMLElement | null>(null);
const STEPS: FitSteps = [
  ['var(--size-mono-s)', 'var(--track-mono)'],
  ['var(--size-mono-s)', 'var(--track-mono-tight)'],
  ['var(--size-mono-xs)', 'var(--track-mono-tight)'],
  ['0.5625rem', 'var(--track-mono-tight)'],
  ['0.5rem', 'var(--track-mono-tight)'],
];
const shown = useHeldReadout(
  () => props.named,
  STEPS,
  () => [[namedBox.value, namedText.value]],
);

const categoryEl = ref<HTMLElement | null>(null);
const modesEl = ref<HTMLElement | null>(null);
const cueEl = ref<HTMLElement | null>(null);
const scrollEl = ref<HTMLElement | null>(null);
const glyphOff = ref(false);

const overflows = (el: HTMLElement) => el.scrollWidth > el.clientWidth + 1;

async function fitLines(): Promise<void> {
  glyphOff.value = false;
  await nextTick();
  for (const el of [categoryEl.value, modesEl.value, cueEl.value, scrollEl.value]) if (el) fitLine(el, el, STEPS);
  const modes = modesEl.value;
  if (!modes || !overflows(modes)) return;
  /* Still too wide at the smallest step: the player glyph goes, then the line fits again from the top step. */
  glyphOff.value = true;
  await nextTick();
  fitLine(modes, modes, STEPS);
}

onMounted(() => {
  void fitLines();
  void document.fonts?.ready.then(fitLines);
});
watch(plateWidth, fitLines, { flush: 'post' });

const spoken = computed(() => {
  const [min, max] = game.players.split('–');
  return t('home.hero.railSpoken', {
    category: t('home.hero.category'),
    modes: t('home.hero.readout.modes'),
    players: t('home.hero.playersSpoken', { min, max: max ?? min }),
  });
});

const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
let unwatchPop: (() => void) | null = null;

/* On the plate, never its wrapper: the wrapper's drop-shadow must stay a fixed filter list (a WebKit layer keeps a stale one when it changes shape). */
function play(el: HTMLElement): void {
  popped = true;
  unwatchPop?.();
  el.style.opacity = '';
  /* Reduced motion keeps the fade and the flash, not the scale. */
  el.animate(
    [
      { opacity: 0, scale: reduced.value ? 1 : 0.72, filter: 'brightness(2.2)' },
      { opacity: 1, offset: 0.55, filter: 'brightness(1.4)' },
      { opacity: 1, scale: 1, filter: 'brightness(1)' },
    ],
    { duration: tokenMs('--dur-3'), delay: tokenMs('--dur-1'), easing: token('--ease-out'), fill: 'backwards' },
  );
}

function arm(mode: 'scroll' | 'now' | 'wait'): void {
  const el = plate.value;
  if (popped || !el) return;
  unwatchPop?.();
  el.style.opacity = '0';
  if (mode === 'now') return play(el);
  if (mode === 'wait') return;
  const check = () => {
    const b = el.getBoundingClientRect();
    if (window.scrollY < 1 || b.height === 0 || b.top < 0 || b.bottom > window.innerHeight) return;
    play(el);
  };
  window.addEventListener('scroll', check, { passive: true });
  unwatchPop = () => {
    window.removeEventListener('scroll', check);
    unwatchPop = null;
  };
}

onMounted(() => arm(props.pop));
watch(() => props.pop, arm);

onBeforeUnmount(() => unwatchPop?.());

const px = (v: number) => `${v.toFixed(1)}px`;
</script>

<template>
  <div
    class="c-home-foot"
    :style="{
      height: `${height}px`,
      '--lid-left': px(left),
      '--lid-width': px(width),
      '--run-top': px(FOOT.runTop * s),
      '--bar-top': px(FOOT.barTop * s),
      '--bar-h': px(FOOT.barH * s),
      '--tray-top': px(FOOT.trayTop * s),
      '--tray-w': px(FOOT.trayW * s),
      '--tray-h': px(FOOT.trayH * s),
      '--plate-mid': px(FOOT.plateMid * s),
      '--plate-w': `${plateWidth}px`,
      '--plate-h-min': `${FOOT.plateH}px`,
      '--tray-hue': `${trayHue ?? 0}deg`,
      '--tray-sat': trayHue === null ? 1 : TRAY_TINT_SAT,
    }"
    :aria-hidden="quiet || undefined"
  >
    <span class="c-home-foot__spoken">{{ spoken }}</span>

    <div ref="images" class="c-home-foot__frame" aria-hidden="true">
      <picture v-if="cables">
        <source type="image/avif" :srcset="srcset('cable-run', RUN_WIDTHS, 'avif')" :sizes="`${Math.round(sizedPage)}px`" />
        <img
          class="c-home-foot__run"
          :src="asset('/box-frame/cable-run-1200.webp')"
          :srcset="srcset('cable-run', RUN_WIDTHS)"
          :sizes="`${Math.round(sizedPage)}px`"
          alt=""
          decoding="async"
          :style="{ aspectRatio: 1 / (FOOT.runAspect + FOOT.runShadow) }"
        />
      </picture>
      <img
        class="c-home-foot__fill"
        :src="asset('/box-frame/fill-160.webp')"
        alt=""
        decoding="async"
        :style="{ left: px(left + FOOT.fillLeft * s), width: px(FOOT.fillW * s) }"
      />
      <picture>
        <source type="image/avif" :srcset="srcset('bar', BAR_WIDTHS, 'avif')" :sizes="`${Math.round(sizedWidth)}px`" />
        <img
          class="c-home-foot__bar"
          :src="asset('/box-frame/bar-1920.webp')"
          :srcset="srcset('bar', BAR_WIDTHS)"
          :sizes="`${Math.round(sizedWidth)}px`"
          alt=""
          decoding="async"
        />
      </picture>
      <div
        v-for="(x, i) in FOOT.trays"
        :key="x"
        class="c-home-foot__tray"
        :style="{ left: px(left + x * s) }"
      >
        <img
          :src="asset(`/box-frame/tray-${i ? 'b' : 'a'}-520.webp`)"
          :srcset="srcset(`tray-${i ? 'b' : 'a'}`, TRAY_WIDTHS)"
          :sizes="`${Math.round(FOOT.trayW * sizedS)}px`"
          alt=""
          decoding="async"
        />
      </div>
    </div>

    <div class="c-home-foot__readout" :class="{ 'is-away': away }">
      <div
        ref="plate"
        class="c-home-foot__plate"
        @mouseenter="emit('plateHover', true)"
        @mouseleave="emit('plateHover', false)"
      >
        <div class="c-home-foot__screen">
          <MonoLabel class="c-home-foot__swap" aria-hidden="true">
            <span ref="categoryEl" class="c-home-foot__say" :class="{ 'is-on': shownLine === 'category' }">
              {{ t('home.hero.category') }}
            </span>
            <span ref="modesEl" class="c-home-foot__say c-home-foot__say--lit" :class="{ 'is-on': shownLine === 'modes' }">
              {{ modesLine }}
              <CardGlyph v-if="!glyphOff" name="player" />
            </span>
            <span ref="cueEl" class="c-home-foot__say c-home-foot__say--cue" :class="{ 'is-on': shownLine === 'cue' }">
              {{ t('home.hero.readout.cue') }}
            </span>
            <span ref="scrollEl" class="c-home-foot__say c-home-foot__say--cue" :class="{ 'is-on': shownLine === 'scroll' }">
              {{ t('home.hero.readout.scroll') }}
            </span>
            <span
              ref="namedBox"
              class="c-home-foot__say c-home-foot__say--named"
              :class="{ 'is-on': shownLine === 'named' }"
            >
              <span ref="namedText" class="c-home-foot__chain">
                <span>{{ shown?.character }}</span>
                <span class="c-home-foot__sep">/</span>
                <span class="c-home-foot__faction" :style="{ '--faction-text': shown?.tone }">{{ shown?.faction }}</span>
              </span>
            </span>
          </MonoLabel>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.c-home-foot {
  /* Grows with the text: the plate never clips its own label. */
  --plate-h: max(var(--plate-h-min), calc(2 * var(--size-mono-s) + 8px));
  /* Each side of a line: keeps it clear of the plate's cut ends. */
  --say-inset: 20px;
  position: relative;
  background: var(--color-bg);
  pointer-events: none;
}

.c-home-foot__spoken {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0;
}

.c-home-foot__frame {
  position: absolute;
  inset: 0;
}

/* Its shadow is baked in, so no filter on a page-wide image; the band below pads for it (HomeHero's --hero-overhang). */
.c-home-foot__run {
  position: absolute;
  left: 0;
  top: var(--run-top);
  width: 100%;
  height: auto;
  max-width: none;
}

.c-home-foot__fill,
.c-home-foot__bar {
  position: absolute;
  top: var(--bar-top);
  height: var(--bar-h);
  max-width: none;
  object-fit: fill;
}

/* Takes the pointer so the strip it covers neither lights nor names. */
.c-home-foot__bar {
  left: var(--lid-left);
  width: var(--lid-width);
  clip-path: polygon(11.94% 0, 88.53% 0, 88.53% 16.05%, 100% 16.05%, 100% 100%, 11.94% 100%);
  pointer-events: auto;
}

.c-home-foot__tray {
  --cut: 10px;

  position: absolute;
  top: var(--tray-top);
  width: var(--tray-w);
  height: var(--tray-h);
  overflow: hidden;
  background: var(--color-bg);
  clip-path: polygon(
    var(--cut) 0,
    calc(100% - var(--cut)) 0,
    100% var(--cut),
    100% calc(100% - var(--cut)),
    calc(100% - var(--cut)) 100%,
    var(--cut) 100%,
    0 calc(100% - var(--cut)),
    0 var(--cut)
  );
}

.c-home-foot__tray img {
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: fill;
  /* Same functions in every state (WebKit's stale-filter bug); no transition, or hue-rotate sweeps the rainbow between hues. */
  filter: hue-rotate(var(--tray-hue)) saturate(var(--tray-sat)) brightness(0.95);
}

.c-home-foot__tray::before,
.c-home-foot__tray::after {
  content: '';
  position: absolute;
}

.c-home-foot__tray::before {
  inset: 0;
  z-index: var(--z-raised);
  box-shadow:
    inset 0 8px 10px -2px rgba(0, 0, 0, 0.85),
    inset 0 0 0 1.5px rgba(0, 0, 0, 0.9);
}

.c-home-foot__tray::after {
  left: var(--cut);
  right: var(--cut);
  bottom: 0;
  height: 1.5px;
  background: rgba(var(--rgb-accent), 0.5);
  box-shadow: 0 0 6px rgba(var(--rgb-accent), 0.5);
}

.c-home-foot__readout {
  position: absolute;
  left: calc(var(--lid-left) + var(--lid-width) / 2);
  top: calc(var(--plate-mid) - var(--plate-h) / 2);
  width: var(--plate-w);
  height: var(--plate-h);
  translate: -50% 0;
  filter: brightness(1) drop-shadow(0 5px 5px rgba(0, 0, 0, 0.85));
  transition:
    opacity var(--dur-3) var(--ease-out),
    visibility var(--dur-3) var(--ease-linear);
}

.c-home-foot__readout.is-away {
  opacity: 0;
  visibility: hidden;
}

/* 45° ends, half the height, at every layer: the metal bevel, the screen and its lit ring. */
.c-home-foot__plate,
.c-home-foot__screen,
.c-home-foot__screen::before {
  --cut: calc(var(--h) / 2);

  clip-path: polygon(
    var(--cut) 0,
    calc(100% - var(--cut)) 0,
    100% 50%,
    calc(100% - var(--cut)) 100%,
    var(--cut) 100%,
    0 50%
  );
}

.c-home-foot__plate {
  --h: var(--plate-h);

  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #6a6870, #2a292e 45%, #0c0c0f);
  /* The pop animates brightness(): the list stays the same at rest. */
  filter: brightness(1);
  pointer-events: auto;
}

/* A 3px bevel, then a 2.5px lit ring, each measured square to the 45° cut. */
.c-home-foot__screen {
  --h: calc(var(--plate-h) - 6px);

  position: absolute;
  inset: 3px calc(3px * 1.41421);
  isolation: isolate;
  background: rgba(var(--rgb-accent), 0.22);
}

.c-home-foot__screen::before {
  --h: calc(var(--plate-h) - 11px);

  content: '';
  position: absolute;
  inset: 2.5px calc(2.5px * 1.41421);
  z-index: -1;
  background: var(--color-bg);
  box-shadow: inset 0 3px 4px rgba(0, 0, 0, 0.9);
}

.c-home-foot__swap {
  position: relative;
  display: grid;
  height: 100%;
  margin: 0;
  overflow: hidden;
  line-height: calc(var(--plate-h) - 6px);
  text-indent: var(--track-mono);
  text-align: center;
  white-space: nowrap;
  text-shadow: 0 0 8px rgba(var(--rgb-accent), 0.35);
}

/* Clipped: fitLine reads each line's own overflow. */
.c-home-foot__say {
  grid-area: 1 / 1;
  justify-self: center;
  max-width: calc(100% - 2 * var(--say-inset));
  overflow: hidden;
  display: flex;
  align-items: center;
  /* safe: a line that still overflows clips at its end, not at both. */
  justify-content: safe center;
  gap: 6px;
  color: var(--color-ink-soft);
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity var(--dur-2) var(--ease-out),
    transform var(--dur-2) var(--ease-out);
}

.c-home-foot__say:first-child {
  transform: translateY(-8px);
}

.c-home-foot__say.is-on {
  opacity: 1;
  transform: none;
}

.c-home-foot__say--lit {
  font-weight: 500;
  color: var(--color-ink);
}

.c-home-foot__say--named {
  text-indent: 0;
}

.c-home-foot__chain {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 500;
  color: var(--color-ink);
}

.c-home-foot__sep {
  color: var(--color-ink-faint);
}

.c-home-foot__faction {
  color: var(--faction-text);
}

.c-home-foot__say--cue {
  font-weight: 500;
  color: var(--color-accent);
}

/* Undoes base.css's reduced-motion cut for fades and colour changes (slides stay off), at each rule's own duration. */
@media (prefers-reduced-motion: reduce) {
  .c-home-foot__readout {
    transition-duration: var(--dur-3) !important;
  }

  .c-home-foot__say {
    transition-duration: var(--dur-2) !important;
    transform: none !important;
  }
}
</style>
