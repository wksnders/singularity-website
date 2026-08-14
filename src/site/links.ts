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
  rulesReference: '#rules-reference',
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

/**
 * A destination written in a DATA file — site/ia.ts, site/soon.ts.
 *
 * `to` for an internal route, `outbound` for a KEY into data/universe.ts.
 * Never a URL, and never a hand-written link to /soon in place of an outbound
 * key: `outbound()` is the one place that knows whether a destination is live,
 * so a key resolves to /soon only while `urls` has none for it, while a
 * hand-written one goes on saying "soon" about a file the site already serves.
 */
export interface LinkSpec {
  to?: RouteLocationRaw;
  outbound?: OutboundKey;
}

/**
 * Join a root-relative `public/` path to the deploy base.
 *
 * The site sits at /singularity-website/ today and at a domain root once the
 * custom domain lands, so a bare "/brands/x.png" written in a data file is a
 * 404 on the live site and correct on localhost — the worst kind of bug, since
 * dev never sees it. Data files write the path as it sits inside public/ and
 * this joins it, which keeps universe.ts free of build config and keeps the
 * base path in the one place it already lives. BASE_URL always ends in a slash.
 *
 * Absolute URLs (Steam, YouTube) pass through untouched.
 */
export function asset(path: string): string {
  return path.startsWith('/') ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;
}

export function outbound(key: OutboundKey): ResolvedLink {
  const href = urls[key];
  if (!href) return { to: to('soon', {}, { hash: SOON_HASH[key] }), external: false };

  /* Root-relative means a file this site serves out of `public/` — the rulebook
     PDF, the print & play zip — so it goes through `asset()`.

     They still resolve as `external`, which is right for a 26MB PDF and a 61MB
     zip: BaseLink gives them target="_blank" + rel="noopener", so a download
     never navigates the page away from whatever the reader was reading. */
  return { href: asset(href), external: true };
}

/** A page that is written but not built yet. */
export function soon(hash: string): RouteLocationRaw {
  return to('soon', {}, { hash });
}

/**
 * Resolve a data-file destination. Renderers go through this rather than
 * reading `spec.to`, which on an `outbound` row is undefined — BaseLink
 * degrades that to plain text, so the link would go missing without erroring.
 */
export function resolveLink(spec: LinkSpec): ResolvedLink {
  return spec.outbound ? outbound(spec.outbound) : { to: spec.to, external: false };
}
