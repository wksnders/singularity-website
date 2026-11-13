/* A page that provides this lets its lazy art (ArtFrame, the trailer poster) start loading ahead of the scroll; anywhere else it stays false. */

import { inject, onBeforeUnmount, provide, readonly, ref, watch } from 'vue';
import type { InjectionKey, Ref } from 'vue';
import { savingData } from '@/composables/useZoomUpgrade';

const WARM: InjectionKey<Readonly<Ref<boolean>>> = Symbol('warmArt');
const COLD: Readonly<Ref<boolean>> = readonly(ref(false));
const WAIT_CAP = 10000;

/** True once lazy art should load now, at low priority. */
export function useWarmArt(): Readonly<Ref<boolean>> {
  return inject(WARM, COLD);
}

/** Warms once `ready` is true and the page's non-lazy images have landed (or WAIT_CAP passes); never with Save-Data or on a connection reported slower than 4G. */
export function provideWarmArt(ready: Readonly<Ref<boolean>>): void {
  const warm = ref(false);
  provide(WARM, readonly(warm));
  const type = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType;
  if (savingData() || (type !== undefined && type !== '4g')) return;
  let idle = 0;
  let timer = 0;
  let until = 0;
  const later = (fn: () => void) => {
    if (window.requestIdleCallback) idle = window.requestIdleCallback(fn, { timeout: 1000 });
    else timer = window.setTimeout(fn, 250);
  };
  const busy = () => [...document.images].some((img) => img.loading !== 'lazy' && !img.complete);
  const check = () => {
    if (busy() && performance.now() < until) later(check);
    else warm.value = true;
  };
  watch(
    ready,
    (now) => {
      if (!now || until) return;
      until = performance.now() + WAIT_CAP;
      later(check);
    },
    { immediate: true },
  );
  onBeforeUnmount(() => {
    if (idle) window.cancelIdleCallback(idle);
    if (timer) window.clearTimeout(timer);
  });
}
