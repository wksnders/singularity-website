/* Web Animations on elements HomeTrailerCast renders, all cancelled at the end so the wires fall back to their rendered state; under reduced motion it runs nothing. */

import { token, tokenMs } from '@/site/tokens';

export interface SparkWire {
  /** Lit copy of the route (glow under-stroke and core), hidden at rest. */
  charge: SVGGElement;
  /** White head running ahead of the charge, hidden at rest. */
  head: SVGGElement;
  /** The route the copies draw, for its length. */
  path: SVGPathElement;
  via: SVGCircleElement | null;
  color: string;

  card: HTMLElement | null;
}

const SPARK = { trunk: 0.5, branch: 1.2, head: 18, overlap: 60, settle: 80, hold: 600, glow: 1000 };
/* HomeTrailerCast's .c-home-cast__character rests on this list: keep the two in step. */
const REST = 'brightness(1) drop-shadow(0 0 0 transparent)';

function light(w: SparkWire, at: number, speed: number, fromEnd: boolean, off: number, out: Animation[]): number {
  const fade = tokenMs('--dur-3');
  const len = w.path.getTotalLength();
  const dur = len / speed;
  const from = fromEnd ? -len : len;
  const dash = `${len} ${len}`;
  out.push(
    w.charge.animate(
      [
        { strokeDasharray: dash, strokeDashoffset: `${from}px` },
        { strokeDasharray: dash, strokeDashoffset: '0px' },
      ],
      { duration: dur, delay: at, easing: 'linear', fill: 'both' },
    ),
  );
  const fadeAt = Math.max(off, at + dur);
  const total = fadeAt + fade;
  out.push(
    w.charge.animate([{ opacity: 1 }, { opacity: 1, offset: fadeAt / total }, { opacity: 0 }], { duration: total, fill: 'forwards' }),
  );
  const headDash = `${SPARK.head} ${len + SPARK.head}`;
  const h0 = fromEnd ? -len : SPARK.head;
  const h1 = fromEnd ? SPARK.head : -len;
  const run = (len + SPARK.head) / speed;
  out.push(
    w.head.animate(
      [
        { strokeDasharray: headDash, strokeDashoffset: `${h0}px`, opacity: 1 },
        { strokeDasharray: headDash, strokeDashoffset: `${h1}px`, opacity: 1 },
      ],
      { duration: run, delay: at, easing: 'linear', fill: 'both' },
    ),
  );
  return at + dur;
}

/** Trunks in the order they empty; branches in the order they light. `done` resolves once every animation has finished and been cancelled; `stop` cancels them early. */
export function runSpark(trunks: SparkWire[], branches: SparkWire[]): { done: Promise<void>; stop: () => void } {
  const out: Animation[] = [];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { done: Promise.resolve(), stop: () => undefined };
  const fade = tokenMs('--dur-3');
  const blink = tokenMs('--dur-1');
  const tA = Math.max(0, ...trunks.map((w) => w.path.getTotalLength() / SPARK.trunk)) + SPARK.settle;
  const starts: number[] = [];
  const arrivals: number[] = [];
  let t = tA;
  for (const w of branches) {
    const run = w.path.getTotalLength() / SPARK.branch;
    starts.push(t);
    arrivals.push(t + run);
    t += run - SPARK.overlap;
  }
  const end = (arrivals.length ? Math.max(...arrivals) : tA) + SPARK.hold;
  const B = branches.length;
  const M = trunks.length;
  trunks.forEach((w, j) => {
    /* Each trunk wire holds its charge until the branch it feeds starts. */
    const spentAt = B ? starts[Math.round(M > 1 ? (j * (B - 1)) / (M - 1) : B - 1)] : end;
    light(w, 0, SPARK.trunk, true, spentAt, out);
  });
  const lit = new Set<HTMLElement>();
  const bg = token('--color-bg');
  branches.forEach((w, n) => {
    light(w, starts[n], SPARK.branch, false, end, out);
    if (w.via) {
      out.push(w.via.animate([{ fill: bg }, { fill: w.color }], { duration: blink, delay: arrivals[n], fill: 'forwards' }));
      out.push(w.via.animate([{ fill: w.color }, { fill: bg }], { duration: fade, delay: end, fill: 'forwards' }));
    }
    if (w.card && !lit.has(w.card) && w.card.offsetWidth) {
      lit.add(w.card);
      out.push(
        w.card.animate(
          [{ filter: REST }, { filter: `brightness(1.08) drop-shadow(0 0 12px ${w.color})`, offset: 0.3 }, { filter: REST }],
          { duration: SPARK.glow, delay: starts[n] + blink / SPARK.branch, easing: token('--ease-out') },
        ),
      );
    }
  });
  const stop = () => {
    for (const a of out) a.cancel();
  };
  return { done: Promise.all(out.map((a) => a.finished.catch(() => undefined))).then(stop), stop };
}
