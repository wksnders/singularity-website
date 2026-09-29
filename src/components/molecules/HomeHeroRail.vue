<script lang="ts">
/* Module scope: the pop plays once per page load. */
let popped = false;
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import CardGlyph from '@/components/atoms/CardGlyph.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import { t } from '@/content';
import { fitLine, useHeldReadout, type FitSteps } from '@/composables/useHeldReadout';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { game } from '@/data/universe';
import { HERO, type LidReadout } from '@/site/lidSplitScene';
import { token, tokenMs, tokenPx } from '@/site/tokens';

const props = defineProps<{
  line: 'category' | 'modes' | 'named';
  named: LidReadout | null;
  /** The premise link is hovered. */
  cue: boolean;
  /** The lid's width, px. */
  width: number;
  /** Sizes the hex for the longest name. */
  cast: LidReadout[] | null;
  away: boolean;
  pop: 'scroll' | 'now' | 'wait';
  /** Hides the rail from assistive tech. */
  quiet: boolean;
}>();

/* Px per character: Plex Mono's 0.6em advance plus the tracking. */
const monoAdvance = tokenPx('--size-mono-s') * (0.6 + parseFloat(token('--track-mono')));
/** Px: the cradle slope's run. */
const DIP = 18;
/** Px: the hex's width beyond its text, the cradle's extra width for its slopes, and the air kept from the lid's edges. */
const HEX = { pad: 52, slopes: 17, edge: 8 };
/** The player glyph's width, in characters. */
const GLYPH_CHARS = 2;
/** Px: the cue plate's padding either side of its text, and its gap from the cradle. */
const PLATE = { pad: 18, gap: 14 };
/** Px: .c-home-rail__chain's gap, once each side of "/". */
const chainGaps = tokenPx('--space-2') * 2;

const modesLine = computed(() => t('home.hero.modesLine', { modes: t('home.hero.modes'), players: game.players }));

const size = computed(() => {
  const labelChars = Math.max(t('home.hero.category').length, modesLine.value.length + GLYPH_CHARS);
  const cap = Math.floor(props.width - HEX.edge * 2 - HEX.slopes);
  let hexWidth = Math.min(Math.round(labelChars * monoAdvance + HEX.pad), cap);
  if (props.cast) {
    const chainChars = Math.max(...props.cast.map((r) => r.character.length + r.faction.length + 1));
    hexWidth = Math.max(hexWidth, Math.min(Math.round(chainChars * monoAdvance + chainGaps + HEX.pad), cap));
  }
  const cradleWidth = hexWidth + HEX.slopes;
  const side = (props.width - cradleWidth) / 2;
  const cueFits = t('home.hero.readout.cue').length * monoAdvance + PLATE.pad * 2 <= side - PLATE.gap - HEX.edge;
  return { hexWidth, cradleWidth, cueFits };
});
const hexWidth = computed(() => size.value.hexWidth);
const cradleWidth = computed(() => size.value.cradleWidth);
const cueBeside = computed(() => props.cue && size.value.cueFits);
const shownLine = computed(() => (props.line !== 'named' && props.cue && !size.value.cueFits ? 'cue' : props.line));

const emit = defineEmits<{ hexHover: [on: boolean] }>();

const hex = ref<HTMLElement | null>(null);
defineExpose({ hex });

const namedBox = ref<HTMLElement | null>(null);
const namedText = ref<HTMLElement | null>(null);
const STEPS: FitSteps = [
  ['var(--size-mono-s)', 'var(--track-mono)'],
  ['var(--size-mono-s)', 'var(--track-mono-tight)'],
  ['0.625rem', 'var(--track-mono-tight)'],
  ['0.5625rem', 'var(--track-mono-tight)'],
];
const shown = useHeldReadout(
  () => props.named,
  STEPS,
  () => [[namedBox.value, namedText.value]],
);

const categoryEl = ref<HTMLElement | null>(null);
const modesEl = ref<HTMLElement | null>(null);

function fitLines(): void {
  for (const el of [categoryEl.value, modesEl.value]) if (el) fitLine(el, el, STEPS);
}

onMounted(fitLines);
watch(size, fitLines, { flush: 'post' });

const spoken = computed(() => {
  const [min, max] = game.players.split('\u2013');
  return t('home.hero.railSpoken', {
    category: t('home.hero.category'),
    modes: t('home.hero.modes'),
    players: t('home.hero.playersSpoken', { min, max: max ?? min }),
  });
});

const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
let unwatchPop: (() => void) | null = null;

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
  const el = hex.value;
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

