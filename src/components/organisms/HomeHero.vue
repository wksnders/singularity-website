<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import CardGlyph from '@/components/atoms/CardGlyph.vue';
import MonoLabel from '@/components/atoms/MonoLabel.vue';
import HomeHeroBand from '@/components/molecules/HomeHeroBand.vue';
import HomeHeroFoot from '@/components/molecules/HomeHeroFoot.vue';
import HomeHeroPanel from '@/components/molecules/HomeHeroPanel.vue';
import SiteLockup from '@/components/molecules/SiteLockup.vue';
import { useLidSplitScene } from '@/composables/useLidSplitScene';
import { echoNav, releaseHomeHero, reportHeroIntro, reportHomeHero } from '@/composables/useChrome';
import { FINE_HOVER, useMediaQuery, viewHeight } from '@/composables/useMediaQuery';
import { useSeekCatch } from '@/composables/useSeekCatch';
import { useViewport } from '@/composables/useViewport';
import { t } from '@/content';
import { LID, MARK, lidStrips } from '@/data/lidArt';
import { buyStoreName, characterById, factionById } from '@/data/universe';
import { currentLocale } from '@/i18n/locales';
import { jumpTo, registerHold } from '@/site/glide';
import { FOOT, HERO, PANEL, SEAM, SPLIT } from '@/site/lidSplitScene';
import type { LidDest, LidReadout } from '@/site/lidSplitScene';
import { sheenUrl } from '@/site/lidGloss';
import { asset, pictureSources, to } from '@/site/links';
import { layoutRect, pageScale, stageWidth } from '@/site/pageScale';
import { patternUrl } from '@/site/patterns';
import { token, tokenDesignPx } from '@/site/tokens';

const emit = defineEmits<{ watch: [] }>();

/* Viewport, not lid width (the side column narrows the lid), and in em so a larger browser text size needs a wider screen; a phone held sideways takes it too, so its Watch button pins in the panel. HomeView, HomeTrailerCast and HomeTrailerDial repeat it in their @media. */
const SIDE_QUERY = '(min-width: 47.5em), (orientation: landscape) and (min-width: 34em)';
const COLUMN = { share: 434 / 1280, min: 300, max: 440 };
/** Px: the premise words shrink from their CSS size by `step` until they fit, down to `min`. */
const WORD_FIT = { min: 10, step: 0.5 };
/** Share of the lid's width. */
const MARK_NARROW = 0.94;
/** Px kept between a name tag and the header, the view's foot or the next tag. */
const TAG_AIR = 8;
/** Narrow screens: the arrow's centre as a share of the lid's width, between the premise strips; `edge` is px. */
const ARROW = { at: 0.35, edge: 8 };
/** Share of the view the pinned lid keeps where the whole lid can't fit: short of it, the foot drops its cables, then the Watch/Buy pair stops pinning. */
const LID_MIN_SHARE = 0.6;
/** The frame round a hero narrower than its window, in the wrap art's px, which HomeHeroPanel's WRAP.lidW (repeated here) scales to the page: its rails' widths, the length their tiles repeat over, the dark gap between the two rails, how far a rail laps over the hero, and the corner tile's size with how far from its outer sides the rail's centre line bends; `barRim` is the px at FOOT.ref from the bar image's top to its metal. */
const FRAME = { lidW: 2360, rail: 72, teeth: 80, tile: 396, seam: 9, lap: 4, corner: 120, bend: 96, barRim: 14 };
const FRAME_EDGES = ['left', 'right'] as const;
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

const { vh: winH, svh: winSvh, pageW: winW, resizing } = useViewport();
/* The hero is drawn at the page scale, so it lays out for the window that scale leaves it. */
const vh = computed(() => winH.value / pageScale.value);
const svh = computed(() => winSvh.value / pageScale.value);
const fullW = computed(() => winW.value / pageScale.value);
/* The hero's own page: narrower than the window once stageWidth frames it, when it sits centred between rails. */
const pageW = computed(() => stageWidth(winW.value, winH.value) / pageScale.value);
const framed = computed(() => pageW.value < fullW.value);

