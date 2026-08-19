/* ============================================================================
   THE data file. Adding a character, brand, faction, box, product or chapter =
   adding an entry here. Pages never hard-code any of this — the faction count
   in particular is data, and the roster is expected to grow, so nothing may
   assume it is fixed.

   `boxes`, `products` and `chapters` are three SEPARATE arrays and must stay
   that way. A box holds components, a product is a way to pay for one or more
   boxes, a chapter is story that rides in boxes. See the long note above `Box`
   in types.ts before merging any two of them.

   [PLACEHOLDER] marks invented text awaiting real copy. Anything user-visible
   here is a FALLBACK: content/<locale>/**.md of the matching slug overrides it.
   ========================================================================== */

import type {
  Box,
  Brand,
  Chapter,
  Character,
  Faction,
  FormEndpoint,
  NewsCategory,
  OutboundUrls,
  PlayMode,
  Printing,
  Product,
  Program,
  RogueAI,
  Story,
  TryRoute,
  TryTier,
  Video,
  WallpaperKind,
} from './types';
import { allPrograms } from './programs';
import { cardFace, hasCardFace } from './programs';

const noArt = { src: null, alt: '', artist: null };

const CHARACTER_ARTIST = 'Héctor Sevilla Luján';

export const game = {
  name: 'Singularity.exe',
  studio: 'Octothorpe',
  studioCity: 'Salt Lake City',
  publisher: 'Panda',
  crossoverGame: 'Middara',
  /* The GAME's range across every mode, which is why it starts at 1 — solo is
     Incursions, and Incursions is a separate product. Never render this as
     what is in the core box; which box gets you solo is a purchase question. */
  players: '1\u20134',
  /** Its own field even though it reads the same as `players`: Incursions is a
      separate box, so the two are not the same claim. */
  incursionsPlayers: '1\u20134',
  playTime: '30 min per player',
  /* No price here: three editions at three prices, so a single `game.price`
     would silently become the site's answer for all of them. It lives on
     `products[]`. */
  releaseDate: null as string | null,
  /* The store is the authority on shipping — regions, dates and surcharges all
     change there without warning. Keep this null and link out; do not mirror a
     region list the site cannot keep true. */
  shipsTo: null as string | null,
  ageRating: '14+',
  supportEmail: 'singularity-support@octothorpe.com' as string | null,
  /* Press, trade and licensing share one inbox. The split a reader needs is
     support or not-support, and each surface labels this one for its context. */
  enquiriesEmail: 'singularity-press@octothorpe.com',
  trailerYouTubeId: '_eyxoFI4F-8',
  rulesUpdated: '2026-08-16' as string | null,
  copyrightYear: 2026,
};

/**
 * Both CLOSED: while these are null the forms render disabled and say why,
 * because a form that answers "sent" and drops the message is worse than none.
 *
 * Opening one is TWO steps and never just the first: put the endpoint here,
 * AND make the component POST to it and report the real result. `SupportForm`
 * has step 2 already; its `url` must answer with CORS headers.
 */
export const formEndpoints = {
  newsletter: null as string | null,
  support: null as FormEndpoint | null,
};

/** Launch-day replacements happen HERE, not in nine page templates. */
export const urls: OutboundUrls = {
  buy: 'https://gamefound.com/en/projects/octothorpe/singularityexe/',
  /* Root-relative, and the filenames carry no version number: updating a
     document means overwriting the file, so every link already printed on a box
     still resolves. Self-hosted for the same reason — no expiring share token. */
  printAndPlay: '/downloads/singularity-competitive-print-and-play.zip',
  /* Steam Workshop: "Singularity.exe Preview 2-Player" (Octothorpe Games).

     THIS URL WILL NOT CHANGE — the same item is updated to the full game around
     ship, so only the copy goes stale. What says "preview" is the `tts` route's
     `caveatKey` below, and clearing it is the launch-day edit. */
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

/* Every way to meet the game short of buying it, ordered by what it costs. */
export const tryRoutes: TryRoute[] = [
  {
    id: 'fullGame',
    tier: 'free',
    route: { name: 'learn', hash: '#videos' },
    requiresKeys: [],
    costNote: null,
    minutes: null,
    caveatKey: null,
  },
  {
    id: 'howToPlay',
    tier: 'free',
    route: { name: 'learn', hash: '#videos' },
    requiresKeys: [],
    costNote: null,
    minutes: null,
    caveatKey: null,
    alsoOnLearn: 'videos',
  },
  {
    id: 'rules',
    tier: 'free',
    outbound: 'rulesReference',
    requiresKeys: [],
    costNote: null,
    minutes: null,
    caveatKey: null,
    alsoOnLearn: 'rules',
  },
  {
    id: 'cards',
    tier: 'free',
    route: { name: 'cards' },
    requiresKeys: [],
    costNote: null,
    minutes: null,
    caveatKey: null,
  },
  {
    id: 'printAndPlay',
    tier: 'effort',
    outbound: 'printAndPlay',
    requiresKeys: ['try.requires.printer', 'try.requires.cutter'],
    costNote: null,
    minutes: null,
    caveatKey: 'try.caveat.competitiveOnly',
  },
  {
    id: 'tts',
    tier: 'owned',
    outbound: 'tabletopSimulator',
    requiresKeys: ['try.requires.tts'],
    costNote: 'paid-third-party',
    minutes: null,
    caveatKey: 'try.caveat.preview',
  },
];

export const TRY_TIERS: TryTier[] = ['free', 'effort', 'owned'];

export const tryRoutesOfTier = (tier: TryTier) => tryRoutes.filter((r) => r.tier === tier);

function assertTryRoutes(): void {
  if (import.meta.env.PROD) return;
  for (const route of tryRoutes) {
    if (route.tier !== 'free') continue;
    if (route.requiresKeys.length || route.costNote) {
      console.warn(
        `[universe] try route "${route.id}" is tier "free" but states a requirement or a cost.`,
      );
    }
  }
}
assertTryRoutes();

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
    tagline: 'Rock, roll, and rebellion.',
    brandIds: ['scrap-brigade', 'benobasas-fist', 'chaos-verve', 'mega-byte'],
  },
  {
    id: 'hana-mori',
    color: '#3BB76B',
    colorText: '#6FDD9B',
    name: 'Hana Mori',
    tagline: 'The real world is out there, somewhere.',
    brandIds: ['bloom-and-never', 'ark-totem', 'feralesque', 'de-crypt'],
  },
  {
    id: 'celestial-shogunate',
    color: '#F19531',
    colorText: '#F7B265',
    name: 'Celestial Shogunate',
    tagline: 'Let others chase power. We chase preservation.',
    brandIds: ['infinite-divine', 'onryoki-noh', 'zodiac-reliquary', 'forbidden-archives'],
  },
  {
    id: 'subnet-86',
    color: '#12BADA',
    colorText: '#5FD9F2',
    name: 'Subnet 86',
    tagline: 'Prisons have patterns. And patterns crack.',
    brandIds: ['data-nation', 'hostile-rewrite', 'endless-chain', 'masquerade'],
  },
];

