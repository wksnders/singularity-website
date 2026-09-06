/* `?stack=` is a published URL contract: positional program slugs, comma-separated, an empty segment meaning an empty slot, trailing empties trimmed; a write must leave the rest of the query and the hash intact. */

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { STACK_SIZE } from '@/data/starterStacks';
import type { StackSeed } from '@/data/starterStacks';
import type { Program } from '@/data/types';

export const STACK_PARAM = 'stack';

export type StackChange =
  /** `from` is set when the program was already in another slot: it moved. */
  | { kind: 'added'; program: Program; slot: number; from?: number }
  | { kind: 'replaced'; program: Program; gone: Program; slot: number; from?: number }
  | { kind: 'removed'; program: Program; slot: number }
  | { kind: 'loaded'; seed: StackSeed }
  | { kind: 'cleared' };

const empty = (): (string | null)[] => Array.from({ length: STACK_SIZE }, () => null);

export function useStack(source: {
  characterId: () => string;
  pool: () => Program[];
  seeds: () => StackSeed[];
}) {
  const route = useRoute();
  const router = useRouter();

  const ids = ref<(string | null)[]>(empty());
  const dropped = ref(0);
  const seedId = ref<string | null>(null);

  const armed = ref<number | null>(null);
  const fromLink = ref(false);

  const byId = computed(() => new Map(source.pool().map((program) => [program.slug, program])));

  const programs = computed(() =>
    ids.value.map((id) => (id ? (byId.value.get(id) ?? null) : null)),
  );

  const count = computed(() => ids.value.filter(Boolean).length);

  const defaultArm = (next: (string | null)[]): number => Math.max(0, next.indexOf(null));

  /** The one legality check, run on every write as well as every read so a seed can never put an id in `?stack=` that reloading would reject: brand access is the only construction rule. */
  function legal(parts: (string | null)[]): { ids: (string | null)[]; dropped: number } {
    const slots = empty();
    let lost = 0;
    parts.forEach((part, index) => {
      const id = part?.trim();
      if (!id) return;
      if (index >= STACK_SIZE || !byId.value.has(id) || slots.includes(id)) {
        lost += 1;
        return;
      }
      slots[index] = id;
    });
    return { ids: slots, dropped: lost };
  }

  function write(next: (string | null)[]): void {
    const query = { ...route.query };
    if (next.some(Boolean)) {
      const trimmed = next.slice();
      while (trimmed.length && !trimmed[trimmed.length - 1]) trimmed.pop();
      query[STACK_PARAM] = trimmed.map((id) => id ?? '').join(',');
    } else {
      delete query[STACK_PARAM];
    }
    /* The hash is carried explicitly — `replace({ query })` drops it. */
    void router.replace({ query, hash: route.hash });
  }

  function reset(): void {
    const raw = route.query[STACK_PARAM];
    const parsed = typeof raw === 'string' && raw ? legal(raw.split(',')) : null;
    /* A link that named a stack opens the builder even when nothing in it survived, because the note saying what was dropped lives inside the builder. */
    fromLink.value = Boolean(parsed && (parsed.ids.some(Boolean) || parsed.dropped));

    if (armed.value !== null) armed.value = 0;
    dropped.value = parsed?.dropped ?? 0;

    if (parsed?.ids.some(Boolean)) {
      ids.value = parsed.ids;
      seedId.value = null;
      /* The address held ids this character cannot reach; rewrite it or Copy link re-shares the broken one. */
      if (parsed.dropped) write(parsed.ids);
      if (armed.value !== null) armed.value = defaultArm(parsed.ids);
      return;
    }

    const seed = source.seeds()[0];
    const next = seed ? legal(seed.programSlugs).ids : empty();
    ids.value = next;
    seedId.value = seed ? seed.deckId : null;
    if (parsed?.dropped) write(next);
    if (armed.value !== null) armed.value = defaultArm(next);
  }

  watch(() => source.characterId(), reset, { immediate: true });

  function commit(next: (string | null)[], change: StackChange): StackChange {
    const checked = legal(next);
    ids.value = checked.ids;
    dropped.value = 0;

    if (armed.value !== null) armed.value = defaultArm(checked.ids);
    seedId.value = change.kind === 'loaded' ? change.seed.deckId : null;
    write(checked.ids);
    return change;
  }

  /** Null closes arming, a number arms that slot and no argument arms the first empty one; while the builder is open there is always an armed slot. */
  function arm(index: number | null = defaultArm(ids.value)): void {
    armed.value = index;
  }

  function chooseInto(id: string): StackChange | null {
    const slot = armed.value;
    const program = byId.value.get(id);
    if (slot === null || !program) return null;
    const next = ids.value.slice();

    /* One slot per program, so taking it from another is a move, not a copy. */
    const already = next.indexOf(id);
    if (already > -1) next[already] = null;
    const from = already > -1 && already !== slot ? already : undefined;

    const goneId = next[slot];
    const gone = goneId && goneId !== id ? byId.value.get(goneId) : undefined;
    next[slot] = id;

    return commit(
      next,
      gone
        ? { kind: 'replaced', program, gone, slot, from }
        : { kind: 'added', program, slot, from },
    );
  }

  function clearSlot(index: number): StackChange | null {
    const id = ids.value[index];
    const program = id ? byId.value.get(id) : undefined;
    if (!program) return null;
    const next = ids.value.slice();
    next[index] = null;
    const change = commit(next, { kind: 'removed', program, slot: index });
    /* Emptying arms what it emptied, which is what the reader will fill. */
    armed.value = index;
    return change;
  }

  function load(seed: StackSeed): StackChange {
    return commit(seed.programSlugs.slice(0, STACK_SIZE), { kind: 'loaded', seed });
  }

  function clear(): StackChange {
    return commit(empty(), { kind: 'cleared' });
  }

  return {
    programs,
    count,
    dropped,
    seedId,
    armed,
    fromLink,
    has: (id: string) => ids.value.includes(id),
    arm,
    chooseInto,
    clearSlot,
    load,
    clear,
  };
}
