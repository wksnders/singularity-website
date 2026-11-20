// A mode `id` is the public URL `/learn/modes#<id>` and the key shared by `modes` in data/universe.ts, `learn.modes.<id>` in ui.json and content/<locale>/modes.json

import type { RouteLocationRaw } from 'vue-router';
import { getCollection, t } from '@/content';
import { modes } from '@/data/universe';
import { to } from '@/site/links';

export interface GuideItem {
  text: string;
  items?: string[];
}

export type GuideBlock =
  | { kind: 'text'; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'strategy'; title?: string; text: string }
  | { kind: 'steps'; items: GuideItem[] }
  | { kind: 'points'; items: GuideItem[] };

export interface GuidePart {
  /** Printed rule name, which other rules cite: never recase it. */
  title?: string;
  blocks: GuideBlock[];
}

export interface GuideSource {
  id: string;
  intro: string[];
  parts: GuidePart[];
}

export interface ModeGuide extends GuideSource {
  name: string;
  players: string;
}

export function modeGuides(): ModeGuide[] {
  const sources = new Map(getCollection<GuideSource>('modes').map((source) => [source.id, source]));
  return modes.flatMap((mode) => {
    const source = sources.get(mode.id);
    if (!source) return [];
    return [{ ...source, name: mode.name, players: mode.players || t(`learn.modes.${mode.id}.players`) }];
  });
}

export function guideLinks(): Map<string, RouteLocationRaw> {
  return new Map(modeGuides().map((guide) => [guide.id, to('modes', {}, { hash: `#${guide.id}` })]));
}

const KINDS = new Set(['text', 'note', 'strategy', 'steps', 'points']);

export function assertModesShape(): void {
  if (!import.meta.env.DEV) return;

  const known = new Set(modes.map((mode) => mode.id));
  for (const source of getCollection<GuideSource>('modes')) {
    const where = `modes.json#${source.id || '(no id)'}`;
    if (!known.has(source.id)) console.warn(`[modes] ${where}: not a mode in data/universe.ts`);
    if (!source.parts?.length) console.warn(`[modes] ${where}: no parts`);

    for (const part of source.parts ?? []) {
      const at = `${where} "${part.title ?? '(untitled)'}"`;
      if (!part.blocks?.length) console.warn(`[modes] ${at}: no blocks`);
      for (const block of part.blocks ?? []) {
        if (!KINDS.has(block.kind)) console.warn(`[modes] ${at}: unknown kind "${block.kind}"`);
        else if (block.kind === 'steps' || block.kind === 'points') {
          if (!block.items?.length) console.warn(`[modes] ${at}: an empty list`);
        } else if (!block.text) console.warn(`[modes] ${at}: a ${block.kind} block with no text`);
      }
    }
  }
}
