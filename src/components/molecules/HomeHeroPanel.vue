<script setup lang="ts">
/* The plate must stay sticky: it carries the hero's calls to action on side layouts. */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import CardGlyph from '@/components/atoms/CardGlyph.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import { t } from '@/content';
import { useHeldReadout, type FitSteps } from '@/composables/useHeldReadout';
import { game } from '@/data/universe';
import { HERO, type LidDest, type LidReadout } from '@/site/lidSplitScene';
import { plainClick } from '@/site/glide';
import { outbound, to } from '@/site/links';

const props = defineProps<{
  width: number;
  height: number;
  named: LidReadout | null;
  hint: string;
  hintLit: boolean;
  universeLit: boolean;
  /** Off on touch, where a tap fires an emulated mouseenter and focus first. */
  hover: boolean;
}>();

const emit = defineEmits<{
  watch: [];
  dest: [dest: LidDest | null];
  universe: [on: boolean];
}>();

/** Px: a plate shorter than this takes the tight spacing. Its height, not the window's: a short lid squeezes it too. */
const TIGHT_BELOW = 700;
/** One tooth down the plate's right edge, in px: flat base, slope out, crown, slope in, flat gap. */
const TOOTH = { base: 10, slope: 6, crown: 16, gap: 6, depth: 12 };

const plate = ref<HTMLElement | null>(null);
const tag = ref<InstanceType<typeof MonoLabel> | null>(null);
const natural = ref(0);
const tagOff = ref(false);
const plateH = computed(() => Math.max(props.height, natural.value));
let tagRoom = 0;
let observer: ResizeObserver | null = null;

/* The tag line hides with l-sr-only, so screen readers keep it. Measure with the tag included, or hiding it flips the decision back. */
function fit(): void {
  const el = plate.value;
  if (!el) return;
  const tagEl = tag.value?.$el as HTMLElement | undefined;
  if (!tagOff.value && tagEl?.parentElement) {
    tagRoom = tagEl.offsetHeight + parseFloat(getComputedStyle(tagEl.parentElement).rowGap);
  }
  const min = el.style.minHeight;
  el.style.minHeight = '0px';
  const shown = el.offsetHeight;
  el.style.minHeight = min;
  const full = shown + (tagOff.value ? tagRoom : 0);
  tagOff.value = full > props.height;
  natural.value = full - (tagOff.value ? tagRoom : 0);
}

onMounted(() => {
  observer = new ResizeObserver(fit);
  if (plate.value) observer.observe(plate.value);
});

onBeforeUnmount(() => observer?.disconnect());

watch(() => props.height, fit, { flush: 'post' });

const clip = computed(() => {
  const { base, slope, crown, gap, depth } = TOOTH;
  const height = plateH.value;
  const period = base + slope + crown + slope + gap;
  const inner = `calc(100% - ${depth}px)`;
  const pts = ['0 0'];
  for (let y = 0; y < height; y += period) {
    pts.push(
      `${inner} ${y}px`,
      `${inner} ${y + base}px`,
      `100% ${y + base + slope}px`,
      `100% ${y + base + slope + crown}px`,
      `${inner} ${y + base + slope * 2 + crown}px`,
    );
  }
  pts.push(`${inner} ${height + period}px`, `0 ${height + period}px`);
  return `polygon(${pts.join(', ')})`;
});

const nameEl = ref<HTMLElement | null>(null);
const factionEl = ref<HTMLElement | null>(null);

const STEPS: FitSteps = [
  ['var(--size-s)', 'var(--track-mono)'],
  ['var(--size-s)', 'var(--track-mono-tight)'],
  ['var(--size-mono-m)', 'var(--track-mono-tight)'],
  ['var(--size-mono-s)', 'var(--track-mono-tight)'],
  ['var(--size-mono-xs)', 'var(--track-mono-tight)'],
];

const shown = useHeldReadout(
  () => props.named,
  STEPS,
  () => [
    [nameEl.value, nameEl.value],
    [factionEl.value, factionEl.value],
  ],
);

