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
  NewsCategory,
  OutboundUrls,
  PlayMode,
  Product,
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
     core box" — the box facts are `boxes[].contents`, and which box gets you
     solo is a purchase question that belongs in the Incursions bands.

     Per-mode counts (2 for the duel, 3–4 for free-for-all) live beside each mode
     in ui.json. */
  players: '1\u20134',
  /** Co-op/solo range — state it wherever co-op is sold. Same span as the game
      as a whole, and still its own field: the Incursions bands quote it alone,
      and Incursions is a separate box, so the two numbers are not the same
      claim even when they read the same. */
  incursionsPlayers: '1\u20134',
  playTime: '30 min per player',
  /* Commercial facts that belong to the GAME rather than to one box.

     Price and box contents are NOT here: there are three editions at three
     prices, so a single `game.price` would silently become the site's answer
     for all of them. Price lives on `products[]`, contents on `boxes[]`. */
  releaseDate: null as string | null,
  /* The store is the authority on shipping — regions, dates and surcharges all
     change there without warning. Keep this null and link out; do not mirror a
     region list the site cannot keep true. */
  shipsTo: null as string | null,
  ageRating: '14+',
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
 * Never do (1) on its own.
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
 * A brand's mark lives at `/brands/<id>.png` and is generated from the master
 * art by scripts/brand-icons.py. Deriving the path from the id rather than
 * storing a string means a mark can never point at the wrong brand, and an
 * unbuilt mark is a 404 rather than a silently wrong picture — which is why
 * `mark()` is opt-in per brand instead of a default on every one. A brand with
 * no recognized mark passes null and renders the faction dot placeholder, as before.
 */
const mark = (id: string) => `/brands/${id}.png`;

