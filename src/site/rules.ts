/* ============================================================================
   RULES REFERENCE — the glossary in `content/<locale>/rules.json`.

   Every `id` is a public URL (`/learn/rules#crash`)
   ========================================================================== */

import { getCollection } from '@/content';
import { expandIcons, searchHaystack } from '@/site/cardText';

/** Not a glossary term: the page renders it as the standfirst. */
export const INTRO_ID = 'using-the-rules-reference';

export type BlockKind = 'text' | 'note' | 'rule' | 'example';

/** One record in `content/<locale>/rules.json`. */
export interface RuleSource {
  id: string;
  title: string;
  blocks: { kind: BlockKind; text: string; items?: string[] }[];
}

export interface RuleBlock {
  kind: BlockKind;
  html: string;
  items: string[];
}

export interface RuleEntry {
  id: string;
  title: string;
  letter: string;
  blocks: RuleBlock[];
  haystack: string;
}

/** Where the document spells a cross-reference differently from the title it
    points at. Key is the spelling in the text, value is the printed title. */
const REF_ALIASES: Record<string, string> = {
  'moving damage and other tokens': 'moving damage or other tokens',
  'initialize & update': 'initialize and update',
};

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};
const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (c) => ESCAPES[c]);

const bareTitle = (title: string) => title.replace(/\s*\[[A-Za-z]+\]/g, '').toLowerCase();

const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Printed verbatim, as the cards print them, with the reading from
    `cardText.ts` hidden alongside for screen readers. */
function markTokens(html: string): string {
  return html.replace(/\[[A-Z]+\]/g, (token) => {
    const word = expandIcons(token);
    if (word === token) return token;
    return `<span aria-hidden="true">${token}</span><span class="l-sr-only">${word}</span>`;
  });
}

/**
 * Cross-references, matched after the word "see".
 */
function linkRefs(html: string, targets: Map<string, string>): string {
  let out = html;
  for (const [name, id] of targets) {
    /* The haystack is already escaped*/
    const pattern = new RegExp(`(\\bsee\\s+(?:the\\s+)?['‘"]?)(${escapeRe(escapeHtml(name))})`, 'gi');
    out = out.replace(pattern, (_all, lead: string, label: string) => {
      return `${lead}<a class="c-rules__ref" href="#${id}">${label}</a>`;
    });
  }
  return out;
}

const render = (text: string, targets: Map<string, string>) =>
  markTokens(linkRefs(escapeHtml(text), targets));

/**
 * Every entry, in printed order.
 *
 * Call this inside a `computed`: it reads the active locale
 */
export function rulesEntries(): RuleEntry[] {
  const sources = getCollection<RuleSource>('rules');

  /* Longest first: a shorter title can be a prefix of a longer one. */
  const targets = new Map<string, string>();
  const byTitle = new Map(sources.map((source) => [bareTitle(source.title), source.id]));
  for (const [alias, actual] of Object.entries(REF_ALIASES)) {
    const id = byTitle.get(actual);
    if (id) byTitle.set(alias, id);
  }
  for (const name of [...byTitle.keys()].sort((a, b) => b.length - a.length)) {
    targets.set(name, byTitle.get(name) as string);
  }

  return sources.map((source): RuleEntry => {
    const lines = source.blocks.flatMap((block) => [block.text, ...(block.items ?? [])]);
    return {
      id: source.id,
      title: source.title,
      letter: source.title.charAt(0).toUpperCase(),
      blocks: source.blocks.map((block) => ({
        kind: block.kind,
        html: render(block.text, targets),
        items: (block.items ?? []).map((item) => render(item, targets)),
      })),
      haystack: searchHaystack([source.title, ...lines]),
    };
  });
}

export interface RuleLetter {
  /** Public anchor for the band: `#letter-a`. */
  id: string;
  letter: string;
  entries: RuleEntry[];
}

export function rulesLetters(entries: RuleEntry[]): RuleLetter[] {
  const bands: RuleLetter[] = [];
  for (const entry of entries) {
    if (entry.id === INTRO_ID) continue;
    const last = bands[bands.length - 1];
    if (last && last.letter === entry.letter) last.entries.push(entry);
    else bands.push({ id: `letter-${entry.letter.toLowerCase()}`, letter: entry.letter, entries: [entry] });
  }
  return bands;
}

/**
 * Dev-only shape check, like `assertFaqShape()`. Nothing type-checks a JSON
 * file and every failure here is silent at runtime: a duplicate id makes one
 * anchor unreachable, and an entry out of alphabetical order splits its letter
 * into two bands the A–Z index cannot both point at.
 */
export function assertRulesShape(entries: RuleEntry[]): void {
  if (!import.meta.env.DEV) return;

  const seen = new Set<string>();
  for (const entry of entries) {
    const where = `rules.json#${entry.id || '(no id)'}`;
    if (!entry.id) console.warn('[rules] an entry has no id');
    else if (seen.has(entry.id)) console.warn(`[rules] ${where}: duplicate id`);
    else seen.add(entry.id);

    if (!entry.title) console.warn(`[rules] ${where}: no title`);
    if (!entry.blocks.length) console.warn(`[rules] ${where}: no blocks`);
  }

  if (!seen.has(INTRO_ID)) console.warn(`[rules] no "${INTRO_ID}" entry to open the page with`);

  const letters = rulesLetters(entries).map((band) => band.letter);
  const repeated = letters.filter((letter, i) => letters.indexOf(letter) !== i);
  if (repeated.length) {
    console.warn(`[rules] entries out of alphabetical order, letters split: ${repeated.join(', ')}`);
  }
}
