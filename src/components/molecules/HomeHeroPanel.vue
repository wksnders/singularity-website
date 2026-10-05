<script setup lang="ts">
/* The plate must stay sticky: it carries the hero's calls to action on side layouts. */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import CardGlyph from '@/components/atoms/CardGlyph.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import { t } from '@/content';
import { useHeldReadout, type FitSteps } from '@/composables/useHeldReadout';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { game } from '@/data/universe';
import { PANEL, type LidDest, type LidReadout } from '@/site/lidSplitScene';
import { plainClick } from '@/site/glide';
import { asset, outbound, to } from '@/site/links';
import { token, tokenPx } from '@/site/tokens';

const props = defineProps<{
  /** Px: the column; the plate reaches past it over the lid. */
  width: number;
  height: number;
  /** Px above the pin's foot where the panel stops travelling. */
  release: number;
  /** Px: the column width the srcset `sizes` follow. */
  sizedWidth: number;
  /** The tab hung under the foot. */
  tab: boolean;
  named: LidReadout | null;
  /** Every name the readout can show: sizes the foot for the longest. */
  cast: LidReadout[];
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
/** The plate's drawn bands and insets, in px at the reference column (PANEL.ref); `plate` is its whole width. */
const PLATE = { plate: 450, pocket: 180, slot: 37, foot: 115, footTop: 21, footW: 250, footWOpen: 310, textRight: 102, ctasMax: 360 };
/** The box wrap behind the plate, registered on the lid, in wrap px: crop edge to lid window, crop size, window width, lift above the plate. */
const WRAP = { toLid: 1732, w: 1780, h: 2996, lidW: 2360, lift: 80, widths: [890, 1280] };
/** Px: the lid's width when the column is PANEL.ref wide. */
const LID_AT_REF = 846;

const ps = computed(() => props.width / PANEL.ref);
/* Wrap px to page px: the wrap's lid window is drawn at the lid's own scale. */
const wrapScale = (column: number) => ((column / PANEL.ref) * LID_AT_REF) / WRAP.lidW;
const wrap = computed(() => {
  const k = wrapScale(props.width);
  return { left: props.width - WRAP.toLid * k, top: -WRAP.lift * ps.value, w: WRAP.w * k, h: WRAP.h * k };
});
const wrapSizes = computed(() => `${Math.round(WRAP.w * wrapScale(props.sizedWidth))}px`);
const wrapSrcset = (ext: string) => WRAP.widths.map((w) => `${asset(`/box-side/wrap-${w}.${ext}`)} ${w}w`).join(', ');
const tabSrcset = [1, 2].map((k) => `${asset(`/box-side/foot-tab-${PANEL.tab.w * k}.webp`)} ${PANEL.tab.w * k}w`).join(', ');
const tabSizes = computed(() => `${Math.round((PANEL.tab.w * props.sizedWidth) / PANEL.ref)}px`);
const band = (name: string) => `url(${asset(`/box-side/plate-${name}.webp`)})`;
const inset = computed(() => Math.max(20, 48 * ps.value));

const plate = ref<HTMLElement | null>(null);
const pocket = ref<HTMLElement | null>(null);
const names = ref<HTMLElement | null>(null);
/** The foot art without its socket, and the readout over the room it leaves: only where the longest name won't fit at --size-mono-xs. */
const footOpen = ref(false);
/** A mono glyph's advance, in em. */
const MONO_ADVANCE = 0.6;

/* Arithmetic, not a measurement of the names on show: the art must not switch as different names are hovered. */
function checkRoom(): void {
  const grid = names.value;
  if (!grid) return;
  const labelW = Math.max(0, ...[...grid.querySelectorAll<HTMLElement>('.c-home-panel__label')].map((l) => l.offsetWidth));
  const room = PLATE.footW * ps.value - labelW - (parseFloat(getComputedStyle(grid).columnGap) || 0);
  const advance = tokenPx('--size-mono-xs') * (MONO_ADVANCE + parseFloat(token('--track-mono-tight')));
  const longest = Math.max(0, ...props.cast.flatMap((r) => [r.character.length, r.faction.length]));
  footOpen.value = longest * advance > room;
}
const tag = ref<InstanceType<typeof MonoLabel> | null>(null);
const natural = ref(0);
const tagOff = ref(false);
const pocketH = ref(PLATE.pocket);
const plateH = computed(() => Math.max(props.height, natural.value));
let tagRoom = 0;
let observer: ResizeObserver | null = null;

/* Measure with the tag included, or hiding it flips the decision back. */
/* Phones held sideways: no pocket or upper slot, the title alone in the text band, and no Universe link. */
const short = useMediaQuery('(max-height: 26em)');

function fit(): void {
  const el = plate.value;
  const top = pocket.value;
  if (!el) return;
  if (!top) {
    const min = el.style.minHeight;
    el.style.minHeight = '0px';
    natural.value = el.offsetHeight;
    el.style.minHeight = min;
    checkRoom();
    return;
  }
  const tagEl = tag.value?.$el as HTMLElement | undefined;
  if (!tagOff.value && tagEl?.parentElement) {
    /* rowGap reads 'normal' without a gap; NaN here flips tagOff on every call. */
    tagRoom = tagEl.offsetHeight + (parseFloat(getComputedStyle(tagEl.parentElement).rowGap) || 0);
  }
  const most = PLATE.pocket * ps.value;
  const least = Math.min(most, tokenPx('--nav-height') + tokenPx('--space-2'));
  const min = el.style.minHeight;
  const was = top.style.height;
  el.style.minHeight = '0px';
  top.style.height = `${least}px`;
  const shown = el.offsetHeight;
  el.style.minHeight = min;
  top.style.height = was;
  const full = shown + (tagOff.value ? tagRoom : 0);
  tagOff.value = full > props.height;
  const rest = full - (tagOff.value ? tagRoom : 0);
  pocketH.value = Math.max(least, Math.min(most, least + props.height - rest));
  natural.value = rest - least + pocketH.value;
  checkRoom();
}

/* Low fetch priority: on a slow connection it lands after the panel, so it fades in rather than popping. */
const wrapImg = ref<HTMLImageElement | null>(null);
const wrapIn = ref(false);

onMounted(() => {
  observer = new ResizeObserver(fit);
  if (plate.value) observer.observe(plate.value);
  if (wrapImg.value?.complete && wrapImg.value.naturalWidth) wrapIn.value = true;
});

onBeforeUnmount(() => observer?.disconnect());

watch(() => [props.height, props.width, short.value], fit, { flush: 'post' });

const nameEl = ref<HTMLElement | null>(null);
const factionEl = ref<HTMLElement | null>(null);

const STEPS: FitSteps = [
  ['var(--size-mono-m)', 'var(--track-mono)'],
  ['var(--size-mono-m)', 'var(--track-mono-tight)'],
  ['var(--size-mono-s)', 'var(--track-mono-tight)'],
  ['var(--size-mono-xs)', 'var(--track-mono-tight)'],
  ['0.5625rem', 'var(--track-mono-tight)'],
  ['0.5rem', 'var(--track-mono-tight)'],
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

const px = (v: number) => `${v.toFixed(1)}px`;
</script>

<template>
  <div
    class="c-home-panel"
    :style="{
      width: px(PLATE.plate * ps),
      bottom: `${release}px`,
      '--ps': ps,
      '--slot': px(PLATE.slot * ps),
      '--foot': px(PLATE.foot * ps),
      '--foot-top': px(PLATE.footTop * ps),
      '--foot-w': px((footOpen ? PLATE.footWOpen : PLATE.footW) * ps),
      '--inset': px(inset),
      '--text-right': px(PLATE.textRight * ps),
      '--ctas-max': px(Math.min(PLATE.ctasMax * ps, PLATE.plate * ps - inset - 8)),
    }"
  >
    <div
      ref="plate"
      class="c-home-panel__plate"
      :class="{ 'is-tight': height < TIGHT_BELOW, 'is-short': short }"
      :style="{ minHeight: `${height}px`, top: `${Math.min(0, height - plateH)}px` }"
    >
      <picture>
        <source type="image/avif" :srcset="wrapSrcset('avif')" :sizes="wrapSizes" />
        <img
          ref="wrapImg"
          class="c-home-panel__wrap"
          :class="{ 'is-in': wrapIn }"
          fetchpriority="low"
          :src="asset('/box-side/wrap-890.webp')"
          :srcset="wrapSrcset('webp')"
          :sizes="wrapSizes"
          alt=""
          decoding="async"
          :style="{ left: px(wrap.left), top: px(wrap.top), width: px(wrap.w), height: px(wrap.h) }"
          @load="wrapIn = true"
        />
      </picture>

      <div v-if="!short" ref="pocket" class="c-home-panel__band" :style="{ height: px(pocketH), backgroundImage: band('top') }" aria-hidden="true" />

      <div class="c-home-panel__band c-home-panel__pitch" :style="{ backgroundImage: band('text') }">
        <MonoLabel ref="tag" tone="accent" class="c-home-panel__tag" :class="{ 'l-sr-only': tagOff || short }">
          <span>{{ t('home.hero.category') }}</span>
          <span class="c-home-panel__modes">
            {{ t('home.hero.modesLine', { modes: t('home.hero.modes'), players: game.players }) }}
            <CardGlyph name="player" />
            <span class="l-sr-only">{{ t('home.hero.playersIcon') }}</span>
          </span>
        </MonoLabel>
        <h2 class="c-home-panel__title">{{ t('home.hero.title') }}</h2>
        <p class="c-home-panel__body" :class="{ 'l-sr-only': short }">{{ t('home.hero.body') }}</p>
      </div>

      <div v-if="!short" class="c-home-panel__band c-home-panel__slot" :style="{ backgroundImage: band('slot-a') }" aria-hidden="true" />

      <div class="c-home-panel__band c-home-panel__act" :style="{ backgroundImage: band('ctas') }">
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
          v-if="!short"
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
      </div>

      <div class="c-home-panel__band c-home-panel__slot" :style="{ backgroundImage: band('slot-b') }" aria-hidden="true" />

      <div class="c-home-panel__band c-home-panel__base" :style="{ backgroundImage: band(footOpen ? 'foot-open' : 'foot') }">
        <div class="c-home-panel__foot" aria-hidden="true">
          <MonoLabel
            size="xs"
            class="c-home-panel__hint"
            :class="{ 'is-off': named, 'is-lit': hintLit }"
          >
            <span class="c-home-panel__dot" />{{ hint }}
          </MonoLabel>
          <!-- A no-break space until the first naming: an empty value has no line to size or align its row. -->
          <div ref="names" class="c-home-panel__names" :class="{ 'is-on': named }">
            <MonoLabel as="span" size="xs" class="c-home-panel__label">{{ t('home.hero.readout.character') }}</MonoLabel>
            <span ref="nameEl" class="c-home-panel__value">{{ shown?.character ?? ' ' }}</span>
            <MonoLabel as="span" size="xs" class="c-home-panel__label">{{ t('home.hero.readout.faction') }}</MonoLabel>
            <span ref="factionEl" class="c-home-panel__value c-home-panel__value--faction" :style="{ '--faction-text': shown?.tone }">
              {{ shown?.faction ?? ' ' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="tab && plateH <= height"
      class="c-home-panel__tab"
      :style="{
        top: `calc(100% - ${PANEL.tab.tuck}px)`,
        width: px(PANEL.tab.w * ps),
        height: px(PANEL.tab.h * ps),
        '--label-x': `${PANEL.tab.label.x}px`,
        '--label-top': `${PANEL.tab.label.top}px`,
        '--label-size': `${PANEL.tab.label.size}px`,
        '--label-track': `${PANEL.tab.label.track}px`,
      }"
      aria-hidden="true"
    >
      <img
        :src="asset(`/box-side/foot-tab-${PANEL.tab.w}.webp`)"
        :srcset="tabSrcset"
        :sizes="tabSizes"
        alt=""
        decoding="async"
        fetchpriority="low"
      />
      <span class="c-home-panel__tab-label">{{ t('home.hero.tabLabel') }}</span>
    </div>
  </div>
</template>

<style>
.c-home-panel {
  position: absolute;
  inset: 0 auto 0 0;
}

.c-home-panel__plate {
  position: sticky;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.c-home-panel__tab {
  position: absolute;
  left: 0;
  pointer-events: none;
}

.c-home-panel__tab img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
}

/* PANEL.tab.label places it on the baked art. */
.c-home-panel__tab-label {
  position: absolute;
  left: calc(var(--label-x) * var(--ps));
  top: calc(var(--label-top) * var(--ps));
  translate: -50% 0;
  font-family: var(--font-display);
  font-size: calc(var(--label-size) * var(--ps));
  font-weight: 700;
  line-height: 1;
  letter-spacing: calc(var(--label-track) * var(--ps));
  text-transform: uppercase;
  white-space: nowrap;
  color: rgba(0, 0, 0, 0.42);
  text-shadow: 0 calc(0.8px * var(--ps)) 0 rgba(255, 255, 255, 0.06);
}

.c-home-panel__wrap {
  position: absolute;
  max-width: none;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--dur-3) var(--ease-out);
}

.c-home-panel__wrap.is-in {
  opacity: 1;
}

.c-home-panel__band {
  position: relative;
  flex: none;
  background: no-repeat 0 0 / 100% 100%;
}

.c-home-panel__slot {
  height: var(--slot);
}

.c-home-panel__pitch,
.c-home-panel__act {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.c-home-panel__pitch {
  padding: calc(4px * var(--ps)) var(--text-right) calc(12px * var(--ps)) var(--inset);
}

.c-home-panel__act {
  align-items: flex-start;
  gap: max(8px, calc(12px * var(--ps)));
  padding: calc(21px * var(--ps)) var(--space-2) calc(14px * var(--ps)) var(--inset);
}

/* The art keeps its own height at the band's foot; larger text grows the band upward, filled by the art's top rows stretched. */
.c-home-panel__base {
  display: flow-root;
  min-height: var(--foot);
  padding: var(--foot-top) 0 calc(14px * var(--ps)) var(--inset);
  background-position: 0 100%;
  background-size: 100% var(--foot);
}

/* 4600%: the art's top 5 of 230 rows, plain metal. */
.c-home-panel__base::before {
  content: '';
  position: absolute;
  inset: 0 0 var(--foot);
  background: inherit;
  background-position: 0 0;
  background-size: 100% 4600%;
}

.c-home-panel__tag {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  font-size: clamp(var(--size-mono-s), 0.86vw, 0.875rem);
  line-height: 1.6;
}

.c-home-panel__modes {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.c-home-panel__title {
  margin: max(6px, calc(8px * var(--ps))) 0 0;
  font-size: clamp(1.25rem, 1.875vw, 2rem);
  line-height: 1.12;
  text-wrap: balance;
}

.c-home-panel__body {
  max-width: 34ch;
  margin-top: max(16px, calc(34px * var(--ps)));
  font-size: clamp(0.9375rem, 1.25vw, 1.1875rem);
  line-height: 1.5;
  text-wrap: pretty;
  color: var(--color-ink-muted);
}

.c-home-panel__ctas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px var(--space-5);
  max-width: var(--ctas-max);
}

/* Large text sizes: wraps inside the column rather than running past the plate. */
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
  position: relative;
  width: var(--foot-w);
  display: grid;
  min-height: 40px;
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
  text-overflow: ellipsis;
  font-family: var(--font-mono);
  font-size: var(--size-mono-m);
  font-weight: 600;
  line-height: 18px;
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  color: var(--color-ink);
}

.c-home-panel__value--faction {
  color: var(--faction-text);
}

.c-home-panel__plate.is-tight .c-home-panel__pitch {
  padding-block: 0;
}

.c-home-panel__plate.is-tight .c-home-panel__body {
  margin-top: max(8px, calc(16px * var(--ps)));
}

/* Without the pocket the text band starts at the plate's top, under the nav. */
.c-home-panel__plate.is-short .c-home-panel__pitch {
  padding-top: calc(var(--nav-height) + var(--space-2));
}

/* Undoes base.css's reduced-motion cut for fades and colour changes (slides stay off), at each rule's own duration. */
@media (prefers-reduced-motion: reduce) {
  .c-home-panel__universe,
  .c-home-panel__hint,
  .c-home-panel__names {
    transition-duration: var(--dur-2) !important;
  }

  .c-home-panel__wrap {
    transition-duration: var(--dur-3) !important;
  }

  .c-home-panel__names {
    transform: none !important;
  }
}
</style>
