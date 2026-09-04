import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';
import type { Ref } from 'vue';

/**
 * the reader has pinch-zoom, so a surface can ask for a bigger rung than its layout size justifies.
 */

/* Not `> 1`: `resize` also fires for the mobile keyboard and the URL bar, which
   change height and leave scale alone. */
const THRESHOLD = 1.2;

/** A reader who asked for less still gets the image, just not the top rung. */
export const savingData = (): boolean =>
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

export function useZoomUpgrade(): Readonly<Ref<boolean>> {
  const zoomed = ref(false);
  let viewport: VisualViewport | null = null;

  function stop(): void {
    viewport?.removeEventListener('resize', check);
    viewport = null;
  }

  /* Latches: the bytes are spent, so swapping back down buys only a decode. */
  function check(): void {
    if (!viewport || viewport.scale <= THRESHOLD) return;
    zoomed.value = true;
    stop();
  }

  onMounted(() => {
    if (savingData()) return;
    viewport = window.visualViewport;
    viewport?.addEventListener('resize', check);
  });

  onBeforeUnmount(stop);

  return readonly(zoomed);
}
