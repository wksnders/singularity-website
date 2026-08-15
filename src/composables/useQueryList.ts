/* 
   `useQueryFilter` for several values at once: `?brand=scrap-brigade,common`.
   Same URL-is-the-state contract, same rules about the param being public.*/

import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useQueryList(param: string) {
  const route = useRoute();
  const router = useRouter();

  const values = computed<string[]>(() => {
    const raw = route.query[param];
    if (typeof raw !== 'string' || raw === '') return [];
    return raw.split(',').filter(Boolean);
  });

  function set(next: string[]): void {
    const query = { ...route.query };
    if (next.length) query[param] = next.join(',');
    else delete query[param];
    /* The hash is carried explicitly — `replace({ query })` drops it. */
    void router.replace({ query, hash: route.hash });
  }

  return {
    values,
    set,
    has: (id: string) => values.value.includes(id),
    remove: (id: string) => set(values.value.filter((value) => value !== id)),
    clear: () => set([]),
  };
}
