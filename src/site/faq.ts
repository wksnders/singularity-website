/* ============================================================================
   FAQ — the group taxonomy and the link table.

   Two things live here and nothing else:

   1. GROUPS, in page order. The array's order IS the order of the bands, and
      the ordinals ("01 / 06") are computed from its length. Reordering the
      page is a reordering of this array.
   2. LINK KEYS. A question may carry one link out. Front matter names a key
      from the table below; this file resolves it to a route. Targets are not
      writable from `content/`, so translating a question can never repoint it
      at a page that does not exist.

   The questions themselves are `content/<locale>/faq.json` — one ordered list
   of records, because that is what they are: a sentence with an id, a group,
   some search aliases and at most one link. Array order is page order within a
   group. An `id` is a public URL (`#faq-<id>`) under rule 5; renaming one
   breaks every link anyone has ever pasted.

   An answer that outgrows a sentence names a markdown file instead
   (`"body": "faq/contents"` → `content/<locale>/faq/contents.md`). That is the
   exception, not the direction of travel: forty-two files of six-line front
   matter wrapped around one sentence each is what this replaced.
   ========================================================================== */

import type { RouteLocationRaw } from 'vue-router';
import { docHtml, getCollection, getDoc, t } from '@/content';
import { game } from '@/data/universe';
import { mailTo, outbound, to } from '@/site/links';
import type { LinkSpec, ResolvedLink } from '@/site/links';

export interface FaqGroup {
  /** Public anchor for the band. Never renamed. */
  id: string;
  /** Exit link at the foot of the band. */
  exit: LinkSpec;
}

/** Order is page order. Labels are `faq.groups.<id>.*` in ui.json. */
export const faqGroups: FaqGroup[] = [
  { id: 'buying', exit: { outbound: 'buy' } },
  { id: 'box', exit: { to: to('cards') } },
  { id: 'playing', exit: { to: to('learn', {}, { hash: '#paths' }) } },
  { id: 'solo', exit: { to: to('incursions') } },
  { id: 'digital', exit: { to: to('learn', {}, { hash: '#try' }) } },
  { id: 'help', exit: { to: to('learn') } },
];

/**
 * Every destination a question is allowed to link to.
 *
 * A key resolves lazily, on read, for the reason spelled out in `links.ts`:
 * `to()` returns a params getter so the locale is resolved at render. Building
 * the map eagerly at module level would be fine today and would freeze the
 * locale the day a second language lands.
 */
const LINK_TARGETS: Record<string, () => RouteLocationRaw | ResolvedLink> = {
  buy: () => outbound('buy'),
  /* Not a typo: contents, price and compatibility are all the store's, so the
     five questions that ask for any of them exit to the same place `buy` does. */
  products: () => outbound('buy'),
  enquiries: () => mailTo(game.enquiriesEmail),
  rulesReference: () => to('rules'),
  printAndPlay: () => outbound('printAndPlay'),
  tabletopSimulator: () => outbound('tabletopSimulator'),
  cards: () => to('cards'),
  incursions: () => to('incursions'),
  universal: () => to('universal'),
  learnPaths: () => to('learn', {}, { hash: '#paths' }),
  learnModes: () => to('learn', {}, { hash: '#modes' }),
  learnVideos: () => to('learn', {}, { hash: '#videos' }),
  support: () => to('community', {}, { hash: '#support' }),
  discord: () => to('community', {}, { hash: '#discord' }),
  press: () => to('community', {}, { hash: '#press' }),
};

/**
 * Resolve a front-matter `linkKey`. An unknown key returns null rather than
 * throwing: a typo in a content file should cost the reader one link, not the
 * page. `assertFaqShape()` names it in the console in dev.
 */
function linkTarget(key: string): RouteLocationRaw | ResolvedLink | null {
  return LINK_TARGETS[key]?.() ?? null;
}

export interface FaqLink {
  label: string;
  to?: RouteLocationRaw;
  link?: ResolvedLink;
}

/** One record in `content/<locale>/faq.json`. */
export interface FaqSource {
  id: string;
  group: string;
  question: string;
  /** The answer, inline. Exactly one of answer / body / sourceKey. */
  answer?: string;
  /** Slug of a markdown file, for an answer that needs more than a sentence. */
  body?: string;
  /** A ui.json key, for an answer that must stay identical to another page. */
  sourceKey?: string;
  link?: { key: string; label: string };
  keywords?: string[];
  reconfirm?: boolean;
}

export interface FaqEntry {
  /** Public: the anchor is `faq-<id>`. */
  id: string;
  anchor: string;
  group: string;
  question: string;
  /** Rendered markdown. Trusted: the source is a file in this repository. */
  answerHtml: string;
  /** Lowercased question + answer, tags stripped. What the reader can see. */
  text: string;
  /** `text` plus the keywords. What a search actually matches against. */
  haystack: string;
  keywords: string[];
  link: FaqLink | null;
  /** Kept so the dev assertion can tell "no link" from "link key misspelt". */
  linkKey: string;
  /** Kept for the same reason: a `body` that resolved to nothing. */
  bodySlug: string;
  /** Position in the file. Only the sort reads it. */
  position: number;
  /**
   * The answer is a 2023 campaign answer that has been rewritten but not
   * reconfirmed with the owner. Editorial state — it is deliberately NOT
   * rendered. See the launch-day switch.
   */
  reconfirm: boolean;
}

