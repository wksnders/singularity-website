/* Driven only by useLidSplitScene's frame, never by the pointer. */

/* Bundled, not from the CDN: a CSS mask is fetched in CORS mode and the Space sends no CORS header. */
const sheens = import.meta.glob<string>('/src/assets/gloss/*.webp', { eager: true, import: 'default' });

/** The figure's merged sheen mask; `id` is its character id. */
export const sheenUrl = (id: string): string | null => sheens[`/src/assets/gloss/gloss-${id}-sheen.webp`] ?? null;

/** Kill switch: false mounts no gloss layers at all. */
export const GLOSS_ON = true;

export const GLOSS = {
  /** Scroll from the page top, in visible heights, that the figures' ramps spread over, and one ramp's share of it. */
  span: 1,
  ramp: 0.4,
  /** Share of a figure (or of the screen, for one taller than it) that must be on screen before its ramp may start. */
  seen: 0.85,
  /** Ms: the levels ease toward their targets with this time constant. */
  easeMs: 110,
  /** Opacity at full level; the bloom swells from `bloom[0]` by `bloom[1]` while the band crosses. */
  glow: 0.55,
  bloom: [0.25, 0.5],
  /** Reduced motion: steady opacities and no band. */
  still: { glow: 0.55, bloom: 0.45 },
  /** The band's position as background-position of a band three figures wide: from just left of the figure to just right of it. */
  band: { from: 1.15, travel: 1.3 },
};

export interface GlossEls {
  glow: HTMLElement;
  bloom: HTMLElement;
  /** Null for a figure without a sheen mask. */
  band: HTMLElement | null;
}

/** Px on screen: a figure's top and bottom. */
export type FigureSpan = [top: number, bottom: number];

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function createGloss(n: number) {
  /* Scroll px, not visible heights, where each figure was first seen: a resize must not move it, and scrolling back above it rewinds the glow. */
  const seenAt: (number | null)[] = new Array(n).fill(null);
  const level = new Array<number>(n).fill(0);
  const written = new Array<string>(n).fill('');

  function write(el: GlossEls, i: number, glow: number, bloom: number, band: string): void {
    const key = `${glow.toFixed(3)}|${bloom.toFixed(3)}|${band}`;
    if (written[i] === key) return;
    written[i] = key;
    el.glow.style.opacity = glow.toFixed(3);
    el.bloom.style.opacity = bloom.toFixed(3);
    if (el.band) el.band.style.transform = band;
  }

  /** `sy` is scroll px from the page top and `hv` the visible height the ramps are measured in. Returns true while a level is still easing. */
  function update(
    els: (GlossEls | null)[],
    figures: FigureSpan[],
    sy: number,
    hv: number,
    screenH: number,
    reduced: boolean,
    dt: number,
  ): boolean {
    if (reduced) {
      els.forEach((el, i) => el && write(el, i, GLOSS.still.glow, GLOSS.still.bloom, 'none'));
      return false;
    }
    const k = 1 - Math.exp(-dt / GLOSS.easeMs);
    const stagger = n > 1 ? (GLOSS.span - GLOSS.ramp) / (n - 1) : 0;
    let busy = false;
    for (let i = 0; i < n; i++) {
      const seen = seenAt[i];
      if (seen !== null && sy < seen - 0.5) seenAt[i] = null;
      const f = figures[i];
      if (seenAt[i] === null && f) {
        const h = f[1] - f[0];
        const vis = Math.min(f[1], screenH) - Math.max(f[0], 0);
        if (h > 0 && vis >= Math.min(h, screenH) * GLOSS.seen) seenAt[i] = sy;
      }
      const at = seenAt[i];
      const target = at === null ? 0 : Math.max(0, Math.min(1, (sy / hv - Math.max(i * stagger, at / hv)) / GLOSS.ramp));
      let v = level[i] + (target - level[i]) * k;
      if (Math.abs(target - v) < 0.0004) v = target;
      else busy = true;
      level[i] = v;
      const el = els[i];
      if (!el) continue;
      const pos = GLOSS.band.from - GLOSS.band.travel * v;
      const on = easeOut(v);
      const pass = 1 - Math.min(1, Math.abs(pos - 0.5) * 2);
      /* As background-position `pos` of a band three times the figure's width: it sits 2·pos figure widths left. */
      write(el, i, GLOSS.glow * on, on * (GLOSS.bloom[0] + GLOSS.bloom[1] * pass), `translate3d(${((-200 * pos) / 3).toFixed(2)}%,0,0)`);
    }
    return busy;
  }

  /** The layers remount empty: write everything again on the next frame. */
  function forget(): void {
    written.fill('');
  }

  return { update, forget };
}
