/* Query keys (`?faction=`, `?category=`, `?kind=`, ...) are published URL contracts: renaming one breaks every existing shared link. */

import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useQueryWriter } from '@/composables/useQuery';
import { queryString } from '@/site/query';

export function useQueryFilter(param: string) {
  const route = useRoute();
  const write = useQueryWriter();

  const value = computed(() => queryString(route.query, param));

  function set(next: string | null): void {
    write({ [param]: next || null }, 'replace');
  }

  function toggle(id: string): void {
    set(value.value === id ? null : id);
  }

  return { value, set, toggle };
}
