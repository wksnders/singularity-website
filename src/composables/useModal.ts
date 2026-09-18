/* The page lock is ref-counted so overlapping dialogs cannot unlock the page early. */

/* EVERY BODY CHILD GOES INERT EXCEPT THE DIALOG, not just `#main` — the skip link, header, menu and footer are `#main`'s SIBLINGS. This is why the lock runs after the dialog renders: it has to know which child to spare. */

/* KEYDOWN IS BOUND TO THE DOCUMENT, not the dialog: the dialog is not focusable, so a click on its padding puts focus on <body>, where an element-bound handler would never see Escape or Tab again. */

import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

let locks = 0;
let inerted: Element[] = [];

function setLock(on: boolean, dialog?: HTMLElement | null): void {
  if (on) {
    if (locks++ > 0) return;
    document.body.style.overflow = 'hidden';
    inerted = Array.from(document.body.children).filter(
      (el) => el !== dialog && !(dialog && el.contains(dialog)) && !el.hasAttribute('inert'),
    );
    for (const el of inerted) {
      el.setAttribute('inert', '');
      /* aria-hidden mirrors `inert` for browsers that do not support `inert`. */
      el.setAttribute('aria-hidden', 'true');
    }
    return;
  }
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;
  document.body.style.overflow = '';
  for (const el of inerted) {
    el.removeAttribute('inert');
    el.removeAttribute('aria-hidden');
  }
  inerted = [];
}

export function useModal(options: {
  open: () => boolean;
  close: () => void;

  initialFocus: () => HTMLElement | null | undefined;
}) {
  const dialog = ref<HTMLElement | null>(null);
  let opener: HTMLElement | null = null;
  let held = false;
  let listening = false;

  function tabbable(): HTMLElement[] {
    if (!dialog.value) return [];
    /* `getClientRects`, not `offsetParent`: `offsetParent` is null for `position: fixed`. */
    return Array.from(dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.getClientRects().length > 0 && !el.hasAttribute('disabled'),
    );
  }

  function onDocumentKeydown(event: KeyboardEvent): void {
    if (!options.open()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      options.close();
      return;
    }
    if (event.key !== 'Tab' || !dialog.value) return;
    const items = tabbable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    /* Focus outside the dialog is reachable: a click on the shell padding parks it on <body>, and without this Tab walks into the page behind. */
    if (!dialog.value.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function listen(on: boolean): void {
    if (on === listening) return;
    listening = on;
    if (on) document.addEventListener('keydown', onDocumentKeydown, true);
    else document.removeEventListener('keydown', onDocumentKeydown, true);
  }

  function release(): void {
    if (!held) return;
    setLock(false);
    listen(false);
    held = false;
  }

  watch(options.open, async (open) => {
    if (open) {
      opener = document.activeElement as HTMLElement | null;
      await nextTick();
      setLock(true, dialog.value);
      listen(true);
      held = true;
      options.initialFocus()?.focus();
      return;
    }
    if (!held) return;
    release();
    if (opener?.isConnected) opener.focus();
    opener = null;
  });

  onBeforeUnmount(release);

  /* Kept for callers that still bind it in a template; the document listener above already covers every case. */
  function onKeydown(_event: KeyboardEvent): void {}

  return { dialog, onKeydown };
}
