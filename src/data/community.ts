/** Each kind needs a label at `home.community.kind.<kind>`. */
export type CreatorKind = 'playthrough' | 'review' | 'teach' | 'stream' | 'unboxing' | 'overview' | 'preview';

export interface Creator {
  id: string;
  name: string;
  kinds: CreatorKind[];
  /** Null falls back to the site's own YouTube link. */
  href: string | null;
  /** The channel's avatar, 96px; null shows the name's initials. */
  logo: string | null;
}

export const creators: Creator[] = [
  { id: 'before-you-play', name: 'Before You Play', kinds: ['teach'], href: 'https://www.youtube.com/watch?v=1tH-1Gf5c8M', logo: '/community/creators/before-you-play-96.webp' },
  { id: 'one-stop-coop-shop', name: 'One Stop Co-op Shop', kinds: ['playthrough', 'unboxing'], href: 'https://www.youtube.com/watch?v=h6qNvQ6v_s0', logo: '/community/creators/one-stop-coop-shop-96.webp' },
  { id: 'king-of-average', name: 'The King of Average', kinds: ['overview', 'unboxing'], href: 'https://www.youtube.com/watch?v=jjc4WX3o_OM', logo: '/community/creators/king-of-average-96.webp' },
  { id: 'liege-of-games', name: 'Liege of Games', kinds: ['review'], href: 'https://www.youtube.com/watch?v=ebyc_Fuxi1g', logo: '/community/creators/liege-of-games-96.webp' },
  { id: 'tim-chuon', name: 'Tim Chuon', kinds: ['preview'], href: 'https://www.youtube.com/watch?v=lYfgGcd8nog', logo: '/community/creators/tim-chuon-96.webp' },
];

/** Null shows the placeholder frame. */
export const communityPhoto: string | null = '/community/gencon-2026-hall-tables-699.webp';
