/* `?card=` is the one way a card opens, on every page that shows cards — a zoom held in a local ref cannot be linked to, and Back would walk the reader off the page.

   OPENING PUSHES, EVERYTHING ELSE REPLACES, so Back closes the dialog rather than leaving the page.
   `open` STARTS FALSE AND FLIPS AFTER MOUNT: CardZoom's scroll lock, inert and focus hang off a non-immediate watcher, so a dialog mounted already-open gets none of them.
   A bad slug strips ONLY `?card=`, never `?printing=`, and the host page shows `MissingCardNote` instead of crashing.
   Closing never clears `?printing=`; a printing chosen inside the zoom is re-applied after the back lands, because it would otherwise be discarded with that history entry. */

import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export const CARD_PARAM = 'card';
export const PRINTING_PARAM = 'printing';

export interface CardParamOptions {
  isKnown: (slug: string) => boolean;
}

/** Patch the query, keeping everything not named. The hash is carried explicitly — a bare `{ query }` DROPS IT, and the rules page opens cards from an anchored rule. `null` deletes the key. */
export function useQueryWriter() {
  const route = useRoute();
  const router = useRouter();
  return (patch: Record<string, string | null>, mode: 'push' | 'replace'): void => {
    const next = { ...route.query };
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) delete next[key];
      else next[key] = value;
    }
    void router[mode]({ query: next, hash: route.hash });
  };
}

export function useCardParam({ isKnown }: CardParamOptions) {
  const route = useRoute();
  const router = useRouter();
  const write = useQueryWriter();

  const str = (key: string): string | null => {
    const value = route.query[key];
    return typeof value === 'string' && value !== '' ? value : null;
  };

  const raw = computed(() => str(CARD_PARAM));
  const slug = computed(() => (raw.value && isKnown(raw.value) ? raw.value : null));
  const printing = computed(() => str(PRINTING_PARAM));

  const open = ref(false);
  const missing = ref<string | null>(null);
  /* Cleared by the watcher on a manual Back, so `close()` can never back past the page the reader arrived on. */
  const pushed = ref(false);
  /* The printing in force when the zoom opened, so `close()` can tell a choice made inside the dialog from the page's own. */
  let openedPrinting: string | null = null;
  /* `router.back()` resolves a task later, with the dialog still mounted: without this, held-down Escape closes twice and the second call walks the reader off the page. */
  let closing = false;

  function openCard(next: string): void {
    missing.value = null;
    pushed.value = true;
    openedPrinting = printing.value;
    closing = false;
    /* `?printing=` is deliberately NOT cleared: it is the character page's own state, and `resolveRowPrinting` makes a stale value inert rather than wrong. */
    write({ [CARD_PARAM]: next }, 'push');
  }

  const setPrinting = (id: string) =>
    write({ [PRINTING_PARAM]: id === 'standard' ? null : id }, 'replace');

  /** Resolves when the next navigation settles, or gives up rather than hang. */
  function navigated(): Promise<void> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        off();
        resolve();
      };
      const off = router.afterEach(finish);
      setTimeout(finish, 300);
    });
  }

  async function close(): Promise<void> {
    if (closing) return;
    closing = true;
    if (pushed.value) {
      pushed.value = false;
      const chosen = printing.value;
      router.back();
      /* The entry being discarded is the one `setPrinting` replaced, so a printing chosen in the zoom would vanish with it. */
      if (chosen !== openedPrinting) {
        await navigated();
        write({ [PRINTING_PARAM]: chosen }, 'replace');
      }
      return;
    }
    write({ [CARD_PARAM]: null }, 'replace');
    /* Nothing to restore focus to on a cold load, so CardZoom hands it to <body>. Take it to #main, where the router lands anyway. */
    void nextTick(() => document.getElementById('main')?.focus());
  }

  const dismissMissing = () => {
    missing.value = null;
  };

  function sync(): void {
    if (raw.value && !slug.value) {
      missing.value = raw.value;
      write({ [CARD_PARAM]: null }, 'replace');
    }
    open.value = Boolean(slug.value);
    if (!slug.value) {
      pushed.value = false;
      closing = false;
    }
  }

  watch(slug, sync);
  watch(raw, (value) => {
    if (value && !isKnown(value)) sync();
  });

  onMounted(async () => {
    await nextTick();
    sync();
  });

  return { slug, printing, open, missing, openCard, setPrinting, close, dismissMissing };
}
