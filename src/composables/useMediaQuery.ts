import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';

/** A mouse or trackpad that can hover. HomeHero's strip hover @media repeats it. */
export const FINE_HOVER = '(hover: hover) and (pointer: fine)';

/* For behaviour CSS cannot express, not styling: `useChrome` owns the shared `wide`, this is per-component. */
export function useMediaQuery(query: string) {
  const media = window.matchMedia(query);
  const matches = ref(media.matches);

  const onChange = () => (matches.value = media.matches);

  onMounted(() => {
    media.addEventListener('change', onChange);
    onChange();
  });

  onBeforeUnmount(() => media.removeEventListener('change', onChange));

  return readonly(matches);
}

/** Read once, at the moment of a scroll: nothing re-renders when it changes. A template that must follow the setting uses `useMediaQuery` instead. */
export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Not innerHeight: a phone's toolbars change it mid-scroll. */
export const viewHeight = (): number => document.documentElement.clientHeight;
