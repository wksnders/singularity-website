import { onScopeDispose, ref } from 'vue';

/** `copied` holds the key of the last copy that actually reached the clipboard, and only until `resetMs` passes: a failed write, or a browser with no clipboard API, never claims "copied". `onFail` is the caller's fallback. `copy` never rejects. */
export function useCopy({ resetMs = 1600 }: { resetMs?: number } = {}) {
  const copied = ref<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  async function copy(text: string, key = 'default', onFail?: () => void): Promise<void> {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard');
      await navigator.clipboard.writeText(text);
    } catch {
      onFail?.();
      return;
    }
    /* The write can settle after the component is gone. */
    if (disposed) return;
    copied.value = key;
    clearTimeout(timer);
    timer = setTimeout(() => (copied.value = null), resetMs);
  }

  onScopeDispose(() => {
    disposed = true;
    clearTimeout(timer);
  });

  return { copied, copy };
}
