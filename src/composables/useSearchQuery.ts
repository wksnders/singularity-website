/* A search box whose text lives in the URL. If this ever wants a `mode` argument or a flag for one page's extra field, the pages have stopped sharing it: back the difference out into the page instead. */

import { computed, ref, watch } from 'vue';
import { useQueryFilter } from '@/composables/useQueryFilter';

export function useSearchQuery(param: string) {
  const query = useQueryFilter(param);

  /* The field binds to this local draft, not to the query param it writes: routing every keystroke through router.replace waits on navigation and makes the caret jump. */
  const draft = ref(query.value.value ?? '');
  watch(
    () => query.value.value,
    (next) => {
      const incoming = next ?? '';
      /* Compared trimmed, or a trailing space typed mid-phrase is overwritten by its own trimmed echo from the URL. */
      if (incoming !== draft.value.trim()) draft.value = incoming;
    },
  );

  const searching = computed(() => draft.value.trim() !== '');

  function search(next: string): void {
    draft.value = next;
    query.set(next.trim() ? next.trim() : null);
  }

  const field = ref<HTMLInputElement | null>(null);

  /** Clearing removes the button that was clicked, so focus has to be placed. */
  function clear(): void {
    search('');
    field.value?.focus();
  }

  return { draft, searching, search, clear, field };
}
