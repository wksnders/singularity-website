// Reference spec: docs/architecture/modules.md#faq
// A question `id` is a public URL (`#faq-<id>`): renaming one breaks every link already pasted.

import type { RouteLocationRaw } from 'vue-router';
import { docHtml, getCollection, getDoc, t } from '@/content';
import { game } from '@/data/universe';
import { mailTo, outbound, to } from '@/site/links';
import type { LinkSpec, ResolvedLink } from '@/site/links';

export interface FaqGroup {
  /** Public anchor for the band. Never renamed. */
  id: string;

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

/** Keys resolve lazily on read: an eager map would freeze the locale the day a second language lands. */
const LINK_TARGETS: Record<string, () => RouteLocationRaw | ResolvedLink> = {
  buy: () => outbound('buy'),
  /* Deliberate duplicate: contents, price and compatibility are all the store's, so those questions exit where `buy` does. */
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

/** An unknown key returns null, so a content typo costs one link rather than the page. */
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

  body?: string;

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

  text: string;

  haystack: string;
  keywords: string[];
  link: FaqLink | null;

  linkKey: string;

  bodySlug: string;

  position: number;
  /** Editorial state, deliberately never rendered to readers. */
  reconfirm: boolean;
}

/* A ui.json answer is interpolated into HTML raw, so it is escaped here; markdown bodies are escaped by markdown-it. */
const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};
const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (c) => ESCAPES[c]);

function plain(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function answerHtmlOf(source: FaqSource): string {
  /* Same statement as /community#team; two copies of the AI claim is two things to keep in step. */
  if (source.sourceKey) return `<p>${escapeHtml(t(source.sourceKey))}</p>`;

  if (source.body) return docHtml(getDoc(source.body));
  return source.answer ? `<p>${escapeHtml(source.answer)}</p>` : '';
}

/** Call this inside a `computed`: it reads the active locale, so a setup-time cache keeps serving the old language. */
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

/** Dev-only: every shape error in `faq.json` is silent at runtime, so this is the only place it surfaces. */
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
