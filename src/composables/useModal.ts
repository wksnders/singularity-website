/* The page lock is ref-counted so overlapping dialogs cannot unlock the page early. */
/* `#main` goes inert rather than `<body>`, because every dialog teleports into `<body>`. */

import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

let locks = 0;

function setLock(on: boolean): void {
  const page = document.getElementById('main');
  if (on) {
    if (locks++ > 0) return;
    document.body.style.overflow = 'hidden';
    /* aria-hidden mirrors `inert` for browsers that do not support `inert`. */
    page?.setAttribute('inert', '');
    page?.setAttribute('aria-hidden', 'true');
    return;
  }
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;
  document.body.style.overflow = '';
  page?.removeAttribute('inert');
  page?.removeAttribute('aria-hidden');
}

export function useModal(options: {
  open: () => boolean;
  close: () => void;

  initialFocus: () => HTMLElement | null | undefined;
}) {
  const dialog = ref<HTMLElement | null>(null);
  let opener: HTMLElement | null = null;
  let held = false;

  watch(options.open, async (open) => {
    if (open) {
      opener = document.activeElement as HTMLElement | null;
      setLock(true);
      held = true;
      await nextTick();
      options.initialFocus()?.focus();
      return;
    }
    if (!held) return;
    setLock(false);
    held = false;
    if (opener?.isConnected) opener.focus();
    opener = null;
  });

  onBeforeUnmount(() => {
    if (!held) return;
    setLock(false);
    held = false;
  });

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      options.close();
      return;
    }
    if (event.key !== 'Tab' || !dialog.value) return;
    /* `getClientRects`, not `offsetParent`: `offsetParent` is null for `position: fixed`. */
    const items = Array.from(dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.getClientRects().length > 0,
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return { dialog, onKeydown };
}
