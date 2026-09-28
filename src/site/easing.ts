const NEWTON_STEPS = 8;
const NEWTON_EPSILON = 1e-5;

function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  return (input: number) => {
    const t = Math.min(1, Math.max(0, input));
    if (t === 0 || t === 1) return t;
    let u = t;
    for (let k = 0; k < NEWTON_STEPS; k++) {
      const x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t;
      if (Math.abs(x) < NEWTON_EPSILON) break;
      const dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
      u = Math.min(1, Math.max(0, u - x / (dx || 1e-6)));
    }
    return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  };
}

export const easeOutCubic = (input: number): number => 1 - (1 - Math.min(1, Math.max(0, input))) ** 3;

export const easeCamera = cubicBezier(0.65, 0, 0.25, 1);
export const easeEmphasis = cubicBezier(0.2, 0.9, 0.1, 1);

export const smoothstep = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
