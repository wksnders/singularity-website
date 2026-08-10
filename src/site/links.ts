/* ============================================================================
   Link helpers.

   `to()` builds every internal link so the active locale is carried without a
   single component knowing about locales.
   `outbound()` resolves the eight external URLs: a real URL when it exists,
   the honest /soon page when it does not. Launch day is a data edit.
   ========================================================================== */

import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router';
import { currentLocale, DEFAULT_LOCALE, LOCALE_ROUTE_PATTERN } from '@/i18n/locales';
import { urls } from '@/data/universe';
import type { OutboundKey } from '@/data/types';

const HAS_LOCALE_SEGMENT = LOCALE_ROUTE_PATTERN.length > 0;

export function to(
  name: string,
  params: Record<string, string> = {},
  extra: { hash?: string; query?: LocationQueryRaw } = {},
): RouteLocationRaw {
  /* `params` is a GETTER, and that is load-bearing.
     site/ia.ts and site/soon.ts call to() at MODULE level, so the nav, the four
     mega panels, the mobile sheet, the footer sitemap and every /soon "also"
     link are built exactly once, when the module is first imported. Reading
     currentLocale eagerly there would freeze the locale at import time and
     every one of those links would lose its prefix the day a second language
     lands. Resolving it lazily means vue-router reads the value when it
     resolves the link — at render — which also makes the links reactive: they
     re-resolve when the locale changes, with no rebuild of the IA. */
  return {
    name,
    get params() {
      if (!HAS_LOCALE_SEGMENT) return { ...params };
      return {
        ...params,
        locale: currentLocale.value === DEFAULT_LOCALE ? '' : currentLocale.value,
      };
    },
    ...extra,
  };
}

/** Which /soon anchor explains each not-yet-live link. */
const SOON_HASH: Record<OutboundKey, string> = {
  buy: '#buy',
  printAndPlay: '#print-and-play',
  tabletopSimulator: '#tts',
  rulebook: '#rulebook',
  discord: '#discord',
  youtube: '#youtube',
  instagram: '#instagram',
  boardgamegeek: '#bgg',
};

export interface ResolvedLink {
  href?: string;
  to?: RouteLocationRaw;
  external: boolean;
}

export function outbound(key: OutboundKey): ResolvedLink {
  const href = urls[key];
  if (href) return { href, external: true };
  return { to: to('soon', {}, { hash: SOON_HASH[key] }), external: false };
}

/** A page that is written but not built yet. */
export function soon(hash: string): RouteLocationRaw {
  return to('soon', {}, { hash });
}
