/* Every panel and figure is cut from this canvas with no other offset. */
export const LID = { w: 2872, h: 3640 };

export type Notch = [x: number, depth: number][];

export const DEFAULT_NOTCH: Notch = [[0, 0.51], [0.106, 0], [0.286, 0], [0.492, 1], [0.603, 1], [0.688, 0.61], [1, 0.61]];

export interface LidStrip {
  factionId: string;
  characterId: string;
  /** [x0, y0, x1, y1] as fractions of the whole lid. */
  box: [number, number, number, number];
  /** x as a fraction of strip width, depth as a fraction of `notchDepth` × strip width. */
  notch?: Notch;
  notchDepth?: number;
  /** [x, y] as fractions of the whole lid: the top of the head, where the name tag points. */
  head: [number, number];
  flush?: boolean;
  detailOpacity?: number;
  premise?: 'first' | 'second';
}

/* Print order, left to right. Even indexes rise and odd ones drop, so reordering changes which strips uncover the premise. */
export const lidStrips: LidStrip[] = [
  {
    factionId: 'monarchy-of-boom',
    characterId: 'scrapper',
    head: [0.1525, 0.612],
    box: [0, 0.5835, 0.2716, 0.9132],
    notch: DEFAULT_NOTCH,
    notchDepth: 0.21,
    premise: 'first',
  },
  {
    factionId: 'celestial-shogunate',
    characterId: 'shiho-zenji',
    head: [0.385, 0.605],
    box: [0.2173, 0.5308, 0.5028, 0.9846],
    flush: true,
    detailOpacity: 0.55,
  },
  {
    factionId: 'hana-mori',
    characterId: 'moka',
    head: [0.6, 0.522],
    box: [0.4861, 0.4242, 0.805, 1],
    notch: [[0, 0.45], [0.125, 0.45], [0.179, 1], [0.375, 1], [0.47, 0], [0.878, 0], [0.918, 0.45], [1, 0.45]],
    notchDepth: 0.09,
    premise: 'second',
  },
  {
    factionId: 'subnet-86',
    characterId: 'zakhi',
    head: [0.8075, 0.645],
    box: [0.7201, 0.1516, 1, 0.9969],
    detailOpacity: 0.55,
  },
];

/* `.exe`'s foot sits at 41% of the lid's height and 92% of the logo canvas's. `aspect` must match SiteLockup's logo size. */
export const MARK = { aspect: 254 / 720, footOnLid: 0.41, footInMark: 0.92 };
