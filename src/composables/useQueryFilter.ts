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
    void router.replace({ query });
  }

  function toggle(id: string): void {
    set(value.value === id ? null : id);
  }

  return { value, set, toggle };
}
