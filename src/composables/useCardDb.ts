/* Every control on the card database, held in the URL: `?q= ?face= ?sort= ?type= ?faction= ?set= ?brand= ?printed= ?cost=` are UI state, never a citation form.

   `?card=` AND `?printing=` ARE NOT HERE — they belong to `useCardParam`, which every page showing cards uses.
   A PARAM AT ITS DEFAULT IS DELETED, not written, or the first keystroke pins every default into a shared link. */

import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCardParam, useQueryWriter } from '@/composables/useCardParam';
import type { CardParamOptions } from '@/composables/useCardParam';
import { ALL, FACET_KEYS, SORTS, defaultFacets } from '@/site/cards';
import { queryString } from '@/site/query';
import type { FacetKey, FacetState, SortKey } from '@/site/cards';

export type Face = 'art' | 'card';

/** The `?set=` spelling is public; `box` is what the facet is called in code. */
const PARAM_OF: Record<FacetKey, string> = {
  type: 'type',
  faction: 'faction',
  box: 'set',
  brand: 'brand',
  printed: 'printed',
  cost: 'cost',
};

export type CardDbOptions = CardParamOptions;

export function useCardDb(options: CardDbOptions) {
  const route = useRoute();
  const write = useQueryWriter();
  const card = useCardParam(options);

  const str = (key: string) => queryString(route.query, key);

  const query = computed(() => str('q') ?? '');
  const face = computed<Face>(() => (str('face') === 'art' ? 'art' : 'card'));
  const sort = computed<SortKey>(() => {
    const value = str('sort');
    return SORTS.includes(value as SortKey) ? (value as SortKey) : 'printed';
  });

  const facets = computed<FacetState>(() => {
    const out = defaultFacets();
    for (const key of FACET_KEYS) out[key] = str(PARAM_OF[key]) ?? ALL;
    return out;
  });

  const setQuery = (value: string) => write({ q: value.trim() ? value : null }, 'replace');
  const setFace = (value: Face) => write({ face: value === 'card' ? null : value }, 'replace');
  const setSort = (value: SortKey) => write({ sort: value === 'printed' ? null : value }, 'replace');

  const setFacet = (key: FacetKey, value: string) =>
    write({ [PARAM_OF[key]]: facets.value[key] === value || value === ALL ? null : value }, 'replace');

  function reset(): void {
    const patch: Record<string, string | null> = { q: null };
    for (const key of FACET_KEYS) patch[PARAM_OF[key]] = null;
    write(patch, 'replace');
  }

  return { query, face, sort, facets, setQuery, setFace, setSort, setFacet, reset, card };
}
