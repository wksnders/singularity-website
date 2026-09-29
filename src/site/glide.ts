/* Scrolls to a location; any wheel, touch, key or press during a glide interrupts it and hands control back. */
import { prefersReducedMotion } from '@/composables/useMediaQuery';
import { easeCamera } from '@/site/easing';

const MIN_MS = 600;
const MAX_MS = 1600;
const PX_PER_MS = 1.1;
/* A sticky ancestor moves the target with each jump. */
const SETTLE_JUMPS = 4;
/** Ms: scroll events arrive a frame after the jump that caused them. */
const ECHO_MS = 100;
/** Ms after a jump that a late scroll ending where it landed still counts as the site's. */
const LANDED_MS = 1000;

export const SCROLL_INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

let raf = 0;
let finish: ((arrived: boolean) => void) | null = null;
let current: Promise<boolean> = Promise.resolve(true);
let jumpedAt = -Infinity;
let jumpedTo = -1;
let heldFor: (el: Element) => number = () => 0;

function stop(arrived = false): void {
  cancelAnimationFrame(raf);
  raf = 0;
  for (const name of SCROLL_INPUTS) window.removeEventListener(name, interrupt);
  finish?.(arrived);
  finish = null;
}

const interrupt = () => stop(false);

type Target = () => number;

function resolveTop(target: Target): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return Math.max(0, Math.min(target(), max));
}

/** For every scroll the site makes itself, so `siteScrolling` can tell them from the reader's and the browser's. 'instant': base.css sets scroll-behavior: smooth. */
export function jumpTo(top: number): void {
  jumpedAt = performance.now();
  window.scrollTo({ top, behavior: 'instant' });
  /* Where it landed: the page clamps a top past its end. */
  jumpedTo = Math.round(window.scrollY);
}

function settle(target: Target): void {
  for (let i = 0; i < SETTLE_JUMPS; i++) {
    const y = resolveTop(target);
    if (Math.abs(y - window.scrollY) < 1) return;
    jumpTo(y);
  }
}

export const siteScrolling = (): boolean => raf !== 0 || performance.now() - jumpedAt < ECHO_MS;

/** For a scroll that arrives late: whether it stopped where the site last sent the page. */
export const siteLandedAt = (y: number): boolean =>
  performance.now() - jumpedAt < LANDED_MS && Math.abs(Math.round(y) - jumpedTo) <= 1;

/** One hold at a time: the latest registration wins. */
export function registerHold(remaining: (el: Element) => number): () => void {
  heldFor = remaining;
  return () => {
    if (heldFor === remaining) heldFor = () => 0;
  };
}

/** Resolves true on arrival, false if interrupted or the target leaves the page. */
function glideTo(target: Target, instant: boolean, alive: () => boolean): Promise<boolean> {
  stop();
  const y0 = window.scrollY;
  const first = resolveTop(target);
  if (instant || prefersReducedMotion() || Math.abs(first - y0) < 2) {
    settle(target);
    current = Promise.resolve(true);
    return current;
  }
  const dur = Math.round(Math.min(MAX_MS, Math.max(MIN_MS, Math.abs(first - y0) / PX_PER_MS)));
  const t0 = performance.now();
  current = new Promise<boolean>((resolve) => {
    finish = resolve;
    for (const name of SCROLL_INPUTS) window.addEventListener(name, interrupt, { passive: true });
    const step = (now: number) => {
      if (!alive()) {
        stop(false);
        return;
      }
      if (now - t0 >= dur) {
        settle(target);
        stop(true);
        return;
      }
      jumpTo(y0 + (resolveTop(target) - y0) * easeCamera((now - t0) / dur));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  });
  return current;
}

export async function glideToElement(el: HTMLElement, instant = false): Promise<boolean> {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const arrived = await glideTo(
    () => el.getBoundingClientRect().top + window.scrollY - margin + heldFor(el),
    instant,
    () => el.isConnected,
  );
  if (arrived) {
    if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  return arrived;
}

export const glideToTop = (): Promise<boolean> => glideTo(() => 0, false, () => true);

/** Waits two frames first: the router starts the glide a tick after the click. */
export async function afterGlide(): Promise<boolean> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  return current;
}

export const plainClick = (event: MouseEvent): boolean =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
