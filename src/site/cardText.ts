/* Render-time reading layer only: `programs.ts` and `Character.abilityText` keep the printed tokens verbatim, and any token with no entry here passes through unchanged. */

/** Title case throughout, so a quantity reads the same on every card. */
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
