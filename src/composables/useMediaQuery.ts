import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';

/* For behaviour CSS cannot express — rendering something else, not styling it
   differently. `useChrome` owns the shared `wide`; this is per component. */
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
