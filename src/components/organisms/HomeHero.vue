<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import BaseLink from '@/components/atoms/BaseLink.vue';
import CardGlyph from '@/components/atoms/CardGlyph.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import UiButton from '@/components/atoms/UiButton.vue';
import HomeHeroPanel from '@/components/molecules/HomeHeroPanel.vue';
import HomeHeroRail from '@/components/molecules/HomeHeroRail.vue';
import SiteLockup from '@/components/molecules/SiteLockup.vue';
import { useLidSplitScene } from '@/composables/useLidSplitScene';
import { echoNav, releaseHomeHero, reportHomeHero } from '@/composables/useChrome';
import { FINE_HOVER, useMediaQuery, viewHeight } from '@/composables/useMediaQuery';
import { useSeekCatch } from '@/composables/useSeekCatch';
import { t } from '@/content';
import { LID, MARK, lidStrips } from '@/data/lidArt';
import { buyStoreName, characterById, factionById } from '@/data/universe';
import { currentLocale } from '@/i18n/locales';
import { jumpTo, plainClick, registerHold } from '@/site/glide';
import { HERO, SEAM, SPLIT } from '@/site/lidSplitScene';
import type { LidDest, LidReadout } from '@/site/lidSplitScene';
import { asset, outbound, pictureSources, to } from '@/site/links';
import { patternUrl } from '@/site/patterns';
import { token, tokenPx } from '@/site/tokens';

const emit = defineEmits<{ watch: [] }>();

/* Viewport, not lid width: the side column narrows the lid. */
const SIDE_MIN = 760;
const COLUMN = { share: 0.3, min: 320, max: 440 };
/** Px: the premise words shrink from their CSS size by `step` until they fit, down to `min`. */
const WORD_FIT = { min: 10, step: 0.5 };
/** Px of page scroll that hides the scroll cue. */
const CUE_GONE_AT = 10;
/** Share of the lid's width. */
const MARK_NARROW = 0.94;
/** Px kept between a name tag and the header, the view's foot or the next tag. */
const TAG_AIR = 8;
/** Narrow screens: the arrow's centre as a share of the lid's width, between the premise strips; `edge` is px. */
const ARROW = { at: 0.35, edge: 8 };
/** Ms for a packet to cross the trace when the Universe link is hovered. */
const PACKET_MS = 420;
/** Px: the trace's thickness, and how far it starts left of the words. */
const TRACE = 2;

const strips = lidStrips.map((strip) => {
  const faction = factionById(strip.factionId);
  const character = characterById(strip.characterId);
  const panel = `/box-core/panel-${strip.factionId}-960.webp`;
  const figure = `/box-core/char-${strip.characterId}-960.webp`;
  return {
    ...strip,
    panelSrc: asset(panel),
    panelSources: pictureSources(panel),
    figureSrc: asset(figure),
    figureSources: pictureSources(figure),
    pattern: patternUrl(`${strip.factionId}-texture`),
    tone: faction?.colorText ?? null,
    readout: {
      character: character?.name ?? '',
      faction: faction?.name ?? '',
      tone: faction?.colorText ?? '',
    } satisfies LidReadout,
  };
});
const cast = strips.map((s) => s.readout);

const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
/* Same query as the strip hover rule in the styles below. */
const hover = useMediaQuery(FINE_HOVER);

const vw = ref(window.innerWidth);
const vh = ref(viewHeight());
/* The body's width, not innerWidth or the root's clientWidth: both include the scrollbar gutter base.css reserves. */
const pageW = ref(document.body.clientWidth);

function readViewport(): void {
  vw.value = window.innerWidth;
  vh.value = viewHeight();
  pageW.value = document.body.clientWidth;
}

const side = computed(() => vw.value >= SIDE_MIN);
const colW = computed(() =>
  side.value ? Math.max(COLUMN.min, Math.min(COLUMN.max, Math.round(pageW.value * COLUMN.share))) : 0,
);
const boxW = computed(() => pageW.value - colW.value);
const boxH = computed(() => Math.round((boxW.value * LID.h) / LID.w));
const bandH = ref(0);
const view = computed(() => Math.max(1, vh.value - bandH.value));
const visH = computed(() => Math.min(boxH.value, view.value));
/** Scroll spent holding the box still. */
const hold = computed(() => (reduced.value ? 0 : Math.round(visH.value * split.pinLen.value)));
const runwayH = computed(() => (reduced.value ? undefined : `${boxH.value + bandH.value + hold.value}px`));
const pinTop = computed(() => Math.min(0, view.value - boxH.value));
/* Not when the lid overflows the screen: docking there changes nothing on screen but still throws browser scrolls short. */
const docked = computed(() => hold.value > 0 && pinTop.value === 0);
const dockTop = computed(() => pinTop.value + boxH.value + bandH.value);
const markW = computed(() => Math.round(boxW.value * (side.value ? 1 : MARK_NARROW)));
const markTop = computed(() =>
  Math.round(boxH.value * MARK.footOnLid - markW.value * MARK.aspect * MARK.footInMark),
);
const sideH = computed(() => Math.min(vh.value, boxH.value));
const stripPx = computed(() => Math.round(boxW.value / strips.length));
const figurePx = (box: [number, number, number, number]) => Math.round((box[2] - box[0]) * boxW.value);

