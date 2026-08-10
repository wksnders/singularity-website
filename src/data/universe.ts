/* ============================================================================
   THE data file. Adding a character, brand, faction or set = adding an entry
   here. Pages never hard-code any of this — the faction count in particular is
   data, and the roster is expected to grow, so nothing may assume it is fixed.

   [PLACEHOLDER] marks invented text awaiting real copy. Anything user-visible
   here is a FALLBACK: content/<locale>/**.md of the matching slug overrides it.
   ========================================================================== */

import type {
  Brand,
  Character,
  Faction,
  GameSet,
  NewsCategory,
  OutboundUrls,
  PlayMode,
  Program,
  RogueAI,
  Story,
  Video,
  WallpaperKind,
} from './types';

const noArt = { src: null, alt: '', artist: null };

export const game = {
  name: 'Singularity.exe',
  studio: 'Octothorpe',
  studioCity: 'Salt Lake City',
  publisher: 'Panda',
  crossoverGame: 'Middara',
  /* 1–4, not 2–4. This is the player count for the GAME — every mode across the
     line — and solo is one of the modes, so the range starts at 1.

     It is not a claim about any single box: solo and co-op are Incursions, and
     Incursions is its own product, sold separately (it launches the same day as
     the core box and expansion 1). So never render this count as "what is in the
     core box" — the box facts are `boxContents`, and which box gets you solo is
     a purchase question that belongs in the Incursions bands.

     Per-mode counts (2 for the duel, 3–4 for free-for-all) live beside each mode
     in ui.json. */
  players: '1\u20134',
  /** Co-op/solo range — state it wherever co-op is sold. Same span as the game
      as a whole, and still its own field: the Incursions bands quote it alone,
      and Incursions is a separate box, so the two numbers are not the same
      claim even when they read the same. */
  incursionsPlayers: '1\u20134',
  playTime: '30 min per player',
  /** Commercial facts. Reserved slots — the layout exists, the values do not. */
  price: null as string | null,
  releaseDate: null as string | null,
  boxContents: null as string | null,
  shipsTo: null as string | null,
  ageRating: null as string | null,
  ratingMarks: null as string | null,
  supportEmail: null as string | null,
  trailerYouTubeId: '_eyxoFI4F-8',
  copyrightYear: 2026,
};

/**
 * Form endpoints. Both are CLOSED: there is nothing behind either form yet.
 *
 * A form that answers "sent" and then drops the message is worse than no form
 * at all — a broken form makes people try again, a lying one does not. So while
 * these are null both forms render disabled and say why.
 *
 * Opening one is TWO steps, in this order:
 *   1. put the endpoint here, and
 *   2. make the component actually POST to it and report the real result.
 * Never do (1) on its own — that restores the exact bug this replaced.
 */
export const formEndpoints = {
  newsletter: null as string | null,
  support: null as string | null,
};

/** Launch-day replacements happen HERE, not in nine page templates. */
export const urls: OutboundUrls = {
  buy: null,
  /* Root-relative, NOT absolute: these three are files this site serves from
     `public/downloads/`, and `outbound()` joins them to the deploy base. Hosting
     them here rather than linking a Dropbox share is deliberate — no expiring
     share token, no third party disabling the link on a traffic spike, and the
     filenames carry no version number, so updating a document means overwriting
     the file and every link ever printed or posted still resolves. Keep it that
     way: the QR codes in the box point at this site. */
  printAndPlay: '/downloads/singularity-competitive-print-and-play.zip',
  /* Steam Workshop: "Singularity.exe Preview 2-Player" (Octothorpe Games).
     Free, but today a PREVIEW build — two players, core + expansion cards and
     the in-game rules reference; the assets are not final.

     THIS URL WILL NOT CHANGE. The plan is to update this same workshop item to
     the full game around ship, so the ID stays put and only the copy goes
     stale. When that update lands, the three strings that currently say
     "preview" have to be rewritten: nav.play.tabletopSimulator, home.ways.tts
     and learn.try.tts in content/en/ui.json. It is on the launch-day list. */
  tabletopSimulator: 'https://steamcommunity.com/sharedfiles/filedetails/?id=2968522499',
  rulebook: '/downloads/singularity-core-rulebook.pdf',
  /* The lookup document, offered BESIDE the rules page — never instead of it.
     The searchable HTML reference is still priority 1; when it ships, this PDF
     stays as the download next to it. */
  rulesReference: '/downloads/singularity-core-reference.pdf',
  discord: 'https://discord.com/invite/XBRfaufKsk',
  /* Channel, not a video: the trailer and the how-to-plays embed by id from
     game.trailerYouTubeId and videos[]. This is the "more from us" link. */
  youtube: 'https://www.youtube.com/@octothorpegames',
  instagram: 'https://www.instagram.com/octothorpegames/',
  boardgamegeek: 'https://boardgamegeek.com/boardgame/379846/singularityexe',
};

