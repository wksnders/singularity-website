/* ============================================================================
   Printed icons → words. The READING layer, applied at render time only:
   `programs.ts` and `Character.abilityText` keep the printed tokens verbatim,
   because errata, proofs and translation all compare against the box.

   Unexpanded, "[P]" is announced as "left bracket P right bracket", so every
   token needs an entry — including the ones whose reading only strips the
   brackets. A token with no entry passes through unchanged rather than being
   guessed at.
   ========================================================================== */

/** Owner-supplied readings. Title case throughout, so a quantity reads the
    same on every card. */
export const iconWords: Record<string, string> = {
  '[P]': 'Power Damage',
  '[A]': 'AI Damage',
  '[C]': 'Corruption Damage',
  '[H]': 'Health',
  '[RCT]': 'Reaction',
  '[AMB]': 'Ambush',
  /* Read as written — the entry exists only to drop the brackets. */
  '[RAM]': 'RAM',
  '[EXE]': 'EXE',
};

/* A newly printed icon is one line here and nothing else. */

/** Every bracket token, whether or not it has a reading. */
const TOKEN = /\[[A-Z]+\]/g;

/** Printed text → spoken text. Unknown tokens are returned untouched. */
export const expandIcons = (text: string): string =>
  text.replace(TOKEN, (token) => iconWords[token] ?? token);

/**
 * Lower-cased, holding BOTH spellings of every part, so "[P]" and "power
 * damage" are one query. If the catalogue ever makes per-keystroke rebuilds too
 * slow, memoise — do not drop a spelling.
 */
export const searchHaystack = (parts: (string | null | undefined)[]): string =>
  parts
    .filter((part): part is string => Boolean(part))
    .map((part) => `${part} ${expandIcons(part)}`)
    .join(' ')
    .toLowerCase();

/** One labelled row of a printed card face; `values` is one printed line each. */
export interface CardLine {
  label: string;
  values: string[];
}

/**
 * Does this haystack answer this query?
 *
 * Substring, except that a number at the edge of a query must not match inside
 * a longer one: "health 1" is not a hit on "health 11", and "11" is not a hit
 * on "111". Only then is the query treated as a pattern, and it is escaped —
 * players search "[P]", which is a character class if it reaches a regex raw.
 */
export const matchesQuery = (haystack: string, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (!/^\d/.test(q) && !/\d$/.test(q)) return haystack.includes(q);
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const before = /^\d/.test(q) ? '(?:^|\\D)' : '';
  const after = /\d$/.test(q) ? '(?!\\d)' : '';
  return new RegExp(`${before}${escaped}${after}`).test(haystack);
};