const runway = ref<HTMLElement | null>(null);
const below = ref<HTMLElement | null>(null);
const box = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const zonesSvg = ref<SVGSVGElement | null>(null);
const wiresSvg = ref<SVGSVGElement | null>(null);
const busesSvg = ref<SVGSVGElement | null>(null);
const sidePanel = ref<ComponentPublicInstance | null>(null);
const tagButton = ref<HTMLElement | null>(null);
const packet = ref<HTMLElement | null>(null);
const mark = ref<HTMLElement | null>(null);
const railRef = ref<InstanceType<typeof HomeHeroRail> | null>(null);
const trace = ref<HTMLElement | null>(null);
const band = ref<HTMLElement | null>(null);
const arrow = ref<ComponentPublicInstance | null>(null);
/* Shallow: the loop reads these every frame and must never trigger a render. */
const stripEls = shallowRef<HTMLElement[]>([]);
const artEls = shallowRef<HTMLElement[]>([]);
const figureEls = shallowRef<HTMLElement[]>([]);
const wordEls = shallowRef<HTMLElement[]>([]);

const keep = (list: HTMLElement[], i: number) => (el: Element | ComponentPublicInstance | null) => {
  const node = el && '$el' in el ? (el.$el as HTMLElement) : (el as HTMLElement | null);
  if (node) list[i] = node;
};

const split = useLidSplitScene(
  {
    runway,
    box,
    stage,
    mark,
    strips: stripEls,
    arts: artEls,
    figures: figureEls,
    circuit: { zones: zonesSvg, wires: wiresSvg, buses: busesSvg },
    hex: () => railRef.value?.hex ?? null,
    field: () => (sidePanel.value?.$el as HTMLElement | undefined) ?? null,
    tagButton: () => tagButton.value,
  },
  {
    reduced,
    hover,
    narrow: computed(() => !side.value),
    band: bandH,
    intro: computed(() => {
      if (!side.value || boxW.value >= pageW.value) return null;
      const k = pageW.value / boxW.value;
      return { k, ox: colW.value / (k - 1) };
    }),
    tones: strips.map((s) => s.tone ?? 'currentColor'),
    onFrame: () => {
      report();
      placeTags();
    },
  },
);

const revealHover = ref(false);
const hexHover = ref(false);
const dest = ref<LidDest | null>(null);

const named = computed<LidReadout | null>(() => {
  const i = split.hovered.value;
  return !revealHover.value && i >= 0 ? strips[i].readout : null;
});
const scrubNamed = computed<LidReadout | null>(() => {
  const i = split.scrubIndex.value;
  return i >= 0 ? strips[i].readout : null;
});
const railLine = computed(() => {
  if (!side.value && scrubNamed.value) return 'named';
  return split.scrubEnd.value || split.pastPin.value || hexHover.value ? 'modes' : 'category';
});
const hint = computed(() => {
  if (dest.value === 'trailer') return t('home.hero.readout.toTrailer');
  if (dest.value === 'store') return t('home.hero.readout.goesTo', { place: buyStoreName });
  if (revealHover.value) return t('home.hero.readout.goesTo', { place: t('home.hero.readout.cue') });
  return hover.value ? t('home.hero.readout.hint') : t('home.hero.readout.hintTap');
});

watch(revealHover, (on) => {
  /* The Universe section's key in site/ia.ts. */
  echoNav(on ? 'universe' : null);
  const run = packet.value;
  const line = trace.value;
  if (!on || reduced.value || !run || !line) return;
  run.animate(
    [
      { transform: `translateX(${-run.offsetWidth}px)`, opacity: 0 },
      { opacity: 1, offset: 0.12 },
      { opacity: 1, offset: 0.88 },
      { transform: `translateX(${line.offsetWidth}px)`, opacity: 0 },
    ],
    { duration: PACKET_MS, easing: token('--ease-in-out') },
  );
});

function reveal(on: boolean): void {
  revealHover.value = on && hover.value && split.settled.value;
}

