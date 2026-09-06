// Content lives at content/<locale>/ mirroring the English tree, and a missing key, record or file falls back to English per item.
// Reference spec: docs/architecture/modules.md#content-index

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

/* Collections are any JSON under content/<locale>/ keyed by filename, so renaming a content file renames its getCollection() key; ui.json matches too but is reached only through t(). */
const rawCollections = import.meta.glob('../../content/*/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

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

const collections: Record<string, Record<string, unknown>> = {};
for (const [path, value] of Object.entries(rawCollections)) {
  const relative = path.slice(CONTENT_PREFIX.length).replace(/\.json$/, '');
  const [locale, name] = relative.split('/');
  (collections[locale] ??= {})[name] = value;
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

/** UI string: falls back to English, then to the key itself so a missing translation stays visible; `vars` fills `{name}` placeholders. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const hit = lookup(strings[currentLocale.value], key) ?? lookup(strings[DEFAULT_LOCALE], key);
  if (hit === undefined && import.meta.env.DEV) {
    console.warn(`[content] missing string: ${key}`);
  }
  const value = hit ?? key;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

/** JSON collection by filename: English supplies the roster and its editorial order, the active locale overrides per record by `id`, and those ids are public anchors a translation must not change. */
export function getCollection<T extends { id: string }>(name: string): T[] {
  const base = (collections[DEFAULT_LOCALE]?.[name] as T[] | undefined) ?? [];
  if (currentLocale.value === DEFAULT_LOCALE) return base;

  const translated = (collections[currentLocale.value]?.[name] as T[] | undefined) ?? [];
  if (!translated.length) return base;

  const byId = new Map(translated.map((item) => [item.id, item]));
  return base.map((item) => byId.get(item.id) ?? item);
}

export function getDoc(slug: string): Doc | null {
  return docs[currentLocale.value]?.[slug] ?? docs[DEFAULT_LOCALE]?.[slug] ?? null;
}

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

export function docHtml(doc: Doc | null): string {
  if (!doc) return '';
  return renderMarkdown(`${doc.locale}/${doc.slug}`, doc.body);
}

export function metaString(doc: Doc | null, key: string, fallback = ''): string {
  const value = doc?.meta[key];
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}
