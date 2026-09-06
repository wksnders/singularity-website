
export interface Segment {
  key: number;
  text: string;
  hit: boolean;
}

const escapeRe = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function matcher(terms: string[]): RegExp | null {
  const parts = terms.map(escapeRe).filter(Boolean);
  if (!parts.length) return null;
  return new RegExp(`(${parts.join('|')})`, 'ig');
}

/** Returns text segments rather than markup so the template never v-html's a question, the one FAQ field that can carry an unescaped angle bracket. */
export function segments(text: string, re: RegExp | null): Segment[] {
  if (!re) return [{ key: 0, text, hit: false }];
  const parts = text.split(re);
  if (parts.length < 2) return [{ key: 0, text, hit: false }];
  const out: Segment[] = [];
  parts.forEach((part, i) => {
    if (part) out.push({ key: i, text: part, hit: i % 2 === 1 });
  });
  return out;
}

/** Replaces only outside tags: a bare html.replace would rewrite matches inside attributes and tag names. */
export function markHtml(html: string, re: RegExp | null): string {
  if (!re) return html;
  return html.replace(/<[^>]*>|[^<]+/g, (chunk) =>
    chunk.startsWith('<') ? chunk : chunk.replace(re, '<mark>$&</mark>'),
  );
}