const side = useMediaQuery(SIDE_QUERY);
/** Narrow screens: the Watch button isn't whole on screen yet, so the readout plate points down to it. */
const watchBelow = ref(false);
const colW = computed(() =>
  side.value ? Math.max(COLUMN.min, Math.min(COLUMN.max, Math.round(pageW.value * COLUMN.share))) : 0,
);
const boxW = computed(() => pageW.value - colW.value);
const panelOverhang = computed(() => Math.round((PANEL.overhang * colW.value) / PANEL.ref));
const boxH = computed(() => Math.round((boxW.value * LID.h) / LID.w));
const bandH = ref(0);
/* Until the band is measured, footFit guesses as if it had no height: the cable run must not mount (and start loading) on that guess. */
const measured = ref(false);
let footMeasured: () => void = () => undefined;
const footReady = new Promise<void>((resolve) => (footMeasured = resolve));
/** Px: the readout plate's height, which grows with the text. */
const plateH = ref(FOOT.plateH);
const footS = computed(() => boxW.value / FOOT.ref);
/* Only a pinned pair counts as holding the whole lid: an unpinned pair can't dock. */
const footFit = computed(() => {
  const full = Math.round(FOOT.height * footS.value);
  const bar = Math.round((FOOT.barTop + FOOT.barH) * footS.value);
  const options = [
    { foot: full, cables: true, pinned: true },
    { foot: bar, cables: false, pinned: true },
    { foot: bar, cables: false, pinned: false },
  ];
  /* From the small viewport, so the rung doesn't change (and the cables pop in) as a phone's browser bars hide. */
  const view = (o: (typeof options)[number]) => svh.value - o.foot - (o.pinned ? bandH.value : 0);
  return (
    options.find((o) => o.pinned && view(o) >= boxH.value) ??
    options.find((o) => view(o) >= svh.value * LID_MIN_SHARE) ??
    options[options.length - 1]
  );
});
const bandPinned = computed(() => footFit.value.pinned);
/** Px pinned under the lid: everything that sizes the pin, the hold or the dock reads this one value. */
const footH = computed(() => footFit.value.foot + (bandPinned.value ? bandH.value : 0));
/** Px of the lid's foot the painted foot covers. */
const lift = computed(() =>
  Math.round(Math.max(-FOOT.barTop * footS.value, -FOOT.plateMid * footS.value + plateH.value / 2)),
);
const premiseBottom = computed(() => SPLIT.premiseBottom + lift.value);
/** Px above the pin's foot where the side panel stops travelling. */
const panelRelease = computed(() =>
  Math.max(0, Math.round(footFit.value.foot - (FOOT.teeth + FOOT.panelRest) * footS.value)),
);
/** Px of the pin's foot kept on screen while it holds: on side layouts only down to the panel's foot, so the hold starts as the panel comes to rest. */
const pinFoot = computed(() => footH.value - (side.value ? panelRelease.value : 0));
/** Px the foot's art hangs below the pin; HomeView's trailer band pads for it. */
const overhang = computed(() => {
  if (!footFit.value.cables) return 0;
  const run = FOOT.runTop * footS.value + pageW.value * FOOT.runAspect - footH.value;
  const tab = side.value
    ? (PANEL.tab.drawn * colW.value) / PANEL.ref - PANEL.tab.tuck - panelRelease.value
    : 0;
  return Math.max(0, Math.ceil(Math.max(run, tab)));
});
const view = computed(() => Math.max(1, vh.value - pinFoot.value));
const visH = computed(() => Math.min(boxH.value, view.value));
/** Scroll spent holding the box still. */
const hold = computed(() => (reduced.value ? 0 : Math.round(visH.value * split.pinLen.value)));
const runwayH = computed(() => (reduced.value ? undefined : `${(boxH.value + footH.value + hold.value) * pageScale.value}px`));
const pinTop = computed(() => Math.min(0, view.value - boxH.value));
/* Docks only with the lid and the whole foot on screen and the pair pinned: an overflowing lid still throws browser scrolls short, an unpinned pair sits under the docked band, and a foot below the fold would dock the band off screen. */
const docked = computed(() => hold.value > 0 && vh.value - footH.value >= boxH.value && bandPinned.value);
const dockTop = computed(() => pinTop.value + boxH.value + footH.value);
/** Px below the runway where the frame's rails turn outward: the top of the slot's `data-frame-foot` element, 0 without one. */
const frameFoot = ref(0);
/* --frame-at is where the bar's metal covers the toothed rail: its tile starts in the middle of a gap, so that is where the teeth end; --hero-vw stands in for 1vw in HomeHeroPanel's type sizes. */
const frameStyle = computed(() => {
  if (!framed.value) return null;
  const k = ((colW.value / PANEL.ref) * FOOT.ref) / FRAME.lidW;
  const drawn = (wrap: number) => `${wrap * k * pageScale.value}px`;
  return {
    '--stage-w': `${pageW.value * pageScale.value}px`,
    '--hero-vw': `${(pageW.value * pageScale.value / 100).toFixed(3)}px`,
    '--frame-rail': drawn(FRAME.rail),
    '--frame-teeth': drawn(FRAME.teeth),
    '--frame-tile': drawn(FRAME.tile),
    '--frame-seam': drawn(FRAME.seam),
    '--frame-lap': drawn(FRAME.lap),
    '--frame-corner': drawn(FRAME.corner),
    '--frame-bend': drawn(FRAME.bend),
    '--frame-at': `${((boxH.value + (FOOT.barTop + FRAME.barRim) * footS.value) * pageScale.value).toFixed(1)}px`,
    '--frame-foot': `${(Math.max(overhang.value, frameFoot.value) * pageScale.value).toFixed(1)}px`,
    '--frame-rail-img': `url(${asset('/box-frame/frame-rail-v-72.webp')})`,
    '--frame-run-img': `url(${asset('/box-frame/frame-rail-h-396.webp')})`,
    '--frame-corner-img': `url(${asset('/box-frame/frame-corner-120.webp')})`,
    '--frame-teeth-img': `url(${asset('/box-frame/frame-teeth-v-80.webp')})`,
    '--frame-ground': `url(${patternUrl('common-texture')})`,
  };
});
const markW = computed(() => Math.round(boxW.value * (side.value ? 1 : MARK_NARROW)));
const markTop = computed(() =>
  Math.round(boxH.value * MARK.footOnLid - markW.value * MARK.aspect * MARK.footInMark),
);
/* Down to the panel's resting foot, not just the lid: on screens taller than the lid the plate must still reach the teeth. */
const sideH = computed(() => Math.min(vh.value, boxH.value + footFit.value.foot - panelRelease.value));
/* Srcset `sizes` only, so in window px, and it grows once a resize ends but never shrinks: WebKit re-picks a candidate on every sizes change, so tracking every px refetches and redecodes mid-drag. */
const drawnW = computed(() => boxW.value * pageScale.value);
const drawnColW = computed(() => colW.value * pageScale.value);
const sizedW = ref(drawnW.value);
const sizedColW = ref(drawnColW.value);
watch([drawnW, drawnColW, resizing], () => {
  /* A column that first appears mid-drag takes its width at once: sizes of 0px would fetch the smallest candidates first. */
  if (sizedColW.value === 0) sizedColW.value = drawnColW.value;
  if (resizing.value) return;
  if (drawnW.value > sizedW.value) sizedW.value = drawnW.value;
  if (drawnColW.value > sizedColW.value) sizedColW.value = drawnColW.value;
});
const stripPx = computed(() => Math.round(sizedW.value / strips.length));
const figurePx = (box: [number, number, number, number]) => Math.round((box[2] - box[0]) * sizedW.value);
const markPx = computed(() => Math.round(sizedW.value * (side.value ? 1 : MARK_NARROW)));

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
const footRef = ref<InstanceType<typeof HomeHeroFoot> | null>(null);
const trace = ref<HTMLElement | null>(null);
const band = ref<ComponentPublicInstance | null>(null);
const arrow = ref<ComponentPublicInstance | null>(null);
/* Shallow: the loop reads these every frame and must never trigger a render. */
const stripEls = shallowRef<HTMLElement[]>([]);
const artEls = shallowRef<HTMLElement[]>([]);
const figureEls = shallowRef<HTMLElement[]>([]);
const wordEls = shallowRef<HTMLElement[]>([]);
/* Plain arrays: only the loop reads them. */
const glossGlow: HTMLElement[] = [];
const glossBloom: HTMLElement[] = [];
const glossBand: HTMLElement[] = [];
/* Must match the rungs on the CDN. */
const GLOSS_WIDTHS: Record<string, number[]> = { glow: [480, 640, 960], bloom: [480] };
const glossSrc = (id: string, layer: string, w: number, ext = 'webp') => asset(`/box-gloss/gloss-${id}-${layer}-${w}.${ext}`);
const glossSrcset = (id: string, layer: string, ext = 'webp') =>
  GLOSS_WIDTHS[layer].map((w) => `${glossSrc(id, layer, w, ext)} ${w}w`).join(', ');

