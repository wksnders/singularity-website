/* Keeps the last readout after its source clears, so the text never blanks while it fades out. */
import { nextTick, ref, watch, type Ref } from 'vue';
import type { LidReadout } from '@/site/lidSplitScene';

/** Largest first. */
export type FitSteps = [size: string, tracking: string][];

export function fitLine(box: HTMLElement, text: HTMLElement, steps: FitSteps): void {
  for (const [size, tracking] of steps) {
    text.style.fontSize = size;
    text.style.letterSpacing = tracking;
    if (box.scrollWidth <= box.clientWidth + 1) return;
  }
}

/** Each target is [box that must not overflow, text to shrink]. */
export function useHeldReadout(
  source: () => LidReadout | null,
  steps: FitSteps,
  targets: () => [HTMLElement | null, HTMLElement | null][],
): Ref<LidReadout | null> {
  const shown = ref<LidReadout | null>(null);
  watch(source, async (next) => {
    if (!next) return;
    shown.value = next;
    await nextTick();
    for (const [box, text] of targets()) if (box && text) fitLine(box, text, steps);
  });
  return shown;
}
