/* Every entry `id` is a published URL fragment (`/learn/rules#crash`): renaming one breaks every printed and pasted link. */

import { getCollection } from '@/content';
import { expandIcons, matchesQuery } from '@/site/cardText';
import { brandById, programs } from '@/data/universe';
import type { Program } from '@/data/types';

export const INTRO_ID = 'using-the-rules-reference';

export type BlockKind = 'text' | 'note' | 'rule' | 'example';

export type RuleClass =
  | 'procedure'
  | 'states'
  | 'tokens'
  | 'keyword'
  | 'typesAndZones'
  | 'timing';

export interface RuleSource {
  id: string;
  title: string;
  cls: RuleClass[];
  pointer?: boolean;
  /** Aliases are search synonyms only, never displayed. */
  aliases?: string[];
  related?: string[];

  todo?: string;
  blocks: { kind: BlockKind; text: string; items?: string[] }[];
}

export interface RuleSeg {
  key: number;
  kind: 'text' | 'token' | 'ref' | 'card' | 'guide';
  text: string;
  hit: boolean;
  word?: string;
  target?: string;
}

export interface RuleLine {
  segs: RuleSeg[];
  items: RuleSeg[][];
}

export interface RuleBlock extends RuleLine {
  kind: BlockKind;
}

export interface RuleEntry {
  id: string;
  title: string;

  token: string;

  bare: string;
  cls: RuleClass[];

  pointer: boolean;
  letter: string;
  blocks: RuleBlock[];
  related: { id: string; label: string }[];
  redirect: { id: string; label: string } | null;
  todo: string;
  haystack: string;
}

const NEVER_LINK = new Set(['may', 'when', 'then', 'deal', 'lose', 'remove', 'spend', 'cycle']);

const REF_ALIASES: Record<string, string> = {
  'moving damage and other tokens': 'moving damage or other tokens',
  'initialize & update': 'initialize and update',
};

const GUIDE = /Learn to Play(?: Guide| book| guide)?/g;

const bareOf = (title: string) => title.replace(/\s*\[[A-Za-z]+\]/g, '').trim();
const tokenOf = (title: string) => (title.match(/\[[A-Za-z]+\]/) ?? [''])[0];
const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface Span {
  s: number;
  e: number;
  kind: RuleSeg['kind'];
  word?: string;
  target?: string;
}

interface LinkCtx {

  refs: Map<string, string>;
  tokens: Map<string, string>;
  cards: Map<string, string>;

  self: string;
  linked: Set<string>;
}

function collect(text: string, ctx: LinkCtx): Span[] {
  const spans: Span[] = [];
  const claim = (s: number, e: number) => spans.every((sp) => e <= sp.s || s >= sp.e);

  for (const [name, id] of ctx.cards) {
    let at = text.indexOf(name);
    while (at !== -1) {
      if (claim(at, at + name.length)) spans.push({ s: at, e: at + name.length, kind: 'card', target: id });
      at = text.indexOf(name, at + name.length);
    }
  }

  for (const m of text.matchAll(GUIDE)) {
    const s = m.index ?? 0;
    if (claim(s, s + m[0].length)) spans.push({ s, e: s + m[0].length, kind: 'guide' });
  }

  for (const [name, id] of ctx.refs) {
    if (id === ctx.self) continue;

    const seeable = new RegExp(`(?:\\bsee\\s+(?:the\\s+)?['‘"]?)(${escapeRe(name)})`, 'gi');
    let linkedHere = ctx.linked.has(id);
    for (const m of text.matchAll(seeable)) {
      const s = (m.index ?? 0) + m[0].length - m[1].length;
      if (!claim(s, s + m[1].length)) continue;
      spans.push({ s, e: s + m[1].length, kind: 'ref', target: id });
      linkedHere = true;
    }
    if (linkedHere || NEVER_LINK.has(name) || !name.includes(' ')) continue;
    const plain = new RegExp(escapeRe(name), 'gi');
    for (const m of text.matchAll(plain)) {
      const s = m.index ?? 0;
      if (!claim(s, s + m[0].length)) continue;
      spans.push({ s, e: s + m[0].length, kind: 'ref', target: id });
      ctx.linked.add(id);
      break;
    }
  }

  for (const m of text.matchAll(/\[[A-Z]+\]/g)) {
    const s = m.index ?? 0;
    if (!claim(s, s + m[0].length)) continue;
    const word = expandIcons(m[0]);
    const owner = ctx.tokens.get(m[0]);
    spans.push({
      s,
      e: s + m[0].length,
      kind: 'token',
      word: word === m[0] ? undefined : word,
      target: owner && owner !== ctx.self ? owner : undefined,
    });
  }

  return spans.sort((a, b) => a.s - b.s);
}

function pieces(text: string, re: RegExp | null, base: Omit<Span, 's' | 'e'>, out: RuleSeg[]): void {
  const push = (value: string, hit: boolean) => {
    if (value) out.push({ key: out.length, kind: base.kind, text: value, hit, word: base.word, target: base.target });
  };
  if (!re) return push(text, false);
  const parts = text.split(re);
  if (parts.length < 2) return push(text, false);
  parts.forEach((part, i) => push(part, i % 2 === 1));
}

