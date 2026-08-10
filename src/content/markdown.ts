import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false, // content is authored by us, but keep the door shut anyway
  linkify: true,
  typographer: true,
  breaks: false,
});

const cache = new Map<string, string>();

/** Rendered once per document, then memoised for the life of the page. */
export function renderMarkdown(key: string, source: string): string {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const html = md.render(source);
  cache.set(key, html);
  return html;
}

export function renderInline(source: string): string {
  return md.renderInline(source);
}
