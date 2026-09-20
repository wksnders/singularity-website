import { useRouter } from 'vue-router';

type Mode = 'push' | 'replace';

/* Shared by every writer on the page, not one per call: two writers in one tick would each build from the same stale `route.query`, and the second navigation would supersede the first and put its key back. */
let pending: { patch: Record<string, string | null>; mode: Mode } | null = null;

/** Patch the query, keeping everything not named. The hash is carried explicitly — a bare `{ query }` DROPS IT, and the rules page opens cards from an anchored rule. `null` deletes the key. Writes made in the same tick land as ONE navigation, a push if any of them asked for one. */
export function useQueryWriter() {
  const router = useRouter();
  return (patch: Record<string, string | null>, mode: Mode): void => {
    if (pending) {
      Object.assign(pending.patch, patch);
      if (mode === 'push') pending.mode = 'push';
      return;
    }
    pending = { patch: { ...patch }, mode };
    queueMicrotask(() => {
      const { patch: all, mode: how } = pending!;
      pending = null;
      const route = router.currentRoute.value;
      const next = { ...route.query };
      for (const [key, value] of Object.entries(all)) {
        if (value === null) delete next[key];
        else next[key] = value;
      }
      void router[how]({ query: next, hash: route.hash });
    });
  };
}
