/* ============================================================================
   Chrome state: one composable, shared by header and mobile sheet.

   Behaviours ported from the mock:
   - `wide` comes from matchMedia, not a CSS breakpoint, because the desktop nav
     and the mobile sheet are different components.
   - The bar solidifies past 80px and retracts on scroll-down past 240px.
   - One mega panel open at a time; Escape closes and returns focus.
   ========================================================================== */

import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';

const WIDE_QUERY = '(min-width: 900px)';
const SOLID_AT = 80;
const RETRACT_AFTER = 240;

const wide = ref(false);
const scrolled = ref(false);
const navHidden = ref(false);
const megaOpen = ref<string | null>(null);
const menuOpen = ref(false);
const playOpen = ref(false);

let listeners = 0;
let lastY = 0;
let media: MediaQueryList | null = null;

function closeAll(): void {
  megaOpen.value = null;
  playOpen.value = false;
}

function onMedia(): void {
  wide.value = Boolean(media?.matches);
  menuOpen.value = false;
}

function onScroll(): void {
  const y = Math.max(0, window.scrollY);
  scrolled.value = y > SOLID_AT;
  const down = y > lastY + 6;
  const up = y < lastY - 6;
  if (down && y > RETRACT_AFTER && !menuOpen.value && !megaOpen.value) navHidden.value = true;
  else if (up || y < RETRACT_AFTER) navHidden.value = false;
  if (down && megaOpen.value) megaOpen.value = null;
  lastY = y;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;
  const open = megaOpen.value;
  if (!open && !playOpen.value && !menuOpen.value) return;
  closeAll();
  menuOpen.value = false;
  if (open) {
    const trigger = document.querySelector<HTMLElement>(`[data-mega-trigger="${open}"]`);
    trigger?.focus();
  }
}

export function useChrome() {
  onMounted(() => {
    listeners += 1;
    if (listeners > 1) return;
    media = window.matchMedia(WIDE_QUERY);
    media.addEventListener('change', onMedia);
    onMedia();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeydown);
    onScroll();
  });

  onBeforeUnmount(() => {
    listeners -= 1;
    if (listeners > 0) return;
    media?.removeEventListener('change', onMedia);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('keydown', onKeydown);
  });

  return {
    wide: readonly(wide),
    scrolled: readonly(scrolled),
    navHidden: readonly(navHidden),
    megaOpen: readonly(megaOpen),
    menuOpen,
    playOpen,
    /** Hover-open, desktop only. */
    openMega(key: string) {
      if (wide.value && megaOpen.value !== key) {
        megaOpen.value = key;
        playOpen.value = false;
      }
    },
    toggleMega(key: string) {
      megaOpen.value = megaOpen.value === key ? null : key;
      playOpen.value = false;
    },
    closeMega() {
      megaOpen.value = null;
    },
    togglePlay() {
      playOpen.value = !playOpen.value;
      megaOpen.value = null;
    },
    toggleMenu() {
      menuOpen.value = !menuOpen.value;
      playOpen.value = false;
    },
    closeAll,
  };
}