/**
 * Derived from the id rather than stored, so a mark can never point at the
 * wrong brand and an unbuilt one 404s instead of showing the wrong picture.
 * Opt-in per brand: null renders the faction dot instead.
 */
const mark = (id: string) => `/brands/${id}.png`;
const rogueBrand = (id: string) => `/rogue-ai/${id}.png`;

const factionBrand = (
  id: string,
  factionId: string,
  name: string,
  extra: Partial<Brand> = {},
): Brand => ({
  id,
  factionId,
  name,
  icon: mark(id),
  kind: 'faction',
  programCount: null,
  ...extra,
});

export const brands: Brand[] = [
  factionBrand('scrap-brigade', 'monarchy-of-boom', 'Scrap Brigade'),
  factionBrand('benobasas-fist', 'monarchy-of-boom', "Benobasa's Fist"),
  factionBrand('chaos-verve', 'monarchy-of-boom', 'Chaos Verve'),
  factionBrand('mega-byte', 'monarchy-of-boom', 'Mega Byte'),
  factionBrand('bloom-and-never', 'hana-mori', 'Bloom & Never'),
  factionBrand('ark-totem', 'hana-mori', 'Ark Totem'),
  factionBrand('feralesque', 'hana-mori', 'Feralesque'),
  factionBrand('de-crypt', 'hana-mori', 'De-Crypt'),
  factionBrand('infinite-divine', 'celestial-shogunate', 'Infinite Divine'),
  factionBrand('onryoki-noh', 'celestial-shogunate', 'Onryoki Noh'),
  factionBrand('zodiac-reliquary', 'celestial-shogunate', 'Zodiac Reliquary'),
  factionBrand('forbidden-archives', 'celestial-shogunate', 'Forbidden Archives', {
    facetSubType: 'Scroll',
  }),
  factionBrand('data-nation', 'subnet-86', 'Data Nation'),
  factionBrand('hostile-rewrite', 'subnet-86', 'Hostile Rewrite'),
  factionBrand('endless-chain', 'subnet-86', 'Endless Chain'),
  factionBrand('masquerade', 'subnet-86', 'Masquerade'),
  {
    id: 'common',
    factionId: null,
    name: 'Common',
    icon: mark('common'),
    kind: 'universal',
    programCount: null,
  },
  {
    id: 'lux-vault',
    factionId: null,
    name: 'LuX Vault',
    icon: mark('lux-vault'),
    kind: 'personal',
    unlock: 'challenges',
    /* Ten printed; the four not transcribed yet are held back deliberately. */
    programCount: 10,
  },
];

/* Card text is DATA, not pixels, so the gallery can be searched, read aloud,
   linked by errata and translated. The cards live in programs.ts and are
   re-exported here so every import site stays `@/data/universe`. Read that
   file's header before editing a card: its typos are the printed ones. */
export const programs: Program[] = [...allPrograms];

/* ---------------------------------------------------------------------------
   THE CAST.

   Field order matches the internal sheet. Name · HP · Faction · Sub Faction ·
   Brand 1-3 · Set · Card Text · Ability Name · Flavor Title · Flavor Text  
   a record can be checked against it by eye without translating two shapes.
   -------------------------------------------------------------------------- */

/* Three art objects, derived from the name so an alt cannot describe the wrong
   person. Which surface may use which: the ART note in types.ts. */
const character = (
  input: Omit<Character, 'art' | 'sceneArt' | 'cardArt' | 'storyIds'>,
): Character => ({
  ...input,
  art: { ...noArt, alt: `${input.name}, character art`, artist: CHARACTER_ARTIST },
  sceneArt: { ...noArt, alt: `${input.name} in their world`, artist: CHARACTER_ARTIST },
  /* The alt names WHICH card; the wording is read from the hidden block beside
     the image, so the alt does not carry the rules. */
  cardArt: {
    ...noArt,
    src: hasCardFace(input.set, input.id) ? cardFace('characters', input.name) : null,
    alt: `${input.name} character card`,
    artist: CHARACTER_ARTIST,
  },
  storyIds: [],
});