/* The dip bottoms out 1px above the foot, where the bed's cut meets it. */
const cradlePath = computed(() => {
  const w = cradleWidth.value;
  const mid = HERO.rail / 2;
  const foot = HERO.rail - 1;
  return `M-1 ${mid} L0 ${mid} L${DIP} ${foot} L${w - DIP} ${foot} L${w} ${mid} L${w + 1} ${mid}`;
});
const bedStart = computed(() => {
  const h = HERO.rail / 2 + 1;
  return `-1,0 0,0 ${h},${h} -1,${h}`;
});
const bedCut = computed(() => {
  const w = cradleWidth.value;
  const h = HERO.rail / 2 + 1;
  return `${w - DIP},${h} ${w},0 ${w + 1},0 ${w + 1},${h}`;
});
</script>

<template>
  <div
    class="c-home-rail"
    :class="{ 'is-away': away }"
    :style="{ '--rail-h': `${HERO.rail}px`, '--plate-pad': `${PLATE.pad}px`, '--plate-gap': `${PLATE.gap}px` }"
    :aria-hidden="quiet || undefined"
  >
    <span class="c-home-rail__spoken">{{ spoken }}</span>
    <div class="c-home-rail__base" aria-hidden="true" />
    <div class="c-home-rail__bed" aria-hidden="true">
      <span class="c-home-rail__fill" />
      <svg class="c-home-rail__cut" :width="cradleWidth" :height="HERO.rail / 2 + 1">
        <polygon :points="bedStart" />
        <polygon :points="bedCut" />
      </svg>
      <span class="c-home-rail__fill" />
    </div>

    <div class="c-home-rail__line">
      <div class="c-home-rail__track">
        <span class="c-home-rail__glow" aria-hidden="true" />
      </div>

      <div class="c-home-rail__cradle" :style="{ width: `${cradleWidth}px` }">
        <svg class="c-home-rail__dip" aria-hidden="true" width="100%" :height="HERO.rail">
          <path :d="cradlePath" />
        </svg>
        <div
          ref="hex"
          class="c-home-rail__hex"
          :style="{ width: `${hexWidth}px` }"
          @mouseenter="emit('hexHover', true)"
          @mouseleave="emit('hexHover', false)"
        >
          <MonoLabel class="c-home-rail__swap" aria-hidden="true">
            <span ref="categoryEl" class="c-home-rail__say" :class="{ 'is-on': shownLine === 'category' }">
              {{ t('home.hero.category') }}
            </span>
            <span ref="modesEl" class="c-home-rail__say c-home-rail__say--lit" :class="{ 'is-on': shownLine === 'modes' }">
              {{ modesLine }}
              <CardGlyph name="player" />
            </span>
            <span class="c-home-rail__say c-home-rail__say--cue" :class="{ 'is-on': shownLine === 'cue' }">
              {{ t('home.hero.readout.cue') }}
            </span>
            <span
              ref="namedBox"
              class="c-home-rail__say c-home-rail__say--named"
              :class="{ 'is-on': shownLine === 'named' }"
            >
              <span ref="namedText" class="c-home-rail__chain">
                <span>{{ shown?.character }}</span>
                <span class="c-home-rail__sep">/</span>
                <span class="c-home-rail__faction" :style="{ '--faction-text': shown?.tone }">{{ shown?.faction }}</span>
              </span>
            </span>
          </MonoLabel>
        </div>
        <MonoLabel
          as="div"
          class="c-home-rail__cue"
          :class="{ 'is-on': cueBeside }"
          aria-hidden="true"
        >
          {{ t('home.hero.readout.cue') }}
        </MonoLabel>
      </div>

      <div class="c-home-rail__track c-home-rail__track--end">
        <span class="c-home-rail__glow" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<style>
.c-home-rail {
  --rail-bed: #161620;
  --rail-lit: rgba(var(--rgb-accent), 0.7);
  --rail-hex-edge: rgba(var(--rgb-accent), 0.55);
  /* The hex and cue plates, inside --rail-h. */
  --hex-top: 4px;
  --hex-h: 24px;
  /* Each side of a line: keeps it clear of the hex's cut ends. */
  --say-inset: 20px;
  position: absolute;
  inset: auto 0 0;
  height: var(--rail-h);
  pointer-events: none;
  transition:
    opacity var(--dur-3) var(--ease-out),
    visibility var(--dur-3) var(--ease-linear);
}

.c-home-rail.is-away {
  opacity: 0;
  visibility: hidden;
}

.c-home-rail__base {
  position: absolute;
  inset: auto 0 -3px;
  height: 4px;
  background: var(--rail-bed);
}

.c-home-rail__bed {
  position: absolute;
  inset: auto 0 0;
  height: calc(var(--rail-h) / 2);
  display: flex;
}

.c-home-rail__fill {
  flex: 1 1 0;
  background: var(--rail-bed);
}