/* The one answer that comes from ui.json rather than markdown is interpolated
   into HTML, so it is escaped on the way in. Markdown bodies go through
   markdown-it, which does this itself; a bare ui string does not, and a
   translator writing "art & writing" should not be able to break the page. */
const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};
const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (c) => ESCAPES[c]);

/** Rendered markdown minus its tags, for search. */
function plain(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Three ways to supply an answer, each with a reason. Exactly one applies. */
function answerHtmlOf(source: FaqSource): string {
  /* Shared with another page — /community#team shows the same statement, and
     two copies of a claim about AI is two things to keep in step. */
  if (source.sourceKey) return `<p>${escapeHtml(t(source.sourceKey))}</p>`;
  /* Longer than a sentence: a list, or more than one paragraph. */
  if (source.body) return docHtml(getDoc(source.body));
  return source.answer ? `<p>${escapeHtml(source.answer)}</p>` : '';
}

/**
 * Every question, in page order: group order from `faqGroups`, then the order
 * the records sit in the file.
 *
 * Call this inside a `computed`. It reads the active locale, so a component
 * that cached the result at setup would keep serving English after a switch.
 */
export function faqEntries(): FaqEntry[] {
  const groupOrder = new Map(faqGroups.map((group, i) => [group.id, i]));

  const entries = getCollection<FaqSource>('faq').map((source, i): FaqEntry => {
    const answerHtml = answerHtmlOf(source);
    const keywords = source.keywords ?? [];
    const linkKey = source.link?.key ?? '';
    const target = linkKey ? linkTarget(linkKey) : null;
    const text = `${source.question} ${plain(answerHtml)}`.toLowerCase();

    return {
      id: source.id,
      anchor: `faq-${source.id}`,
      group: source.group,
      question: source.question,
      answerHtml,
      text,
      haystack: `${text} ${keywords.join(' ').toLowerCase()}`,
      keywords,
      linkKey,
      bodySlug: source.body ?? '',
      link:
        target === null
          ? null
          : {
              label: source.link?.label ?? '',
              ...(isResolvedLink(target) ? { link: target } : { to: target }),
            },
      reconfirm: source.reconfirm === true,
      /* File position, kept only to make the sort stable across groups. */
      position: i,
    };
  });

  return entries.sort(
    (a, b) =>
      (groupOrder.get(a.group) ?? Number.MAX_SAFE_INTEGER) -
        (groupOrder.get(b.group) ?? Number.MAX_SAFE_INTEGER) || a.position - b.position,
  );
}

function isResolvedLink(value: RouteLocationRaw | ResolvedLink): value is ResolvedLink {
  return typeof value === 'object' && value !== null && 'external' in value;
}

/**
 * Dev-only shape check, in the spirit of `assertCharacterShape()`. Nothing
 * type-checks a JSON file, and every failure below is silent at runtime: an
 * unknown `group` drops a question off the site with no error, a mistyped
 * `link.key` quietly removes its one route out, and a `body` pointing at a
 * file that does not exist renders an empty answer under a real question.
 */
export function assertFaqShape(entries: FaqEntry[]): void {
  if (!import.meta.env.DEV) return;

  const known = new Set(faqGroups.map((group) => group.id));
  const seen = new Set<string>();

  for (const entry of entries) {
    const where = `faq.json#${entry.id || '(no id)'}`;
    if (!entry.id) console.warn(`[faq] an entry has no id`);
    else if (seen.has(entry.id)) console.warn(`[faq] ${where}: duplicate id`);
    else seen.add(entry.id);

    if (!entry.question) console.warn(`[faq] ${where}: no question`);
    if (!known.has(entry.group)) console.warn(`[faq] ${where}: unknown group "${entry.group}"`);
    if (!entry.answerHtml) {
      console.warn(
        entry.bodySlug
          ? `[faq] ${where}: body "${entry.bodySlug}" has no markdown file`
          : `[faq] ${where}: no answer, body or sourceKey`,
      );
    }
    if (entry.link && !entry.link.label) console.warn(`[faq] ${where}: link with no label`);
    if (entry.linkKey && !entry.link) {
      console.warn(`[faq] ${where}: unknown link key "${entry.linkKey}"`);
    }
    if (!entry.keywords.length) console.warn(`[faq] ${where}: no search keywords`);
  }

  const orphans = new Set(faqGroups.map((group) => group.id));
  for (const entry of entries) orphans.delete(entry.group);
  if (orphans.size) console.warn(`[faq] groups with no questions: ${[...orphans].join(', ')}`);

  const reconfirm = entries.filter((entry) => entry.reconfirm).map((entry) => entry.id);
  if (reconfirm.length) console.warn(`[faq] reconfirm before launch: ${reconfirm.join(', ')}`);
}