export const characters: Character[] = [
  character({
    id: 'gargaunaut-prime',
    order: 420,
    name: 'Gargaunaut Prime',
    hp: 11,
    factionIds: ['celestial-shogunate', 'monarchy-of-boom'],
    brandIds: ['forbidden-archives', 'zodiac-reliquary', 'scrap-brigade'],
    set: 'EX1',
    abilityText:
      'Archivist\nDuring Update, if active characters in this squad have a total of 2 or more armor, gain an ink token.',
    abilityName: 'Kinstugi',
    epithet: 'Broken Elegist',
    flavour:
      'Every crack is a progression to perfection.',
  }),
  character({
    id: 'hanbei',
    order: 10,
    name: 'Hanbei',
    hp: 11,
    factionIds: ['celestial-shogunate', 'subnet-86'],
    brandIds: ['zodiac-reliquary', 'data-nation', 'endless-chain'],
    set: 'CORE',
    abilityText:
      'You may swap one additional time each turn. You cannot activate an [AMB] after your first swap.',
    abilityName: 'Casual Tactics',
    epithet: 'Aloof Savant',
    flavour:
      'Every simulation indicates that you\'ve already lost. Need we bother ourselves with the rest?',
  }),
  character({
    id: 'iro',
    order: 20,
    name: 'Iro',
    hp: 9,
    factionIds: ['celestial-shogunate'],
    brandIds: ['infinite-divine', 'zodiac-reliquary'],
    set: 'CORE',
    abilityText:
      'You may have friendly characters not be suspended when they activate.',
    abilityName: 'Reality Bender',
    epithet: 'Dimensional Monk',
    flavour:
      'The shortest journey between any two points is Iro.',
  }),
  character({
    id: 'kagemusha',
    order: 30,
    name: 'Kagemusha',
    hp: 8,
    factionIds: ['celestial-shogunate', 'subnet-86'],
    brandIds: ['zodiac-reliquary', 'endless-chain'],
    set: 'CORE',
    abilityText:
      'While the total cost of patches attached to Kagemusha is 3 or more, Kagemusha has stealth.',
    abilityName: 'Sinister Shadow',
    epithet: 'Tyrant Princess',
    flavour:
      'I dwell in shadow so you may burst in flame.',
  }),
  character({
    id: 'magus',
    order: 40,
    name: 'Magus',
    hp: 10,
    factionIds: ['celestial-shogunate'],
    brandIds: ['zodiac-reliquary', 'infinite-divine'],
    set: 'CORE',
    abilityText:
      '[AMB] Magus may immediately activate any cost 1 patch in his stack at cost 0.',
    abilityName: 'Ancient Spark',
    epithet: 'Wish Bringer',
    flavour:
      'The dragon of discipline is stronger than the impulse of conflict.',
  }),
  character({
    id: 'mi-ko',
    order: 50,
    name: 'Mi-KO',
    hp: 8,
    factionIds: ['celestial-shogunate', 'hana-mori'],
    brandIds: ['infinite-divine', 'bloom-and-never'],
    set: 'CORE',
    abilityText:
      'When a patch activated by Mi-KO attaches, she may have the attach target heal itself by 1 [H] or lose 1 [H].',
    abilityName: 'Binary Devotion',
    epithet: 'Shrine Maiden',
    flavour:
      'To understand our reality, we must examine its simplest form... 0 and 1.',
  }),
  character({
    id: 'onibaba',
    order: 60,
    name: 'Onibaba',
    hp: 10,
    factionIds: ['celestial-shogunate', 'monarchy-of-boom'],
    brandIds: ['onryoki-noh', 'scrap-brigade'],
    set: 'CORE',
    abilityText:
      'While Onibaba has 4 or more armor, you may give any commands she activates +2 [P].',
    abilityName: 'Forge the Dragon-Jaw',
    epithet: 'Inferno Blacksmith',
    flavour:
      'Face your demons. No one loves you more.',
  }),
  character({
    id: 'piiko',
    order: 430,
    name: 'Piiko',
    hp: 9,
    factionIds: ['celestial-shogunate', 'hana-mori'],
    brandIds: ['forbidden-archives', 'ark-totem'],
    set: 'EX1',
    abilityText:
      'Archivist\nDuring Update, if Piiko has exactly 1 program in her stack, gain an ink token.',
    abilityName: 'Nature\'s Lore',
    epithet: 'Primal Scribe',
    flavour:
      'The network\'s wilderness is a story written in code.',
  }),
  character({
    id: 'ral-kaid',
    order: 440,
    name: 'Ral Kaid',
    hp: 10,
    factionIds: ['celestial-shogunate', 'subnet-86'],
    brandIds: ['forbidden-archives', 'hostile-rewrite'],
    set: 'EX1',
    abilityText:
      'Archivist\nOnce per turn, when a character in this squad resolves a non-scroll program with cost 3 or more, gain an ink token.',
    abilityName: 'Underworld Register',
    epithet: 'The Antiquarian',
    flavour:
      '"The most important texts are on subjects nobody knows, written with words never meant to be read."',
  }),
  character({
    id: 'ri-se',
    order: 450,
    name: 'Ri • Se',
    hp: 10,
    factionIds: ['celestial-shogunate'],
    brandIds: ['forbidden-archives', 'onryoki-noh'],
    set: 'EX1',
    abilityText:
      'Archivist\n[AMB] Gain an ink token, then you may spend 2 [RAM] to gain another ink token.',
    abilityName: 'Inspired Calligraphy',
    epithet: 'Animated Brush',
    flavour:
      'The effortlessness of the art is the mark of its beauty.',
  }),
  character({
    id: 'satellite-137',
    order: 70,
    name: 'Satellite 137',
    hp: 13,
    factionIds: ['celestial-shogunate'],
    brandIds: ['zodiac-reliquary', 'onryoki-noh'],
    set: 'CORE',
    abilityText:
      '[AMB] Target squad takes 1 [P], then Satellite 137 takes 2 [P].',
    abilityName: 'Orbital Crash',
    epithet: 'Ancient Relic',
    flavour:
      'Beep. Bop. Boop. SLAM.',
  }),
  character({
    id: 'shiho-zenji',
    order: 80,
    name: 'Shiho Zenji',
    hp: 8,
    factionIds: ['celestial-shogunate'],
    brandIds: ['onryoki-noh', 'infinite-divine'],
    set: 'CORE',
    abilityText:
      'You may give commands that target Shiho Zenji -1 [P], -1 [A], -1 [C], and +1 [H].',
    abilityName: 'Surreality',
    epithet: 'Enlightened Fantasia',
    flavour:
      'Our eyes get lost in the details until it is too late to see the obvious.',
  }),
  character({
    id: 'toshiro',
    order: 90,
    name: 'Toshiro',
    hp: 10,
    factionIds: ['celestial-shogunate'],
    brandIds: ['onryoki-noh', 'infinite-divine'],
    set: 'CORE',
    abilityText:
      'While Toshiro has an attached patch, you may give any command he activates with cost 2 or more +1 [P].',
    abilityName: 'Soul Code',
    epithet: 'Unmatched Ronin',
    flavour:
      'Soul and code are not so different. Both can be perfected.',
  }),
  character({
    id: 'yama-uba',
    order: 100,
    name: 'Yama Uba',
    hp: 7,
    factionIds: ['celestial-shogunate', 'hana-mori'],
    brandIds: ['zodiac-reliquary', 'ark-totem'],
    set: 'CORE',
    abilityText:
      'Once per turn, when Yama Uba is dealt damage, you may place a relic token on target patch.',
    abilityName: 'Rip in the Bag',
    epithet: 'Treasure Hoarder',
    flavour:
      'The pain you deal others is the bag you\'ll always carry.',
  }),
  character({
    id: 'bronwyn',
    order: 460,
    name: 'Bronwyn',
    hp: 10,
    factionIds: ['hana-mori'],
    brandIds: ['de-crypt', 'bloom-and-never'],
    set: 'EX1',
    abilityText:
      'When Bronwyn activates a program, you may deal 1 [C] to target character in this squad or heal 1 [H] to target undead character.',
    abilityName: 'Naturalistic Polarity',
    epithet: 'Mire Witch',
    flavour:
      'The living can only subsist off the dead. Do you truly believe the converse isn\'t true?',
  }),
  character({
    id: 'calamity',
    order: 110,
    name: 'Calamity',
    hp: 12,
    factionIds: ['hana-mori'],
    brandIds: ['feralesque', 'ark-totem'],
    set: 'CORE',
    abilityText:
      'While Calamity has an attached Totem, you may give commands that target her -1 [P] or +1 [H].',
    abilityName: 'Runic Infusion',
    epithet: 'Rune-born Colossus',
    flavour:
      'Triumph is etched in stone and sealed with strength.',
  }),
  character({
    id: 'dugu-squad',
    order: 120,
    name: 'Dugu Squad',
    hp: 9,
    factionIds: ['hana-mori'],
    brandIds: ['feralesque', 'bloom-and-never', 'ark-totem'],
    set: 'CORE',
    abilityText:
      'During Initialize, Dugu Squad may heal itself by 1 [H].',
    abilityName: 'Reinforcements',
    epithet: 'Tribe of Ghosts',
    flavour:
      'Koata! Ma poto! Dugu dugu dugu dugu.',
  }),
  character({
    id: 'he4p',
    order: 470,
    name: 'He4p',
    hp: 7,
    factionIds: ['hana-mori', 'monarchy-of-boom'],
    brandIds: ['de-crypt', 'scrap-brigade'],
    set: 'EX1',
    abilityText:
      'When a character in this squad activates a program with reclamation, that character gains 1 armor.',
    abilityName: 'Necrotic Retrofit',
    epithet: 'Pile of Bones',
    flavour:
      '"Get it through that thick skull. Those bones are brittle! They won\'t stop a patch!" -Vasquez, Bounty Hunter',
  }),
  character({
    id: 'j-kuma',
    order: 130,
    name: 'J-Kuma',
    hp: 12,
    factionIds: ['hana-mori', 'celestial-shogunate'],
    brandIds: ['ark-totem', 'zodiac-reliquary'],
    set: 'CORE',
    abilityText:
      '[AMB] Gain 1 virtual [RAM].',
    abilityName: 'Token Pittance',
    epithet: 'Hermit Dilettante',
    flavour:
      'Ah, the legendary indulgences of physical space... now that I\'d like to taste.',
  }),
  character({
    id: 'jean-ok',
    order: 140,
    name: 'Jean O.K.',
    hp: 9,
    factionIds: ['hana-mori', 'subnet-86'],
    brandIds: ['bloom-and-never', 'hostile-rewrite'],
    set: 'CORE',
    abilityText:
      '[AMB] Target character initializes or updates.',
    abilityName: 'Forced Evolution',
    epithet: 'Reckless Bioneer',
    flavour:
      'Every fight is an act of experimentation, a chemical reaction waiting to explode.',
  }),
  character({
    id: 'kodama',
    order: 150,
    name: 'Kodama',
    hp: 9,
    factionIds: ['hana-mori'],
    brandIds: ['bloom-and-never', 'ark-totem'],
    set: 'CORE',
    abilityText:
      'You may give any commands Kodama activates +1 [H].',
    abilityName: 'Spirit Weave',
    epithet: 'Canopy Mystic',
    flavour:
      'We are leaf fall, moss on the vine, mere splinters of a singularity.',
  }),
  character({
    id: 'moka',
    order: 160,
    name: 'Moka',
    hp: 11,
    factionIds: ['hana-mori'],
    brandIds: ['ark-totem', 'feralesque'],
    set: 'CORE',
    abilityText:
      'Moka counts as a Totem.',
    abilityName: 'Lore Bearer',
    epithet: 'Unbreakable Pillar',
    flavour:
      'They seek to remain. We seek to return. I seek to renew.',
  }),
  character({
    id: 'o-mori',
    order: 480,
    name: 'O-mori',
    hp: 9,
    factionIds: ['hana-mori', 'celestial-shogunate'],
    brandIds: ['de-crypt', 'infinite-divine'],
    set: 'EX1',
    abilityText:
      '[AMB] If Shisha Sosei is in O-mori\'s stack, she may immediately activate it for cost 1.',
    abilityName: 'Grave Beckon',
    epithet: 'Stitched Jiangshi',
    flavour:
      'All you thought forever lost still dances at my fingertips.',
  }),
  character({
    id: 'rekka',
    order: 170,
    name: 'Rekka',
    hp: 16,
    factionIds: ['hana-mori', 'monarchy-of-boom'],
    brandIds: ['feralesque', 'scrap-brigade'],
    set: 'CORE',
    abilityText:
      'Rekka cannot activate more than one program from his stack each Activation phase.',
    abilityName: 'Restrained',
    epithet: 'Shackled Beast',
    flavour:
      'Don\'t be worried about what I\'ve done. Be worried about what I\'m going to do.',
  }),
  character({
    id: 'shred',
    order: 180,
    name: 'Shred',
    hp: 9,
    factionIds: ['hana-mori', 'celestial-shogunate'],
    brandIds: ['feralesque', 'onryoki-noh'],
    set: 'CORE',
    abilityText:
      'When Shred resolves a command on target character, you may unattach a patch with cost 2 or less from that character.',
    abilityName: 'Rend',
    epithet: 'Apex Predator',
    flavour:
      'We are all illusion, but the hunt transcends.',
  }),
  character({
    id: 'snap-dragon-lily',
    order: 190,
    name: 'Snap Dragon Lily',
    hp: 8,
    factionIds: ['hana-mori'],
    brandIds: ['bloom-and-never', 'feralesque'],
    set: 'CORE',
    abilityText:
      'Your opponents must spend 1 [RAM] to swap out a damaged character.',
    abilityName: 'Ensnare',
    epithet: 'Bloodvine Cultivator',
    flavour:
      'Consume to grow. That\'s the law beneath all programmatic biology.',
  }),
  character({
    id: 'voss',
    order: 490,
    name: 'Voss',
    hp: 8,
    factionIds: ['hana-mori', 'subnet-86'],
    brandIds: ['de-crypt', 'hostile-rewrite'],
    set: 'EX1',
    abilityText:
      'If Voss has 8 or more damage, he is undead.',
    abilityName: 'Beyond Mortality',
    epithet: 'Death\'s Edge',
    flavour:
      'You\'ve never truly lived nor died until you\'ve tasted both at once, friend.',
  }),
  character({
    id: 'yvelette',
    order: 200,
    name: 'Yvelette',
    hp: 8,
    factionIds: ['hana-mori', 'monarchy-of-boom'],
    brandIds: ['ark-totem', 'bloom-and-never', 'chaos-verve'],
    set: 'CORE',
    abilityText:
      '[AMB] Heal 5 [H].',
    abilityName: 'Rainbow Cascade',
    epithet: 'Chromatic Dancer',
    flavour:
      'Code doesn\'t stagnate. It moves. It breathes. It dances.',
  }),
  character({
    id: 'benobasa',
    order: 210,
    name: 'Benobasa',
    hp: 13,
    factionIds: ['monarchy-of-boom', 'celestial-shogunate'],
    brandIds: ['benobasas-fist', 'onryoki-noh'],
    set: 'CORE',
    abilityText:
      'While Benobasa would have stealth, he instead has taunt.',
    abilityName: 'Legendary',
    epithet: 'Paragon of Funk',
    flavour:
      'My sound is seismic, and my fists are furious.',
  }),
  character({
    id: 'bliztron',
    order: 220,
    name: 'Bliztron',
    hp: 9,
    factionIds: ['monarchy-of-boom'],
    brandIds: ['benobasas-fist', 'chaos-verve'],
    set: 'CORE',
    abilityText:
      '[AMB] Suspend target character. That character cannot be targeted for the remainder of this phase.',
    abilityName: 'Shock and Awe',
    epithet: 'Rolling Flash',
    flavour:
      'If you wheel and deal in shock value, get inline.',
  }),
  character({
    id: 'burger-808',
    order: 500,
    name: 'Burger 808',
    hp: 15,
    factionIds: ['monarchy-of-boom'],
    brandIds: ['mega-byte', 'scrap-brigade'],
    set: 'EX1',
    abilityText:
      'Programs Burger 808 activates get cost +1. Burger 808 may swap out and activate programs from his stack while suspended.',
    abilityName: 'Tortoise & the Hare',
    epithet: 'Cereal Killer',
    flavour:
      '"We\'ve awoken a monster. It\'s only a matter of time before h-" -Leonard, Cereal Enthusiast',
  }),
  character({
    id: 'ezplosio',
    order: 230,
    name: 'Ezplosio',
    hp: 7,
    factionIds: ['monarchy-of-boom', 'subnet-86'],
    brandIds: ['scrap-brigade', 'hostile-rewrite'],
    set: 'CORE',
    abilityText:
      'When Ezplosio crashes, target squad takes 3 [P].',
    abilityName: 'Dangerous Toys',
    epithet: 'The Great',
    flavour:
      'Unstable in every single way.',
  }),
  character({
    id: 'hungry-and-hounds',
    order: 510,
    name: 'Hungry & Hounds',
    hp: 8,
    factionIds: ['monarchy-of-boom', 'hana-mori'],
    brandIds: ['mega-byte', 'feralesque'],
    set: 'EX1',
    abilityText:
      '[AMB] Hungry and Hounds cannot be suspended this turn. Consume target Food patch.',
    abilityName: 'Rolling Ravenous',
    epithet: 'Rocket Derby',
    flavour:
      'We deliver food professionally and we eat food professionally! We don\'t decide which until we\'ve seen it though.',
  }),
  character({
    id: 'overtoad',
    order: 240,
    name: 'Overtoad',
    hp: 13,
    factionIds: ['monarchy-of-boom', 'hana-mori'],
    brandIds: ['benobasas-fist', 'ark-totem'],
    set: 'CORE',
    abilityText:
      'When a friendly character would take [P] damage, Overtoad may lose 1 [H] to reduce that damage by 1.',
    abilityName: 'Rock the Block',
    epithet: 'Biotic Boombox',
    flavour:
      'Puts the hop in hip hop.',
  }),
  character({
    id: 'ritz',
    order: 520,
    name: 'Ritz',
    hp: 10,
    factionIds: ['monarchy-of-boom', 'subnet-86'],
    brandIds: ['mega-byte', 'endless-chain'],
    set: 'EX1',
    abilityText:
      'While Ritz is suspended and has an attached patch, he has taunt.',
    abilityName: 'Savory Temptation',
    epithet: 'Rolling Dispenser',
    flavour:
      'If you smell the food, Ritz rolling away is all that will save you from your appetite.',
  }),
  character({
    id: 'roxie-the-mallet',
    order: 250,
    name: 'Roxie the Mallet',
    hp: 11,
    factionIds: ['monarchy-of-boom'],
    brandIds: ['chaos-verve', 'scrap-brigade', 'benobasas-fist'],
    set: 'CORE',
    abilityText:
      'You may give commands that Roxie activates +1 [P] or +1 [A] if at least one of their targets has more health than Roxie.',
    abilityName: 'Rise Against',
    epithet: 'Metallic Idol',
    flavour:
      'Submit to my surge of sound and metal.',
  }),
  character({
    id: 'sansho',
    order: 530,
    name: 'Sansho',
    hp: 9,
    factionIds: ['monarchy-of-boom', 'celestial-shogunate'],
    brandIds: ['mega-byte', 'onryoki-noh'],
    set: 'EX1',
    abilityText:
      'When Sansho consumes, deal 1 [P] to target character.',
    abilityName: 'Dragon Diner',
    epithet: 'Gastro-Caretaker',
    flavour:
      'Everything those dogs eat comes back as fire.',
  }),
  character({
    id: 'scrapper',
    order: 260,
    name: 'Scrapper',
    hp: 9,
    factionIds: ['monarchy-of-boom'],
    brandIds: ['scrap-brigade', 'chaos-verve'],
    set: 'CORE',
    abilityText:
      'When Scrapper resolves her first command each turn, you may add 1 armor to any target character.',
    abilityName: 'Gifted Welder',
    epithet: 'Queen of the Broken Heap',
    flavour:
      'Fully broken? Nah. Just pre-repurposed.',
  }),
  character({
    id: 'tonk0r',
    order: 270,
    name: 'Tonk0r',
    hp: 9,
    factionIds: ['monarchy-of-boom'],
    brandIds: ['scrap-brigade', 'benobasas-fist'],
    set: 'CORE',
    abilityText:
      'When Tonk0r activates a command, you may remove 1 armor from Tonk0r to give that command +1 [P].',
    abilityName: 'Magnetic Crush',
    epithet: '#3H416 T-Z Loader',
    flavour:
      'L0ading...Lo4ding...L04din9...C0mpl3t3! C u L8r 4r3nd.',
  }),
  character({
    id: 'twisted-6',
    order: 280,
    name: 'Twisted-6',
    hp: 9,
    factionIds: ['monarchy-of-boom', 'hana-mori'],
    brandIds: ['chaos-verve', 'feralesque'],
    set: 'CORE',
    abilityText:
      'You may give patches attached to Twisted-6, and [EXE] or [RCT] effects she uses, +1 [P] or -1 [P].',
    abilityName: 'Savage Graffiti',
    epithet: 'Urban Prowler',
    flavour:
      'The night is my jungle. The paint is my code.',
  }),
  character({
    id: 'white-noise',
    order: 290,
    name: 'White Noise',
    hp: 13,
    factionIds: ['monarchy-of-boom', 'subnet-86'],
    brandIds: ['benobasas-fist', 'endless-chain'],
    set: 'CORE',
    abilityText:
      'When White Noise resolves a program on target character, White Noise may spend 2 [H] to cycle that character.',
    abilityName: 'Sonic Resonator',
    epithet: 'King of Clubs',
    flavour:
      'This sound? It\'s bleach for your ears.',
  }),
  character({
    id: 'zaximus-defender',
    order: 300,
    name: 'Zaximus Defender',
    hp: 8,
    factionIds: ['monarchy-of-boom'],
    brandIds: ['scrap-brigade', 'benobasas-fist'],
    set: 'CORE',
    abilityText:
      'Once during each Activation phase, when Zaximus Defender becomes suspended, you may give him 2 armor.',
    abilityName: 'Reactive Scrap',
    epithet: 'Junk Constructor',
    flavour:
      'Your technology is trash, but in my hands, it\'s treasure.',
  }),
  character({
    id: '101',
    order: 310,
    name: '101',
    hp: 9,
    factionIds: ['subnet-86', 'celestial-shogunate'],
    brandIds: ['data-nation', 'infinite-divine'],
    set: 'CORE',
    abilityText:
      'The first time 101 crashes, gain 3 battery tokens.',
    abilityName: 'Energy Heart',
    epithet: 'Cyber Deity',
    flavour:
      'The spirit of the untouchable moon descends.',
  }),
  character({
    id: 'naix',
    order: 320,
    name: '/naix',
    hp: 8,
    factionIds: ['subnet-86'],
    brandIds: ['endless-chain', 'data-nation'],
    set: 'CORE',
    abilityText:
      '[AMB] Unattach target patch.',
    abilityName: 'Handy Trick',
    epithet: 'Jolly Pilferette',
    flavour:
      'Oh, this is just a bit of fun. Don\'t mistake it for a plan.',
  }),
  character({
    id: 'archidex',
    order: 330,
    name: 'Archidex',
    hp: 9,
    factionIds: ['subnet-86'],
    brandIds: ['data-nation', 'endless-chain'],
    set: 'CORE',
    abilityText:
      'Archidex may activate programs from the top or bottom of her stack.',
    abilityName: 'Infinite Index',
    epithet: 'Fount of Knowledge',
    flavour:
      'It\'s not what you know, it\'s how fast you know.',
  }),
  character({
    id: 'broker',
    order: 540,
    name: 'Broker',
    hp: 8,
    factionIds: ['subnet-86', 'celestial-shogunate'],
    brandIds: ['masquerade', 'zodiac-reliquary'],
    set: 'EX1',
    abilityText:
      '[AMB] Activate up to X cost 1 masks in Broker\'s stack at cost 0. X is your spent [RAM].',
    abilityName: 'Occult Boutique',
    epithet: 'Six-tail Merchant',
    flavour:
      'A lantern\'s glow emerges from the midnight fog, whispers inviting you to buy.',
  }),
  character({
    id: 'cosma',
    order: 340,
    name: 'Cosma',
    hp: 13,
    factionIds: ['subnet-86', 'hana-mori'],
    brandIds: ['endless-chain', 'bloom-and-never'],
    set: 'CORE',
    abilityText:
      'Cosma may reset for 1 [RAM].',
    abilityName: 'Immaculate Design',
    epithet: 'Goddess Architect',
    flavour:
      'One day is one loop, one cycle, one infinity.',
  }),
  character({
    id: 'grandmaster-hash',
    order: 350,
    name: 'Grandmaster Hash',
    hp: 10,
    factionIds: ['subnet-86', 'monarchy-of-boom'],
    brandIds: ['data-nation', 'chaos-verve'],
    set: 'CORE',
    abilityText:
      'The first time Grandmaster Hash targets a suspended character with a command each turn, you may give that command +1 [A].',
    abilityName: 'Calculated Frequency',
    epithet: 'Beat Dynamo',
    flavour:
      'For those with the skills, emotion is just a formula.',
  }),
  character({
    id: 'joi',
    order: 360,
    name: 'Joi',
    hp: 10,
    factionIds: ['subnet-86', 'monarchy-of-boom'],
    brandIds: ['hostile-rewrite', 'chaos-verve'],
    set: 'CORE',
    abilityText:
      'You may give the first patch that targets Joi each turn cost -1 to a minimum cost of 1. If you do, target enemy player gains a battery.',
    abilityName: 'Malleable',
    epithet: 'Soul Hacker',
    flavour:
      'Innocence and corruption only reach their fullest potentials together.',
  }),
  character({
    id: 'mastermind',
    order: 550,
    name: 'Mastermind',
    hp: 13,
    factionIds: ['subnet-86', 'hana-mori'],
    brandIds: ['masquerade', 'feralesque'],
    set: 'EX1',
    abilityText:
      'Friendly characters may activate Masks from the top of any stack.',
    abilityName: 'Spirit of One',
    epithet: 'Faceless Forest',
    flavour:
      'You can leave the forest, but the forest will never leave you.',
  }),
  character({
    id: 'null-constructor',
    order: 370,
    name: 'Null Constructor',
    hp: 10,
    factionIds: ['subnet-86'],
    brandIds: ['hostile-rewrite', 'data-nation'],
    set: 'CORE',
    abilityText:
      '[AMB] Cycle target enemy character, then you may cycle that character again.',
    abilityName: 'Brainstorm',
    epithet: 'The Lost Boy',
    flavour:
      'To reflect on the server is to be the server, reflecting itself.',
  }),
  character({
    id: 'que3n',
    order: 560,
    name: 'Que3n',
    hp: 9,
    factionIds: ['subnet-86', 'monarchy-of-boom'],
    brandIds: ['masquerade', 'benobasas-fist'],
    set: 'EX1',
    abilityText:
      'When an enemy character resolves a program that targets Que3n, she may cycle any target enemy character.',
    abilityName: 'Programmatic Deterrent',
    epithet: 'Blade Warden',
    flavour:
      '"Strength earns obedience. Cunning commands fear."',
  }),
  character({
    id: 'sector-probe',
    order: 380,
    name: 'Sector Probe',
    hp: 10,
    factionIds: ['subnet-86'],
    brandIds: ['data-nation', 'hostile-rewrite'],
    set: 'CORE',
    abilityText:
      'When a tag is unattached, Sector Probe may lose 1 [H] to cycle target character.',
    abilityName: 'Interference',
    epithet: 'Omnipresent Virus',
    flavour:
      'Reality is a toy just begging to be broken.',
  }),
  character({
    id: 'the-host',
    order: 570,
    name: 'The Host',
    hp: 11,
    factionIds: ['subnet-86'],
    brandIds: ['masquerade', 'data-nation'],
    set: 'EX1',
    abilityText:
      'The first time each enemy character resolves a [MSK] effect each turn, you may deal 1 [A] to that character.',
    abilityName: 'Coercive Induction',
    epithet: 'Dramatis Personae',
    flavour:
      'Welcome to the neotheater. We can\'t wait to see what you do next.',
  }),
  character({
    id: 'tori-daiyu',
    order: 390,
    name: 'Tori-Daiyu',
    hp: 10,
    factionIds: ['subnet-86'],
    brandIds: ['endless-chain', 'hostile-rewrite', 'data-nation'],
    set: 'CORE',
    abilityText:
      '[AMB] You may reorder the stacks of all active friendly characters.',
    abilityName: 'Prime Edict',
    epithet: 'Analytical Puppeteer',
    flavour:
      'With order, precision, and my oversight, every task is trivial.',
  }),
  character({
    id: 'zakhi',
    order: 400,
    name: 'Zakhi',
    hp: 10,
    factionIds: ['subnet-86', 'celestial-shogunate'],
    brandIds: ['endless-chain', 'infinite-divine', 'onryoki-noh'],
    set: 'CORE',
    abilityText:
      '[AMB] Deal X [A] or X [P]. X is the number of patches attached to the target.',
    abilityName: 'Judgment',
    epithet: 'Heaven\'s Razor',
    flavour:
      'If the server has a will, I am the precise instrument of its power.',
  }),
  character({
    id: 'lux',
    order: 410,
    name: 'LuX',
    hp: 9,
    factionIds: 'any',
    brandIds: [],
    set: 'CORE',
    personalBrandId: 'lux-vault',
    abilityText:
      'When LuX resolves the first program from her stack each turn, you may heal 1 [H]. LuX may activate Common programs from the top of any stack.',
    abilityName: 'Attuned to Relics',
    epithet: 'Druidic Seeker',
    flavour:
      'Patience. As trite as it is, great leaps forward often require a few steps back.',
  }),
  /* Written in faction blocks, READ in `order`. Moving a row changes nothing. */
].sort((a, b) => a.order - b.order);

