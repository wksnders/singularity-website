// List query params are comma-separated in the URL (?brand=scrap-brigade,common); the separator is a published-link contract.

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