function onHexHover(on: boolean): void {
  hexHover.value = on && hover.value && split.settled.value;
}

const tagsOn = ref(false);
/* With a mouse and the side panel, hovering names the cast. */
const tagsButton = computed(() => !(hover.value && side.value));
const tagEls: HTMLElement[] = [];

const artAltId = useId();
const artAlt = computed(() => {
  const names = strips.map((s) => t('home.hero.artCast', { ...s.readout }));
  const list = new Intl.ListFormat(currentLocale.value, { type: 'conjunction' }).format(names);
  return t('home.hero.artAlt', { count: strips.length, cast: list });
});
const tagSpots = ref<{ style: Record<string, string>; shown: boolean }[]>([]);

function toggleTags(): void {
  if (!split.settled.value || !split.tagsReady.value) return;
  tagsOn.value = !tagsOn.value;
  placeTags();
  /* Again once the slots have their widths: the cards are measured inside them. */
  nextTick(placeTags);
}

function placeTags(): void {
  const frame = box.value;
  if (!tagsOn.value || !frame) return;
  const hr = frame.getBoundingClientRect();
  const pw = hr.width / strips.length;
  const nav = tokenPx('--nav-height');
  const highest = Math.max(0, -hr.top) + nav + TAG_AIR;
  const lowest = Math.min(hr.height, vh.value - hr.top) - TAG_AIR;
  tagSpots.value = figureEls.value.map((fig, i) => {
    /* The figure spans its strip's `box` on the lid. */
    const [x0, y0, x1, y1] = lidStrips[i].box;
    const [fx, fy] = lidStrips[i].head;
    const f = fig.getBoundingClientRect();
    const tipX = f.left - hr.left + ((fx - x0) / (x1 - x0)) * f.width;
    const tipY = f.top - hr.top + ((fy - y0) / (y1 - y0)) * f.height;
    const tag = tagEls[i];
    const h = tag?.offsetHeight ?? 0;
    const cardW = (tag?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
    /* The strip's own rect, not its share: the split scales it. The side panel's teeth cover the first one's left edge. */
    const s = stripEls.value[i]?.getBoundingClientRect();
    const left = Math.max(0, s ? s.left - hr.left : i * pw) + (i === 0 && side.value ? HERO.panelOverhang : 0) + TAG_AIR / 2;
    const width = Math.min(hr.width, s ? s.right - hr.left : (i + 1) * pw) - TAG_AIR / 2 - left;
    const cardX = Math.max(0, Math.min(tipX - left - cardW / 2, width - cardW));
    return {
      style: {
        left: `${left.toFixed(1)}px`,
        top: `${(tipY - h).toFixed(1)}px`,
        width: `${width.toFixed(1)}px`,
        '--card-x': `${cardX.toFixed(1)}px`,
        '--tip-x': `${(tipX - left).toFixed(1)}px`,
      },
      /* A tag whose head is off screen or under the header points at nothing. */
      shown: tipY - h >= highest && tipY <= lowest,
    };
  });
}


watch(tagsButton, (shown) => {
  if (!shown) tagsOn.value = false;
});

function dropTags(event: PointerEvent): void {
  if (tagsOn.value && !tagButton.value?.contains(event.target as Node)) tagsOn.value = false;
}

watch(split.tagsReady, (ready) => {
  if (!ready) tagsOn.value = false;
});

const premise = (strip: (typeof strips)[number]) =>
  strip.premise === 'first' ? t('home.hero.premise.lead') : `${t('home.hero.premise.end')} →`;

function fitWords(): void {
  const lines = wordEls.value.map((a) => a.parentElement).filter((p): p is HTMLElement => !!p);
  if (!lines.length) return;
  lines.forEach((p) => p.style.removeProperty('font-size'));
  const css = getComputedStyle(lines[0]);
  const room = lines[0].clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
  const fits = () => wordEls.value.every((a) => a.offsetWidth <= room + 0.5);
  let size = parseFloat(css.fontSize);
  while (size > WORD_FIT.min && !fits()) {
    size -= WORD_FIT.step;
    lines.forEach((p) => (p.style.fontSize = `${size}px`));
  }
}

watch(split.settled, report);

function place(): void {
  bandH.value = band.value?.offsetHeight ?? 0;
  split.measure();
  placeTags();
  nextTick(placeTags);
  const frame = box.value;
  if (!frame) return;
  const btn = arrow.value?.$el as HTMLElement | undefined;
  if (btn) {
    const w = btn.offsetWidth;
    const W = frame.clientWidth;
    const cx = Math.min(W - ARROW.edge - w / 2, Math.max(ARROW.edge + w / 2, W * ARROW.at));
    btn.style.left = `${cx.toFixed(1)}px`;
    btn.style.top = `${(frame.clientHeight - SPLIT.premiseBottom - SPLIT.premiseLink / 2).toFixed(1)}px`;
  }
  const [first, second] = [wordEls.value[0], wordEls.value[wordEls.value.length - 1]];
  if (!side.value || !first?.isConnected || !second?.isConnected) return;
  fitWords();
  /* Layout offsets, not rects: the entrance scales and pans the lid. */
  const at = (word: HTMLElement) => {
    const line = word.parentElement as HTMLElement;
    return { right: line.offsetLeft + word.offsetLeft + word.offsetWidth, bottom: line.offsetTop + word.offsetTop + word.offsetHeight };
  };
  if (trace.value) {
    Object.assign(trace.value.style, {
      width: `${Math.max(0, at(second).right + TRACE).toFixed(1)}px`,
      top: `${(at(first).bottom - TRACE).toFixed(1)}px`,
    });
  }
}

const scrolledAway = ref(false);

/* Until settled, the camera has moved the mark, so its rect is ignored. */
function report(): void {
  const b = box.value;
  const m = split.settled.value ? mark.value?.getBoundingClientRect() : null;
  /* offsetHeight: the entrance scales the box from its top edge, so its rect's bottom runs long. */
  reportHomeHero(!b || b.getBoundingClientRect().top + b.offsetHeight <= 0, split.settled.value && (!m || m.bottom < 0));
  scrolledAway.value = window.scrollY > CUE_GONE_AT;
}

/** Scroll the hold still has to spend, measured from page scroll `y`. */
function holdLeft(y: number): number {
  const start = (runway.value?.getBoundingClientRect().top ?? 0) + window.scrollY - pinTop.value;
  return Math.max(0, start + hold.value - Math.max(y, start));
}

/* The browser scrolls to things in the docked page as if it moved with the scroll; while docked it doesn't, so its scrolls land short by the hold left. */
function revealBelow(event: FocusEvent): void {
  const target = event.target as HTMLElement;
  if (!docked.value || !target.matches(':focus-visible')) return;
  const left = holdLeft(window.scrollY);
  if (left > 0 && target.getBoundingClientRect().bottom > vh.value) {
    jumpTo(window.scrollY + left);
    const overshoot = target.getBoundingClientRect().bottom - vh.value;
    if (overshoot > 0) jumpTo(window.scrollY + overshoot);
  }
}

useSeekCatch({ docked, holdLeft, vh, pageW });

let resize: ResizeObserver | null = null;
let unregisterHold = () => {};

onMounted(async () => {
  window.addEventListener('resize', readViewport);
  window.addEventListener('pointerdown', dropTags, { passive: true });
  unregisterHold = registerHold((el) => (docked.value && below.value?.contains(el) ? holdLeft(window.scrollY) : 0));
  resize = new ResizeObserver(readViewport);
  resize.observe(document.documentElement);
  /* Before the tick: a cold hash load scrolls to its target on that tick, and needs the band's height. */
  bandH.value = band.value?.offsetHeight ?? 0;
  await nextTick();
  place();
  report();
  document.fonts?.ready.then(place);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', readViewport);
  window.removeEventListener('pointerdown', dropTags);
  unregisterHold();
  resize?.disconnect();
  releaseHomeHero();
});

watch([boxW, boxH, vh, side, bandH], async () => {
  await nextTick();
  place();
  report();
});
</script>

<template>
  <div class="c-home-hero" :style="{ '--hold': `${docked ? hold : 0}px` }">
    <div
      ref="runway"
      class="c-lid"
      :style="{
        height: runwayH,
        '--n': strips.length,
        '--premise-bottom': `${SPLIT.premiseBottom}px`,
        '--premise-link': `${SPLIT.premiseLink}px`,
        '--trace': `${TRACE}px`,
        '--tags-button': `${HERO.tagsButton}px`,
        '--lid-seam': `${side ? SEAM.wide : SEAM.narrow}px`,
        '--zone-overhang': `${SEAM.overhang}px`,
      }"
    >
      <div class="c-lid__pin" :style="{ top: `${pinTop}px` }">
        <div
          ref="box"
          class="c-lid__box"
          :class="{ 'is-arriving': !split.settled.value }"
          :style="{
            width: side ? `${boxW}px` : undefined,
            height: `${boxH}px`,
            marginLeft: `${colW}px`,
            '--overlap': `${SPLIT.overlapPct}%`,
          }"
        >
          <div ref="stage" class="c-lid__stage">
            <div class="c-lid__layer c-lid__board" aria-hidden="true">
              <div class="c-lid__grid" />
              <template v-for="(strip, i) in strips" :key="strip.factionId">
                <span
                  v-if="strip.pattern"
                  class="c-lid__zone"
                  :class="{ 'c-lid__zone--first': i === 0, 'c-lid__zone--last': i === strips.length - 1 }"
                  :style="{ '--i': i, '--faction-text': strip.tone ?? undefined }"
                >
                  <span
                    class="c-lid__detail"
                    :style="{
                      opacity: strip.detailOpacity ?? SPLIT.detailOpacity,
                      maskImage: `url(${strip.pattern})`,
                      WebkitMaskImage: `url(${strip.pattern})`,
                    }"
                  />
                </span>
              </template>
              <svg ref="zonesSvg" class="c-lid__svg" />
              <div
                v-if="side"
                ref="trace"
                class="c-lid__trace"
                :class="{ 'is-lit': revealHover }"
              >
                <span class="c-lid__pad" />
                <span ref="packet" class="c-lid__packet" />
              </div>
            </div>

            <div class="c-lid__layer" aria-hidden="true">
              <template v-for="(strip, i) in strips" :key="strip.factionId">
                <p v-if="side && strip.premise" class="c-lid__words" :style="{ '--i': i }">
                  <RouterLink
                    :ref="keep(wordEls, strip.premise === 'first' ? 0 : 1)"
                    :to="to('universe')"
                    class="c-lid__word"
                    :class="{ 'is-lit': revealHover }"
                    tabindex="-1"
                    @mouseenter="reveal(true)"
                    @mouseleave="reveal(false)"
                  >
                    {{ premise(strip) }}
                  </RouterLink>
                </p>
              </template>
            </div>

            <div class="c-lid__layer" role="img" :aria-labelledby="artAltId">
              <div
                v-for="(strip, i) in strips"
                :key="strip.factionId"
                :ref="keep(stripEls, i)"
                class="c-lid__strip"
                :style="{ '--i': i }"
              >
                <picture>
                  <source
                    v-for="source in strip.panelSources"
                    :key="source.type"
                    :type="source.type"
                    :srcset="source.srcset"
                    :sizes="`${stripPx}px`"
                  />
                  <img
                    :ref="keep(artEls, i)"
                    class="c-lid__art"
                    :src="strip.panelSrc"
                    alt=""
                    decoding="async"
                  />
                </picture>
              </div>
            </div>

            <svg ref="wiresSvg" class="c-lid__svg" aria-hidden="true" />
            <svg ref="busesSvg" class="c-lid__svg" aria-hidden="true" />

            <h1 ref="mark" class="c-lid__mark" :style="{ width: `${markW}px`, top: `${markTop}px` }">
              <SiteLockup :sizes="`${markW}px`" :signed="split.badgeIn.value" />
            </h1>

            <div class="c-lid__layer" aria-hidden="true">
              <div
                v-for="(strip, i) in strips"
                :key="strip.factionId"
                :ref="keep(figureEls, i)"
                class="c-lid__figure"
              >
                <picture>
                  <source
                    v-for="source in strip.figureSources"
                    :key="source.type"
                    :type="source.type"
                    :srcset="source.srcset"
                    :sizes="`${figurePx(strip.box)}px`"
                  />
                  <img :src="strip.figureSrc" alt="" decoding="async" />
                </picture>
              </div>
            </div>

            <HomeHeroRail
              ref="railRef"
              :line="railLine"
              :named="side ? null : scrubNamed"
              :cue="revealHover"
              :width="boxW"
              :cast="side ? null : cast"
              :away="side ? !split.settled.value : !split.badgeIn.value"
              :pop="side ? 'scroll' : split.badgeIn.value ? 'now' : 'wait'"
              :quiet="side"
              @hex-hover="onHexHover"
            />

            <RouterLink
              v-if="!side"
              ref="arrow"
              :to="to('universe')"
              class="c-lid__arrow"
              :class="{ 'is-on': split.open.value, 'is-lit': split.scrubEnd.value || reduced }"
            >
              <span>{{ t('home.hero.universe') }}</span>
            </RouterLink>
          </div>

          <div class="c-lid__layer" aria-hidden="true">
            <div
              v-for="(strip, i) in strips"
              :ref="keep(tagEls, i)"
              :key="strip.factionId"
              class="c-lid__tag"
              :class="{ 'is-on': tagsOn && tagSpots[i]?.shown }"
              :style="[tagSpots[i]?.style, { '--faction-text': strip.tone ?? undefined }]"
            >
              <div class="c-lid__tag-card">
                <p class="c-lid__tag-name">{{ strip.readout.character }}</p>
                <MonoLabel size="xs" class="c-lid__tag-faction">
                  {{ strip.readout.faction }}
                </MonoLabel>
              </div>
            </div>
          </div>
          <p :id="artAltId" hidden>{{ artAlt }}</p>
        </div>

        <div v-if="!side" ref="band" class="c-lid__band">
          <UiButton
            variant="primary"
            class="c-lid__watch"
            :to="to('home', {}, { hash: '#trailer' })"
            @click="plainClick($event) && emit('watch')"
          >
            <span class="c-lid__play" aria-hidden="true" />{{ t('home.hero.watch') }}
          </UiButton>
          <BaseLink :link="outbound('buy')" class="c-lid__buy">{{ t('home.hero.buy') }} →</BaseLink>
        </div>

        <HomeHeroPanel
          v-if="side"
          ref="sidePanel"
          :width="colW"
          :height="sideH"
          :named="named"
          :hint="hint"
          :hint-lit="revealHover || dest !== null"
          :universe-lit="revealHover"
          :hover="hover"
          @watch="emit('watch')"
          @dest="dest = $event"
          @universe="reveal"
        />

        <!-- After the side panel so Tab reaches its calls to action first. aria-disabled, not disabled: focus must survive the split. -->
        <button
          v-if="tagsButton"
          ref="tagButton"
          type="button"
          class="c-lid__tags"
          :style="{ left: `${side ? colW + HERO.panelOverhang + HERO.tagsGap : HERO.tagsGap}px` }"
          :aria-pressed="tagsOn"
          :aria-disabled="!split.tagsReady.value || undefined"
          :aria-label="t('home.hero.tagsLabel')"
          @click="toggleTags"
        >
          <span class="c-lid__tags-disc"><CardGlyph name="player" /></span>
        </button>
      </div>

      <p v-if="boxH + bandH > vh && !scrolledAway && split.badgeIn.value" class="c-lid__cue" aria-hidden="true">
        <span class="c-lid__chevron" />
      </p>
    </div>

    <div
      class="c-home-hero__below"
      ref="below"
      :class="{ 'is-docked': docked }"
      :style="{ top: `${dockTop}px` }"
      @focusin="revealBelow"
    >
      <slot />
    </div>
  </div>
