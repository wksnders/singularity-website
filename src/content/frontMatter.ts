// Front-matter values parse only as strings, numbers, booleans, null, inline arrays [a, b] or dash lists; content/** authoring is limited to these forms.
// Quoted values stay strings; `null`/`~` omit the key.

export type MetaValue = string | number | boolean | string[];
export type Meta = Record<string, MetaValue>;

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

const QUOTED = /^(["'])(.*)\1$/;

const unquote = (value: string): string => QUOTED.exec(value)?.[2] ?? value;

const coerce = (raw: string): MetaValue | null => {
  const value = raw.trim();
  const quoted = QUOTED.exec(value);
  if (quoted) return quoted[2];
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value !== '' && !Number.isNaN(Number(value))) return Number(value);
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => unquote(item.trim()))
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
      const item = coerce(listItem[1]);
      if (item !== null) (meta[listKey] as string[]).push(String(item));
      continue;
    }

    const pair = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!pair) continue;

    const [, key, rest] = pair;
    if (rest.trim() === '') {
      meta[key] = [];
      listKey = key;
    } else {
      const value = coerce(rest);
      if (value !== null) meta[key] = value;
      listKey = null;
    }
  }

  return { meta, body: source.slice(match[0].length) };
}
