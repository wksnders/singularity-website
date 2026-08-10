/* ============================================================================
   CONTENT — markdown files and UI strings, with English fallback.

   content/
     en/
       ui.json                     every short UI string (nav, chips, labels)
       home/hero.md                long-form prose, front matter + body
       universe/factions/<id>.md   entity copy: name, tagline, story
   Adding a language = copying the folder and translating it. There is no
   i18n dependency: a missing key or file falls back to English, per item.
   ========================================================================== */

import { currentLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/locales';
import { parseFrontMatter, type Meta } from './frontMatter';
import { renderMarkdown } from './markdown';

export interface Doc {
  /** Locale-independent path, e.g. "universe/factions/subnet-86". */
  slug: string;
  locale: Locale;
  meta: Meta;
  body: string;
}

type StringTree = { [key: string]: string | StringTree };

const rawDocs = import.meta.glob('../../content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const rawStrings = import.meta.glob('../../content/*/ui.json', {
  eager: true,
  import: 'default',
}) as Record<string, StringTree>;

const CONTENT_PREFIX = '../../content/';

const docs: Record<string, Record<string, Doc>> = {};
for (const [path, source] of Object.entries(rawDocs)) {
  const relative = path.slice(CONTENT_PREFIX.length).replace(/\.md$/, '');
  const slash = relative.indexOf('/');
  if (slash < 0) continue;
  const locale = relative.slice(0, slash) as Locale;
  const slug = relative.slice(slash + 1);
  const { meta, body } = parseFrontMatter(source);
  (docs[locale] ??= {})[slug] = { slug, locale, meta, body };
}

const strings: Record<string, StringTree> = {};
for (const [path, tree] of Object.entries(rawStrings)) {
  const locale = path.slice(CONTENT_PREFIX.length).split('/')[0];
  strings[locale] = tree;
}

function lookup(tree: StringTree | undefined, key: string): string | undefined {
  if (!tree) return undefined;
  let node: string | StringTree | undefined = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * A UI string. Falls back to English, then to the key itself so a missing
 * translation is visible in the layout instead of collapsing it.
 */
export function t(key: string): string {
  const hit = lookup(strings[currentLocale.value], key) ?? lookup(strings[DEFAULT_LOCALE], key);
  if (hit === undefined && import.meta.env.DEV) {
    console.warn(`[content] missing string: ${key}`);
  }
  return hit ?? key;
}

/** A markdown document by slug, current locale first, then English. */
export function getDoc(slug: string): Doc | null {
  return docs[currentLocale.value]?.[slug] ?? docs[DEFAULT_LOCALE]?.[slug] ?? null;
}

/** Every document under a slug prefix, e.g. "news/". */
export function getDocs(prefix: string): Doc[] {
  const merged: Record<string, Doc> = {};
  for (const [slug, doc] of Object.entries(docs[DEFAULT_LOCALE] ?? {})) {
    if (slug.startsWith(prefix)) merged[slug] = doc;
  }
  if (currentLocale.value !== DEFAULT_LOCALE) {
    for (const [slug, doc] of Object.entries(docs[currentLocale.value] ?? {})) {
      if (slug.startsWith(prefix)) merged[slug] = doc;
    }
  }
  return Object.values(merged);
}

/** Rendered HTML body of a document (memoised). */
export function docHtml(doc: Doc | null): string {
  if (!doc) return '';
  return renderMarkdown(`${doc.locale}/${doc.slug}`, doc.body);
}

/** A front-matter string, with a fallback for content that has not landed. */
export function metaString(doc: Doc | null, key: string, fallback = ''): string {
  const value = doc?.meta[key];
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

export function metaList(doc: Doc | null, key: string): string[] {
  const value = doc?.meta[key];
  return Array.isArray(value) ? value : [];
}