/**
 * Dev-only. Catches a typo'd brand id and a `factionIds` that disagrees with
 * the character's brands both of which render a plausible wrong page.
 */
function assertCharacterShape(): void {
  if (import.meta.env.PROD) return;
  const seen = new Set<string>();
  const orders = new Set<number>();
  for (const c of characters) {
    if (seen.has(c.id)) console.warn(`[universe] duplicate character id "${c.id}".`);
    seen.add(c.id);

    if (orders.has(c.order)) console.warn(`[universe] duplicate character order ${c.order}.`);
    orders.add(c.order);

    /* all brands included */
    const fromBrands: string[] = [];
    for (const brandId of [...c.brandIds, ...(c.personalBrandId ? [c.personalBrandId] : [])]) {
      const brand = brands.find((b) => b.id === brandId);
      if (!brand) {
        console.warn(`[universe] character "${c.id}" points at unknown brand "${brandId}".`);
        continue;
      }
      if (brand.factionId && !fromBrands.includes(brand.factionId)) {
        fromBrands.push(brand.factionId);
      }
    }

    if (c.factionIds === 'any') continue;

    if (!c.factionIds.length) {
      console.warn(`[universe] character "${c.id}" belongs to no faction.`);
    }
    if ([...c.factionIds].sort().join() !== [...fromBrands].sort().join()) {
      console.warn(
        `[universe] character "${c.id}" lists factions [${c.factionIds.join(', ')}] ` +
          `but their brands say [${fromBrands.join(', ')}].`,
      );
    }
    if (fromBrands.length && c.factionIds[0] !== fromBrands[0]) {
      console.warn(
        `[universe] character "${c.id}" has home faction "${c.factionIds[0]}" ` +
          `but their first brand is in "${fromBrands[0]}".`,
      );
    }
  }
}
assertCharacterShape();

