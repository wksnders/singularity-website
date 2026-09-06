/* Every destination's `also` must list only live, public destinations, so a /soon visit never dead-ends. */

import { to } from '@/site/links';
import type { LinkSpec } from '@/site/links';

export interface SoonAlso extends LinkSpec {
  /** Must be an existing i18n key; IA label keys are reused where they fit. */
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

      { key: 'ia.learn.modes.label', to: to('learn', {}, { hash: '#modes' }) },
      { key: 'ia.learn.videos.label', to: to('learn', {}, { hash: '#videos' }) },
      { key: 'ia.universe.cards.label', to: to('cards') },
    ],
  },
  {

    id: 'video',
    kind: 'link',
    also: [
      { key: 'ia.learn.paths.label', to: to('learn', {}, { hash: '#paths' }) },
      { key: 'ia.learn.modes.label', to: to('learn', {}, { hash: '#modes' }) },
      { key: 'ia.universe.cards.label', to: to('cards') },
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