const keep = (list: HTMLElement[], i: number) => (el: Element | ComponentPublicInstance | null) => {
  const node = el && '$el' in el ? (el.$el as HTMLElement) : (el as HTMLElement | null);
  if (node) list[i] = node;
};

/* The wordmark's foot, not the canvas's: the badge below it fades out once the wordmark is off the top. */
const wordGone = ref(false);

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
    plate: () => footRef.value?.plate ?? null,
    foot: () => (footRef.value?.$el as HTMLElement | undefined) ?? null,
    /* Only the foot art on screen: below the fold it would hold the entrance back for nothing. */
    extraArt: async () => {
      await footReady;
      await nextTick();
      const bottom = viewHeight();
      return [...(footRef.value?.images?.querySelectorAll('img') ?? [])].filter((img) => {
        const r = img.getBoundingClientRect();
        return r.bottom > 0 && r.top < bottom;
      });
    },
    field: () => (sidePanel.value?.$el as HTMLElement | undefined) ?? null,
    tagButton: () => tagButton.value,
    gloss: () =>
      strips.map((_, i) => {
        const glow = glossGlow[i];
        const bloom = glossBloom[i];
        const band = glossBand[i];
        return glow?.isConnected && bloom?.isConnected ? { glow, bloom, band: band?.isConnected ? band : null } : null;
      }),
  },
  {
    reduced,
    hover,
    narrow: computed(() => !side.value),
    band: pinFoot,
    intro: computed(() => {
      if (!side.value || boxW.value >= pageW.value) return null;
      const k = pageW.value / boxW.value;
      return { k, ox: colW.value / (k - 1), left: colW.value };
    }),
    tones: strips.map((s) => s.tone ?? 'currentColor'),
    markGone: wordGone,
    resizing,
    lift,
    onFrame: () => {
      report();
      placeTags();
    },
  },
);

