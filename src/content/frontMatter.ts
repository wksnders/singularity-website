/* ============================================================================
   Front matter — a ~40 line parser instead of a dependency.
   Supports: strings, numbers, booleans, inline arrays [a, b] and dash lists.
   ========================================================================== */

export type MetaValue = string | number | boolean | string[];
export type Meta = Record<string, MetaValue>;

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

const coerce = (raw: string): MetaValue => {
  const value = raw.trim().replace(/^["'](.*)["']$/, '$1');
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value !== '' && !Number.isNaN(Number(value))) return Number(value);
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim().replace(/^["'](.*)["']$/, '$1'))
      .filter(Boolean);
  }
  return value;
};

export function parseFrontMatter(source: string): { meta: Meta; body: string } {
  const match = FENCE.exec(source);
  if (!match) return { meta: {}, body: source };

  const meta: Meta = {};
  let listKey: string | null = null;

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && listKey) {
      (meta[listKey] as string[]).push(String(coerce(listItem[1])));
      continue;
    }

    const pair = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!pair) continue;

    const [, key, rest] = pair;
    if (rest.trim() === '') {
      meta[key] = [];
      listKey = key;
    } else {
      meta[key] = coerce(rest);
      listKey = null;
    }
  }

  return { meta, body: source.slice(match[0].length) };
}
