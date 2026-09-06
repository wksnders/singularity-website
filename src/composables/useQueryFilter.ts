/* Query keys (`?faction=`, `?category=`, `?kind=`, ...) are published URL contracts: renaming one breaks every existing shared link. */

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
    /* Pass `hash` explicitly; `router.replace({ query })` drops it and loses the reader's deep-link anchor. */
    void router.replace({ query, hash: route.hash });
  }

  function toggle(id: string): void {
    set(value.value === id ? null : id);
  }

  return { value, set, toggle };
}