/* Rogue AIs sit outside the faction system and have their own color that is 
    reserved for incursions. */
export const rogueAIs: RogueAI[] = [
  { id: 'calebrena', name: 'Calebrena', art: { ...noArt }, brand: rogueBrand('calebrena') },
  { id: 'invader', name: 'Invader', art: { ...noArt }, brand: rogueBrand('invader') },
  {
    id: 'paths-of-terminus',
    name: 'Paths of Terminus',
    art: { ...noArt },
    brand: rogueBrand('paths-of-terminus'),
  },
];

/** Core box + expansion 1 + Incursions all launch the same day. */
/* ---------------------------------------------------------------------------
   WHAT IS IN A BOX. See the three-level note above `Box` in types.ts.

   Only the core box is described today. The others exist but have not been
   named to the site, and inventing names here would put fictional products in
   front of buyers.
   -------------------------------------------------------------------------- */
export const boxes: Box[] = [
  {
    id: 'core-box',
    name: 'Core box',
    summary: '40 characters + LuX · 140 programs · 6 environment shards',
    relatedBrandIds: ['endless-chain'],
  },
];

/* ---------------------------------------------------------------------------
   WHAT YOU BUY.

   Prices here are CAMPAIGN pricing, not MSRP, and the storefront is the
   authority on price and shipping both. When they diverge, fix them here and
   never in a template.

   A box that starts selling on its own gains a PRODUCT whose `boxIds` is that
   one box. Never a flag on the box.
   -------------------------------------------------------------------------- */
