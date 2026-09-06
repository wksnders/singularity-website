import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';
import type { Ref } from 'vue';

/* Not `> 1`: `resize` also fires for the mobile keyboard and URL bar, which change height but leave scale alone. */
const THRESHOLD = 1.2;

export const savingData = (): boolean =>
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

export function useZoomUpgrade(): Readonly<Ref<boolean>> {
  const zoomed = ref(false);
  let viewport: VisualViewport | null = null;

  function stop(): void {
    viewport?.removeEventListener('resize', check);
    viewport = null;
  }

  /* Latches: once true it never returns to false. */
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
