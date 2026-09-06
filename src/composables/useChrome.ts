// Shared chrome state: `wide` is a matchMedia ref because the desktop nav and mobile sheet are separate components; per-component queries use useMediaQuery.

import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';

const WIDE_QUERY = '(min-width: 900px)';
const SOLID_AT = 80;
const RETRACT_AFTER = 240;

const PAST_HERO_LOGO = 0.38;

const wide = ref(false);
const scrolled = ref(false);
const pastHeroLogo = ref(false);
const navHidden = ref(false);
const megaOpen = ref<string | null>(null);
const menuOpen = ref(false);

let listeners = 0;
let lastY = 0;
let media: MediaQueryList | null = null;

function closeAll(): void {
  megaOpen.value = null;
}

function onMedia(): void {
  wide.value = Boolean(media?.matches);
  menuOpen.value = false;
}

function onScroll(): void {
  const y = Math.max(0, window.scrollY);
  scrolled.value = y > SOLID_AT;
  pastHeroLogo.value = y > window.innerHeight * PAST_HERO_LOGO;
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
  if (!open && !menuOpen.value) return;
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
    pastHeroLogo: readonly(pastHeroLogo),
    navHidden: readonly(navHidden),
    megaOpen: readonly(megaOpen),
    menuOpen,
    openMega(key: string) {
      if (wide.value && megaOpen.value !== key) {
        megaOpen.value = key;
      }
    },
    toggleMega(key: string) {
      megaOpen.value = megaOpen.value === key ? null : key;
    },
    closeMega() {
      megaOpen.value = null;
    },
    toggleMenu() {
      menuOpen.value = !menuOpen.value;
    },
    closeAll,
  };
}