function dest(where: LidDest | null): void {
  if (props.hover || where === null) emit('dest', where);
}

function universe(on: boolean): void {
  if (props.hover || !on) emit('universe', on);
}
</script>

<template>
  <div class="c-home-panel" :style="{ width: `${width + HERO.panelOverhang}px` }">
    <div
      ref="plate"
      class="c-home-panel__plate"
      :class="{ 'is-tight': height < TIGHT_BELOW }"
      :style="{ minHeight: `${height}px`, top: `${Math.min(0, height - plateH)}px`, clipPath: clip }"
    >
      <span class="c-home-panel__fill" :style="{ clipPath: clip }" aria-hidden="true" />

      <div class="c-home-panel__pitch">
        <MonoLabel ref="tag" tone="accent" class="c-home-panel__tag" :class="{ 'l-sr-only': tagOff }">
          <span>{{ t('home.hero.category') }}</span>
          <span class="c-home-panel__modes">
            {{ t('home.hero.modesLine', { modes: t('home.hero.modes'), players: game.players }) }}
            <CardGlyph name="player" />
            <span class="l-sr-only">{{ t('home.hero.playersIcon') }}</span>
          </span>
        </MonoLabel>
        <h2 class="c-home-panel__title">{{ t('home.hero.title') }}</h2>
        <p class="c-home-panel__body">{{ t('home.hero.body') }}</p>
      </div>

      <div class="c-home-panel__ctas">
        <UiButton
          variant="primary"
          class="c-home-panel__watch"
          :to="to('home', {}, { hash: '#trailer' })"
          @click="plainClick($event) && emit('watch')"
          @mouseenter="dest('trailer')"
          @mouseleave="dest(null)"
          @focus="dest('trailer')"
          @blur="dest(null)"
        >
          <span class="c-home-panel__play" aria-hidden="true" />{{ t('home.hero.watch') }}
        </UiButton>
        <BaseLink
          :link="outbound('buy')"
          class="c-home-panel__buy"
          @mouseenter="dest('store')"
          @mouseleave="dest(null)"
          @focus="dest('store')"
          @blur="dest(null)"
        >
          {{ t('home.hero.buy') }} →
        </BaseLink>
      </div>

      <BaseLink
        :to="to('universe')"
        class="c-mono c-home-panel__universe"
        :class="{ 'is-lit': universeLit }"
        @mouseenter="universe(true)"
        @mouseleave="universe(false)"
        @focus="universe(true)"
        @blur="universe(false)"
      >
        {{ t('home.hero.universe') }} →
      </BaseLink>

      <div class="c-home-panel__foot" aria-hidden="true">
        <MonoLabel
          size="xs"
          tone="faint"
          class="c-home-panel__hint"
          :class="{ 'is-off': named, 'is-lit': hintLit }"
        >
          <span class="c-home-panel__dot" />{{ hint }}
        </MonoLabel>
        <!-- A no-break space until the first naming: an empty value has no line to size or align its row. -->
        <div class="c-home-panel__names" :class="{ 'is-on': named }">
          <MonoLabel as="span" size="xs" tone="faint" class="c-home-panel__label">{{ t('home.hero.readout.character') }}</MonoLabel>
          <span ref="nameEl" class="c-home-panel__value">{{ shown?.character ?? '\u00a0' }}</span>
          <MonoLabel as="span" size="xs" tone="faint" class="c-home-panel__label">{{ t('home.hero.readout.faction') }}</MonoLabel>
          <span ref="factionEl" class="c-home-panel__value c-home-panel__value--faction" :style="{ '--faction-text': shown?.tone }">
            {{ shown?.faction ?? '\u00a0' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.c-home-panel {
  position: absolute;
  inset: 0 auto 0 0;
}

/* The 2px of plate past the fill is a lit bevel. */
.c-home-panel__plate {
  position: sticky;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: safe center;
  gap: var(--space-7);
  padding: calc(var(--nav-height) + var(--space-8)) var(--space-9) var(--space-10) var(--space-10);
  background: rgba(var(--rgb-ink), 0.2);
}

.c-home-panel__fill {
  position: absolute;
  inset: 0 2px 0 0;
  z-index: -1;
  background: linear-gradient(90deg, #12121d 0%, #1a1a28 42%, #17171f 78%, #121219 100%);
}

.c-home-panel__pitch {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.c-home-panel__tag {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  line-height: 1.6;
}

.c-home-panel__modes {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.c-home-panel__title {
  margin: 0;
  font-size: clamp(1.375rem, 2.3vw, 2.125rem);
  line-height: 1.12;
  text-wrap: balance;
}

.c-home-panel__body {
  max-width: 34ch;
  font-size: clamp(1rem, 1.15vw, 1.125rem);
  line-height: 1.5;
  color: var(--color-ink-muted);
}

.c-home-panel__ctas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-5);
}

/* Large text sizes: wraps inside the column rather than running under the teeth. */
.c-btn.c-home-panel__watch {
  max-width: 100%;
  white-space: normal;
  text-align: center;
}

.c-home-panel__play {
  width: 0;
  height: 0;
  margin-right: var(--space-2);
  border-left: 9px solid currentColor;
  border-top: 5.5px solid transparent;
  border-bottom: 5.5px solid transparent;
}

.c-home-panel__buy {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: var(--size-body-l);
  font-weight: 700;
  white-space: nowrap;
  color: var(--color-accent-text);
}

.c-home-panel__buy:hover {
  color: var(--color-ink-bright);
  text-decoration: none;
}

.c-home-panel__universe {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  min-height: 44px;
  white-space: nowrap;
  color: var(--color-ink-soft);
  transition:
    color var(--dur-2) var(--ease-linear),
    text-shadow var(--dur-2) var(--ease-linear);
}

.c-home-panel__universe.is-lit,
.c-home-panel__universe:hover {
  color: var(--color-ink-bright);
  text-decoration: none;
  text-shadow: 0 0 14px rgba(var(--rgb-accent), 0.8);
}

.c-home-panel__foot {
  display: grid;
  min-height: 40px;
  margin: auto 0 calc(var(--space-4) * -1);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-line-strong);
}

.c-home-panel__hint {
  grid-area: 1 / 1;
  align-self: center;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-weight: 500;
  transition:
    opacity var(--dur-2) var(--ease-out),
    color var(--dur-2) var(--ease-linear);
}

.c-home-panel__hint.is-off {
  opacity: 0;
}

.c-home-panel__hint.is-lit {
  color: var(--color-accent);
}

.c-home-panel__dot {
  flex: none;
  width: 6px;
  height: 6px;
  border: 1px solid currentColor;
  border-radius: var(--radius-pill);
}

.c-home-panel__hint.is-lit .c-home-panel__dot {
  background: currentColor;
}

.c-home-panel__names {
  grid-area: 1 / 1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-1) var(--space-4);
  align-items: baseline;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity var(--dur-2) var(--ease-out),
    transform var(--dur-2) var(--ease-out);
}

.c-home-panel__names.is-on {
  opacity: 1;
  transform: none;
}

.c-home-panel__label {
  font-weight: 500;
}

.c-home-panel__value {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: var(--size-s);
  font-weight: 600;
  line-height: 18px;
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  color: var(--color-ink);
}

.c-home-panel__value--faction {
  color: var(--faction-text);
}

.c-home-panel__plate.is-tight {
  gap: var(--space-4);
  padding: calc(var(--nav-height) + var(--space-1)) var(--space-9) var(--space-6) var(--space-10);
}

/* Undoes base.css's reduced-motion cut for fades and colour changes; slides stay off. Durations match each rule's own. */
@media (prefers-reduced-motion: reduce) {
  .c-home-panel__universe,
  .c-home-panel__hint,
  .c-home-panel__names {
    transition-duration: var(--dur-2) !important;
  }

  .c-home-panel__names {
    transform: none !important;
  }
}
</style>