const revealHover = ref(false);
const plateHover = ref(false);
const dest = ref<LidDest | null>(null);

const named = computed<LidReadout | null>(() => {
  const i = split.hovered.value;
  return !revealHover.value && i >= 0 ? strips[i].readout : null;
});

const trayHue = computed(() => {
  const i = side.value ? (revealHover.value ? -1 : split.hovered.value) : split.scrubIndex.value;
  return i >= 0 ? strips[i].trayHue : null;
});
const scrubNamed = computed<LidReadout | null>(() => {
  const i = split.scrubIndex.value;
  return i >= 0 ? strips[i].readout : null;
});
const railLine = computed(() => {
  if (!side.value && scrubNamed.value) return 'named';
  if (!side.value && watchBelow.value) return 'scroll';
  return split.scrubEnd.value || split.pastPin.value || plateHover.value ? 'modes' : 'category';
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

function onPlateHover(on: boolean): void {
  plateHover.value = on && hover.value && split.settled.value;
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
let spotsKey = '';
const tagsOverMark = ref(false);
const markDim = computed(() => tagsOn.value && !side.value && tagsOverMark.value);

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
  const hr = layoutRect(frame);
  const pw = hr.width / strips.length;
  const nav = tokenDesignPx('--nav-height');
  const highest = Math.max(0, -hr.top) + nav + TAG_AIR;
  const lowest = Math.min(hr.height, vh.value - hr.top) - TAG_AIR;
  const m = mark.value ? layoutRect(mark.value) : null;
  let overMark = false;
  const spots = figureEls.value.map((fig, i) => {

    const [x0, y0, x1, y1] = lidStrips[i].box;
    const [fx, fy] = lidStrips[i].head;
    const f = layoutRect(fig);
    const tipX = f.left - hr.left + ((fx - x0) / (x1 - x0)) * f.width;
    const tipY = f.top - hr.top + ((fy - y0) / (y1 - y0)) * f.height;
    const tag = tagEls[i];
    const h = (tag?.offsetHeight ?? 0) / pageScale.value;
    const cardW = ((tag?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0) / pageScale.value;
    /* The strip's own rect, not its share: the split scales it. The side panel's teeth cover the first one's left edge. */
    const strip = stripEls.value[i];
    const s = strip ? layoutRect(strip) : null;
    const left = Math.max(0, s ? s.left - hr.left : i * pw) + (i === 0 && side.value ? panelOverhang.value : 0) + TAG_AIR / 2;
    const width = Math.min(hr.width, s ? s.right - hr.left : (i + 1) * pw) - TAG_AIR / 2 - left;
    const cardX = Math.max(0, Math.min(tipX - left - cardW / 2, width - cardW));
    const shown = tipY - h >= highest && tipY <= lowest;
    if (shown && m) {
      const x = hr.left + left + cardX;
      const y = hr.top + tipY;
      overMark ||= x < m.right && x + cardW > m.left && y > m.top && y - h < m.top + m.height * MARK.wordFoot;
    }
    return {
      style: {
        left: `${(left * pageScale.value).toFixed(1)}px`,
        top: `${((tipY - h) * pageScale.value).toFixed(1)}px`,
        width: `${(width * pageScale.value).toFixed(1)}px`,
        '--card-x': `${(cardX * pageScale.value).toFixed(1)}px`,
        '--tip-x': `${((tipX - left) * pageScale.value).toFixed(1)}px`,
      },
      /* A tag whose head is off screen or under the header points at nothing. */
      shown,
    };
  });
  /* Runs every animation frame while the tags are on: unchanged spots must not re-render the hero. */
  const key = JSON.stringify(spots);
  if (key !== spotsKey) {
    spotsKey = key;
    tagSpots.value = spots;
  }
  tagsOverMark.value = overMark;
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
  let size = parseFloat(css.fontSize) / pageScale.value;
  while (size > WORD_FIT.min && !fits()) {
    size -= WORD_FIT.step;
    lines.forEach((p) => (p.style.fontSize = `${size * pageScale.value}px`));
  }
}

watch(split.settled, report);

/* Rects over the page scale, not layoutRect, as the marked element may be zoomed; and only undocked, when neither end is sticky and the gap holds at any scroll. */
function placeFrame(): void {
  const mark = framed.value && !docked.value ? below.value?.querySelector('[data-frame-foot]') : null;
  const gap = mark && runway.value ? mark.getBoundingClientRect().top - runway.value.getBoundingClientRect().bottom : 0;
  frameFoot.value = Math.max(0, gap / pageScale.value);
}

function place(): void {
  bandH.value = ((band.value?.$el as HTMLElement | undefined)?.offsetHeight ?? 0) / pageScale.value;
  plateH.value = (footRef.value?.plate?.offsetHeight ?? 0) / pageScale.value || FOOT.plateH;
  split.measure();
  placeFrame();
  placeTags();
  nextTick(placeTags);
  const frame = box.value;
  if (!frame) return;
  const btn = arrow.value?.$el as HTMLElement | undefined;
  if (btn) {
    const w = btn.offsetWidth / pageScale.value;
    const W = frame.clientWidth / pageScale.value;
    const cx = Math.min(W - ARROW.edge - w / 2, Math.max(ARROW.edge + w / 2, W * ARROW.at));
    btn.style.left = `${(cx * pageScale.value).toFixed(1)}px`;
    const top = frame.clientHeight / pageScale.value - premiseBottom.value - SPLIT.premiseLink / 2;
    btn.style.top = `${(top * pageScale.value).toFixed(1)}px`;
  }
  const [first, second] = [wordEls.value[0], wordEls.value[wordEls.value.length - 1]];
  if (!side.value || !first?.isConnected || !second?.isConnected) return;
  fitWords();
  /* Layout offsets, not rects: the entrance scales and pans the lid. */
  const at = (word: HTMLElement) => {
    const line = word.parentElement as HTMLElement;
    const z = pageScale.value;
    return { right: (line.offsetLeft + word.offsetLeft + word.offsetWidth) / z, bottom: (line.offsetTop + word.offsetTop + word.offsetHeight) / z };
  };
  if (trace.value) {
    Object.assign(trace.value.style, {
      width: `${(Math.max(0, at(second).right + TRACE) * pageScale.value).toFixed(1)}px`,
      top: `${((at(first).bottom - TRACE) * pageScale.value).toFixed(1)}px`,
    });
  }
}


/* Until settled, the camera has moved the mark, so its rect is ignored. */
function report(): void {
  const b = box.value;
  const m = split.settled.value ? mark.value?.getBoundingClientRect() : null;
  wordGone.value = split.settled.value && (!m || m.top + m.height * MARK.wordFoot < 0);
  /* offsetHeight: the entrance scales the box from its top edge, so its rect's bottom runs long. */
  const gone = !b || layoutRect(b).top + b.offsetHeight / pageScale.value <= 0;
  /* Side layouts: the header's logo sits over the panel, which is still passing under it after the wordmark leaves, so it waits for the solid header. */
  reportHomeHero(gone, side.value ? gone : wordGone.value);
  const watch = side.value ? null : (band.value?.$el as HTMLElement | undefined)?.querySelector('.c-home-band__watch');
  watchBelow.value = !!watch && layoutRect(watch).bottom > vh.value + 0.5;
}

/* Takes and returns window px, as scroll positions are. */
function holdLeft(y: number): number {
  const z = pageScale.value;
  const start = (runway.value ? layoutRect(runway.value).top : 0) * z + window.scrollY - pinTop.value * z;
  return Math.max(0, start + hold.value * z - Math.max(y, start));
}

/* The browser scrolls to things in the docked page as if it moved with the scroll; while docked it doesn't, so its scrolls land short by the hold left. */
function revealBelow(event: FocusEvent): void {
  const target = event.target as HTMLElement;
  if (!docked.value || !target.matches(':focus-visible')) return;
  const left = holdLeft(window.scrollY);
  /* Client rects against the window's height, in window px as the scroll is: the target may sit under more zoom than the hero. */
  if (left > 0 && target.getBoundingClientRect().bottom > winH.value) {
    jumpTo(window.scrollY + left);
    const overshoot = target.getBoundingClientRect().bottom - winH.value;
    if (overshoot > 0) jumpTo(window.scrollY + overshoot);
  }
}

useSeekCatch({ docked, holdLeft, vh: winH, pageW: winW });
watch(split.entrance, reportHeroIntro);

let unregisterHold = () => {};
let belowWatch: ResizeObserver | null = null;

onMounted(async () => {
  /* The watch only sees changes: a skipped entrance stays null and must still release the nav. */
  reportHeroIntro(split.entrance.value);
  window.addEventListener('pointerdown', dropTags, { passive: true });
  unregisterHold = registerHold((el) => (docked.value && below.value?.contains(el) ? holdLeft(window.scrollY) : 0));
  /* Before the tick: a cold hash load scrolls to its target on that tick, and needs the band's height. */
  bandH.value = ((band.value?.$el as HTMLElement | undefined)?.offsetHeight ?? 0) / pageScale.value;
  measured.value = true;
  footMeasured();
  /* The slot's own layout moves the frame's foot without the hero resizing. */
  belowWatch = new ResizeObserver(placeFrame);
  if (below.value) belowWatch.observe(below.value);
  await nextTick();
  place();
  report();
  document.fonts?.ready.then(place);
});

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', dropTags);
  belowWatch?.disconnect();
  unregisterHold();
  releaseHomeHero();
});

/* A safety net: frames painted while the browser fell behind a drag may have missed the final size. */
watch(resizing, (on) => {
  if (!on) place();
});

watch([boxW, boxH, vh, side, footH], async () => {
  await nextTick();
  place();
  report();
});
</script>

<template>
  <div class="c-home-hero" :style="{ '--hold': `${(docked ? hold : 0) * pageScale}px`, '--hero-overhang': `${overhang * pageScale}px` }">
    <div
      ref="runway"
      class="c-lid"
      :style="{
        height: runwayH,
        '--n': strips.length,
        '--premise-bottom': `${premiseBottom * pageScale}px`,
        '--premise-link': `${SPLIT.premiseLink * pageScale}px`,
        '--trace': `${TRACE * pageScale}px`,
        '--tags-button': `${HERO.tagsButton * pageScale}px`,
        '--lid-seam': `${(side ? SEAM.wide : SEAM.narrow) * pageScale}px`,
        '--zone-overhang': `${SEAM.overhang * pageScale}px`,
      }"
    >
      <div class="c-lid__pin" :style="[{ top: `${pinTop * pageScale}px` }, frameStyle]">
        <div class="c-lid__frame">
          <div
            ref="box"
            class="c-lid__box"
            :class="{ 'is-arriving': !split.settled.value }"
            :style="{
              width: side ? `${boxW * pageScale}px` : undefined,
              height: `${boxH * pageScale}px`,
              marginLeft: `${colW * pageScale}px`,
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

              <h1 ref="mark" class="c-lid__mark" :class="{ 'is-dim': markDim }" :style="{ width: `${markW * pageScale}px`, top: `${markTop * pageScale}px` }">
                <SiteLockup :sizes="`${markPx}px`" :signed="split.badgeIn.value" :faded="wordGone" />
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
                  <div v-if="split.gloss.value" class="c-lid__gloss">
                    <img
                      :ref="keep(glossBloom, i)"
                      class="c-lid__gloss-layer"
                      :src="glossSrc(strip.characterId, 'bloom', GLOSS_WIDTHS.bloom[0])"
                      :srcset="glossSrcset(strip.characterId, 'bloom')"
                      :sizes="`${figurePx(strip.box)}px`"
                      alt=""
                      decoding="async"
                    />
                    <picture>
                      <source type="image/avif" :srcset="glossSrcset(strip.characterId, 'glow', 'avif')" :sizes="`${figurePx(strip.box)}px`" />
                      <img
                        :ref="keep(glossGlow, i)"
                        class="c-lid__gloss-layer"
                        :src="glossSrc(strip.characterId, 'glow', GLOSS_WIDTHS.glow[0])"
                        :srcset="glossSrcset(strip.characterId, 'glow')"
                        :sizes="`${figurePx(strip.box)}px`"
                        alt=""
                        decoding="async"
                      />
                    </picture>
                    <div
                      v-if="sheenUrl(strip.characterId)"
                      class="c-lid__gloss-sheen"
                      :style="{ '--sheen': `url(${sheenUrl(strip.characterId)})` }"
                    >
                      <div :ref="keep(glossBand, i)" class="c-lid__gloss-band" />
                    </div>
                  </div>
                </div>
              </div>

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

          <span v-if="framed && side" class="c-lid__teeth" :style="{ height: `${boxH * pageScale}px` }" aria-hidden="true" />

          <HomeHeroFoot
            ref="footRef"
            :line="railLine"
            :named="side ? null : scrubNamed"
            :cue="revealHover"
            :width="boxW"
            :left="colW"
            :height="footFit.foot"
            :sized-width="sizedW"
            :cables="footFit.cables && measured"
            :tray-hue="trayHue"
            :sized-page="sizedW + sizedColW"
            :cast="side ? null : cast"
            :away="side ? !split.settled.value : !split.badgeIn.value"
            :pop="side ? 'scroll' : split.badgeIn.value ? 'now' : 'wait'"
            :quiet="side"
            @plate-hover="onPlateHover"
          />

          <HomeHeroBand v-if="!side && bandPinned" ref="band" @watch="emit('watch')" />

          <HomeHeroPanel
            v-if="side"
            ref="sidePanel"
            :width="colW"
            :height="sideH"
            :release="panelRelease"
            :sized-width="sizedColW"
            :tab="footFit.cables && measured"
            :named="named"
            :cast="cast"
            :hint="hint"
            :hint-lit="revealHover || dest !== null"
            :universe-lit="revealHover"
            :hover="hover"
            @watch="emit('watch')"
            @dest="dest = $event"
            @universe="reveal"
          />

          <!-- After the side panel so Tab reaches its calls to action first; aria-disabled, not disabled, so focus survives the split. -->
          <button
            v-if="tagsButton"
            ref="tagButton"
            type="button"
            class="c-lid__tags"
            :style="{ left: `${(side ? colW + panelOverhang + HERO.tagsGap : HERO.tagsGap) * pageScale}px` }"
            :aria-pressed="tagsOn"
            :aria-disabled="!split.tagsReady.value || undefined"
            :aria-label="t('home.hero.tagsLabel')"
            @click="toggleTags"
          >
            <span class="c-lid__tags-disc"><CardGlyph name="player" /></span>
          </button>
        </div>

        <template v-if="framed">
          <span v-for="edge in FRAME_EDGES" :key="edge" class="c-lid__margin" :class="`c-lid__margin--${edge}`" aria-hidden="true">
            <span class="c-lid__ground" />
            <span class="c-lid__rail" />
          </span>
        </template>
      </div>
    </div>

    <HomeHeroBand v-if="!side && !bandPinned" ref="band" @watch="emit('watch')" />

    <div
      class="c-home-hero__below"
      ref="below"
      :class="{ 'is-docked': docked }"
      :style="{ top: `${dockTop * pageScale}px` }"
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
  /* Clip, not hidden (hidden makes a scroll container): a frame painted before the resize handlers catch up must not widen the page. */
  overflow-x: clip;
  z-index: var(--z-raised);
  background: var(--color-bg);
}

