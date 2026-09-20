/* A page states its section order once, and every SectionMarker numbers itself from it. The key is private on purpose: these two functions are the only way in or out. */

import { computed, inject, provide, toValue } from 'vue';
import type { ComputedRef, InjectionKey, MaybeRefOrGetter } from 'vue';

type SectionList = readonly { id: string }[];

const SECTIONS: InjectionKey<ComputedRef<SectionList>> = Symbol('sections');

/**
 * Pass the page's FULL ordered list: this is the numbering source, not the index.
 * A page that filters what SectionIndex and the rail show (the FAQ, while searching) still provides every section here, or the markers renumber mid-search.
 */
export function provideSections(sections: MaybeRefOrGetter<SectionList>): void {
  provide(
    SECTIONS,
    computed(() => toValue(sections)),
  );
}

/** 1-based position of `id` on the page; null when no list is provided or the id is not in it. */
export function useSectionPosition(
  id: MaybeRefOrGetter<string | undefined>,
): ComputedRef<{ index: number; total: number } | null> {
  const sections = inject(SECTIONS, null);
  return computed(() => {
    const key = toValue(id);
    if (!sections || key === undefined) return null;
    const at = sections.value.findIndex((section) => section.id === key);
    if (at === -1) {
      if (import.meta.env.DEV) console.warn(`[sections] "${key}" is not in the provided section list`);
      return null;
    }
    return { index: at + 1, total: sections.value.length };
  });
}
