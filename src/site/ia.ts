/* Curated, editorial list: a route existing is not a reason to add an entry here. */

import type { RouteLocationRaw } from 'vue-router';
import { isHidden, to } from '@/site/links';
import type { LinkSpec } from '@/site/links';

export interface IaItem extends LinkSpec {
  /** i18n key root: resolves to ia.<key>.label and ia.<key>.note in content/<locale>/ui.json. */
  key: string;
  /** Show the second line in mega panels. */
  note?: boolean;
  /** The mobile menu reads ia.<key>.mobileLabel instead of ia.<key>.label. */
  mobileLabel?: boolean;
}

export interface IaGroup {
  key: string;
  items: IaItem[];
  /** Generated from data instead of listed: the faction column. */
  source?: 'factions';
}

export interface IaSection {
  key: string;
  to: RouteLocationRaw;
  /** Absent = a flat link (News); present = desktop dropdown columns. */
  mega?: IaGroup[];
  /** Right-hand art column in the mega panel. */
  featuredCharacter?: boolean;
  /** Rows under this section in the mobile menu; absent means one link straight to `to`. */
  mobile?: IaItem[];
  mobileFactions?: boolean;
}

export type ShortcutIcon = 'learn' | 'cards' | 'print' | 'chat';

export interface IaShortcut extends IaItem {
  icon: ShortcutIcon;
}

const universe: IaSection = {
  key: 'universe',
  to: to('universe'),
  featuredCharacter: true,
  mega: [
    { key: 'universe.factions', items: [], source: 'factions' },
    {
      key: 'universe.explore',
      items: [
        { key: 'universe.world', to: to('universe', {}, { hash: '#world' }) },
        { key: 'universe.characters', to: to('characters') },
        { key: 'universe.cards', to: to('cards') },
        { key: 'universe.incursions', to: to('incursions') },
        { key: 'universe.universal', to: to('universal') },
        { key: 'universe.lexicon', to: to('universe', {}, { hash: '#lexicon' }) },
      ],
    },
    {
      key: 'universe.newHere',
      items: [{ key: 'universe.primer', to: to('universe', {}, { hash: '#world' }), note: true }],
    },
  ],
  mobileFactions: true,
  mobile: [
    { key: 'universe.characters', to: to('characters'), mobileLabel: true },
    { key: 'universe.cards', to: to('cards'), note: true },
    { key: 'universe.incursions', to: to('incursions'), mobileLabel: true, note: true },
    { key: 'universe.universal', to: to('universal'), note: true },
  ],
};

const story: IaSection = {
  key: 'story',
  to: to('story'),
  mega: [
    {
      key: 'story.onThePage',
      items: [
        { key: 'story.chapters', to: to('story', {}, { hash: '#chapters' }), note: true },
        { key: 'story.soFar', to: to('story', {}, { hash: '#story-so-far' }), note: true },
        { key: 'story.graph', to: to('story', {}, { hash: '#story-graph' }), note: true },
        { key: 'story.convergence', to: to('story', {}, { hash: '#convergence' }), note: true },
      ],
    },
    {
      key: 'story.chaptersGroup',
      items: [
        { key: 'story.ch01', to: to('story', {}, { hash: '#ch-01' }), note: true },
        { key: 'story.ch02', to: to('story', {}, { hash: '#ch-02' }), note: true },
        { key: 'story.ch03', to: to('soon', {}, { hash: '#story-chapter' }), note: true },
      ],
    },
    {
      key: 'story.also',
      items: [
        { key: 'story.buy', outbound: 'buy', note: true },
        { key: 'story.pastVotes', to: to('soon', {}, { hash: '#vote' }), note: true },
      ],
    },
  ],
  mobile: [
    { key: 'story.chapters', to: to('story', {}, { hash: '#chapters' }), note: true },
    { key: 'story.soFar', to: to('story', {}, { hash: '#story-so-far' }), note: true },
    { key: 'story.graph', to: to('story', {}, { hash: '#story-graph' }), note: true },
    { key: 'story.convergence', to: to('story', {}, { hash: '#convergence' }), note: true },
  ],
};

const learn: IaSection = {
  key: 'learn',
  to: to('learn'),
  mega: [
    {
      key: 'learn.tracks',
      items: [
        { key: 'learn.new', to: to('learn', {}, { hash: '#path-new' }), note: true },
        { key: 'learn.veteran', to: to('learn', {}, { hash: '#path-veteran' }), note: true },
        { key: 'learn.coop', to: to('learn', {}, { hash: '#path-coop' }), note: true },
      ],
    },
    {
      key: 'learn.rulesHub',
      items: [
        { key: 'learn.reference', to: to('rules'), note: true },
        { key: 'learn.errata', to: to('soon', {}, { hash: '#errata' }), note: true },
        /* The database's second door: a reader mid-game looks for it here, not under Universe. */
        { key: 'learn.cardDb', to: to('cards'), note: true },
        { key: 'learn.competition', to: to('soon', {}, { hash: '#competition' }), note: true },
        { key: 'learn.faq', to: to('faq'), note: true },
      ],
    },
    {
      key: 'learn.also',
      items: [
        { key: 'learn.modes', to: to('learn', {}, { hash: '#modes' }), note: true },
        { key: 'learn.videos', to: to('learn', {}, { hash: '#videos' }), note: true },
        { key: 'learn.printAndPlay', outbound: 'printAndPlay', note: true },
      ],
    },
  ],
  mobile: [
    { key: 'learn.modes', to: to('modes'), mobileLabel: true, note: true },
    { key: 'learn.videos', to: to('learn', {}, { hash: '#videos' }), mobileLabel: true, note: true },
    { key: 'learn.reference', to: to('rules'), note: true },
    { key: 'learn.faq', to: to('faq') },
  ],
};