function segment(text: string, ctx: LinkCtx, re: RegExp | null): RuleSeg[] {
  const out: RuleSeg[] = [];
  let at = 0;
  for (const span of collect(text, ctx)) {
    if (span.s > at) pieces(text.slice(at, span.s), re, { kind: 'text' }, out);
    pieces(text.slice(span.s, span.e), re, span, out);
    at = span.e;
  }
  if (at < text.length) pieces(text.slice(at), re, { kind: 'text' }, out);
  return out;
}

let warned = false;

export function rulesEntries(terms: string[] = []): RuleEntry[] {
  const sources = [...getCollection<RuleSource>('rules')].sort((a, b) =>
    a.id === INTRO_ID ? -1 : b.id === INTRO_ID ? 1 : bareOf(a.title).localeCompare(bareOf(b.title)),
  );

  const titles = new Map(sources.map((s) => [bareOf(s.title).toLowerCase(), s.id]));
  for (const [alias, actual] of Object.entries(REF_ALIASES)) {
    const id = titles.get(actual);
    if (id) titles.set(alias, id);
  }
  titles.delete(bareOf(sources.find((s) => s.id === INTRO_ID)?.title ?? '').toLowerCase());

  const refs = new Map(
    [...titles.keys()].sort((a, b) => b.length - a.length).map((k) => [k, titles.get(k) as string]),
  );
  const tokens = new Map(
    sources.filter((s) => tokenOf(s.title)).map((s) => [tokenOf(s.title), s.id]),
  );
  const cards = new Map(
    [...programs]
      .sort((a, b) => b.name.length - a.name.length)
      .map((p): [string, string] => [p.name, p.slug]),
  );

  const label = new Map(sources.map((s) => [s.id, bareOf(s.title)]));
  const re = terms.length
    ? new RegExp(`(${terms.map(escapeRe).filter(Boolean).join('|')})`, 'ig')
    : null;

  return sources.map((source): RuleEntry => {
    const ctx: LinkCtx = { refs, tokens, cards, self: source.id, linked: new Set() };
    const lines = source.blocks.flatMap((b) => [b.text, ...(b.items ?? [])]);
    const blocks = source.blocks.map((block) => ({
      kind: block.kind,
      segs: segment(block.text, ctx, re),
      items: (block.items ?? []).map((item) => segment(item, ctx, re)),
    }));

    const pointer = source.pointer ? blocks[0]?.segs.find((s) => s.kind === 'ref') : undefined;

    return {
      id: source.id,
      title: source.title,
      token: tokenOf(source.title),
      bare: bareOf(source.title),
      cls: source.cls,
      pointer: Boolean(source.pointer),
      letter: bareOf(source.title).charAt(0).toUpperCase(),
      blocks,
      related: (source.related ?? []).map((id) => ({ id, label: label.get(id) ?? id })),
      redirect: pointer?.target ? { id: pointer.target, label: label.get(pointer.target) ?? '' } : null,
      todo: source.todo ?? '',
      haystack: fold([source.title, ...lines, ...(source.aliases ?? [])]),
    };
  });
}

const fold = (parts: string[]) =>
  parts
    .map((part) => `${part} ${expandIcons(part)}`)
    .join(' ')
    .toLowerCase();

export const matchesRule = (entry: RuleEntry, terms: string[]) =>
  terms.every((term) => matchesQuery(entry.haystack, term));

export interface RuleLetter {

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

export const CLASS_ORDER: RuleClass[] = [
  'procedure',
  'states',
  'tokens',
  'keyword',
  'typesAndZones',
  'timing',
];

/** Dev-only: ids must be unique and every `related` id must resolve to a real entry, or anchors and chips break silently. */
export function assertRulesShape(entries: RuleEntry[]): void {
  if (!import.meta.env.DEV || warned) return;
  warned = true;

  const seen = new Set<string>();
  for (const entry of entries) {
    const where = `rules.json#${entry.id || '(no id)'}`;
    if (!entry.id) console.warn('[rules] an entry has no id');
    else if (seen.has(entry.id)) console.warn(`[rules] ${where}: duplicate id`);
    else seen.add(entry.id);

    if (!entry.title) console.warn(`[rules] ${where}: no title`);
    if (!entry.blocks.length) console.warn(`[rules] ${where}: no blocks`);
    if (entry.id !== INTRO_ID && !entry.cls.length) {
      console.warn(`[rules] ${where}: on no shelf`);
    }
    if (entry.pointer && !entry.redirect) {
      console.warn(`[rules] ${where}: a pointer whose text names no known entry`);
    }
    for (const related of entry.related) {
      if (!entries.some((e) => e.id === related.id)) {
        console.warn(`[rules] ${where}: related "${related.id}" is not an entry`);
      }
    }
  }

  const needRelated = entries.filter((e) => e.id !== INTRO_ID && !e.related.length);
  if (needRelated.length) {
    console.warn(
      `[rules] ${needRelated.length} entries need related[]: ${needRelated.map((e) => e.id).join(', ')}`,
    );
  }

  const edited = entries.filter((e) => e.todo.includes('EDITED BY CLAUDE'));
  if (edited.length) {
    console.warn(`[rules] text edited away from the print run: ${edited.map((e) => e.id).join(', ')}`);
  }
  const todo = entries.filter((e) => e.todo).length;
  if (todo) console.warn(`[rules] ${todo} of ${entries.length} records still carry a todo`);
}

export const brandNameOf = (program: Program) => brandById(program.brandId)?.name ?? '';