/** Five formats, confirmed. Not a competitive/co-op pair. */
export const modes: PlayMode[] = [
  { id: 'ffa', name: 'Free-for-all' },
  { id: 'duel', name: '1v1 duel' },
  { id: 'teams', name: '2v2 teams' },
  { id: 'draft', name: 'Draft' },
  { id: 'incursions', name: 'Incursions (co-op & solo)', players: '1\u20134' },
];

export const factions: Faction[] = [
  {
    id: 'monarchy-of-boom',
    color: '#9F539E',
    colorText: '#D08FCF',
    name: 'Monarchy of Boom',
    tagline: '[PLACEHOLDER] Explosive royalty.',
    brandIds: ['endless-chain', 'mob-brand-2', 'mob-brand-3', 'mob-brand-4'],
  },
  {
    id: 'hana-mori',
    color: '#3BB76B',
    colorText: '#6FDD9B',
    name: 'Hana Mori',
    tagline: '[PLACEHOLDER] Where code blossoms.',
    brandIds: ['hm-brand-1', 'hm-brand-2', 'hm-brand-3', 'hm-brand-4'],
  },
  {
    id: 'celestial-shogunate',
    color: '#F19531',
    colorText: '#F7B265',
    name: 'Celestial Shogunate',
    tagline: '[PLACEHOLDER] Order written in starlight.',
    brandIds: ['cs-brand-1', 'cs-brand-2', 'cs-brand-3', 'cs-brand-4'],
  },
  {
    id: 'subnet-86',
    color: '#12BADA',
    colorText: '#5FD9F2',
    name: 'Subnet 86',
    tagline: '[PLACEHOLDER] The network remembers.',
    brandIds: ['s86-brand-1', 's86-brand-2', 's86-brand-3', 's86-brand-4'],
  },
];

const factionBrand = (id: string, factionId: string, name: string): Brand => ({
  id,
  factionId,
  name,
  kind: 'faction',
  programCount: 10,
});

