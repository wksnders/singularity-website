/* All coordinates are px in the cast's own box. */

export type Side = 'l' | 'r';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CastGeo {
  /** Gutter layout: the cards stand in columns beside the player. */
  gutters: boolean;
  player: Box;
  /** Card buttons, in cast order. */
  cards: Box[];
  dials: [Box, Box];
  plate: Box;
}

export interface Via {
  x: number;
  y: number;
  r: number;
}

/** One drawn wire. `route` is its whole run from where the charge enters it (behind the player, or the dial) out to its via. */
export interface Wire {
  key: string;
  side: Side;
  /** The card it feeds, by cast index; trunks carry the index whose colour they wear. */
  card: number;
  kind: 'trace' | 'trunk' | 'crown';
  color: string;
  d: string[];
  route: string;
  via: Via | null;
}

/** Px from the player's edge (negative runs out into the gutter), at every width: the gutter cards are a fixed 124px. */
const TRACE = { inside: 90, out: 124, bend: 30, end: 210, viaX: 216, up: 20, upEnd: 192, upX: 212, upY: 40, upVia: 44, down: 50, downX: 174, downEnd: 102, downVia: 108 };
const TRACE_VIA = 6;
/** Px: trunk wire pitch; where trunks start behind the player (or the outer card); how far below its foot they gather. */
const TRUNK = { pitch: 12, behind: 40, foot: 4 };
const CROWN_VIA = 4.5;

const f = (v: number) => v.toFixed(1);
const mid = (b: Box) => [b.x + b.w / 2, b.y + b.h / 2] as const;

