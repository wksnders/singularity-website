/* Render-time reading layer only: `programs.ts` and `Character.abilityText` keep the printed tokens verbatim, and any token with no entry here passes through unchanged. */

/** Every key needs a matching entry in `tokenGlyph`, or the token prints as bare text. */
export const iconWords: Record<string, string> = {
  '[P]': 'Power Damage',
  '[A]': 'AI Damage',
  '[C]': 'Corruption Damage',
  '[H]': 'Health',
  '[RCT]': 'Reaction',
  '[AMB]': 'Ambush',
  '[MSK]': 'Mask Effect',

  '[RAM]': 'RAM',
  '[EXE]': 'EXE',
};

const TOKEN = /\[[A-Z]+\]/g;

export const expandIcons = (text: string): string =>
  text.replace(TOKEN, (token) => iconWords[token] ?? token);

/** `word` is set only on a token, and is what a screen reader speaks in place of the glyph. */
export interface GlyphSegment {
  text: string;
  word?: string;
}

/* A token with no entry in `iconWords` stays literal text rather than vanishing. */
export function glyphSegments(text: string): GlyphSegment[] {
  const out: GlyphSegment[] = [];
  let at = 0;
  for (const match of text.matchAll(TOKEN)) {
    const word = iconWords[match[0]];
    if (!word) continue;
    if (match.index > at) out.push({ text: text.slice(at, match.index) });
    out.push({ text: match[0], word });
    at = match.index + match[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}

/** Holds both spellings of every part, so "[P]" and "power damage" are one query — never drop a spelling. */
export const searchHaystack = (parts: (string | null | undefined)[]): string =>
  parts
    .filter((part): part is string => Boolean(part))
    .map((part) => `${part} ${expandIcons(part)}`)
    .join(' ')
    .toLowerCase();

/** A card prints its sub-types as one string, and the rules count them one at a time. */
export const hasSubType = (subType: string | undefined, name: string): boolean =>
  new RegExp(`(^| )${name}( |$)`).test(subType ?? '');

/** One labelled row of a printed card face; `values` is one printed line each. */
export interface CardLine {
  label: string;
  values: string[];
}

/** The query is escaped because players search "[P]", and a number at a query edge must not match inside a longer one: "health 1" is not a hit on "health 11". */
export const matchesQuery = (haystack: string, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (!/^\d/.test(q) && !/\d$/.test(q)) return haystack.includes(q);
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const before = /^\d/.test(q) ? '(?:^|\\D)' : '';
  const after = /\d$/.test(q) ? '(?!\\d)' : '';
  return new RegExp(`${before}${escaped}${after}`).test(haystack);
};
