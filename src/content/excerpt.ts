/** The first prose paragraph of a markdown body as plain text: headings and blockquotes are skipped, links keep their label, emphasis marks go. Empty when there is none. */
export function firstParagraph(body: string): string {
  const first = body
    /* Docs are CRLF: normalise line endings before splitting paragraphs. */
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('#') && !block.startsWith('>'));
  if (!first) return '';
  return first
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
