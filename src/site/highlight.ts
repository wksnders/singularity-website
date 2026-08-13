/* ============================================================================
   Search-hit marking.

   Two functions because the FAQ carries two kinds of string: a question, which
   is plain text, and an answer, which is already HTML by the time it reaches
   the page.
   ========================================================================== */

export interface Segment {
  key: number;
  text: string;
  hit: boolean;
}

const escapeRe = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One regex for every term, or null when there is nothing to mark. */
export function matcher(terms: string[]): RegExp | null {
  const parts = terms.map(escapeRe).filter(Boolean);
  if (!parts.length) return null;
  return new RegExp(`(${parts.join('|')})`, 'ig');
}

/**
 * Plain text → segments. The template renders a hit as <mark> and a miss as
 * text, which is the point: building the <mark> here would mean handing the
 * template a string it has to v-html, and a question is the one field on this
 * page that could carry an angle bracket without anyone noticing.
 */
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

/**
 * Rendered markdown → the same markdown with hits wrapped.
 *
 * The split on tags is the whole job. A plain `html.replace(re, …)` would
 * happily rewrite the inside of an `href`, or wrap part of a tag name, and the
 * result is markup that still renders — just wrongly, and only for the reader
 * who searched the word that happened to appear in an attribute.
 *
 * Character references are left alone for the same reason they are rare here:
 * splitting them would produce visible `&amp;`. A term that matches inside one
 * is the accepted edge.
 */
export function markHtml(html: string, re: RegExp | null): string {
  if (!re) return html;
  return html.replace(/<[^>]*>|[^<]+/g, (chunk) =>
    chunk.startsWith('<') ? chunk : chunk.replace(re, '<mark>$&</mark>'),
  );
}