/* Clipped: the entrance slides the panel in from the left, which in a framed hero is over the margin. */
.c-lid__frame {
  position: relative;
  overflow-x: clip;
  width: var(--stage-w, auto);
  margin-inline: auto;
}

/* One set of rules draws both sides: the right margin is the left one mirrored. */
.c-lid__margin {
  position: absolute;
  isolation: isolate;
  top: 0;
  bottom: calc(-1 * var(--frame-foot));
  left: 0;
  width: calc(50% - var(--stage-w) / 2);
  pointer-events: none;
}

.c-lid__margin--right {
  right: 0;
  left: auto;
  scale: -1 1;
}

/* Ink-on-transparency art, as in TryItBand: the pattern is a mask and the tint is the background; clipped along the centre line of the rail, its corner and its level run, so none shows outside the bend. */
.c-lid__ground {
  position: absolute;
  inset: 0;
  background: var(--color-ink);
  opacity: 0.07;
  clip-path: polygon(
    0 0,
    calc(100% + var(--frame-lap) - var(--frame-rail) / 2) 0,
    calc(100% + var(--frame-lap) - var(--frame-rail) / 2) calc(100% - var(--frame-bend)),
    calc(100% + var(--frame-lap) - var(--frame-bend)) calc(100% - var(--frame-rail) / 2),
    0 calc(100% - var(--frame-rail) / 2)
  );
  mask-image: var(--frame-ground);
  mask-size: 24.375rem;
  -webkit-mask-image: var(--frame-ground);
  -webkit-mask-size: 24.375rem;
}