export const brands: Brand[] = [
  factionBrand('endless-chain', 'monarchy-of-boom', 'Endless Chain'),
  factionBrand('mob-brand-2', 'monarchy-of-boom', '[PLACEHOLDER brand 02]'),
  factionBrand('mob-brand-3', 'monarchy-of-boom', '[PLACEHOLDER brand 03]'),
  factionBrand('mob-brand-4', 'monarchy-of-boom', '[PLACEHOLDER brand 04]'),
  factionBrand('hm-brand-1', 'hana-mori', '[PLACEHOLDER brand 05]'),
  factionBrand('hm-brand-2', 'hana-mori', '[PLACEHOLDER brand 06]'),
  factionBrand('hm-brand-3', 'hana-mori', '[PLACEHOLDER brand 07]'),
  factionBrand('hm-brand-4', 'hana-mori', '[PLACEHOLDER brand 08]'),
  factionBrand('cs-brand-1', 'celestial-shogunate', '[PLACEHOLDER brand 09]'),
  factionBrand('cs-brand-2', 'celestial-shogunate', '[PLACEHOLDER brand 10]'),
  factionBrand('cs-brand-3', 'celestial-shogunate', '[PLACEHOLDER brand 11]'),
  factionBrand('cs-brand-4', 'celestial-shogunate', '[PLACEHOLDER brand 12]'),
  factionBrand('s86-brand-1', 'subnet-86', '[PLACEHOLDER brand 13]'),
  factionBrand('s86-brand-2', 'subnet-86', '[PLACEHOLDER brand 14]'),
  factionBrand('s86-brand-3', 'subnet-86', '[PLACEHOLDER brand 15]'),
  factionBrand('s86-brand-4', 'subnet-86', '[PLACEHOLDER brand 16]'),
  {
    id: 'lux-brand',
    factionId: null,
    name: '[PLACEHOLDER — LuX personal brand]',
    kind: 'personal',
    unlock: 'challenges',
    programCount: 10,
  },
  {
    id: 'unlock-brand-1',
    factionId: null,
    name: '[PLACEHOLDER mini brand 01]',
    kind: 'personal',
    unlock: 'beat-incursion',
    programCount: 4,
  },
  {
    id: 'unlock-brand-2',
    factionId: null,
    name: '[PLACEHOLDER mini brand 02]',
    kind: 'personal',
    unlock: 'beat-incursion',
    programCount: 4,
  },
  {
    id: 'unlock-brand-3',
    factionId: null,
    name: '[PLACEHOLDER mini brand 03]',
    kind: 'personal',
    unlock: 'beat-incursion',
    programCount: 4,
  },
];

/* Card text is DATA, not pixels: the printed card is an image, but its name,
   cost, type, rules and flavour must exist as text so the gallery is
   searchable, screen-readable, errata-linkable and translatable.
   Piloted here on Endless Chain; the other 15 brands follow the same shape. */
const endlessChain: Program[] = Array.from({ length: 10 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  const revealed = i < 3;
  return {
    id: `endless-chain-${n}`,
    brandId: 'endless-chain',
    name: revealed ? `[PLACEHOLDER program ${n}]` : '',
    cost: revealed ? '\u2014' : '',
    type: revealed ? '[PLACEHOLDER type line]' : '',
    rules: revealed ? '[PLACEHOLDER rules text — the exact printed wording]' : '',
    flavour: revealed ? '[PLACEHOLDER flavour line]' : '',
    revealed,
    art: { ...noArt, alt: revealed ? `[PLACEHOLDER program ${n}] card` : '' },
  };
});

export const programs: Program[] = [...endlessChain];

const placeholderCharacter = (
  index: number,
  factionIds: Character['factionIds'],
  brandId: string | null,
): Character => {
  const n = String(index).padStart(2, '0');
  return {
    id: `character-${n}`,
    name: `[PLACEHOLDER name ${n}]`,
    epithet: `[PLACEHOLDER epithet ${n}]`,
    factionIds,
    brandId,
    art: { ...noArt, alt: `[PLACEHOLDER name ${n}], character art` },
    storyIds: [],
  };
};

