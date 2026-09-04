/* ============================================================================
   Link helpers.

   `to()` carries the active locale so no component has to know about locales.
   `outbound()` resolves an external key to a real URL when there is one and to
   /soon when there is not, so launch day is a data edit.
   ========================================================================== */

import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router';
import { currentLocale, DEFAULT_LOCALE, LOCALE_ROUTE_PATTERN } from '@/i18n/locales';
import { urls } from '@/data/universe';
import { CARD_WIDTHS } from '@/data/programs';
import { ART_WIDTHS } from '@/data/universe';
import type { OutboundKey, TryRoute } from '@/data/types';

const HAS_LOCALE_SEGMENT = LOCALE_ROUTE_PATTERN.length > 0;

export function to(
  name: string,
  params: Record<string, string> = {},
  extra: { hash?: string; query?: LocationQueryRaw } = {},
): RouteLocationRaw {
  /* `params` is a GETTER, and that is load-bearing. ia.ts and soon.ts call to()
     at MODULE level, so reading currentLocale eagerly would freeze the locale at
     import time and every nav, panel, sheet and footer link would lose its
     prefix the day a second language lands. */
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

const SOON_HASH: Record<OutboundKey, string> = {
  buy: '#buy',
  printAndPlay: '#print-and-play',
  tabletopSimulator: '#tts',
  rulebook: '#rulebook',
  rulesReference: '#rules-reference',
  discord: '#discord',
  youtube: '#youtube',
  instagram: '#instagram',
  twitter: '#twitter',
  boardgamegeek: '#bgg',
};

export interface ResolvedLink {
  href?: string;
  to?: RouteLocationRaw;
  external: boolean;
}

/**
 * A destination written in a DATA file. Never a URL, and never a hand-written
 * link to /soon in place of an outbound key: a key stops saying "soon" the day
 * `urls` gains one, a hand-written link never does.
 */
export interface LinkSpec {
  to?: RouteLocationRaw;
  outbound?: OutboundKey;
}

/**
 * Join a root-relative `public/` path to wherever public files are served from.
 * A bare "/brands/x.png" from a data file is correct on localhost and a 404 on
 * the live site — the worst kind of bug, because dev never sees it. Absolute
 * URLs pass through.
 *
 * This is the ONLY place that decides the host, so VITE_ASSET_BASE moves every
 * file under public/ to a CDN without touching a data file or a component. Set
 * it only once those files are actually uploaded: it is a promise about where
 * they are, and a wrong one 404s art everywhere at once.
 */
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE || import.meta.env.BASE_URL).replace(/\/$/, '');

export function asset(path: string): string {
  return path.startsWith('/') ? `${ASSET_BASE}${path}` : path;
}

const PRESS_WIDTHS = { avif: [560, 1080], webp: [560, 1080] };

const RUNGS: [string, { avif: number[]; webp: number[] }][] = [
  ['/cards/', CARD_WIDTHS],
  ['/characters/', ART_WIDTHS],
  ['/press/covers/', PRESS_WIDTHS],
];

export function pictureSources(src: string | null): { type: string; srcset: string }[] {
  const widths = src ? RUNGS.find(([prefix]) => src.startsWith(prefix))?.[1] : undefined;
  const stem = src?.replace(/-\d+\.[a-z0-9]+$/, '');
  if (!src || !widths || !stem || stem === src) return [];

  return (['avif', 'webp'] as const).map((ext) => ({
    type: `image/${ext}`,
    srcset: widths[ext].map((w) => `${asset(`${stem}-${w}.${ext}`)} ${w}w`).join(', '),
  }));
}

export function outbound(key: OutboundKey): ResolvedLink {
  const href = urls[key];
  if (!href) return { to: to('soon', {}, { hash: SOON_HASH[key] }), external: false };

  /* Files we serve ourselves stay `external` on purpose: BaseLink then opens
     them in a new tab, so a 60MB download never navigates the page away. */
  return { href: asset(href), external: true };
}

export function soon(hash: string): RouteLocationRaw {
  return to('soon', {}, { hash });
}

/* `external` so BaseLink renders an anchor at all: an href with external false
   falls through its template to plain text. */
export function mailTo(address: string): ResolvedLink {
  return { href: `mailto:${address}`, external: true };
}

/* Renderers go through this rather than reading `spec.to`, which on an
   `outbound` row is undefined BaseLink degrades that to plain text, so the
   link goes missing without erroring. */
export function resolveLink(spec: LinkSpec): ResolvedLink {
  return spec.outbound ? outbound(spec.outbound) : { to: spec.to, external: false };
}

export function tryRouteLink(route: TryRoute): ResolvedLink {
  if (route.outbound) return outbound(route.outbound);
  return { to: to(route.route.name, {}, { hash: route.route.hash }), external: false };
}
