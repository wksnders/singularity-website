/* A whole scroll, rest to rest, with no reader input and not made by the site is the browser seeking (find-in-page, a text link, a screen reader). Judged once it ends. */
import { onBeforeUnmount, onMounted } from 'vue';
import type { Ref } from 'vue';
import { SCROLL_INPUTS, jumpTo, siteLandedAt, siteScrolling } from '@/site/glide';

/** Ms without a scroll event that counts as at rest. */
const REST_MS = 150;
/** Ms before a scroll starts that reader input still claims it. */
const INPUT_LEAD = 500;
/** Share of the view a seek must cover. */
const SEEK_MIN = 0.1;
/* Touch: a pan fires pointercancel, so pointerHeld misses touch drags; these count them as input. */
const INPUT_EVENTS = [...SCROLL_INPUTS, 'touchmove', 'touchend'] as const;
/** Px left of the page's scrollbar where pointer movement counts as reader input: Firefox's scrollbar sends no pointer events. */
const SCROLLBAR_REACH = 48;
/* contextmenu: the menu can swallow the pointerup. */
const POINTER_HOLD = ['pointerdown', 'pointerup', 'pointercancel', 'contextmenu'] as const;

export interface SeekCatchOpts {
  docked: Readonly<Ref<boolean>>;
  holdLeft: (y: number) => number;
  vh: Readonly<Ref<number>>;
  pageW: Readonly<Ref<number>>;
}

/** Pushes a browser seek that went down from inside the hold on by the hold it skipped. */
export function useSeekCatch({ docked, holdLeft, vh, pageW }: SeekCatchOpts): void {
  let restY = 0;
  let startedAt = -1;
  let inputAt = -Infinity;
  let bySite = false;
  let restTimer = 0;
  const noteInput = () => (inputAt = performance.now());
  let pointerHeld = false;
  let autoscroll = false;
  let heldDuring = false;
  /* A held pointer is the reader however long it pauses: a scrollbar drag sends nothing between press and release. A middle press off a link counts until the next press: autoscroll runs with the button up. */
  function pressed(event: PointerEvent | MouseEvent): void {
    pointerHeld = event.type === 'pointerdown';
    if (pointerHeld) autoscroll = event.button === 1 && !(event.target as Element | null)?.closest?.('a[href]');
  }
  /* A release can land outside the window; the next move says whether a button is still down. */
  function moved(event: PointerEvent): void {
    pointerHeld = event.buttons > 0;
    if (event.clientX >= pageW.value - SCROLLBAR_REACH) noteInput();
  }
  const letGo = () => (pointerHeld = autoscroll = false);

  function seekEnded(): void {
    const byReader = heldDuring || inputAt >= startedAt - INPUT_LEAD;
    const from = restY;
    const y = window.scrollY;
    startedAt = -1;
    restY = y;
    if (!docked.value || bySite || byReader || siteLandedAt(y) || y - from < vh.value * SEEK_MIN) return;
    const left = holdLeft(from);
    if (left < 1) return;
    jumpTo(y + left);
    restY = window.scrollY;
  }

  function track(): void {
    if (startedAt < 0) {
      startedAt = performance.now();
      bySite = false;
      heldDuring = false;
    }
    bySite ||= siteScrolling();
    heldDuring ||= pointerHeld || autoscroll;
    clearTimeout(restTimer);
    restTimer = window.setTimeout(seekEnded, REST_MS);
  }

  onMounted(() => {
    window.addEventListener('scroll', track, { passive: true });
    for (const name of INPUT_EVENTS) window.addEventListener(name, noteInput, { passive: true });
    for (const name of POINTER_HOLD) window.addEventListener(name, pressed, { passive: true });
    window.addEventListener('pointermove', moved, { passive: true });
    window.addEventListener('blur', letGo);
    restY = window.scrollY;
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', track);
    for (const name of INPUT_EVENTS) window.removeEventListener(name, noteInput);
    for (const name of POINTER_HOLD) window.removeEventListener(name, pressed);
    window.removeEventListener('pointermove', moved);
    window.removeEventListener('blur', letGo);
    clearTimeout(restTimer);
  });
}
