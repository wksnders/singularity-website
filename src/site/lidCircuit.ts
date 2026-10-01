/* Packets run on Web Animations so the hero's loop can idle. */
import { ENTRANCE } from '@/site/lidSplitScene';

const NS = 'http://www.w3.org/2000/svg';
const PACKET = 10;
/** Runs per second. */
const SPEED = { wire: 0.32, bus: 0.16 };
/** Phase steps between neighbouring packets. */
const STAGGER = { wire: 0.37, bus: 0.29 };
/** Of split progress. */
const WIRES_IN = { from: 0.12, span: 0.4 };
/** Opacity. */
const BUS_FLOOR = 0.35;
/** Px. */
const BEND = 6;
const VIA_CLEAR = 3;
/** Px from a seam's centre, plus `spread` per px of gap. */
const BUS_SPLIT = { base: 3, spread: 0.12 };
/** Px per px of scroll. */
const RAIL_DRIFT = 0.45;
/** Where each gap wire leaves strip a and lands on strip b, as fractions of their heights. */
const WIRE_SETS: [number, number][] = [
  [0.2, 0.28],
  [0.46, 0.4],
  [0.7, 0.76],
];
/** Where a gap wire turns, as a share of the gap. */
const WIRE_TURN = 0.5;

/* Whole bytes, first byte most significant; each byte is followed by one empty slot. */
const WORD = 0x73696e67756c6172697479n;
const BYTE_BITS = 8;
const WORD_BYTES = Math.ceil(WORD.toString(2).length / BYTE_BITS);
/** Px per bit slot, lit pulse width and spark width. */
const TRAIN = { slot: 12, slotNarrow: 9, pulse: 6, pulseNarrow: 5, spark: 2 };

interface BitTrain {
  cycle: number;
  byte: number;
  lit: string;
  spark: string;
  sparkLead: number;
}

const trains = new Map<boolean, BitTrain>();

function bitTrain(narrow: boolean): BitTrain {
  const hit = trains.get(narrow);
  if (hit) return hit;
  const slot = narrow ? TRAIN.slotNarrow : TRAIN.slot;
  const pulse = narrow ? TRAIN.pulseNarrow : TRAIN.pulse;
  const bits: boolean[] = [];
  for (let i = WORD_BYTES * BYTE_BITS - 1; i >= 0; i--) {
    bits.push(((WORD >> BigInt(i)) & 1n) === 1n);
    if (i % BYTE_BITS === 0) bits.push(false);
  }
  const starts = bits.flatMap((on, j) => (on ? [j * slot] : []));
  const cycle = bits.length * slot;
  const dashes = (w: number) =>
    starts
      .map((st, j) => {
        const next = j + 1 < starts.length ? starts[j + 1] : starts[0] + cycle;
        return `${w} ${(next - st - w).toFixed(1)}`;
      })
      .join(' ');
  const train = {
    cycle,
    byte: (BYTE_BITS + 1) * slot,
    lit: dashes(pulse),
    spark: dashes(TRAIN.spark),
    sparkLead: (pulse - TRAIN.spark) / 2,
  };
  trains.set(narrow, train);
  return train;
}

export interface StripBox {
  x: number;
  y: number;
  w: number;
  h: number;
  ei: number;
  travel: number;
  /** Px the hover pulls the strip's left and right edges in. */
  inL: number;
  inR: number;
}

export interface Zone {
  x0: number;
  x1: number;
}

interface Line {
  el: SVGLineElement;
  xs?: string;
  h?: number;
}

interface Side {
  glow: Line;
  core: Line;
  hiGlow: Line;
  hi: Line;
  spark: Line;
  shift: number;
}

interface Strand {
  glow: SVGPathElement;
  core: SVGPathElement;
  pkt: SVGPathElement;
  d?: string;
  per?: number;
  lit?: boolean;
  anim?: Animation | null;
}

interface Wire {
  a: number;
  b: number;
  ta: number;
  tb: number;
  g: SVGGElement;
  A: Strand;
  B: Strand;
  phase: number;
  via: SVGCircleElement;
  viaA: SVGCircleElement;
  viaB: SVGCircleElement;
}

interface Bus {
  a: number;
  b: number;
  g: SVGGElement;
  A: Strand;
  B: Strand;
  phase: number;
}

function make<K extends keyof SVGElementTagNameMap>(
  parent: Element,
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  parent.appendChild(el);
  return el;
}

