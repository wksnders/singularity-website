/* ============================================================================
   THE STACK IS THE URL. `?stack=` holds three slots as program SLUGS,
   comma-separated and POSITIONAL: an empty segment is an empty slot, so `jab,,maul` means top and
   bottom filled with the middle still open. Position is the order, so a gap is
   never closed up on the reader's behalf. Trailing empties are trimmed;
   interior ones are kept.

   There is no localStorage and no account, which has three consequences:

     - Copy link is the save button, not a social nicety. Arriving from the nav
       shows the published stack or empty slots, never last week's build.
     - Every write is `router.replace`, never `push`. A push turns Back into an
       undo stack for card picks.
     - A hand-edited address can never draw an illegal stack: the character's
       brand access is the only construction rule there is, so anything outside
       it, repeated or past the third slot is dropped and counted so the page
       can say so. Every write goes through the same check as every read, or
       loading a seed could put an id in the address that reloading rejects.

  A program sits in at most one slot, so putting one where it already is
  somewhere else moves it rather than copying it.

  While the builder is open there is ALWAYS an armed slot, the first empty
  one, or the top when the stack is full. There is no disarmed state

   `?stack=` sits beside `?faction=` on this page and must not clear it.
   ========================================================================== */

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
  /** The slot the next pick fills. Null only while the builder is closed. */
  const armed = ref<number | null>(null);
  const fromLink = ref(false);

  const byId = computed(() => new Map(source.pool().map((program) => [program.slug, program])));

  const programs = computed(() =>
    ids.value.map((id) => (id ? (byId.value.get(id) ?? null) : null)),
  );

  const count = computed(() => ids.value.filter(Boolean).length);

  /** The first empty slot, or the top when there is none. */
  const defaultArm = (next: (string | null)[]): number => Math.max(0, next.indexOf(null));

  /** The one legality check, run on everything written as well as everything
      read: brand access is the only construction rule there is. */
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
    /* A link that named a stack opens the builder even if nothing in it
       survived: the reader asked for one, and the note saying what was left
       out lives inside the builder. */
    fromLink.value = Boolean(parsed && (parsed.ids.some(Boolean) || parsed.dropped));
    /* Re-armed rather than cleared: navigating between characters must not
       leave an open builder with no target and every tile inert. */
    if (armed.value !== null) armed.value = 0;
    dropped.value = parsed?.dropped ?? 0;

    if (parsed?.ids.some(Boolean)) {
      ids.value = parsed.ids;
      seedId.value = null;
      /* The address held ids this character cannot reach; rewrite it, or Copy
         link re-shares the broken one. */
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
    /* Re-armed on the next empty slot, so filling three is three taps. */
    if (armed.value !== null) armed.value = defaultArm(checked.ids);
    seedId.value = change.kind === 'loaded' ? change.seed.deckId : null;
    write(checked.ids);
    return change;
  }

  /**
   * Null closes the builder's arming; a number arms that slot; no argument
   * arms the first empty one. There is no disarmed state while the builder is
   * open, which is what lets every pool tile name a destination.
   */
  function arm(index: number | null = defaultArm(ids.value)): void {
    armed.value = index;
  }

  /** Put a program in the armed slot. */
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