export const characters: Character[] = [
  placeholderCharacter(1, ['monarchy-of-boom'], 'endless-chain'),
  placeholderCharacter(2, ['monarchy-of-boom'], 'mob-brand-2'),
  placeholderCharacter(3, ['monarchy-of-boom'], 'mob-brand-3'),
  placeholderCharacter(4, ['monarchy-of-boom', 'subnet-86'], 'mob-brand-4'),
  placeholderCharacter(5, ['hana-mori'], 'hm-brand-1'),
  placeholderCharacter(6, ['hana-mori'], 'hm-brand-2'),
  placeholderCharacter(7, ['hana-mori'], 'hm-brand-3'),
  placeholderCharacter(8, ['hana-mori'], 'hm-brand-4'),
  placeholderCharacter(9, ['celestial-shogunate'], 'cs-brand-1'),
  placeholderCharacter(10, ['celestial-shogunate'], 'cs-brand-2'),
  placeholderCharacter(11, ['celestial-shogunate'], 'cs-brand-3'),
  placeholderCharacter(12, ['celestial-shogunate', 'hana-mori'], 'cs-brand-4'),
  placeholderCharacter(13, ['subnet-86'], 's86-brand-1'),
  placeholderCharacter(14, ['subnet-86'], 's86-brand-2'),
  placeholderCharacter(15, ['subnet-86'], 's86-brand-3'),
  placeholderCharacter(16, ['subnet-86'], 's86-brand-4'),
  {
    id: 'lux',
    name: 'LuX',
    epithet: '[PLACEHOLDER epithet]',
    factionIds: 'any',
    brandId: null,
    personalBrandId: 'lux-brand',
    art: { ...noArt, alt: 'LuX, character art' },
    storyIds: [],
  },
  {
    id: 'unlock-01',
    name: '[PLACEHOLDER unlock 01]',
    epithet: '[PLACEHOLDER epithet]',
    factionIds: 'any',
    brandId: null,
    personalBrandId: 'unlock-brand-1',
    unlockedVia: 'incursions',
    fromRogueAIId: 'rogue-ai-1',
    art: { ...noArt, alt: '' },
    storyIds: [],
  },
  {
    id: 'unlock-02',
    name: '[PLACEHOLDER unlock 02]',
    epithet: '[PLACEHOLDER epithet]',
    factionIds: 'any',
    brandId: null,
    personalBrandId: 'unlock-brand-2',
    unlockedVia: 'incursions',
    fromRogueAIId: 'rogue-ai-2',
    art: { ...noArt, alt: '' },
    storyIds: [],
  },
  {
    id: 'unlock-03',
    name: '[PLACEHOLDER unlock 03]',
    epithet: '[PLACEHOLDER epithet]',
    factionIds: 'any',
    brandId: null,
    personalBrandId: 'unlock-brand-3',
    unlockedVia: 'incursions',
    fromRogueAIId: 'rogue-ai-3',
    art: { ...noArt, alt: '' },
    storyIds: [],
  },
];

/** Rogue AIs sit outside the faction system — no faction colour, ever. */
export const rogueAIs: RogueAI[] = [
  { id: 'rogue-ai-1', name: '[PLACEHOLDER rogue AI 01]', unlockCharacterId: 'unlock-01', art: { ...noArt } },
  { id: 'rogue-ai-2', name: '[PLACEHOLDER rogue AI 02]', unlockCharacterId: 'unlock-02', art: { ...noArt } },
  { id: 'rogue-ai-3', name: '[PLACEHOLDER rogue AI 03]', unlockCharacterId: 'unlock-03', art: { ...noArt } },
];

/** Core box + expansion 1 + Incursions all launch the same day. */
export const sets: GameSet[] = [
  {
    id: 'core-set',
    name: '[PLACEHOLDER core set name]',
    kind: 'core',
    status: 'available',
    chapter: 1,
    chapterTitle: '[PLACEHOLDER chapter title]',
    contents: ['[PLACEHOLDER box contents]'],
    buyUrl: null,
    relatedBrandIds: ['endless-chain'],
  },
  {
    id: 'expansion-1',
    name: '[PLACEHOLDER expansion name]',
    kind: 'expansion',
    status: 'available',
    chapter: 2,
    chapterTitle: '[PLACEHOLDER chapter title]',
    contents: ['[PLACEHOLDER box contents]'],
    carriesIncursions: true,
    buyUrl: null,
    relatedBrandIds: [],
  },
  {
    id: 'expansion-2',
    name: '[PLACEHOLDER announced set]',
    kind: 'expansion',
    status: 'announced',
    chapter: 3,
    chapterTitle: '[PLACEHOLDER chapter title]',
    contents: [],
    buyUrl: null,
    relatedBrandIds: [],
  },
];

