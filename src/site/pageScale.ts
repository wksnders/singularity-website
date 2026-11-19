/* Above 1440px wide the page is drawn larger: base.css sizes the root font by --page-scale and every length is in rem, so it all grows together. */
import { readonly, ref } from 'vue';
import { viewHeight } from '@/composables/useMediaQuery';

/** Window widths (px) the scale grows between, the scale reached at `to`, how many times its height a window may count as wide, and how many times wider than that it is before its widest art is framed. */
const SCALE = { from: 1440, to: 2560, max: 1.25, shape: 2, frame: 1.15 };
const SETTLE_MS = 200;

/* Whether zoom here measures as the trailer block's px sums assume: client rects in visual px, offsets and currentCSSZoom in the element's own, and lengths and viewport units inside it scaled alike. */
function zoomMeasures(): boolean {
  const probe = document.createElement('div');
  const inner = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:0;top:0;width:10px;height:10px;visibility:hidden;zoom:2';
  inner.style.cssText = 'position:absolute;left:10px;width:10vw;height:1px';
  probe.append(inner);
  document.documentElement.append(probe);
  const outer = probe.getBoundingClientRect();
  const rect = inner.getBoundingClientRect();
  const standard =
    (probe as Element & { currentCSSZoom?: number }).currentCSSZoom === 2 &&
    probe.offsetWidth === 10 &&
    inner.offsetLeft === 10 &&
    Math.abs(outer.width - 20) < 0.5 &&
    Math.abs(rect.left - outer.left - 20) < 0.5 &&
    Math.abs(rect.width - window.innerWidth / 5) < 4;
  probe.remove();
  return standard;
}

/* The trailer block's extra zoom only where zoom is the standard one, or its px sums go wrong: Safari before 26.4 and Chromium before 128 pass CSS.supports on older rules, so the property is looked for and the measuring then tried. */
export const zoomable = typeof CSS !== 'undefined' && CSS.supports('zoom', '2') && 'currentCSSZoom' in Element.prototype && zoomMeasures();

/** Px: the width a `width` × `height` window's widest art is laid out for: the window's own until that is `frame` times the width the scale counts (here never under `from`), then that width; the step keeps a 16:9 screen's window, a little over 2:1, clear of sliver margins. */
export function stageWidth(width: number, height: number): number {
  const counted = Math.max(SCALE.from, height * SCALE.shape);
  return width < counted * SCALE.frame ? width : counted;
}

function measure(): number {
  /* An ultrawide scales like the 16:9 screen of the same height, whose browser window is about 2:1. */
  const wide = Math.min(window.innerWidth, viewHeight() * SCALE.shape);
  const share = Math.min(1, Math.max(0, (wide - SCALE.from) / (SCALE.to - SCALE.from)));
  return Math.round((1 + share * (SCALE.max - 1)) * 1000) / 1000;
}

const scale = ref(1);
/* Grows once a resize ends and never shrinks: a browser re-picks its srcset candidate on every `sizes` change. */
const settled = ref(1);
let settleTimer = 0;
let measured = 1;

/* Rem over 16: the scale times the reader's own font-size setting, which rem lengths follow too. */
function remScale(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;
}

function set(next: number): void {
  const root = document.documentElement.style;
  root.setProperty('--page-scale', String(next));
  root.setProperty('--cast-zoom', zoomable ? String(next) : '1');
  scale.value = remScale();
  root.setProperty('--design-scale', String(scale.value));
}

function apply(): void {
  const next = measure();
  if (next === measured) return;
  measured = next;
  set(next);
  window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(() => (settled.value = Math.max(settled.value, scale.value)), SETTLE_MS);
}

/** Call once before the app mounts, so the first paint is already scaled. */
export function startPageScale(): void {
  measured = measure();
  set(measured);
  settled.value = scale.value;
  window.addEventListener('resize', apply);
  /* A reader's font-size setting can change with no resize (browser settings, Firefox's text-only zoom): a 1rem probe catches it. */
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:0;left:0;width:1rem;height:0;visibility:hidden;pointer-events:none';
  probe.setAttribute('aria-hidden', 'true');
  document.documentElement.append(probe);
  new ResizeObserver(() => {
    if (remScale() === scale.value) return;
    set(measured);
    settled.value = Math.max(settled.value, scale.value);
  }).observe(probe);
}

/** Real px per design px (rem × 16, the px the layout maths is written in): divide window sizes, scroll offsets, pointer positions and offset sizes by it, and multiply any length a script writes by it; client rects take rectScale or layoutRect. */
export const pageScale = readonly(scale);

/** The scale once a resize has ended, never shrinking: for a choice of image, which a browser fetches again whenever it changes. */
export const settledScale = readonly(settled);

/** Real px per design px for `el`'s client rects and pointer positions: the page scale, times the trailer block's zoom inside it. */
export const rectScale = (el: Element): number => ((el as Element & { currentCSSZoom?: number }).currentCSSZoom ?? 1) * scale.value;

export type LayoutRect = Record<'left' | 'top' | 'right' | 'bottom' | 'width' | 'height', number>;

/** `el`'s client rect in design px. */
export function layoutRect(el: Element): LayoutRect {
  const z = rectScale(el);
  const r = el.getBoundingClientRect();
  return { left: r.left / z, top: r.top / z, right: r.right / z, bottom: r.bottom / z, width: r.width / z, height: r.height / z };
}

/** Where a source size's length starts: after its media condition, if it has one. */
function lengthStart(entry: string): number {
  let depth = 0;
  let at = 0;
  for (let i = 0; i < entry.length; i++) {
    if (entry[i] === '(') depth++;
    else if (entry[i] === ')') depth--;
    else if (/\s/.test(entry[i]) && depth === 0 && entry.slice(i).trim()) at = i + 1;
  }
  return at;
}

/** `sizes` for an image on the scaled page: its px lengths grow with the scale, while media conditions and viewport units already describe the real window. */
export function scaledSizes(sizes: string): string {
  const by = settled.value;
  if (by === 1) return sizes;
  const entries: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i <= sizes.length; i++) {
    if (sizes[i] === '(') depth++;
    else if (sizes[i] === ')') depth--;
    if (i < sizes.length && (sizes[i] !== ',' || depth > 0)) continue;
    const entry = sizes.slice(start, i);
    const at = lengthStart(entry);
    entries.push(entry.slice(0, at) + entry.slice(at).replace(/(\d*\.?\d+)px/g, (_, px: string) => `${Math.ceil(Number(px) * by)}px`));
    start = i + 1;
  }
  return entries.join(',');
}