/* The upright rail, its level run (::before) and the corner between them (::after), lifted over the ground span, which would otherwise cover the ::before: each laps the corner by 1px, so no seam opens at a fractional size. */
.c-lid__rail,
.c-lid__margin::before,
.c-lid__margin::after {
  position: absolute;
  z-index: 1;
}

.c-lid__rail {
  top: 0;
  right: calc(-1 * var(--frame-lap));
  bottom: calc(var(--frame-corner) - 1px);
  width: var(--frame-rail);
  background: var(--frame-rail-img) 0 0 / 100% var(--frame-tile) repeat-y;
}

.c-lid__margin::before {
  content: '';
  right: calc(var(--frame-corner) - var(--frame-lap) - 1px);
  bottom: 0;
  left: 0;
  height: var(--frame-rail);
  background: var(--frame-run-img) 100% 0 / var(--frame-tile) 100% repeat-x;
}

.c-lid__margin::after {
  content: '';
  right: calc(-1 * var(--frame-lap));
  bottom: 0;
  width: var(--frame-corner);
  height: var(--frame-corner);
  background: var(--frame-corner-img) 0 0 / 100% 100% no-repeat;
}

/* The inset shadow is the gap between the two rails: without it the lid's art shows there. */
.c-lid__teeth {
  position: absolute;
  top: 0;
  right: 0;
  width: var(--frame-teeth);
  background: var(--frame-teeth-img) 0 var(--frame-at) / 100% var(--frame-tile) repeat-y;
  box-shadow: inset calc(-1 * var(--frame-seam)) 0 0 var(--color-bg);
  filter: drop-shadow(-0.1875rem 0 0.25rem rgba(0, 0, 0, 0.5));
  pointer-events: none;
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

/* The circuit is drawn in design px and scaled up whole, so its strokes grow with the page too. */
.c-lid__svg {
  position: absolute;
  inset: 0;
  width: calc(100% / var(--design-scale, 1));
  height: calc(100% / var(--design-scale, 1));
  overflow: visible;
  pointer-events: none;
  transform: scale(var(--design-scale, 1));
  transform-origin: 0 0;
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
    repeating-linear-gradient(90deg, rgba(var(--rgb-ink), 0.05) 0 1px, transparent 1px 2rem),
    repeating-linear-gradient(0deg, rgba(var(--rgb-ink), 0.05) 0 1px, transparent 1px 2rem);
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
  -webkit-mask-size: 16.25rem auto;
  mask-size: 16.25rem auto;
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
  --pad: 0.625rem;

  position: absolute;
  right: calc(var(--pad) / -2);
  top: calc((var(--trace) - var(--pad)) / 2);
  width: var(--pad);
  height: var(--pad);
  border: 0.125rem solid rgba(var(--rgb-accent), 0.6);
  border-radius: var(--radius-pill);
  background: var(--color-bg);
  transition: border-color var(--dur-2) var(--ease-linear);
}

.c-lid__trace.is-lit {
  background: var(--color-ink-bright);
}

.c-lid__packet {
  --packet: 0.375rem;

  position: absolute;
  left: 0;
  top: calc((var(--trace) - var(--packet)) / 2);
  width: 4rem;
  height: var(--packet);
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, transparent, var(--color-ink-bright) 60%, transparent);
  box-shadow: 0 0 0.75rem rgba(var(--rgb-accent), 0.8);
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
  font-size: 1.181rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.005em;
  white-space: nowrap;
  text-shadow: 0 0 1.125rem rgba(var(--rgb-accent), 0.35);
}

