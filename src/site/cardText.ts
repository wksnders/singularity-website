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

/** Names, plus each one with its separators stripped, so "Ri • Se" answers to "rise" and "Mega Byte" to "megabyte". */
export const nameHaystack = (parts: (string | null | undefined)[]): string => {
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    out.push(part);
    const squashed = part.replace(/[^a-zA-Z0-9]+/g, '');
    if (squashed && squashed.toLowerCase() !== part.toLowerCase()) out.push(squashed);
  }
  return searchHaystack(out);
};

/** Letters, digits and single spaces only; anything else is a printed token like "[P]" or "S.P.4.4.M.", where word edges do not apply. */
const WORDY = /^[a-z0-9]+(?: [a-z0-9]+)*$/;

/** The inflections a printed rule uses, so "heal" finds "heals" and "healing" but never "health"; the bare `d` needs a term already ending in `e`, or "ai" would hit "aid". */
const tailOf = (term: string) => (term.endsWith('e') ? "(?:s|d|es|ed|ing|'s)?" : "(?:s|es|ed|ing|'s)?");

/** One term the reader typed. `phrase` came from quotes and is verbatim — no inflections, no name prefix; `exclude` came from a leading minus. */
export interface QueryTerm {
  text: string;
  phrase: boolean;
  exclude: boolean;
}

/* An unclosed quote falls to `\S+`, so a term is still parsed while the reader is mid-phrase. */
const TERMS = /-?"[^"]*"?|\S+/g;

/** Google's shorthand, which is what readers try first: quotes are verbatim, a leading minus removes, and every other term is required. */
export function parseQuery(query: string): QueryTerm[] {
  const out: QueryTerm[] = [];
  for (const raw of query.toLowerCase().match(TERMS) ?? []) {
    const exclude = raw.startsWith('-');
    const body = exclude ? raw.slice(1) : raw;
    const phrase = body.startsWith('"');
    const text = (phrase ? body.replace(/^"|"$/g, '') : body).trim();
    if (text) out.push({ text, phrase, exclude });
  }
  return out;
}

/** False for a printed token like "[P]", which is matched as a raw substring because word edges do not apply to it. */
export const isWordTerm = (term: QueryTerm): boolean => WORDY.test(term.text);

const SUFFIXES = ["'s", 'ing', 'es', 'ed', 'd', 's'];

/* These three can hide a dropped `e`, so "moving" and "moved" both have to reach "move". */
const RESTORES_E = new Set(['ing', 'ed', 'es']);

/** EVERY stem a query word could have come from, keeping three letters each, or "ring" would go looking for "r". */
function stemsOf(term: string): string[] {
  const out: string[] = [];
  for (const suffix of SUFFIXES) {
    if (!term.endsWith(suffix) || term.length - suffix.length < 3) continue;
    const stem = term.slice(0, -suffix.length);
    out.push(stem);
    if (RESTORES_E.has(suffix) && !stem.endsWith('e')) out.push(`${stem}e`);
  }
  return [...new Set(out)];
}

/** The pattern one term is tested for, so a highlighter marks what matched and nothing else; the caller supplies its own word edges. */
export function termPattern(term: QueryTerm, loose = false): string {
  if (loose || !isWordTerm(term)) return term.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (term.phrase) return term.text;
  const forms = [...new Set([term.text, ...stemsOf(term.text)])];
  const alts = forms.map((form) => `${form}${tailOf(form)}`);
  return alts.length > 1 ? `(?:${alts.join('|')})` : alts[0];
}

function hits(haystack: string, names: string, term: QueryTerm, loose: boolean): boolean {
  const q = term.text;
  if (loose) return haystack.includes(q) || names.includes(q);
  if (!isWordTerm(term)) return haystack.includes(q);
  if (new RegExp(`(^|[^a-z0-9])${termPattern(term)}([^a-z0-9]|$)`).test(haystack)) return true;
  /* A quoted term is verbatim, so it never reaches for the half-typed-name prefix. */
  return !term.phrase && Boolean(names) && new RegExp(`(^|[^a-z0-9])${q}`).test(names);
}

/** Every plain term must hit and no minus term may; `names` is matched by word PREFIX so a half-typed name still finds its card, `haystack` only on whole words, and `loose` is the substring pass a caller runs when the strict one found nothing. */
export const matchesQuery = (haystack: string, query: string, names = '', loose = false): boolean =>
  parseQuery(query).every((term) => hits(haystack, names, term, loose) !== term.exclude);
