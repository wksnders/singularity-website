/* ============================================================================
   Filter state lives in the URL. `?faction=`, `?category=`, `?kind=` are public
   contracts from the mock and must survive every refactor: a filtered index is
   a shareable page.
   ========================================================================== */

import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useQueryFilter(param: string) {
  const route = useRoute();
  const router = useRouter();

  const value = computed<string | null>(() => {
    const raw = route.query[param];
    return typeof raw === 'string' && raw !== '' ? raw : null;
  });

  function set(next: string | null): void {
    const query = { ...route.query };
    if (next) query[param] = next;
    else delete query[param];
    /* The hash is carried explicitly. `replace({ query })` drops it, which on
       a page where the reader arrived at a deep link would silently throw the
       anchor away the first time they touched a filter and the address bar
       would stop matching the page they are looking at. */
    void router.replace({ query, hash: route.hash });
  }

  function toggle(id: string): void {
    set(value.value === id ? null : id);
  }

  return { value, set, toggle };
}