const news: IaSection = { key: 'news', to: to('news') };

const community: IaSection = {
  key: 'community',
  to: to('community'),
  mega: [
    {
      key: 'community.group',
      items: [
        { key: 'community.discord', to: to('community', {}, { hash: '#discord' }), note: true },
        { key: 'community.wallpapers', to: to('community', {}, { hash: '#wallpapers' }), note: true },
      ],
    },
    {
      key: 'community.help',
      items: [
        { key: 'community.support', to: to('community', {}, { hash: '#support' }), note: true },
        { key: 'community.faq', to: to('faq'), note: true },
      ],
    },
    {
      key: 'community.pressTeam',
      items: [
        { key: 'community.press', to: to('community', {}, { hash: '#press' }), note: true },
        { key: 'community.team', to: to('community', {}, { hash: '#team' }), note: true },
      ],
    },
  ],
  mobile: [
    { key: 'community.wallpapers', to: to('community', {}, { hash: '#wallpapers' }) },
    { key: 'community.support', to: to('community', {}, { hash: '#support' }), mobileLabel: true, note: true },
    { key: 'community.press', to: to('community', {}, { hash: '#press' }) },
    { key: 'community.team', to: to('community', {}, { hash: '#team' }), mobileLabel: true },
  ],
};

const shortcuts: IaShortcut[] = [
  { key: 'shortcut.learn', icon: 'learn', to: to('learn', {}, { hash: '#paths' }) },
  { key: 'shortcut.cards', icon: 'cards', to: to('cards') },
  { key: 'shortcut.printAndPlay', icon: 'print', outbound: 'printAndPlay' },
  { key: 'shortcut.discord', icon: 'chat', outbound: 'discord' },
];

export const mobileShortcuts = shortcuts.filter((item) => !isHidden(item.to));

export const primaryNav: IaSection[] = [universe, story, learn, news, community].filter(
  (section) => !isHidden(section.to),
);

const footerAll: IaGroup[] = [
  {
    key: 'footer.universe',
    items: [
      { key: 'universe.world', to: to('universe', {}, { hash: '#world' }) },
      { key: 'universe.factions', to: to('universe', {}, { hash: '#factions' }) },
      /* Footer only: the missing primaryNav, mega and mobile rows are deliberate. */
      { key: 'universe.brands', to: to('brands') },
      { key: 'universe.characters', to: to('characters') },
      { key: 'universe.cards', to: to('cards') },
      { key: 'universe.incursions', to: to('incursions') },
      { key: 'universe.universal', to: to('universal') },
      { key: 'universe.lexicon', to: to('universe', {}, { hash: '#lexicon' }) },
    ],
  },
  {
    key: 'footer.story',
    items: [
      { key: 'story.chapters', to: to('story', {}, { hash: '#chapters' }) },
      { key: 'story.soFar', to: to('story', {}, { hash: '#story-so-far' }) },
      { key: 'story.graph', to: to('story', {}, { hash: '#story-graph' }) },
      { key: 'story.convergence', to: to('story', {}, { hash: '#convergence' }) },
    ],
  },
  {
    key: 'footer.learn',
    items: [
      { key: 'learn.paths', to: to('learn', {}, { hash: '#paths' }) },
      { key: 'learn.modes', to: to('learn', {}, { hash: '#modes' }) },
      { key: 'learn.videos', to: to('learn', {}, { hash: '#videos' }) },
      { key: 'learn.reference', to: to('rules') },
      { key: 'learn.errata', to: to('soon', {}, { hash: '#errata' }) },
      { key: 'learn.competition', to: to('soon', {}, { hash: '#competition' }) },
      { key: 'learn.faq', to: to('faq') },
    ],
  },
  {
    key: 'footer.news',
    items: [
      { key: 'news.announcements', to: to('news', {}, { query: { category: 'announcement' } }) },
      { key: 'news.upcoming', to: to('news', {}, { query: { category: 'upcoming' } }) },
      { key: 'news.events', to: to('news', {}, { query: { category: 'events' } }) },
    ],
  },
  {
    key: 'footer.community',
    items: [
      { key: 'community.discord', to: to('community', {}, { hash: '#discord' }) },
      { key: 'community.press', to: to('community', {}, { hash: '#press' }) },
      { key: 'community.wallpapers', to: to('community', {}, { hash: '#wallpapers' }) },
      { key: 'community.support', to: to('community', {}, { hash: '#support' }) },
      { key: 'community.team', to: to('community', {}, { hash: '#team' }) },
    ],
  },
];

export const footerColumns: IaGroup[] = footerAll
  .map((group) => ({ ...group, items: group.items.filter((item) => !isHidden(item.to)) }))
  .filter((group) => group.items.length > 0);

/** Socials render from data URLs, not from the IA (they are outbound). */
export const socialKeys = ['discord', 'youtube', 'instagram', 'twitter', 'boardgamegeek'] as const;