.c-home-rail__cut {
  display: block;
  flex: none;
  overflow: visible;
  fill: var(--rail-bed);
}

.c-home-rail__line {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
}

.c-home-rail__track {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  height: var(--rail-h);
}

.c-home-rail__glow {
  position: absolute;
  inset: calc(var(--rail-h) / 2 - 1px) 0 auto;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--rail-lit) 40%, var(--rail-lit));
  box-shadow: 0 -6px 16px rgba(var(--rgb-accent), 0.4);
}

.c-home-rail__track--end .c-home-rail__glow {
  background: linear-gradient(270deg, transparent, var(--rail-lit) 40%, var(--rail-lit));
}

/* Above the end track: the cue plate reaches over it. */
.c-home-rail__cradle {
  position: relative;
  z-index: var(--z-raised);
  flex: none;
  height: var(--rail-h);
}

.c-home-rail__dip {
  position: absolute;
  inset: 0;
  overflow: visible;
  clip-path: inset(-12px -12px 0 -12px);
  filter: drop-shadow(0 0 6px rgba(var(--rgb-accent), 0.4));
  fill: none;
  stroke: var(--rail-lit);
  stroke-width: 2;
  stroke-linejoin: miter;
}

.c-home-rail__spoken {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0;
}

.c-home-rail__hex,
.c-home-rail__cue,
.c-home-rail__hex::before,
.c-home-rail__cue::before {
  /* 45° ends: half the plate's height. */
  --hex-cut: calc(var(--hex-h) / 2);

  clip-path: polygon(
    var(--hex-cut) 0,
    calc(100% - var(--hex-cut)) 0,
    100% 50%,
    calc(100% - var(--hex-cut)) 100%,
    var(--hex-cut) 100%,
    0 50%
  );
}

.c-home-rail__hex {
  position: absolute;
  left: 50%;
  top: var(--hex-top);
  height: var(--hex-h);
  /* `translate`, not transform: the pop animates `scale`, which must stay centred. */
  translate: -50% 0;
  background: var(--rail-hex-edge);
  pointer-events: auto;
}

.c-home-rail__hex::before,
.c-home-rail__cue::before {
  --hex-cut: calc(var(--hex-h) / 2 - 2px);

  content: '';
  position: absolute;
  /* A 2px bevel, measured square to the 45° cut. */
  inset: 2px calc(2px * 1.41421);
  background: var(--color-bg);
}

.c-home-rail__swap {
  position: relative;
  display: grid;
  height: var(--hex-h);
  margin: 0;
  overflow: hidden;
  line-height: var(--hex-h);
  text-indent: var(--track-mono);
  text-align: center;
  white-space: nowrap;
}

/* Clipped: fitLine reads each line's own overflow. */
.c-home-rail__say {
  grid-area: 1 / 1;
  justify-self: center;
  max-width: calc(100% - 2 * var(--say-inset));
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--color-ink-muted);
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity var(--dur-2) var(--ease-out),
    transform var(--dur-2) var(--ease-out);
}

.c-home-rail__say:first-child {
  transform: translateY(-8px);
}

.c-home-rail__say.is-on {
  opacity: 1;
  transform: none;
}

.c-home-rail__say--lit {
  font-weight: 500;
  color: var(--color-ink);
}

.c-home-rail__say--named {
  text-indent: 0;
}

.c-home-rail__chain {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 500;
  color: var(--color-ink);
}

.c-home-rail__sep {
  color: var(--color-ink-faint);
}

.c-home-rail__faction {
  color: var(--faction-text);
}

.c-home-rail__say--cue {
  font-weight: 500;
  color: var(--color-accent);
}

.c-home-rail__cue {
  position: absolute;
  left: calc(100% + var(--plate-gap));
  top: var(--hex-top);
  display: flex;
  align-items: center;
  height: var(--hex-h);
  padding: 0 var(--plate-pad);
  background: var(--rail-hex-edge);
  font-weight: 500;
  line-height: 14px;
  white-space: nowrap;
  color: var(--color-accent);
  opacity: 0;
  transform: translateX(-8px);
  transition:
    opacity var(--dur-2) var(--ease-out),
    transform var(--dur-2) var(--ease-out);
  isolation: isolate;
}

/* Keeps the fill under the plate's text. */
.c-home-rail__cue::before {
  z-index: -1;
}

.c-home-rail__cue.is-on {
  opacity: 1;
  transform: none;
}

/* Undoes base.css's reduced-motion cut for fades; slides stay off. Durations match each rule's own. */
@media (prefers-reduced-motion: reduce) {
  .c-home-rail {
    transition-duration: var(--dur-3) !important;
  }

  .c-home-rail__say,
  .c-home-rail__cue {
    transition-duration: var(--dur-2) !important;
    transform: none !important;
  }
}
</style>