export function createCircuit(svgs: { zones: SVGSVGElement; wires: SVGSVGElement; buses: SVGSVGElement }, tones: string[]) {
  const n = tones.length;
  const anims = new Set<Animation>();
  const wireAnims = new Set<Animation>();
  let playing = true;
  let wiresHeld = false;
  const written = new WeakMap<Element, Map<string, string>>();

  /** A `style.` prefix sets a style property instead of an attribute. */
  function write(el: SVGElement, name: string, value: string): void {
    let seen = written.get(el);
    if (!seen) written.set(el, (seen = new Map()));
    if (seen.get(name) === value) return;
    seen.set(name, value);
    if (name.startsWith('style.')) el.style.setProperty(name.slice(6), value);
    else el.setAttribute(name, value);
  }

  for (const svg of Object.values(svgs)) svg.replaceChildren();

  const TONED = 'stroke: var(--faction-text)';
  const toned = (parent: SVGElement, tone: string) => make(parent, 'g', { style: `--faction-text: ${tone}` });

  const sides: Side[][] = tones.map((tone, i) => {
    const g = toned(svgs.zones, tone);
    const side = (k: number): Side => ({
      glow: { el: make(g, 'line', { style: TONED, 'stroke-width': 4, 'stroke-opacity': 0.05 }) },
      core: { el: make(g, 'line', { style: TONED, 'stroke-width': 1, 'stroke-opacity': 0.45 }) },
      hiGlow: {
        el: make(g, 'line', { style: TONED, 'stroke-width': 5, 'stroke-opacity': 0.12, 'stroke-linecap': 'round' }),
      },
      hi: { el: make(g, 'line', { style: TONED, 'stroke-width': 1.4, 'stroke-opacity': 0.75, 'stroke-linecap': 'round' }) },
      spark: {
        el: make(g, 'line', {
          style: 'stroke: var(--color-ink)',
          'stroke-width': 1,
          'stroke-opacity': 0.3,
          'stroke-linecap': 'round',
        }),
      },
      shift: (i * 2 + k) / (n * 2),
    });
    return [side(0), side(1)];
  });

  const strand = (g: SVGElement): Strand => ({
    glow: make(g, 'path', { fill: 'none', style: TONED, 'stroke-width': 5, 'stroke-opacity': 0.14, 'stroke-linejoin': 'round' }),
    core: make(g, 'path', { fill: 'none', style: TONED, 'stroke-width': 1.5, 'stroke-opacity': 0.78, 'stroke-linejoin': 'round' }),
    pkt: make(g, 'path', { fill: 'none', style: TONED, 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
  });

  const wires: Wire[] = [];
  const buses: Bus[] = [];
  for (let i = 0; i < n - 1; i++) {
    const ca = tones[i];
    const cb = tones[i + 1];
    WIRE_SETS.forEach(([ta, tb], k) => {
      const g = make(svgs.wires, 'g', {});
      const ga = toned(g, ca);
      const gb = toned(g, cb);
      const v = (i + k) % 2 ? 0.04 : -0.04;
      wires.push({
        a: i,
        b: i + 1,
        ta: ta + v,
        tb: tb - v,
        g,
        A: strand(ga),
        B: strand(gb),
        phase: ((i * 3 + k) * STAGGER.wire) % 1,
        via: make(g, 'circle', {
          r: 2.8,
          style: 'fill: var(--color-bg); stroke: var(--color-accent)',
          'stroke-width': 1.2,
          'stroke-opacity': 0.85,
        }),
        viaA: make(ga, 'circle', { r: 2.2, style: `fill: var(--color-bg); ${TONED}`, 'stroke-width': 1.2 }),
        viaB: make(gb, 'circle', { r: 2.2, style: `fill: var(--color-bg); ${TONED}`, 'stroke-width': 1.2 }),
      });
    });
    const g = make(svgs.buses, 'g', {});
    buses.push({ a: i, b: i + 1, g, A: strand(toned(g, ca)), B: strand(toned(g, cb)), phase: (i * STAGGER.bus) % 1 });
  }

  function pulse(
    s: Strand,
    pts: [number, number][],
    reduced: boolean,
    speed: number,
    phase: number,
    wire = false,
  ): void {
    const d = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');
    if (s.d !== d) {
      s.glow.setAttribute('d', d);
      s.core.setAttribute('d', d);
      s.pkt.setAttribute('d', d);
      s.d = d;
    }
    if (reduced) {
      if (s.lit !== false) s.pkt.setAttribute('stroke-opacity', '0');
      s.lit = false;
      if (s.anim) {
        s.anim.cancel();
        anims.delete(s.anim);
        wireAnims.delete(s.anim);
      }
      s.anim = null;
      return;
    }
    let length = 0;
    for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const per = length + PACKET;
    if (s.anim && s.per !== undefined && Math.abs(s.per - per) <= 2) return;
    const keyframes = [{ strokeDashoffset: `${PACKET}px` }, { strokeDashoffset: `${(PACKET - per).toFixed(1)}px` }];
    s.pkt.setAttribute('stroke-dasharray', `${PACKET} ${per.toFixed(1)}`);
    if (s.lit !== true) s.pkt.setAttribute('stroke-opacity', '0.95');
    s.lit = true;
    if (s.anim) (s.anim.effect as KeyframeEffect).setKeyframes(keyframes);
    else {
      const duration = 1000 / speed;
      s.anim = s.pkt.animate(keyframes, { duration, iterations: Infinity, easing: 'linear' });
      s.anim.currentTime = phase * duration;
      if (!playing || (wire && wiresHeld)) s.anim.pause();
      anims.add(s.anim);
      if (wire) wireAnims.add(s.anim);
    }
    s.per = per;
  }

  function update(o: {
    cur: StripBox[];
    zones: Zone[];
    H: number;
    p: number;
    sy: number;
    reduced: boolean;
    narrow: boolean;
  }): void {
    const train = bitTrain(o.narrow);
    const hs = String(o.H);
    o.zones.forEach((z, i) => {
      const c = o.cur[i];
      const drift = (o.sy * RAIL_DRIFT + (c ? c.ei * c.travel * ENTRANCE.ride : 0)) * (i % 2 ? 1 : -1);
      [z.x0, z.x1].forEach((x, k) => {
        const s = sides[i][k];
        const xs = x.toFixed(1);
        for (const line of [s.glow, s.core, s.hiGlow, s.hi, s.spark]) {
          if (line.xs === xs && line.h === o.H) continue;
          line.el.setAttribute('x1', xs);
          line.el.setAttribute('x2', xs);
          line.el.setAttribute('y1', '0');
          line.el.setAttribute('y2', hs);
          line.xs = xs;
          line.h = o.H;
        }
        const off = (((Math.round(s.shift * WORD_BYTES) * train.byte - drift) % train.cycle) + train.cycle) % train.cycle;
        const dashed: [Line, string, number][] = [
          [s.hiGlow, train.lit, off],
          [s.hi, train.lit, off],
          [s.spark, train.spark, off - train.sparkLead],
        ];
        for (const [line, dash, offset] of dashed) {
          write(line.el, 'style.opacity', o.reduced ? '0' : '1');
          write(line.el, 'stroke-dasharray', dash);
          write(line.el, 'stroke-dashoffset', offset.toFixed(1));
        }
      });
    });

    const shown = Math.min(1, Math.max(0, (o.p - WIRES_IN.from) / WIRES_IN.span));
    const hold = shown === 0;
    if (hold !== wiresHeld) {
      wiresHeld = hold;
      for (const a of wireAnims) {
        if (hold || !playing) a.pause();
        else a.play();
      }
    }
    for (const w of wires) {
      const a = o.cur[w.a];
      const b = o.cur[w.b];
      if (!a || !b) continue;
      const ax = a.x + a.w;
      const bx = b.x;
      /* Ends follow the strips' edges as drawn (a hover pulls an edge in, and an end left behind shows); the run and the bend don't, so the trace holds still. */
      const Ax = ax - a.inR;
      const Ay = a.y + a.h * w.ta;
      const Bx = bx + b.inL;
      const By = b.y + b.h * w.tb;
      const mx = ax + (bx - ax) * WIRE_TURN;
      const my = (Ay + By) / 2;
      const c = Math.min(BEND, Math.abs(By - Ay) / 2, Math.abs(bx - ax) / 4);
      const sgn = Math.sign(By - Ay) || 1;
      pulse(w.A, [[Ax, Ay], [mx - c, Ay], [mx, Ay + sgn * c], [mx, my]], o.reduced, SPEED.wire, w.phase, true);
      pulse(w.B, [[Bx, By], [mx + c, By], [mx, By - sgn * c], [mx, my]], o.reduced, SPEED.wire, w.phase + 0.5, true);
      write(w.via, 'cx', mx.toFixed(1));
      write(w.via, 'cy', my.toFixed(1));
      const za = o.zones[w.a];
      const zb = o.zones[w.b];
      const onA = !!za && za.x1 > Ax + VIA_CLEAR && za.x1 < mx - c - VIA_CLEAR;
      const onB = !!zb && zb.x0 < Bx - VIA_CLEAR && zb.x0 > mx + c + VIA_CLEAR;
      write(w.viaA, 'cx', za ? za.x1.toFixed(1) : '0');
      write(w.viaA, 'cy', Ay.toFixed(1));
      write(w.viaA, 'style.opacity', onA ? '1' : '0');
      write(w.viaB, 'cx', zb ? zb.x0.toFixed(1) : '0');
      write(w.viaB, 'cy', By.toFixed(1));
      write(w.viaB, 'style.opacity', onB ? '1' : '0');
      write(w.g, 'style.opacity', shown.toFixed(3));
    }
    for (const bus of buses) {
      const a = o.cur[bus.a];
      const b = o.cur[bus.b];
      if (!a || !b) continue;
      const sx = (a.x + a.w + b.x) / 2;
      const off = BUS_SPLIT.base + Math.max(0, b.x - (a.x + a.w)) * BUS_SPLIT.spread;
      const end = o.H + 2;
      pulse(bus.A, [[sx - off, 0], [sx - off, end]], o.reduced, SPEED.bus, bus.phase);
      pulse(bus.B, [[sx + off, 0], [sx + off, end]], o.reduced, SPEED.bus, bus.phase + 0.5);
      write(bus.g, 'style.opacity', Math.max(BUS_FLOOR, shown).toFixed(3));
    }
  }

  return {
    update,
    play(on: boolean): void {
      playing = on;
      for (const a of anims) {
        if (on && !(wiresHeld && wireAnims.has(a))) a.play();
        else a.pause();
      }
    },
    destroy(): void {
      for (const a of anims) a.cancel();
      for (const svg of Object.values(svgs)) svg.replaceChildren();
    },
  };
}

export type Circuit = ReturnType<typeof createCircuit>;