/** Story-graph nodes. Pins come from castIds — no separate map data. */
export const stories: Story[] = [
  { id: 'story-01', setId: 'core-set', title: '[PLACEHOLDER story 01]', castIds: ['character-01', 'character-05'] },
  { id: 'story-02', setId: 'core-set', title: '[PLACEHOLDER story 02]', castIds: ['character-09', 'character-13'] },
  { id: 'story-03', setId: 'expansion-1', title: '[PLACEHOLDER story 03]', castIds: ['character-04', 'lux'] },
  { id: 'story-04', setId: 'expansion-1', title: '[PLACEHOLDER story 04]', castIds: ['character-12', 'character-16'] },
];

export const videos: Video[] = [
  {
    id: 'first-game',
    title: '[PLACEHOLDER — your first game]',
    youTubeId: null,
    qrSlug: 'learn/first-game',
    captioned: true,
    presenter: null,
    durationSec: null,
  },
  {
    id: 'first-incursion',
    title: '[PLACEHOLDER — running an Incursion]',
    youTubeId: null,
    qrSlug: 'learn/first-incursion',
    captioned: true,
    presenter: null,
    durationSec: null,
  },
  {
    id: 'draft',
    title: '[PLACEHOLDER — drafting]',
    youTubeId: null,
    qrSlug: 'learn/draft',
    captioned: true,
    presenter: null,
    durationSec: null,
  },
];

export const newsCategories: NewsCategory[] = [
  { id: 'announcement', name: 'Announcements' },
  { id: 'upcoming', name: 'Upcoming' },
  { id: 'events', name: 'Events' },
  { id: 'errata', name: 'Errata' },
];

export const wallpaperKinds: WallpaperKind[] = [
  { id: 'desktop', name: 'Desktop', size: '2560 × 1440' },
  { id: 'mobile', name: 'Mobile', size: '1170 × 2532' },
  { id: 'avatar', name: 'Avatar', size: '512 × 512' },
];

/** Download gallery entries. `file` is null until the real exports land. */
export const wallpapers = [
  { id: 'wall-01', kind: 'desktop', file: null as string | null },
  { id: 'wall-02', kind: 'desktop', file: null as string | null },
  { id: 'wall-03', kind: 'mobile', file: null as string | null },
  { id: 'wall-04', kind: 'avatar', file: null as string | null },
];

/**
 * Studio credit lives in one band on Community. Per-artwork artist credit is a
 * post-launch job — `art.artist` is in the schema and stays unfilled for now.
 */
export const team = [
  { id: 'team-01', name: '[PLACEHOLDER name 01]', role: 'Game design' },
  { id: 'team-02', name: '[PLACEHOLDER name 02]', role: 'Art direction' },
  { id: 'team-03', name: '[PLACEHOLDER name 03]', role: 'Illustration' },
  { id: 'team-04', name: '[PLACEHOLDER name 04]', role: 'Narrative' },
  { id: 'team-05', name: '[PLACEHOLDER name 05]', role: 'Production' },
  { id: 'team-06', name: '[PLACEHOLDER name 06]', role: 'Community' },
];

/* ---------------------------------------------------------------- lookups */

export const factionById = (id: string) => factions.find((f) => f.id === id) ?? null;
export const brandById = (id: string) => brands.find((b) => b.id === id) ?? null;
export const characterById = (id: string) => characters.find((c) => c.id === id) ?? null;
export const setById = (id: string) => sets.find((s) => s.id === id) ?? null;
export const programsOfBrand = (brandId: string) => programs.filter((p) => p.brandId === brandId);
export const brandsOfFaction = (factionId: string) => brands.filter((b) => b.factionId === factionId);

/** Any-faction characters survive every faction filter — that is canon. */
export const charactersOfFaction = (factionId: string) =>
  characters.filter((c) => c.factionIds === 'any' || c.factionIds.includes(factionId));

export const unalignedCharacters = () => characters.filter((c) => c.factionIds === 'any');
