/* ============================================================================
   ONE PAGE LOCK, SHARED BY EVERY DIALOG. Two dialogs that each set
   `body.overflow` and `#main[inert]` fight over them: whichever closes second
   wins, and closing the first re-enables a page the second is still covering.
   The count here is what makes the lock survive an overlap.

   `#main` is what goes inert, not `<body>`, because every dialog teleports to
   `<body>` — inerting the body would inert the dialog with it.
   ========================================================================== */

import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

let locks = 0;

function setLock(on: boolean): void {
  const page = document.getElementById('main');
  if (on) {
    if (locks++ > 0) return;
    document.body.style.overflow = 'hidden';
    /* `inert` takes the page out of the accessibility tree; the aria-hidden is
       for browsers that do not have it yet. */
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
  /** Focused when the dialog opens. */
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
    /* `getClientRects`, not `offsetParent`: that is null for anything
       `position: fixed`, which silently drops a fixed close button out of the
       cycle the moment focus leaves it. */
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
