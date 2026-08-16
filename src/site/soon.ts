/* ============================================================================
   /soon — the honest not-yet page.

   Two kinds of destination, and the difference matters to a reader:
   - `page`: we are writing it (rules reference, a chapter, a news post)
   - `link`: it exists but is not live yet (buy, Discord, TTS, print & play)
   Every entry also names what IS available on the same subject, so one visit
   never dead-ends. Only listed, public destinations belong here.
   ========================================================================== */

import { to } from '@/site/links';
import type { LinkSpec } from '@/site/links';

export interface SoonAlso extends LinkSpec {
  /** i18n key for the label, reusing the IA keys where they fit. */
  key: string;
}

export interface SoonDestination {
  id: string;
  kind: 'page' | 'link';
  also: SoonAlso[];
}

const DESTINATIONS: SoonDestination[] = [
  {
    id: 'errata',
    kind: 'page',
    also: [
      { key: 'ia.learn.reference.label', to: to('rules') },
      { key: 'ia.universe.cards.label', to: to('cards') },
      { key: 'ia.news.label', to: to('news', {}, { query: { category: 'errata' } }) },
    ],
  },
  {
    id: 'competition',
    kind: 'page',
    also: [
      { key: 'ia.learn.reference.label', to: to('rules') },
      { key: 'ia.learn.modes.label', to: to('learn', {}, { hash: '#modes' }) },
      { key: 'ia.community.discord.label', to: to('community', {}, { hash: '#discord' }) },
    ],
  },
  {
    id: 'story-chapter',
    kind: 'page',
    also: [
      { key: 'ia.story.chapters.label', to: to('story', {}, { hash: '#chapters' }) },
      { key: 'ia.story.soFar.label', to: to('story', {}, { hash: '#story-so-far' }) },
    ],
  },
  {
    id: 'learn-track',
    kind: 'page',
    also: [
      /* Only real destinations here: an `also` list that bounces back to
         /soon is the dead end this page exists to avoid. */
      { key: 'ia.learn.modes.label', to: to('learn', {}, { hash: '#modes' }) },
      { key: 'ia.learn.videos.label', to: to('learn', {}, { hash: '#videos' }) },
      { key: 'ia.universe.cards.label', to: to('cards') },
    ],
  },
  {
    /* The videos are made, not written — so `link`, not `page`. */
    id: 'video',
    kind: 'link',
    also: [
      { key: 'ia.learn.paths.label', to: to('learn', {}, { hash: '#paths' }) },
      { key: 'ia.learn.modes.label', to: to('learn', {}, { hash: '#modes' }) },
      { key: 'ia.universe.cards.label', to: to('cards') },
    ],
  },
  {
    id: 'press-kit',
    kind: 'link',
    also: [
      { key: 'ia.community.press.label', to: to('community', {}, { hash: '#press' }) },
      { key: 'ia.community.discord.label', to: to('community', {}, { hash: '#discord' }) },
    ],
  },
  {
    id: 'news-post',
    kind: 'page',
    also: [{ key: 'ia.news.label', to: to('news') }],
  },
  {
    id: 'news-archive',
    kind: 'page',
    also: [{ key: 'ia.news.label', to: to('news') }],
  },
  {
    id: 'vote',
    kind: 'page',
    also: [{ key: 'ia.story.convergence.label', to: to('story', {}, { hash: '#convergence' }) }],
  },
  {
    id: 'stack-builder',
    kind: 'page',
    also: [
      { key: 'ia.universe.cards.label', to: to('cards') },
      { key: 'ia.universe.characters.label', to: to('characters') },
      { key: 'ia.learn.modes.label', to: to('learn', {}, { hash: '#modes' }) },
    ],
  },
];

const FALLBACK_ALSO: SoonAlso[] = [
  { key: 'ia.universe.label', to: to('universe') },
  { key: 'ia.learn.label', to: to('learn') },
  { key: 'ia.news.label', to: to('news') },
];

export function soonDestination(hash: string): SoonDestination {
  const id = hash.replace(/^#/, '');
  return DESTINATIONS.find((d) => d.id === id) ?? { id: 'generic', kind: 'page', also: FALLBACK_ALSO };
}
