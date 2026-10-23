/** Each kind needs a label at `home.community.kind.<kind>`. */
export type CreatorKind = 'playthrough' | 'review' | 'teach' | 'stream';

export interface Creator {
  id: string;
  name: string;
  kind: CreatorKind;
  /** Null falls back to the site's own YouTube link. */
  href: string | null;
}

/** [PLACEHOLDER] until the coverage list is real. */
export const creators: Creator[] = [
  { id: 'creator-1', name: '[Creator name]', kind: 'playthrough', href: null },
  { id: 'creator-2', name: '[Creator name]', kind: 'review', href: null },
  { id: 'creator-3', name: '[Creator name]', kind: 'teach', href: null },
  { id: 'creator-4', name: '[Creator name]', kind: 'stream', href: null },
  { id: 'creator-5', name: '[Creator name]', kind: 'playthrough', href: null },
];

/** Null shows the placeholder frame. */
export const communityPhoto: string | null = '/community/gencon-2026-hall-tables-699.webp';