const factionBrand = (id: string, factionId: string, name: string, icon = true): Brand => ({
  id,
  factionId,
  name,
  icon: icon ? mark(id) : null,
  kind: 'faction',
  programCount: 10,
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
  factionBrand('forbidden-archives', 'celestial-shogunate', 'Forbidden Archives'),
  factionBrand('data-nation', 'subnet-86', 'Data Nation'),
  factionBrand('hostile-rewrite', 'subnet-86', 'Hostile Rewrite'),
  factionBrand('endless-chain', 'subnet-86', 'Endless Chain'),
  factionBrand('masquerade', 'subnet-86', 'Masquerade'),
  {
    id: 'lux-vault',
    factionId: null,
    name: 'LuX Vault',
    icon: mark('lux-vault'),
    kind: 'personal',
    unlock: 'challenges',
    programCount: 10,
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

/* ---------------------------------------------------------------------------
   THE CAST.

   Field order is on purpose. we store characters
   Name · HP · Faction · Sub Faction · Brand 1-3 · Card Text · Ability Name ·
   Flavor Title · Flavor Text, and these entries read in that same order so a
   record can be checked against other sources by eye without translating between
   two shapes. 
   
   -------------------------------------------------------------------------- */

const character = (input: Omit<Character, 'art' | 'storyIds'>): Character => ({
  ...input,
  art: { ...noArt, alt: `${input.name}, character art` },
  storyIds: [],
});

export const characters: Character[] = [
  character({
    id: 'hanbei',
    name: 'Hanbei',
    hp: 11,
    factionIds: ['celestial-shogunate', 'subnet-86'],
    brandIds: ['zodiac-reliquary', 'data-nation', 'endless-chain'],
    abilityText:
      'You may swap one additional time each turn. You cannot activate an [AMB] after your first swap.',
    abilityName: 'Casual Tactics',
    epithet: 'Aloof Savant',
    flavour:
      'Every simulation indicates that you\'ve already lost. Need we bother ourselves with the rest?',
  }),
  character({
    id: 'iro',
    name: 'Iro',
    hp: 9,
    factionIds: ['celestial-shogunate'],
    brandIds: ['infinite-divine', 'zodiac-reliquary'],
    abilityText:
      'You may have friendly characters not be suspended when they activate.',
    abilityName: 'Reality Bender',
    epithet: 'Dimensional Monk',
    flavour:
      'The shortest journey between any two points is Iro.',
  }),
  character({
    id: 'kagemusha',
    name: 'Kagemusha',
    hp: 8,
    factionIds: ['celestial-shogunate', 'subnet-86'],
    brandIds: ['zodiac-reliquary', 'endless-chain'],
    abilityText:
      'While the total cost of patches attached to Kagemusha is 3 or more, Kagemusha has stealth.',
    abilityName: 'Sinister Shadow',
    epithet: 'Tyrant Princess',
    flavour:
      'I dwell in shadow so you may burst in flame.',
  }),
  character({
    id: 'magus',
    name: 'Magus',
    hp: 10,
    factionIds: ['celestial-shogunate'],
    brandIds: ['zodiac-reliquary', 'infinite-divine'],
    abilityText:
      '[AMB] Magus may immediately activate any cost 1 patch in his stack at cost 0.',
    abilityName: 'Ancient Spark',
    epithet: 'Wish Bringer',
    flavour:
      'The dragon of discipline is stronger than the impulse of conflict.',
  }),
  character({
    id: 'mi-ko',
    name: 'Mi-KO',
    hp: 8,
    factionIds: ['celestial-shogunate', 'hana-mori'],
    brandIds: ['infinite-divine', 'bloom-and-never'],
    abilityText:
      'When a patch activated by Mi-KO attaches, she may have the attach target heal itself by 1 [H] or lose 1 [H].',
    abilityName: 'Binary Devotion',
    epithet: 'Shrine Maiden',
    flavour:
      'To understand our reality, we must examine its simplest form... 0 and 1.',
  }),
  character({
    id: 'onibaba',
    name: 'Onibaba',
    hp: 10,
    factionIds: ['celestial-shogunate', 'monarchy-of-boom'],
    brandIds: ['onryoki-noh', 'scrap-brigade'],
    abilityText:
      'While Onibaba has 4 or more armor, you may give any commands she activates +2 [P].',
    abilityName: 'Forge the Dragon-Jaw',
    epithet: 'Inferno Blacksmith',
    flavour:
      'Face your demons. No one loves you more.',
  }),
  character({
    id: 'satellite-137',
    name: 'Satellite 137',
    hp: 13,
    factionIds: ['celestial-shogunate'],
    brandIds: ['zodiac-reliquary', 'onryoki-noh'],
    abilityText:
      '[AMB] Target squad takes 1 [P], then Satellite 137 takes 2 [P].',
    abilityName: 'Orbital Crash',
    epithet: 'Ancient Relic',
    flavour:
      'Beep. Bop. Boop. SLAM.',
  }),
  character({
    id: 'shiho-zenji',
    name: 'Shiho Zenji',
    hp: 8,
    factionIds: ['celestial-shogunate'],
    brandIds: ['onryoki-noh', 'infinite-divine'],
    abilityText:
      'You may give commands that target Shiho Zenji -1 [P], -1 [A], -1 [C], and +1 [H].',
    abilityName: 'Surreality',
    epithet: 'Enlightened Fantasia',
    flavour:
      'Our eyes get lost in the details until it is too late to see the obvious.',
  }),
  character({
    id: 'toshiro',
    name: 'Toshiro',
    hp: 10,
    factionIds: ['celestial-shogunate'],
    brandIds: ['onryoki-noh', 'infinite-divine'],
    abilityText:
      'While Toshiro has an attached patch, you may give any command he activates with cost 2 or more +1 [P].',
    abilityName: 'Soul Code',
    epithet: 'Unmatched Ronin',
    flavour:
      'Soul and code are not so different. Both can be perfected.',
  }),
  character({
    id: 'yama-uba',
    name: 'Yama Uba',
    hp: 7,
    factionIds: ['celestial-shogunate', 'hana-mori'],
    brandIds: ['zodiac-reliquary', 'ark-totem'],
    abilityText:
      'Once per turn, when Yama Uba is dealt damage, you may place a relic token on target patch.',
    abilityName: 'Rip in the Bag',
    epithet: 'Treasure Hoarder',
    flavour:
      'The pain you deal others is the bag you\'ll always carry.',
  }),
  character({
    id: 'calamity',
    name: 'Calamity',
    hp: 12,
    factionIds: ['hana-mori'],
    brandIds: ['feralesque', 'ark-totem'],
    abilityText:
      'While Calamity has an attached Totem, you may give commands that target her -1 [P] or +1 [H].',
    abilityName: 'Runic Infusion',
    epithet: 'Rune-born Colossus',
    flavour:
      'Triumph is etched in stone and sealed with strength.',
  }),
  character({
    id: 'dugu-squad',
    name: 'Dugu Squad',
    hp: 9,
    factionIds: ['hana-mori'],
    brandIds: ['feralesque', 'bloom-and-never', 'ark-totem'],
    abilityText:
      'During Initialize, Dugu Squad may heal itself by 1 [H].',
    abilityName: 'Reinforcements',
    epithet: 'Tribe of Ghosts',
    flavour:
      'Koata! Ma poto! Dugu dugu dugu dugu.',
  }),
  character({
    id: 'j-kuma',
    name: 'J-Kuma',
    hp: 12,
    factionIds: ['hana-mori', 'celestial-shogunate'],
    brandIds: ['ark-totem', 'zodiac-reliquary'],
    abilityText:
      '[AMB] Gain 1 virtual [RAM].',
    abilityName: 'Token Pittance',
    epithet: 'Hermit Dilettante',
    flavour:
      'Ah, the legendary indulgences of physical space... now that I\'d like to taste.',
  }),
  character({
    id: 'kodama',
    name: 'Kodama',
    hp: 9,
    factionIds: ['hana-mori'],
    brandIds: ['bloom-and-never', 'ark-totem'],
    abilityText:
      'You may give any commands Kodama activates +1 [H].',
    abilityName: 'Spirit Weave',
    epithet: 'Canopy Mystic',
    flavour:
      'We are leaf fall, moss on the vine, mere splinters of a singularity.',
  }),
  character({
    id: 'moka',
    name: 'Moka',
    hp: 11,
    factionIds: ['hana-mori'],
    brandIds: ['ark-totem', 'feralesque'],
    abilityText:
      'Moka counts as a Totem.',
    abilityName: 'Lore Bearer',
    epithet: 'Unbreakable Pillar',
    flavour:
      'They seek to remain. We seek to return. I seek to renew.',
  }),
  character({
    id: 'jean-ok',
    name: 'Jean O.K.',
    hp: 9,
    factionIds: ['hana-mori', 'subnet-86'],
    brandIds: ['bloom-and-never', 'hostile-rewrite'],
    abilityText:
      '[AMB] Target character initializes or updates.',
    abilityName: 'Forced Evolution',
    epithet: 'Reckless Bioneer',
    flavour:
      'Every fight is an act of experimentation, a chemical reaction waiting to explode.',
  }),
  character({
    id: 'rekka',
    name: 'Rekka',
    hp: 16,
    factionIds: ['hana-mori', 'monarchy-of-boom'],
    brandIds: ['feralesque', 'scrap-brigade'],
    abilityText:
      'Rekka cannot activate more than one program from his stack each Activation phase.',
    abilityName: 'Restrained',
    epithet: 'Shackled Beast',
    flavour:
      'Don\'t be worried about what I\'ve done. Be worried about what I\'m going to do.',
  }),
  character({
    id: 'shred',
    name: 'Shred',
    hp: 9,
    factionIds: ['hana-mori', 'celestial-shogunate'],
    brandIds: ['feralesque', 'onryoki-noh'],
    abilityText:
      'When Shred resolves a command on target character, you may unattach a patch with cost 2 or less from that character.',
    abilityName: 'Rend',
    epithet: 'Apex Predator',
    flavour:
      'We are all illusion, but the hunt transcends.',
  }),
  character({
    id: 'snap-dragon-lily',
    name: 'Snap Dragon Lily',
    hp: 8,
    factionIds: ['hana-mori'],
    brandIds: ['bloom-and-never', 'feralesque'],
    abilityText:
      'Your opponents must spend 1 [RAM] to swap out a damaged character.',
    abilityName: 'Ensnare',
    epithet: 'Bloodvine Cultivator',
    flavour:
      'Consume to grow. That\'s the law beneath all programmatic biology.',
  }),
  character({
    id: 'yvelette',
    name: 'Yvelette',
    hp: 8,
    factionIds: ['hana-mori', 'monarchy-of-boom'],
    brandIds: ['ark-totem', 'bloom-and-never', 'chaos-verve'],
    abilityText:
      '[AMB] Heal 5 [H].',
    abilityName: 'Rainbow Cascade',
    epithet: 'Chromatic Dancer',
    flavour:
      'Code doesn\'t stagnate. It moves. It breathes. It dances.',
  }),
  character({
    id: 'benobasa',
    name: 'Benobasa',
    hp: 13,
    factionIds: ['monarchy-of-boom', 'celestial-shogunate'],
    brandIds: ['benobasas-fist', 'onryoki-noh'],
    abilityText:
      'While Benobasa would have stealth, he instead has taunt.',
    abilityName: 'Legendary',
    epithet: 'Paragon of Funk',
    flavour:
      'My sound is seismic, and my fists are furious.',
  }),
  character({
    id: 'bliztron',
    name: 'Bliztron',
    hp: 9,
    factionIds: ['monarchy-of-boom'],
    brandIds: ['benobasas-fist', 'chaos-verve'],
    abilityText:
      '[AMB] Suspend target character. That character cannot be targeted for the remainder of this phase.',
    abilityName: 'Shock and Awe',
    epithet: 'Rolling Flash',
    flavour:
      'If you wheel and deal in shock value, get inline.',
  }),
  character({
    id: 'ezplosio',
    name: 'Ezplosio',
    hp: 7,
    factionIds: ['monarchy-of-boom', 'subnet-86'],
    brandIds: ['scrap-brigade', 'hostile-rewrite'],
    abilityText:
      'When Ezplosio crashes, target squad takes 3 [P].',
    abilityName: 'Dangerous Toys',
    epithet: 'The Great',
    flavour:
      'Unstable in every single way.',
  }),
  character({
    id: 'overtoad',
    name: 'Overtoad',
    hp: 13,
    factionIds: ['monarchy-of-boom', 'hana-mori'],
    brandIds: ['benobasas-fist', 'ark-totem'],
    abilityText:
      'When a friendly character would take [P] damage, Overtoad may lose 1 [H] to reduce that damage by 1.',
    abilityName: 'Rock the Block',
    epithet: 'Biotic Boombox',
    flavour:
      'Puts the hop in hip hop.',
  }),
  character({
    id: 'roxie-the-mallet',
    name: 'Roxie the Mallet',
    hp: 11,
    factionIds: ['monarchy-of-boom'],
    brandIds: ['chaos-verve', 'scrap-brigade', 'benobasas-fist'],
    abilityText:
      'You may give commands that Roxie activates +1 [P] or +1 [A] if at least one of their targets has more health than Roxie.',
    abilityName: 'Rise Against',
    epithet: 'Metallic Idol',
    flavour:
      'Submit to my surge of sound and metal.',
  }),
  character({
    id: 'scrapper',
    name: 'Scrapper',
    hp: 9,
    factionIds: ['monarchy-of-boom'],
    brandIds: ['scrap-brigade', 'chaos-verve'],
    abilityText:
      'When Scrapper resolves her first command each turn, you may add 1 armor to any target character.',
    abilityName: 'Gifted Welder',
    epithet: 'Queen of the Broken Heap',
    flavour:
      'Fully broken? Nah. Just pre-repurposed.',
  }),
  character({
    id: 'tonk0r',
    name: 'Tonk0r',
    hp: 9,
    factionIds: ['monarchy-of-boom'],
    brandIds: ['scrap-brigade', 'benobasas-fist'],
    abilityText:
      'When Tonk0r activates a command, you may remove 1 armor from Tonk0r to give that command +1 [P].',
    abilityName: 'Magnetic Crush',
    epithet: '#3H416 T-Z Loader',
    flavour:
      'L0ading...Lo4ding...L04din9...C0mpl3t3! C u L8r 4r3nd.',
  }),
  character({
    id: 'twisted-6',
    name: 'Twisted-6',
    hp: 9,
    factionIds: ['monarchy-of-boom', 'hana-mori'],
    brandIds: ['chaos-verve', 'feralesque'],
    abilityText:
      'You may give patches attached to Twisted-6, and [EXE] or [RCT] effects she uses, +1 [P] or -1 [P].',
    abilityName: 'Savage Graffiti',
    epithet: 'Urban Prowler',
    flavour:
      'The night is my jungle. The paint is my code.',
  }),
  character({
    id: 'white-noise',
    name: 'White Noise',
    hp: 13,
    factionIds: ['monarchy-of-boom', 'subnet-86'],
    brandIds: ['benobasas-fist', 'endless-chain'],
    abilityText:
      'When White Noise resolves a program on target character, White Noise may spend 2 [H] to cycle that character.',
    abilityName: 'Sonic Resonator',
    epithet: 'King of Clubs',
    flavour:
      'This sound? It\'s bleach for your ears.',
  }),
  character({
    id: 'zaximus-defender',
    name: 'Zaximus Defender',
    hp: 8,
    factionIds: ['monarchy-of-boom'],
    brandIds: ['scrap-brigade', 'benobasas-fist'],
    abilityText:
      'Once during each Activation phase, when Zaximus Defender becomes suspended, you may give him 2 armor.',
    abilityName: 'Reactive Scrap',
    epithet: 'Junk Constructor',
    flavour:
      'Your technology is trash, but in my hands, it\'s treasure.',
  }),
  character({
    id: '101',
    name: '101',
    hp: 9,
    factionIds: ['subnet-86', 'celestial-shogunate'],
    brandIds: ['data-nation', 'infinite-divine'],
    abilityText:
      'The first time 101 crashes, gain 3 battery tokens.',
    abilityName: 'Energy Heart',
    epithet: 'Cyber Deity',
    flavour:
      'The spirit of the untouchable moon descends.',
  }),
  character({
    id: 'naix',
    name: '/naix',
    hp: 8,
    factionIds: ['subnet-86'],
    brandIds: ['endless-chain', 'data-nation'],
    abilityText:
      '[AMB] Unattach target patch.',
    abilityName: 'Handy Trick',
    epithet: 'Jolly Pilferette',
    flavour:
      'Oh, this is just a bit of fun. Don\'t mistake it for a plan.',
  }),
  character({
    id: 'archidex',
    name: 'Archidex',
    hp: 9,
    factionIds: ['subnet-86'],
    brandIds: ['data-nation', 'endless-chain'],
    abilityText:
      'Archidex may activate programs from the top or bottom of her stack.',
    abilityName: 'Infinite Index',
    epithet: 'Fount of Knowledge',
    flavour:
      'It\'s not what you know, it\'s how fast you know.',
  }),
  character({
    id: 'cosma',
    name: 'Cosma',
    hp: 13,
    factionIds: ['subnet-86', 'hana-mori'],
    brandIds: ['endless-chain', 'bloom-and-never'],
    abilityText:
      'Cosma may reset for 1 [RAM].',
    abilityName: 'Immaculate Design',
    epithet: 'Goddess Architect',
    flavour:
      'One day is one loop, one cycle, one infinity.',
  }),
  character({
    id: 'tori-daiyu',
    name: 'Tori-Daiyu',
    hp: 10,
    factionIds: ['subnet-86'],
    brandIds: ['endless-chain', 'hostile-rewrite', 'data-nation'],
    abilityText:
      '[AMB] You may reorder the stacks of all active friendly characters.',
    abilityName: 'Prime Edict',
    epithet: 'Analytical Puppeteer',
    flavour:
      'With order, precision, and my oversight, every task is trivial.',
  }),
  character({
    id: 'grandmaster-hash',
    name: 'Grandmaster Hash',
    hp: 10,
    factionIds: ['subnet-86', 'monarchy-of-boom'],
    brandIds: ['data-nation', 'chaos-verve'],
    abilityText:
      'The first time Grandmaster Hash targets a suspended character with a command each turn, you may give that command +1 [A].',
    abilityName: 'Calculated Frequency',
    epithet: 'Beat Dynamo',
    flavour:
      'For those with the skills, emotion is just a formula.',
  }),
  character({
    id: 'joi',
    name: 'Joi',
    hp: 10,
    factionIds: ['subnet-86', 'monarchy-of-boom'],
    brandIds: ['hostile-rewrite', 'chaos-verve'],
    abilityText:
      'You may give the first patch that targets Joi each turn cost -1 to a minimum cost of 1. If you do, target enemy player gains a battery.',
    abilityName: 'Malleable',
    epithet: 'Soul Hacker',
    flavour:
      'Innocence and corruption only reach their fullest potentials together.',
  }),
  character({
    id: 'null-constructor',
    name: 'Null Constructor',
    hp: 10,
    factionIds: ['subnet-86'],
    brandIds: ['hostile-rewrite', 'data-nation'],
    abilityText:
      '[AMB] Cycle target enemy character, then you may cycle that character again.',
    abilityName: 'Brainstorm',
    epithet: 'The Lost Boy',
    flavour:
      'To reflect on the server is to be the server, reflecting itself.',
  }),
  character({
    id: 'sector-probe',
    name: 'Sector Probe',
    hp: 10,
    factionIds: ['subnet-86'],
    brandIds: ['data-nation', 'hostile-rewrite'],
    abilityText:
      'When a tag is unattached, Sector Probe may lose 1 [H] to cycle target character.',
    abilityName: 'Interference',
    epithet: 'Omnipresent Virus',
    flavour:
      'Reality is a toy just begging to be broken.',
  }),
  character({
    id: 'zakhi',
    name: 'Zakhi',
    hp: 10,
    factionIds: ['subnet-86', 'celestial-shogunate'],
    brandIds: ['endless-chain', 'infinite-divine', 'onryoki-noh'],
    abilityText:
      '[AMB] Deal X [A] or X [P]. X is the number of patches attached to the target.',
    abilityName: 'Judgment',
    epithet: 'Heaven\'s Razor',
    flavour:
      'If the server has a will, I am the precise instrument of its power.',
  }),
  character({
    id: 'lux',
    name: 'LuX',
    hp: 9,
    factionIds: 'any',
    brandIds: [],
    personalBrandId: 'lux-vault',
    abilityText:
      'When LuX resolves the first program from her stack each turn, you may heal 1 [H]. LuX may activate Common programs from the top of any stack.',
    abilityName: 'Attuned to Relics',
    epithet: 'Druidic Seeker',
    flavour:
      'Patience. As trite as it is, great leaps forward often require a few steps back.',
  }),
];

/**
 * Dev-only. Catches a typo'd brand id and a `factionIds` that disagrees with
 * the character's brands — both of which render a plausible wrong page.
 */
function assertCharacterShape(): void {
  if (import.meta.env.PROD) return;
  const seen = new Set<string>();
  for (const c of characters) {
    if (seen.has(c.id)) console.warn(`[universe] duplicate character id "${c.id}".`);
    seen.add(c.id);

    /* Personal brands included: one may belong to a faction. */
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
  { id: 'rogue-ai-1', name: '[PLACEHOLDER rogue AI 01]', art: { ...noArt } },
  { id: 'rogue-ai-2', name: '[PLACEHOLDER rogue AI 02]', art: { ...noArt } },
  { id: 'rogue-ai-3', name: '[PLACEHOLDER rogue AI 03]', art: { ...noArt } },
];

/** Core box + expansion 1 + Incursions all launch the same day. */
/* ---------------------------------------------------------------------------
   WHAT IS IN A BOX. Boxes hold components and carry story. They do NOT hold a
   price — see the three-level note above `Box` in types.ts.

   Only the core box is described today. The other boxes exist (Gameplay
   Complete is six of them) but have not been named to the site, and inventing
   names here would put fictional products in front of buyers.
   -------------------------------------------------------------------------- */
export const boxes: Box[] = [
  {
    id: 'core-box',
    name: 'Core box',
    summary: '40 characters + LuX · 140 programs · 6 environment shards',
    contents: [
      '40 unique characters',
      /* 130 printed for the cast above, plus LuX's own ten — quoted as one
         number because a buyer counts cards, not authorship. */
      '140 unique gameplay programs',
      'LuX, and the ten programs of her personal brand',
      '6 environment shards — legendary locations that rewrite the battlefield',
      '20 fragment cards',
      'A sealed bonus pack: more characters, lore and content, opened once you have collected the fragments',
      '158 tokens',
      '12 alternate-art characters',
      '4 oversized starter-deck strategy cards',
      '40 premium card sleeves — two decks, colour-coded by team and numbered 1–5',
      '10 duplicate common cards',
    ],
    relatedBrandIds: ['endless-chain'],
  },
];

/* ---------------------------------------------------------------------------
   WHAT YOU BUY. A SKU is a way to pay, and it bundles boxes.

   Every price here is CAMPAIGN pricing on the storefront, not an MSRP, and the
   storefront is the authority on both price and shipping. When those diverge,
   fix them here — never in a template.

   When a box that currently ships only inside an edition starts selling on its
   own, add a PRODUCT for it whose `boxIds` is that one box. Do not add a flag
   to the box.
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
    /* Six boxes, and each of them may be sold separately in future. One of the
       six is the SAME core box the Core Edition ships — confirmed, which is why
       it is one `Box` entry referenced by two SKUs rather than two near-identical
       entries. The other five are not named to the site yet, so this list is a
       partial enumeration: `boxCount` is the fact, `boxIds` is how much of it we
       can spell. Do not synthesise the missing five from other editions. */
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
 * Dev-only shape check.
 *
 * `boxCount` is the claim, `boxIds` is how much of that claim we can currently
 * spell. UNDER-listing is legal and is the state today — Gameplay Complete says
 * six and names one, because only the core box has been identified to the site.
 * OVER-listing and dangling ids are always bugs, so those are what this catches.
 *
 * When the six are named (see the research notes), tighten the first check to
 * strict equality — an edition that claims six and lists five renders a
 * perfectly plausible wrong page, and nothing else would notice.
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

/** The edition fact strips quote. Never index products[] by position. */
export const coreProduct = products.find((p) => p.id === 'core-edition') ?? products[0];
/** The box those fact strips actually describe. */
export const coreBox = boxes.find((b) => b.id === 'core-box') ?? boxes[0];

/* ---------------------------------------------------------------------------
   WHAT YOU READ. Chapters are numbered, and the number drives the `#ch-01`
   anchors, which are public URL contracts.

   `boxIds` is empty on all three today: which box carries which chapter is an
   OPEN QUESTION, and an empty array renders "no box attached", which is also
   what a story-only release looks like. Guessing here would print a purchase
   claim. Note these are BOXES — bundling boxes into an edition does not create
   or move a chapter.
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

/**
 * Studio credit lives in one band on Community. Per-artwork artist credit is a
 * post-launch job — `art.artist` is in the schema and stays unfilled for now.
 */
/* Source: .ai/gamefound-copy.md, Image 06 — the printed campaign credits.
   Fifteen credit lines, fifteen people. Matt Anderson and Alex Johnstone each
   appear TWICE in the printed list (blocks 1 and 2) under different titles;
   here they are one person each with the two titles joined by " · ", so the
   grid shows fifteen faces rather than seventeen cards with two repeats.

   Order follows the printed blocks: direction/design, art, senior design, then
   the Panda GM and associate block. Names are set as printed — Héctor Sevilla
   Luján and João Guisado carry diacritics that are part of the spelling. Never
   ASCII-fold them.

   "Box Server Illustration" and "Singularity Logo" are credits for artefacts
   rather than job titles. Kept verbatim; they read slightly oddly in a field
   phrased for people, and that is the credits' wording, not a typo to fix. */
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
export const brandsOfFaction = (factionId: string) => brands.filter((b) => b.factionId === factionId);

/** Any-faction characters are exempt from the faction filter, not excluded. */
export const charactersOfFaction = (factionId: string) =>
  characters.filter((c) => c.factionIds === 'any' || c.factionIds.includes(factionId));

export const unalignedCharacters = () => characters.filter((c) => c.factionIds === 'any');
