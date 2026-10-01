// Shared chrome state: `wide` is a matchMedia ref because the desktop nav and mobile sheet are separate components; per-component queries use useMediaQuery.

import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';

/* SiteHeader's CSS mirrors this breakpoint. */
const WIDE_QUERY = '(min-width: 900px)';
const SOLID_AT = 80;
const RETRACT_AFTER = 240;
/** Ms from app mount: the nav shows even if the hero never reports (slow or failed Home chunk). */
const INTRO_FAILSAFE = 1600;

const wide = ref(false);
const scrolled = ref(false);
/* Set only by the Home hero (reportHomeHero): it pins while it splits, so no scroll offset can tell when it has left. */
const heroGone = ref(false);
const heroMarkGone = ref(false);
let heroHolds = false;
const navEcho = ref<string | null>(null);
/* Starts at 'wait': on a cold Home load the header paints before the hero mounts and reports. A hash deep link never hides it. */
const heroIntro = ref<'wait' | 'play' | null>(window.location.hash ? null : 'wait');
/* Once over, the entrance never hides or dims the nav again this page load. */
let introOver = heroIntro.value === null;
const navHidden = ref(false);
const megaOpen = ref<string | null>(null);
const menuOpen = ref(false);

let listeners = 0;
let lastY = 0;
let lastDown = false;
let media: MediaQueryList | null = null;

function closeAll(): void {
  megaOpen.value = null;
}

function onMedia(): void {
  wide.value = Boolean(media?.matches);
  menuOpen.value = false;
}

const mayRetract = (y: number) => y > RETRACT_AFTER && !heroHolds && !menuOpen.value && !megaOpen.value;

function onScroll(): void {
  const y = Math.max(0, window.scrollY);
  scrolled.value = y > SOLID_AT;
  const down = y > lastY + 6;
  const up = y < lastY - 6;
  if (down && mayRetract(y)) navHidden.value = true;
  else if (up || y < RETRACT_AFTER || heroHolds) navHidden.value = false;
  if (down && megaOpen.value) megaOpen.value = null;
  if (down || up) lastDown = down;
  lastY = y;
}

export function reportHomeHero(gone: boolean, markGone: boolean): void {
  heroGone.value = gone;
  heroMarkGone.value = markGone;
  const released = heroHolds && gone;
  heroHolds = !gone;
  if (heroHolds) navHidden.value = false;
  /* A single jump past the hero is judged by onScroll before the hero reports it gone: retract here too. */
  if (released && lastDown && mayRetract(lastY)) navHidden.value = true;
}

export function releaseHomeHero(): void {
  reportHomeHero(false, false);
  heroHolds = false;
  navEcho.value = null;
  endHeroIntro();
}

export function reportHeroIntro(phase: 'wait' | 'play' | null): void {
  if (introOver) return;
  heroIntro.value = phase;
  if (phase === null) introOver = true;
}

export function endHeroIntro(): void {
  introOver = true;
  heroIntro.value = null;
}

export function echoNav(key: string | null): void {
  navEcho.value = key;
}

/* Mega panel only: the mobile sheet's Escape belongs to useModal, and handling it here too would close it twice. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;
  const open = megaOpen.value;
  if (!open) return;
  closeAll();
  document.querySelector<HTMLElement>(`[data-mega-trigger="${open}"]`)?.focus();
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
    setTimeout(() => {
      if (heroIntro.value === 'wait') endHeroIntro();
    }, INTRO_FAILSAFE);
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
    heroGone: readonly(heroGone),
    heroMarkGone: readonly(heroMarkGone),
    navEcho: readonly(navEcho),
    heroIntro: readonly(heroIntro),
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