/** `colors` and `trunkOrder` are in cast order; `half` cards stand in the left column. */
export function castWires(geo: CastGeo, colors: string[], trunkOrder: number[], half: number): Wire[] {
  const out: Wire[] = [];
  const { player: p } = geo;
  const dials = geo.dials.map(mid);

  if (geo.gutters) {
    [geo.cards.slice(0, half), geo.cards.slice(half)].forEach((column, s) => {
      const side: Side = s ? 'r' : 'l';
      const k = column.length;
      /* Mirrored on the right: x runs out from the player's right edge. */
      const X = (x: number) => (s ? p.x + p.w - x : p.x + x);
      column.forEach((card, i) => {
        const index = s ? half + i : i;
        const c = card.y + card.h / 2;
        const dir = i < k / 2 ? -1 : 1;
        const y = (v: number) => f(c + v * dir);
        const T = TRACE;
        const start = `M${f(X(T.inside))} ${y(0)}H${f(X(-T.out))}`;
        out.push({
          key: `trace-${index}-a`,
          side,
          card: index,
          kind: 'trace',
          color: colors[index],
          d: [`${start}L${f(X(-T.out - T.bend))} ${y(T.bend)}H${f(X(-T.end))}`],
          route: `${start}L${f(X(-T.out - T.bend))} ${y(T.bend)}H${f(X(-T.end))}`,
          via: { x: X(-T.viaX), y: c + T.bend * dir, r: TRACE_VIA },
        });
        out.push({
          key: `trace-${index}-b`,
          side,
          card: index,
          kind: 'trace',
          color: colors[index],
          d: [`M${f(X(-T.out))} ${y(0)}L${f(X(-T.out - T.up))} ${y(-T.up)}H${f(X(-T.upEnd))}L${f(X(-T.upX))} ${y(-T.upY)}`],
          route: `${start}L${f(X(-T.out - T.up))} ${y(-T.up)}H${f(X(-T.upEnd))}L${f(X(-T.upX))} ${y(-T.upY)}`,
          via: { x: X(-T.viaX), y: c - T.upVia * dir, r: TRACE_VIA },
        });
        out.push({
          key: `trace-${index}-c`,
          side,
          card: index,
          kind: 'trace',
          color: colors[index],
          d: [`M${f(X(-T.out - T.bend))} ${y(T.bend)}L${f(X(-T.downX))} ${y(T.down)}V${y(T.downEnd)}`],
          route: `${start}L${f(X(-T.out - T.bend))} ${y(T.bend)}L${f(X(-T.downX))} ${y(T.down)}V${y(T.downEnd)}`,
          via: { x: X(-T.downX), y: c + T.downVia * dir, r: TRACE_VIA },
        });
      });
    });

    const m = trunkOrder.length;
    const top = p.y + p.h - TRUNK.behind;
    const foot = p.y + p.h + TRUNK.foot;
    dials.forEach(([dx, dy], s) => {
      trunkOrder.forEach((index, i) => {
        const o = (i - (m - 1) / 2) * TRUNK.pitch;
        const splay = o * 2;
        const d = `M${f(dx + splay)} ${f(top)}V${f(foot)}L${f(dx + o)} ${f(foot + Math.abs(splay - o))}V${f(dy)}`;
        out.push({ key: `trunk-${s}-${index}`, side: s ? 'r' : 'l', card: index, kind: 'trunk', color: colors[index], d: [d], route: d, via: null });
      });
    });
    return out;
  }

  const n = geo.cards.length;
  let rowFoot = 0;
  geo.cards.forEach((card, i) => {
    rowFoot = Math.max(rowFoot, card.y + card.h);
    const cx = card.x + card.w / 2;
    const top = card.y;
    const dir = i < n / 2 ? -1 : 1;
    const w = Math.min(30, card.w * 0.22);
    const stem = top + 30;
    const sx = cx + dir * w * 0.5;
    const oy = top - 4 - w * 0.6;
    const ix = cx - dir * w * 0.6;
    const vias: Via[] = [
      { x: sx, y: top - 50, r: CROWN_VIA },
      { x: cx + dir * (w * 1.4 + CROWN_VIA), y: oy, r: CROWN_VIA },
      { x: ix, y: top - 42, r: CROWN_VIA },
    ];
    const routes = [
      `M${f(cx)} ${f(stem)}V${f(top - 14)}L${f(sx)} ${f(top - 14 - w * 0.5)}V${f(vias[0].y + CROWN_VIA)}`,
      `M${f(cx)} ${f(stem)}V${f(top - 4)}L${f(cx + dir * w * 0.6)} ${f(oy)}H${f(cx + dir * w * 1.4)}`,
      `M${f(cx)} ${f(stem)}V${f(top - 8)}L${f(ix)} ${f(top - 8 - w * 0.6)}V${f(vias[2].y + CROWN_VIA)}`,
    ];
    routes.forEach((route, k) =>
      out.push({ key: `crown-${i}-${k}`, side: i < n / 2 ? 'l' : 'r', card: i, kind: 'crown', color: colors[i], d: [route], route, via: vias[k] }),
    );
  });

  const m = trunkOrder.length;
  dials.forEach(([dx, dy], s) => {
    trunkOrder.forEach((index, i) => {
      const x = dx + (i - (m - 1) / 2) * TRUNK.pitch;
      const d = `M${f(x)} ${f(rowFoot - TRUNK.behind)}V${f(dy)}`;
      out.push({ key: `trunk-${s}-${index}`, side: s ? 'r' : 'l', card: index, kind: 'trunk', color: colors[index], d: [d], route: d, via: null });
    });
  });
  return out;
}

/** Deg the dials turn to face the open card from the plate's centre, folded into ±90°: the slot is symmetric. */
export function dialTurn(plate: Box, card: Box | undefined): number {
  if (!card) return 0;
  const [px, py] = mid(plate);
  const [cx, cy] = mid(card);
  const deg = (Math.atan2(cy - py, cx - px) * 180) / Math.PI;
  return ((((deg + 90) % 180) + 180) % 180) - 90;
}

/** Deg around a dial, swept clockwise from straight down on the left and counter-clockwise on the right. */
export function sweepAngle(side: Side, dial: Box, x: number, y: number): number {
  const [bx, by] = mid(dial);
  const a = (Math.atan2(y - by, x - bx) * 180) / Math.PI;
  return ((((side === 'l' ? a - 90 : 90 - a) % 360) + 360) % 360);
}