.c-lid__word {
  display: inline-flex;
  align-items: center;
  min-height: var(--premise-link);
  padding: 0 0.375rem;
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

/* Set by useLidSplitScene's scrub; every state lists brightness then drop-shadow, because on a composited layer WebKit keeps the old brightness when the new list is a lone drop-shadow, and keeps a shadow until the list is none. */
.c-lid__figure.is-named {
  filter: brightness(1) drop-shadow(0 0 0.875rem rgba(var(--rgb-accent), 0.45));
}

.c-lid__figure.is-dim {
  filter: brightness(0.55) drop-shadow(0 0 0.875rem rgba(var(--rgb-accent), 0));
}

.c-lid__figure.is-dark {
  filter: brightness(0.4) drop-shadow(0 0 0.875rem rgba(var(--rgb-accent), 0));
}

/* The spotlight snaps; only the final dim fades. */
.c-lid__figure:is(.is-named, .is-dim) {
  transition: none;
}

.c-lid__figure img {
  width: 100%;
  height: 100%;
  max-width: none;
}

/* Baked (lidGloss.ts): the scene writes only these opacities and the band's transform. */
.c-lid__gloss {
  position: absolute;
  inset: 0;
}

.c-lid__gloss-layer {
  position: absolute;
  inset: 0;
  opacity: 0;
  will-change: opacity;
}

.c-lid__gloss-sheen {
  position: absolute;
  inset: 0;
  overflow: hidden;
  -webkit-mask: var(--sheen) 0 0 / 100% 100% no-repeat;
  mask: var(--sheen) 0 0 / 100% 100% no-repeat;
}

.c-lid__gloss-band {
  position: absolute;
  inset: 0 auto 0 0;
  width: 300%;
  background: linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.3) 50%, transparent 60%);
  transform: translate3d(-76.67%, 0, 0);
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .c-lid__gloss-sheen {
    display: none;
  }
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
  transition: opacity var(--dur-2) var(--ease-linear);
}

