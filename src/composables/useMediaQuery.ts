import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';

/* For behaviour CSS cannot express, not styling: `useChrome` owns the shared `wide`, this is per-component. */
export function useMediaQuery(query: string) {
  const matches = ref(false);
  let media: MediaQueryList | null = null;

  const onChange = () => (matches.value = Boolean(media?.matches));

  onMounted(() => {
    media = window.matchMedia(query);
    media.addEventListener('change', onChange);
    onChange();
  });

  onBeforeUnmount(() => media?.removeEventListener('change', onChange));

  return readonly(matches);
}

/** Read once, at the moment of a scroll: nothing re-renders when it changes. A template that must follow the setting uses `useMediaQuery` instead. */
export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