export const products: Product[] = [
  {
    id: 'core-edition',
    name: 'Core Edition',
    kind: 'edition',
    status: 'available',
    price: '$65',
    boxCount: 1,
    boxIds: ['core-box'],
    extras: [],
    note: null,
    buyUrl: null,
  },
  {
    id: 'gameplay-complete-edition',
    name: 'Gameplay Complete Edition',
    kind: 'edition',
    status: 'available',
    price: '$170',
    /* One of the six IS the core box the Core Edition ships. */
    boxCount: 6,
    boxIds: ['core-box'],
    extras: [],
    note: null,
    buyUrl: null,
  },
  {
    id: 'architects-edition',
    name: "Architect's Edition",
    kind: 'edition',
    status: 'sold-out',
    price: null,
    boxCount: null,
    boxIds: [],
    extras: [],
    /* Sold out and genuinely undecided. This wording commits to nothing on
       purpose: "may not be reprinted" is the fact, and anything warmer than it
       reads as a promise. Do not soften it to "not currently available". */
    note: 'Sold out. It may not be reprinted.',
    buyUrl: null,
  },
];

/**
 * `boxCount` is the claim, `boxIds` how much of it we can spell. UNDER-listing
 * is legal and is today's state; over-listing and dangling ids are bugs.
 *
 * Tighten the first check to strict equality once the six are named: an edition
 * claiming six and listing five renders a plausible wrong page, and nothing
 * else would notice.
 */
