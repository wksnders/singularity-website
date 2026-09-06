
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
  /* `params` is a getter because ia.ts and soon.ts call to() at module level; reading currentLocale eagerly would freeze the locale at import time. */
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

/** A destination written in a data file: use an outbound key, never a literal URL and never a hand-written /soon link, so the link goes live the day `urls` gains an entry. */
export interface LinkSpec {
  to?: RouteLocationRaw;
  outbound?: OutboundKey;
}

/** The only place the asset host is decided: set VITE_ASSET_BASE only once every file under public/ is actually served from there, or every asset 404s at once. */
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE || import.meta.env.BASE_URL).replace(/\/$/, '');

export function asset(path: string): string {
  return path.startsWith('/') ? `${ASSET_BASE}${path}` : path;
}

const PRESS_WIDTHS = { avif: [560, 1080], webp: [560, 1080] };

const WIDTHS_BY_PREFIX: [string, { avif: number[]; webp: number[] }][] = [
  ['/cards/', CARD_WIDTHS],
  ['/characters/', ART_WIDTHS],
  ['/press/covers/', PRESS_WIDTHS],
];

export function pictureSources(src: string | null): { type: string; srcset: string }[] {
  const widths = src ? WIDTHS_BY_PREFIX.find(([prefix]) => src.startsWith(prefix))?.[1] : undefined;
  const stem = src?.replace(/-\d+\.[a-z0-9]+$/, '');
  if (!src || !widths || !stem || stem === src) return [];

  return (['avif', 'webp'] as const).map((ext) => ({
    type: `image/${ext}`,
    srcset: widths[ext].map((w) => `${asset(`${stem}-${w}.${ext}`)} ${w}w`).join(', '),
  }));
}

/** Data names only the JPEG (`Faction.environment.src`); the WebP pair is derived from the id, so upload all three or the WebP 404s. */
export function environmentSources(id: string): { type: string; srcset: string }[] {
  return [
    {
      type: 'image/webp',
      srcset: [1600, 2400]
        .map((w) => `${asset(`/environments/${id}-${w}.webp`)} ${w}w`)
        .join(', '),
    },
  ];
}

export function outbound(key: OutboundKey): ResolvedLink {
  const href = urls[key];
  if (!href) return { to: to('soon', {}, { hash: SOON_HASH[key] }), external: false };

  /* Files we serve ourselves stay `external` so BaseLink opens them in a new tab and a large download never navigates the page away. */
  return { href: asset(href), external: true };
}

export function soon(hash: string): RouteLocationRaw {
  return to('soon', {}, { hash });
}

/* `external` is required or BaseLink renders the href as plain text instead of an anchor. */
export function mailTo(address: string): ResolvedLink {
  return { href: `mailto:${address}`, external: true };
}

/* Renderers must call this rather than read `spec.to`, which is undefined on an outbound row and silently degrades to plain text. */
export function resolveLink(spec: LinkSpec): ResolvedLink {
  return spec.outbound ? outbound(spec.outbound) : { to: spec.to, external: false };
}

export function tryRouteLink(route: TryRoute): ResolvedLink {
  if (route.outbound) return outbound(route.outbound);
  return { to: to(route.route.name, {}, { hash: route.route.hash }), external: false };
}
