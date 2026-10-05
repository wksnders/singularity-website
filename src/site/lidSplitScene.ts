import { DEFAULT_NOTCH, LID } from '@/data/lidArt';
import type { LidStrip, Notch } from '@/data/lidArt';

export interface LidReadout {
  character: string;
  faction: string;
  tone: string;
}

export type LidDest = 'trailer' | 'store';

/** Px, up from the lid's foot. */
const PREMISE_BOTTOM = 54;
/** Px: each premise word is a link this tall. */
const PREMISE_LINK = 44;

export const SPLIT = {
  /** The box holds for this × its visible height while it splits. */
  pin: 0.3,
  /** Share of the hold where the split, the scrub and the rail's flip complete. */
  doneAt: 0.92,
  /** Px per px of split scroll. */
  drift: 0.15,
  /** × the visible height. */
  driftCap: 1.2,
  /** Px; narrow screens take `slipNarrow` of it. */
  slip: 12,
  slipNarrow: 0.6,
  /** Px per px of split scroll, up to `slip`. */
  sink: 0.05,
  premiseBottom: PREMISE_BOTTOM,
  premiseLink: PREMISE_LINK,
  /** Px: the rising strips must clear the premise and 12px air. */
  clear: PREMISE_BOTTOM + PREMISE_LINK + 12,
  /** Share of the split's scroll, capped by `FAST_MIN`. */
  clearWithin: 0.85,
  /** Scale lost at full split. */
  shrinkInner: 0.1,
  shrinkOuter: 0.07,
  /** Zoom at full split: the art must zoom less than its figure, or the figure's painted hole shows. */
  artZoom: 0.035,
  figureZoom: 0.065,
  /** Share of strip width, at least `pullMin` px. */
  pull: 0.03,
  pullMin: 8,
  /** % of the lid's width added to each strip's share, so neighbours overlap with no hairline. */
  overlapPct: 0.02,
  notchDepth: 0.21,
  notchMax: 96,
  notchMin: 8,
  /** Px past the view's edge. */
  edgeClear: 12,
  detailOpacity: 0.32,
};

/** Ms unless noted. */
export const ENTRANCE = {
  dur: 560,
  stagger: 160,
  /** A scale, eased out over `dur` × `settleSpan`. */
  settle: 0.1,
  settleSpan: 1.7,
  seat: 120,
  /** Share of a strip's entrance travel. */
  ride: 0.5,
  camMax: 1100,
  panBase: 480,
  /** Ms per px of lid below the view. */
  panPerPx: 620 / 925,
  /** Px of overflow below which the camera doesn't pan. */
  panMin: 24,
  introMin: 900,
  introMax: 1300,
  /** How much larger the side column starts the intro: its scale is 1 + fieldGrow. */
  fieldGrow: 0.05,
  badge: 320,
  /** Before the camera stops. */
  badgeLead: 40,
  rest: 400,
  skip: 200,
  skipTail: 60,
  /** From decode to the first frame. */
  startDelay: 40,
  decodeCap: 1200,
  /** A frame gap longer than `stall` (a stall, or frames not shown) advances the entrance by only `stallStep`. */
  stall: 250,
  stallStep: 16,
};

/** `perFigure` is in visible heights of scroll; `from` and `to` are shares of the split's progress. */
export const SCRUB = {
  perFigure: 0.4,
  from: 0.08,
  to: 0.8,
  /** Share of the split, at least `tagsFadeMin` px. */
  tagsFade: 0.05,
  tagsFadeMin: 60,
};

/** Px: the name-tags button, and its gap from the foot and from the teeth or lid edge. The components set their CSS from these. */
export const HERO = { tagsButton: 52, tagsGap: 4 };

/** The side panel's plate, in px at a column `ref` wide; HomeHeroPanel draws at the same scale. */
export const PANEL = {
  ref: 434,
  overhang: 16,
  /** The tab under the panel's foot, in the baked art's px: image size with shadow room, drawn height, tuck under the panel, and where its engraving sits. */
  tab: { w: 480, h: 250, drawn: 212, tuck: 5, label: { x: 112.2, top: 35.4, size: 14, track: 2.4 } },
};

/** The painted foot under the lid, in px at a lid `ref` wide, y down from the lid's foot and `trays` as left edges; the art's crops (frame bar, fill and tray windows) must change with these. */
export const FOOT = {
  ref: 846,
  height: 182.4,
  barTop: -47.6,
  barH: 123.375,
  fillLeft: -54,
  fillW: 165,
  trays: [44, 468],
  trayTop: -4.6,
  trayW: 334,
  trayH: 52,
  /** The readout plate's centre, and its least width. */
  plateMid: -29.6,
  plateW: 254,
  plateMin: 240,
  /** Px at any scale: the plate's height before the text grows it. */
  plateH: 30,
  /** The bar's teeth tips, and how far below them the side panel's foot comes to rest. */
  teeth: 73.1,
  panelRest: 18,
  /** The cable run: its top (lid scale), its art's height per px of page width, and its baked shadow's extra height. */
  runTop: 58.4,
  runAspect: 386 / 2315,
  runShadow: 42 / 2315,
};

/** Px; HomeHero hands them to its CSS. */
export const SEAM = { wide: 4, narrow: 3, overhang: 60 };

type Point = [number, number];

/** `dir` −1 keeps what lies above the edge. */
export function notchPolygon(opts: {
  y: number;
  dir: 1 | -1;
  width: number;
  depth: number;
  far: number;
  profile?: Notch;
  flip?: boolean;
  ext?: number;
  map?: (p: Point) => Point;
}): string {
  const { y, dir, width, depth, far, ext = 0, map } = opts;
  const base = opts.profile ?? DEFAULT_NOTCH;
  const prof = opts.flip ? base.map(([x, f]): [number, number] => [1 - x, f]).reverse() : base;
  const first = prof[0][1];
  const last = prof[prof.length - 1][1];
  const pts: Point[] = [
    [-ext, y + dir * first * depth],
    ...prof.map(([x, f]): Point => [x * width, y + dir * f * depth]),
    [width + ext, y + dir * last * depth],
    [width + ext, y + dir * far],
    [-ext, y + dir * far],
  ];
  const out = pts.map((p) => {
    const [px, py] = map ? map(p) : p;
    return `${px.toFixed(1)}px ${py.toFixed(1)}px`;
  });
  return `polygon(${out.join(',')})`;
}

export interface Registration {
  aw: number;
  ah: number;
  ax: number;
  oyRest: number;
  scale: number;
}

export function registration(stripW: number, heroH: number, count: number): Registration {
  const perStrip = LID.w / count;
  const scale = Math.max(stripW / perStrip, heroH / LID.h);
  const aw = perStrip * scale;
  const ah = LID.h * scale;
  return { aw, ah, ax: (stripW - aw) / 2, oyRest: Math.min(0, heroH - ah), scale };
}

export function figureSize(strip: LidStrip, reg: Registration) {
  const [x0, y0, x1, y1] = strip.box;
  return { w: (x1 - x0) * LID.w * reg.scale, h: (y1 - y0) * reg.ah };
}