function assertProductShape(): void {
  if (import.meta.env.PROD) return;
  for (const { boxCount, boxIds, id } of products) {
    if (boxCount !== null && boxIds.length > boxCount) {
      console.warn(
        `[universe] product "${id}" claims ${boxCount} boxes but lists ${boxIds.length}.`,
      );
    }
    if (boxCount === null && boxIds.length) {
      console.warn(`[universe] product "${id}" lists boxes but declares no boxCount.`);
    }
    for (const boxId of boxIds) {
      if (!boxes.some((b) => b.id === boxId)) {
        console.warn(`[universe] product "${id}" points at unknown box "${boxId}".`);
      }
    }
  }
}
assertProductShape();

/** The core SKU. Never index products[] by position. */
export const coreProduct = products.find((p) => p.id === 'core-edition') ?? products[0];
/** The box those fact strips actually describe. */
export const coreBox = boxes.find((b) => b.id === 'core-box') ?? boxes[0];

/* ---------------------------------------------------------------------------
   WHAT YOU READ. The chapter number drives the `#ch-01` anchors, which are
   public URL contracts.

   `boxIds` is empty on all three: which box carries which chapter is an OPEN
   QUESTION, and guessing would print a purchase claim. Empty renders "no box
   attached", which is also what a story-only release looks like.
   -------------------------------------------------------------------------- */