.c-lid__mark.is-dim {
  opacity: 0.15;
}

.c-lid__arrow {
  position: absolute;
  left: 0;
  top: 0;
  isolation: isolate;
  display: grid;
  align-items: center;
  height: var(--premise-link);
  padding: 0 1.875rem 0 1.375rem;
  font-family: var(--font-label);
  font-size: var(--size-label-s);
  font-weight: 600;
  letter-spacing: var(--track-label);
  text-transform: uppercase;
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
  --tip: 1.25rem;
  --notch: 0.75rem;

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
  --tip: 1.175rem;
  --notch: 0.6875rem;

  inset: 0.125rem 0.1562rem;
  background: rgba(var(--rgb-bg), 0.94);
}

.c-lid__arrow.is-lit {
  color: var(--color-bg);
  filter: drop-shadow(0 0 0.875rem rgba(var(--rgb-accent), 0.8));
}

.c-lid__arrow.is-lit::before {
  background: var(--color-ink-bright);
}

.c-lid__arrow.is-lit::after {
  background: var(--color-accent);
}

.c-lid__tag {
  position: absolute;
  padding-bottom: 0.25rem;
  opacity: 0;
  transform: translateY(-0.25rem);
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
  width: 0.5625rem;
  height: 0.5625rem;
  margin-left: -0.2812rem;
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
  padding: 0.3125rem 0.375rem 0.375rem;
  border: 1px solid rgba(var(--rgb-ink), 0.22);
  border-radius: 0.375rem;
  background: rgba(var(--rgb-bg), 0.84);
  backdrop-filter: blur(0.5rem);
  -webkit-backdrop-filter: blur(0.5rem);
  text-align: center;
}

.c-lid__tag-name {
  font-size: var(--size-xs);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-ink);
}

.c-lid__tag-card .c-lid__tag-faction {
  margin-top: 0.125rem;
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
  width: calc(var(--tags-button) - 0.25rem);
  height: calc(var(--tags-button) - 0.25rem);
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

/* Undoes base.css's reduced-motion cut for fades and colour changes (slides stay off), at each rule's own duration; HomeHeroFoot and HomeHeroPanel do the same for theirs. */
@media (prefers-reduced-motion: reduce) {
  .c-lid__mark,
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