</template>

<style>
/* Needs the hero's `::after` for room: sticky never moves into its parent's padding. */
.c-home-hero__below.is-docked {
  position: sticky;
  margin-top: calc(-1 * var(--hold));
}

.c-home-hero::after {
  content: '';
  display: block;
  height: var(--hold);
}

.c-lid {
  position: relative;
}

.c-lid__pin {
  position: sticky;
  z-index: var(--z-raised);
  background: var(--color-bg);
}

.c-lid__box {
  position: relative;
  overflow-x: clip;
  background: var(--color-bg);
}

.c-lid__box.is-arriving {
  pointer-events: none;
}

.c-lid__stage {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.c-lid__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.c-lid__layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.c-lid__board {
  background: radial-gradient(60% 55% at 50% 42%, rgba(var(--rgb-accent), 0.09), transparent 70%);
}

.c-lid__grid {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(90deg, rgba(var(--rgb-ink), 0.05) 0 1px, transparent 1px 32px),
    repeating-linear-gradient(0deg, rgba(var(--rgb-ink), 0.05) 0 1px, transparent 1px 32px);
  -webkit-mask-image: linear-gradient(to bottom, #000 50%, transparent 86%);
  mask-image: linear-gradient(to bottom, #000 50%, transparent 86%);
}

/* The outer two run past the screen's edges so their outer borders never show. */
.c-lid__zone {
  position: absolute;
  top: -12%;
  height: 124%;
  left: calc(var(--i) * 100% / var(--n) + var(--lid-seam) / 2);
  width: calc(100% / var(--n) - var(--lid-seam));
}

.c-lid__zone--first {
  left: calc(var(--zone-overhang) * -1);
  width: calc(100% / var(--n) - var(--lid-seam) / 2 + var(--zone-overhang));
}

.c-lid__zone--last {
  width: calc(100% / var(--n) - var(--lid-seam) / 2 + var(--zone-overhang));
}

.c-lid__detail {
  position: absolute;
  inset: 0;
  background: var(--faction-text);
  -webkit-mask-size: 260px auto;
  mask-size: 260px auto;
  -webkit-mask-repeat: repeat;
  mask-repeat: repeat;
}

.c-lid__trace {
  position: absolute;
  left: calc(-1 * var(--trace));
  top: 0;
  width: 0;
  height: var(--trace);
  background: rgba(var(--rgb-accent), 0.35);
  transition: background var(--dur-2) var(--ease-linear);
}

.c-lid__pad {
  --pad: 10px;

  position: absolute;
  right: calc(var(--pad) / -2);
  top: calc((var(--trace) - var(--pad)) / 2);
  width: var(--pad);
  height: var(--pad);
  border: 2px solid rgba(var(--rgb-accent), 0.6);
  border-radius: var(--radius-pill);
  background: var(--color-bg);
  transition: border-color var(--dur-2) var(--ease-linear);
}

.c-lid__trace.is-lit {
  background: var(--color-ink-bright);
}

.c-lid__packet {
  --packet: 6px;

  position: absolute;
  left: 0;
  top: calc((var(--trace) - var(--packet)) / 2);
  width: 64px;
  height: var(--packet);
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, transparent, var(--color-ink-bright) 60%, transparent);
  box-shadow: 0 0 12px rgba(var(--rgb-accent), 0.8);
  opacity: 0;
}

.c-lid__trace.is-lit .c-lid__pad {
  border-color: var(--color-ink-bright);
}

.c-lid__words {
  position: absolute;
  left: calc(var(--i) * 100% / var(--n));
  width: calc(100% / var(--n) + var(--overlap));
  bottom: var(--premise-bottom);
  padding: 0 var(--space-2);
  text-align: center;
  font-family: var(--font-display);
  /* The largest size fitWords may give them. */
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
  white-space: nowrap;
  text-shadow: 0 0 18px rgba(var(--rgb-accent), 0.35);
}

.c-lid__word {
  display: inline-flex;
  align-items: center;
  min-height: var(--premise-link);
  padding: 0 6px;
  pointer-events: auto;
  color: var(--color-accent-text);
  transition: color var(--dur-2) var(--ease-linear);
}

.c-lid__word:hover,
.c-lid__word.is-lit {
  color: var(--color-ink-bright);
  text-decoration: none;
}

.c-lid__strip {
  position: absolute;
  top: 0;
  left: calc(var(--i) * 100% / var(--n));
  width: calc(100% / var(--n) + var(--overlap));
  height: 100%;
  overflow: hidden;
  background: var(--color-surface);
  pointer-events: auto;
  will-change: transform;
  transition: filter var(--dur-2) var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .c-lid__strip:hover {
    filter: brightness(1.07);
  }
}

.c-lid__art {
  position: absolute;
  max-width: none;
  object-fit: fill;
  will-change: transform;
}

.c-lid__figure {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  will-change: transform;
  transition: filter var(--dur-2) var(--ease-linear);
}

/* Set by useLidSplitScene's scrub. */
.c-lid__figure.is-named {
  filter: drop-shadow(0 0 14px rgba(var(--rgb-accent), 0.45));
}

.c-lid__figure.is-dim {
  filter: brightness(0.55);
}

.c-lid__figure.is-dark {
  filter: brightness(0.4);
}

.c-lid__figure img {
  width: 100%;
  height: 100%;
  max-width: none;
}

.c-lid__mark {
  position: absolute;
  left: 50%;
  z-index: var(--z-raised);
  font-size: 0;
  line-height: 0;
  pointer-events: none;
  transform: translateX(-50%);
  will-change: transform;
}

.c-lid__arrow {
  position: absolute;
  left: 0;
  top: 0;
  isolation: isolate;
  display: grid;
  align-items: center;
  height: var(--premise-link);
  padding: 0 30px 0 22px;
  font-family: var(--font-display);
  font-size: var(--size-s);
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
  color: var(--color-accent);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translate(-50%, -50%);
  transition:
    opacity var(--dur-2) var(--ease-out),
    visibility var(--dur-2) var(--ease-linear);
}

.c-lid__arrow.is-on {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.c-lid__arrow:hover {
  text-decoration: none;
  color: var(--color-ink-bright);
}

.c-lid__arrow::before,
.c-lid__arrow::after {
  --tip: 20px;
  --notch: 12px;

  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(var(--rgb-accent), 0.7);
  clip-path: polygon(
    0 0,
    calc(100% - var(--tip)) 0,
    100% 50%,
    calc(100% - var(--tip)) 100%,
    0 100%,
    var(--notch) 50%
  );
  transition: background var(--dur-2) var(--ease-linear);
}

.c-lid__arrow::after {
  --tip: 18.8px;
  --notch: 11px;

  inset: 2px 2.5px;
  background: rgba(var(--rgb-bg), 0.94);
}

.c-lid__arrow.is-lit {
  color: var(--color-bg);
  filter: drop-shadow(0 0 14px rgba(var(--rgb-accent), 0.8));
}

.c-lid__arrow.is-lit::before {
  background: var(--color-ink-bright);
}

.c-lid__arrow.is-lit::after {
  background: var(--color-accent);
}

.c-lid__tag {
  position: absolute;
  padding-bottom: 4px;
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity var(--dur-2) var(--ease-linear),
    transform var(--dur-2) var(--ease-out);
}

.c-lid__tag.is-on {
  opacity: 1;
  transform: none;
}

.c-lid__tag::before {
  content: '';
  position: absolute;
  left: var(--tip-x);
  bottom: 0;
  width: 9px;
  height: 9px;
  margin-left: -4.5px;
  border-right: 1px solid rgba(var(--rgb-ink), 0.22);
  border-bottom: 1px solid rgba(var(--rgb-ink), 0.22);
  background: rgba(var(--rgb-bg), 0.84);
  transform: rotate(45deg);
}

.c-lid__tag-card {
  position: relative;
  width: max-content;
  max-width: 100%;
  margin-left: var(--card-x);
  padding: 5px 6px 6px;
  border: 1px solid rgba(var(--rgb-ink), 0.22);
  border-radius: 6px;
  background: rgba(var(--rgb-bg), 0.84);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  text-align: center;
}

.c-lid__tag-name {
  font-size: var(--size-mono-s);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-ink);
}

.c-lid__tag-card .c-lid__tag-faction {
  margin-top: 2px;
  color: var(--faction-text);
  line-height: 1.3;
}

.c-lid__tags {
  position: absolute;
  top: 0;
  display: grid;
  place-items: center;
  width: var(--tags-button);
  height: var(--tags-button);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity var(--dur-1) var(--ease-linear),
    transform var(--dur-2) var(--ease-out);
}

/* This rule and the next mirror .c-btn:disabled in UiButton.vue. */
.c-lid__tags[aria-disabled='true'] {
  cursor: not-allowed;
}

.c-lid__tags[aria-disabled='true'] .c-lid__tags-disc {
  border-color: var(--color-line);
  color: var(--color-ink-faint);
}

/* Round, to match the disc: base.css squares every focus ring. */
.c-lid__tags:focus-visible {
  border-radius: var(--radius-pill);
}

.c-lid__tags-disc {
  display: grid;
  place-items: center;
  width: calc(var(--tags-button) - 4px);
  height: calc(var(--tags-button) - 4px);
  border: 1px solid rgba(var(--rgb-ink), 0.25);
  border-radius: var(--radius-pill);
  background: rgba(var(--rgb-bg), 0.72);
  font-size: var(--size-h3);
  color: var(--color-ink);
  transition: background var(--dur-2) var(--ease-linear);
}

.c-lid__tags[aria-pressed='true'] .c-lid__tags-disc {
  background: rgba(var(--rgb-accent), 0.92);
  color: var(--color-bg);
}

.c-lid__band {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  max-width: var(--width-reading);
  margin: 0 auto;
  padding: var(--space-6) var(--gutter) var(--space-4);
}

.c-lid__watch {
  align-self: stretch;
  min-height: 52px;
}

.c-lid__play {
  width: 0;
  height: 0;
  margin-right: var(--space-2);
  border-left: 9px solid currentColor;
  border-top: 5.5px solid transparent;
  border-bottom: 5.5px solid transparent;
}

.c-lid__buy {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: var(--size-body-l);
  font-weight: 700;
  white-space: nowrap;
}

.c-lid__cue {
  position: fixed;
  left: 50%;
  bottom: 22px;
  z-index: var(--z-sticky);
  transform: translateX(-50%);
  pointer-events: none;
}

.c-lid__chevron {
  display: block;
  width: 12px;
  height: 12px;
  border-right: 2px solid rgba(var(--rgb-ink), 0.85);
  border-bottom: 2px solid rgba(var(--rgb-ink), 0.85);
  transform: rotate(45deg);
  filter: drop-shadow(0 1px 3px var(--color-bg)) drop-shadow(0 0 10px rgba(var(--rgb-bg), 0.9));
}

/* Undoes base.css's reduced-motion cut for fades and colour changes; slides stay off. Durations match each rule's own. HomeHeroRail and HomeHeroPanel do the same for theirs. */
@media (prefers-reduced-motion: reduce) {
  .c-lid__trace,
  .c-lid__pad,
  .c-lid__word,
  .c-lid__strip,
  .c-lid__tag,
  .c-lid__tags-disc {
    transition-duration: var(--dur-2) !important;
  }

  .c-lid__tags {
    transition-duration: var(--dur-1), var(--dur-2) !important;
  }

  .c-lid__tag {
    transform: none !important;
  }
}
</style>