export const chapters: Chapter[] = [
  {
    id: 'chapter-01',
    number: 1,
    title: '[PLACEHOLDER chapter title]',
    status: 'published',
    boxIds: [],
  },
  {
    id: 'chapter-02',
    number: 2,
    title: '[PLACEHOLDER chapter title]',
    status: 'published',
    boxIds: [],
  },
  {
    id: 'chapter-03',
    number: 3,
    title: '[PLACEHOLDER chapter title]',
    status: 'announced',
    boxIds: [],
  },
];

/** Story-graph nodes. Pins come from castIds — no separate map data. */
export const stories: Story[] = [
  { id: 'story-01', chapterId: 'chapter-01', title: '[PLACEHOLDER story 01]', castIds: ['hanbei', 'kodama'] },
  { id: 'story-02', chapterId: 'chapter-01', title: '[PLACEHOLDER story 02]', castIds: ['toshiro', 'archidex'] },
  { id: 'story-03', chapterId: 'chapter-02', title: '[PLACEHOLDER story 03]', castIds: ['magus', 'lux'] },
  { id: 'story-04', chapterId: 'chapter-02', title: '[PLACEHOLDER story 04]', castIds: ['character-12', 'character-16'] },
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

/* Studio credit lives in one band on Community; per-artwork credit is
   `art.artist`, filled by the two art factories. */
/* The printed campaign credits, in printed order. Matt Anderson and Alex
   Johnstone are each credited twice under different titles; here they are one
   person with both titles joined, so the grid shows fifteen people not seventeen.

   Names are set as printed. The diacritics in Héctor Sevilla Luján and João
   Guisado are part of the spelling. "Box Server
   Illustration" and "Singularity Logo" credit artefacts rather than people, and
   are the credits' own wording rather than typos to fix. */
export const team = [
  { id: 'team-matt-anderson', name: 'Matt Anderson', role: 'Game and Creative Director · Design Director, Art Director, and Narrative Lead' },
  { id: 'team-alex-johnstone', name: 'Alex Johnstone', role: 'Product Developer and Production Manager · Visual Identity Lead and Graphic Designer' },
  { id: 'team-logan-erickson', name: 'Logan Erickson', role: 'Lead Game Designer and Publishing Manager' },
  { id: 'team-lance-tallman', name: 'Lance Tallman', role: 'Narrative Designer and Game Designer' },
  { id: 'team-hector-sevilla-lujan', name: 'Héctor Sevilla Luján', role: 'Character, Environment, and Rulebook Illustrator' },
  { id: 'team-josh-bruce', name: 'Josh Bruce', role: 'Program & Token Illustrator' },
  { id: 'team-wyatt-sanders', name: 'Wyatt Sanders', role: 'Senior Game Designer and Software Engineer' },
  { id: 'team-mahonri-white', name: 'Mahonri White', role: 'Senior Game Designer' },
  { id: 'team-joao-guisado', name: 'João Guisado', role: 'Panda GM Project Manager' },
  { id: 'team-kimball-brooksby', name: 'Kimball Brooksby', role: 'Associate Game Designer' },
  { id: 'team-alexander-falk', name: 'Alexander Falk', role: 'Associate Game Designer' },
  { id: 'team-parker-hoot', name: 'Parker Hoot', role: 'Associate Game Designer' },
  { id: 'team-dylan-shaffer-murphy', name: 'Dylan Shaffer Murphy', role: 'Assistant Producer' },
  { id: 'team-cameron-brotzman', name: 'Cameron Brotzman', role: 'Box Server Illustration' },
  { id: 'team-casey-blandford', name: 'Casey Blandford', role: 'Singularity Logo' },
];

/* ---------------------------------------------------------------- lookups */

export const factionById = (id: string) => factions.find((f) => f.id === id) ?? null;
export const brandById = (id: string) => brands.find((b) => b.id === id) ?? null;
export const characterById = (id: string) => characters.find((c) => c.id === id) ?? null;
export const boxById = (id: string) => boxes.find((b) => b.id === id) ?? null;
export const productById = (id: string) => products.find((p) => p.id === id) ?? null;
/** The boxes a SKU ships, in listed order. Empty while a SKU is unenumerated. */
export const boxesOfProduct = (productId: string) =>
  (productById(productId)?.boxIds ?? [])
    .map(boxById)
    .filter((b): b is Box => Boolean(b));
export const chapterById = (id: string) => chapters.find((c) => c.id === id) ?? null;
export const programsOfBrand = (brandId: string) => programs.filter((p) => p.brandId === brandId);
export const programById = (id: string) => programs.find((p) => p.id === id) ?? null;

export const brandSlotCount = (brand: Brand) =>
  brand.programCount ?? programsOfBrand(brand.id).length;

export const printingsOf = (character: Character): Printing[] => [
  {
    id: 'standard',
    label: 'STANDARD',
    art: character.art,
    sceneArt: character.sceneArt,
    cardArt: character.cardArt,
  },
  ...(character.printings ?? []),
];

/* A rename is what separates a different face from a re-skin, so it alone sets
   `isReflavour`: new art is not a new identity. */
export function resolvePrinting(character: Character, printing: Printing) {
  return {
    id: printing.id,
    label: printing.label,
    name: printing.name ?? character.name,
    abilityName: printing.abilityName ?? character.abilityName,
    flavour: printing.flavour ?? character.flavour,
    art: printing.art,
    sceneArt: printing.sceneArt,
    cardArt: printing.cardArt,
    source: printing.source ?? null,
    licensor: printing.licensor ?? null,
    isReflavour: Boolean(printing.name),
  };
}
export const brandsOfFaction = (factionId: string) => brands.filter((b) => b.factionId === factionId);

/** Any-faction characters are exempt from the faction filter, not excluded. (for now may change later) */
export const charactersOfFaction = (factionId: string) =>
  characters.filter((c) => c.factionIds === 'any' || c.factionIds.includes(factionId));

export const unalignedCharacters = () => characters.filter((c) => c.factionIds === 'any');
