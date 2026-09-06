// Reference spec: docs/architecture/modules.md#programs
// Transcribe the printed wording exactly, typos and all; an edited string makes this file a second, wrong rulebook.
// This ships in the JS bundle and is readable in devtools, so nothing internal goes here: an unannounced card is simply absent, never `revealed: false`.
// `cardId` is the printed, locale-bearing id errata cite in `affectedProgramIds`; `id` is the public URL identity, derived from the English name so `?card=` and `?stack=` name the same cards in every locale.

import type { Program, SetCode } from './types';

const PROGRAM_ARTIST = 'Josh Bruce';

/** Rungs card-art.py writes. Changing this without rerunning it ships 404s. */
export const CARD_WIDTHS = { avif: [420, 840, 1260, 1680], webp: [420, 840] };

/* These four LuX Vault cards are printed and carry ids, but no art master was ever exported, so they have no face. */
const WITHOUT_FACE = new Set(['SC-181P-EN', 'SC-182P-EN', 'SC-183P-EN', 'SC-184P-EN']);

export const hasCardFace = (cardId: string): boolean => !WITHOUT_FACE.has(cardId);

export const cardFace = (cardId: string): string | null =>
  hasCardFace(cardId) ? `/cards/${cardId}-840.webp` : null;

/** A card as written down; id, art and reveal state are filled in by `brandCards`, never per entry. */
interface CardText {
  name: string;
  /** Printed bottom-right, transcribed and never derived; absent on a parked card, which is why `brandCards` takes CardedText. */
  cardId?: string;
  /** Printed type line, without the sub-type. */
  type: string;
  /** "Totem", "Tag", "Food", "Mask", "Scroll". Absent on most cards. */
  subType?: string;
  cost: number;
  /** One entry per printed line, in printed order. */
  rules: string[];
  /** '' when the card prints an `unlock` line in place of flavour. */
  flavour: string;
  /** LuX only: the printed Endian Key that opens the card. */
  unlock?: string;
}

type CardedText = CardText & { cardId: string };

/** Apostrophes are dropped rather than hyphenated, so "Re'gine's Retribution" is `regines-retribution` — these slugs are published URLs. */
const slugify = (name: string): string =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2018\u2019]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const brandCards = (brandId: string, set: SetCode, cards: CardedText[]): Program[] =>
  cards.map((card) => ({
    slug: slugify(card.name),
    cardId: card.cardId,
    brandId,
    name: card.name,
    cost: String(card.cost),
    type: card.type,
    ...(card.subType ? { subType: card.subType } : {}),
    rules: card.rules,
    flavour: card.flavour,
    ...(card.unlock ? { unlock: card.unlock } : {}),
    revealed: true,
    set,

    art: { src: null, alt: `${card.name}, program art`, artist: PROGRAM_ARTIST },
    sceneArt: {
      src: null,
      alt: `${card.name}, program art with its background`,
      artist: PROGRAM_ARTIST,
    },
    cardArt: {
      src: cardFace(card.cardId),
      alt: `${card.name} card`,
      artist: PROGRAM_ARTIST,
    },
  }));

const scrapBrigade: CardedText[] = [
  {
    name: 'Armor Up',
    cardId: 'SC-157P-EN',
    type: 'Command',
    cost: 4,
    rules: ['Add 2 armor to each active character in target squad.'],
    flavour: '"A scrap for you and a scrap for you." -Tao, the Stringless Puppet',
  },
  {
    name: 'Rocket Crush',
    cardId: 'SC-158P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Deal 2 [P]. This character may remove 1 armor to deal 4 [P] instead.'],
    flavour: '"Sometimes when I\'m bored, I like to strap incredibly dangerous rockets onto whatever\'s closest to me... that helps a lot." -The Great Ezplosio',
  },
  {
    name: 'Pass the Plate, Mate',
    cardId: 'SC-159P-EN',
    type: 'Command',
    cost: 2,
    rules: ['Add 2 armor to target character. When this program is used to reset, gain 1 armor.'],
    flavour: '"Just found this code out in the heap. No clue what it does, but I\'d be happy to bolt it on!" -Scrapper',
  },
  {
    name: 'Defrag',
    cardId: 'SC-160P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Remove X armor from friendly characters, then deal X [P].'],
    flavour: '"No! It\'s not meant to be \'graceful\'. Ugh, I can\'t roll my eyes hard enough. Just aim the garbage that way!" -The Great Ezplosio',
  },
  {
    name: 'Scrap and Weld',
    cardId: 'SC-161P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Redistribute armor in any way between friendly active characters.'],
    flavour: '"You\'d be surprised how much of you I\'ve replaced over the years." -Super Joe',
  },
  {
    name: 'Insta-mesh',
    cardId: 'SC-162P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: ['[RCT]: When this character takes X damage, they gain X armor.'],
    flavour: '"You asked for an impenetrable fortress. I made it pocket-size! Just, uh... give it a sec to unfold." -Scrapper',
  },
  {
    name: 'Mechanize',
    cardId: 'SC-163P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: ['When this character activates a command, they gain 1 armor before that command resolves.'],
    flavour: '"Every program produces some junk memory. Waste not want not I always say!" -Scrapper',
  },
  {
    name: 'Forcefield of BOOM!',
    cardId: 'SC-164P-EN',
    type: 'Patch: Self',
    cost: 7,
    rules: [
      'On attach, add 10 armor to the attached character. This character has taunt.',
      'Unattach this when this character has no armor.',
    ],
    flavour: '"Count1ng d0wn to BOOM." -Tonk0r',
  },
  {
    name: 'Crisis Engine',
    cardId: 'SC-165P-EN',
    type: 'Patch: Self',
    cost: 5,
    rules: [
      "The first command this character activates each turn get +X [P]. X is equal to this character's armor.",
      '[EXE]: This character gains 3 armor.',
    ],
    flavour: '"It\'s my masterpiece, Scrapper!" "Neato Zax! Can you stop it?" "Ha! No, not at all." -Zaximus to Scrapper',
  },
  {
    name: 'Magnetic Core',
    cardId: 'SC-166P-EN',
    type: 'Patch: Any',
    cost: 4,
    rules: [
      'During Initialize, add 1 armor to this character.',
      '[EXE]: This character gains 3 armor.',
    ],
    flavour: '"Let\'s make you a code magnet! You know the ladies dig a guy covered in rusty junk." -Scrapper to Zaximus',
  },
];

const benobasasFist: CardedText[] = [
  {
    name: 'Bass Drop Jutsu',
    cardId: 'SC-057P-EN',
    type: 'Command',
    cost: 6,
    rules: ['Target squad loses 3 [H].'],
    flavour: '"Just like Benobasa to ruin perfection simply by taking it way too far." -Grandmaster Hash',
  },
  {
    name: 'Dragon Feet',
    cardId: 'SC-058P-EN',
    type: 'Command',
    cost: 4,
    rules: ['Deal 3 [P], then deal 2 [P] to a different target.'],
    flavour: '"The air is warm. The ground is burning... our feet are burning!" -Revelations of Master Jaya',
  },
  {
    name: 'Stone Hands',
    cardId: 'SC-059P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Deal 2 [P], then deal 1 [P] to a different target.'],
    flavour: "It's rumored that Benobasa originally distributed this program in the archaic form of a book.",
  },
  {
    name: 'Break Beats',
    cardId: 'SC-060P-EN',
    type: 'Command',
    cost: 2,
    rules: ['Deal 1 [P], then deal 1 [P] to a different target.'],
    flavour: '"Regular rhythm is predictable. Don\'t be predictable." -Benobasa',
  },
  {
    name: 'Combo Breaker',
    cardId: 'SC-061P-EN',
    type: 'Patch: Ally',
    cost: 3,
    rules: ['When this character takes damage, you may add it to this instead, then if the damage on this patch is 3 or more, unattach it.'],
    flavour: '"Take their best. If you\'re still standing, they\'ll have nothing left." -Benobasa',
  },
  {
    name: 'Show me your Moves',
    cardId: 'SC-062P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: ['While this character has 7 or more [H], they have taunt.'],
    flavour: '"How amusing. Fine, then. Step forward and prove it." -Sk4di, 12th Disciple',
  },
  {
    name: "Monarchy's Rumble",
    cardId: 'SC-063P-EN',
    type: 'Patch: Any',
    cost: 6,
    rules: [
      'This character has taunt.',
      '[RCT]: When this character activates a command, that command gets +2 [P], then attach this to a different friendly character.',
    ],
    flavour: '"Make them tremble. Let the ground rumble. Rewrite their code with the memory that we are." -Apprentice Sung, 14th Disciple',
  },
  {
    name: 'Pump it Up',
    cardId: 'SC-064P-EN',
    type: 'Patch: Ally',
    cost: 1,
    rules: [
      'On attach, suspend this character.',
      '[RCT]: When this character activates a command, that command gets +1 [P] or +1 [A].',
    ],
    flavour: '"Ever been so hype you feel like a slow-motion explosion? That\'s me right now!" -Halozy, 5th Disciple',
  },
  {
    name: "Benobasa's Block!",
    cardId: 'SC-065P-EN',
    type: 'Patch: Self',
    cost: 3,
    rules: ['[RCT]: When a command or [EXE] effect is activated or used, that command or [EXE] effect gets -4 [P] and -4 [A].'],
    flavour: '"Sung, this may shock you, but the best defense is usually just a good defense." -Benobasa',
  },
  {
    name: 'Ora Ora',
    cardId: 'SC-066P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: ['While this character has no other attached patches, they have taunt.'],
    flavour: '"Command all the attention that your strength can handle." -Benobasa',
  },
];

const chaosVerve: CardedText[] = [
  {
    name: 'Sonic Flare',
    cardId: 'SC-077P-EN',
    type: 'Command',
    cost: 7,
    rules: ['Target squad takes 1 [P], then suspend that squad. You may treat this as cost 1 when using it to reset.'],
    flavour: '"It\'s the height of euphoric, synesthetic overload! It\'s like getting punched in the face, and you... will... love it." -Roxie',
  },
  {
    name: 'Hyperwave',
    cardId: 'SC-078P-EN',
    type: 'Command',
    cost: 2,
    rules: ['Suspend the character with the lowest [H] in target squad. You may choose between ties.'],
    flavour: '"These frequencies resonate perfectly with most cognitive code. It\'s a total trip. Just don\'t overdo it." -Grandmaster Hash',
  },
  {
    name: 'Disco Hand Grenade',
    cardId: 'SC-079P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Suspend target character, or deal 4 [A] to target suspended character.'],
    flavour: '"Yeah, there\'s \'make\' them dance... and then there\'s \'-make-\' them dance. Know what I mean?" -White Noise',
  },
  {
    name: 'Pyrotechnix',
    cardId: 'SC-080P-EN',
    type: 'Command',
    cost: 2,
    rules: ['Deal 1 [A] and 1 [P] to target character.'],
    flavour: '"YES! The best part of the concert! This is where it all blows up!" -The Great Ezplosio',
  },
  {
    name: '2nd Encore',
    cardId: 'SC-081P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Deal 1 [P] to each suspended character in target squad.'],
    flavour: '"You\'re tired, they\'re tired... but that\'s exactly when you\'ve got to double down. Just part of the job." -White Noise',
  },
  {
    name: 'Amplitude',
    cardId: 'SC-082P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Deal 1 [A] to target enemy character. If the target is suspended, gain 1 virtual [RAM].'],
    flavour: '"The best jams are the ones that come back to you." -Grandmaster Hash',
  },
  {
    name: 'Psycho Graffiti',
    cardId: 'SC-083P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: ['Each turn, the first command this character activates that targets a suspended character gets +1 [P] and +1 [A].'],
    flavour: '"True art is not yours. It takes on a life of its own." -Twisted-6',
  },
  {
    name: 'Doorway to Dreamland',
    cardId: 'SC-084P-EN',
    type: 'Patch: Self',
    cost: 3,
    rules: [
      'On attach, suspend this character, then suspend target enemy character. This character does not ready during Refresh.',
      'During Initialize, unattach this.',
    ],
    flavour: '"Let your mind drift in the lights, then dissolve in the color." -Yvelette',
  },
  {
    name: "Baq's Battery Backpack",
    cardId: 'SC-085P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: ['[EXE]: Suspend this character, then gain 2 virtual [RAM].'],
    flavour: '"Baq, we don\'t need to light the whole server! This is seriously the last time I carry this." -Joi',
  },
  {
    name: 'Infinite Youth',
    cardId: 'SC-086P-EN',
    type: 'Patch: Self',
    cost: 1,
    rules: ['[EXE]: Gain 1 virtual [RAM].'],
    flavour: '"Attitude is the name of the game. History won\'t see you from someone else\'s shadow." -Benobasa',
  },
];

const megaByte: CardedText[] = [
  {
    name: 'Regurgitation',
    cardId: 'MB-006P-EN',
    type: 'Command',
    cost: 2,
    rules: ['Remove X byte tokens from patches attached to friendly characters, then deal X + 1 [P].'],
    flavour: '"You don\'t understand, the customer is ALWAYS right." -Gu1p, former Restaurateur',
  },
  {
    name: 'Second Helping',
    cardId: 'MB-007P-EN',
    type: 'Command',
    cost: 2,
    rules: ['You may spend X additional [RAM] to attach up to X crashed Food patches to active characters in this squad.'],
    flavour: 'Freshly made every minute!',
  },
  {
    name: 'Lunch Break',
    cardId: 'MB-008P-EN',
    type: 'Patch: Ally',
    cost: 1,
    rules: ['When this character consumes, this character heals itself by 2 [H]. Unattach this patch and ready this character, then you must swap them if able.'],
    flavour: 'Variety, flavor, and sophistication, all in the most compact form factor.',
  },
  {
    name: 'Iron Stomach',
    cardId: 'MB-009P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: ['Patches attached to friendly characters get cost +1 for each byte token on them.'],
    flavour: 'Plenty gets in. Nothing gets out.',
  },
  {
    name: 'Last Byte',
    cardId: 'MB-010P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: ['Patches attached to characters in this squad gain consume +1.'],
    flavour: 'Give my compliments to the chef.',
  },
  {
    name: 'Shoyu ROM-In',
    cardId: 'MB-011P-EN',
    type: 'Patch: Self',
    subType: 'Food',
    cost: 2,
    rules: ['Consume 3: Gain a battery.'],
    flavour: '"If I\'m gonna eat the same thing every day, might as well energize me." -Zel, Detective B.H.D.',
  },
  {
    name: 'Syntactic Sugar',
    cardId: 'MB-012P-EN',
    type: 'Patch: Ally',
    subType: 'Food',
    cost: 2,
    rules: ['Consume 4: You may unattach a patch with cost less than or equal to the number of byte tokens on this patch.'],
    flavour: 'So simple and easy to make, people practically give them away.',
  },
  {
    name: 'Uba Stew',
    cardId: 'MB-013P-EN',
    type: 'Patch: Ally',
    subType: 'Food',
    cost: 3,
    rules: ['Consume 3: Heal 2 [H].'],
    flavour: 'No substitutions.',
  },
  {
    name: 'Twisted Tacos',
    cardId: 'MB-014P-EN',
    type: 'Patch: Ally',
    subType: 'Food',
    cost: 3,
    rules: [
      'Consume 2: Deal 2 [P].',
      'When this character takes damage, unattach this.',
    ],
    flavour: "Can't keep me down.",
  },
  {
    name: '3x3x3 Burger',
    cardId: 'MB-015P-EN',
    type: 'Patch: Self',
    subType: 'Food',
    cost: 4,
    rules: [
      "Consume 3: Deal X [P] to up to X different target enemy characters. X is equal to the byte tokens on this patch. This can't be consumed again this turn.",
      "This program can't be modified.",
    ],
    flavour: 'I hope you like sharp cheddar...',
  },
];

const bloomAndNever: CardedText[] = [
  {
    name: 'Witch Dust',
    cardId: 'SC-067P-EN',
    type: 'Command',
    cost: 5,
    rules: ['Heal target squad by 1 [H], then deal X [C]. X is equal to the amount of damage healed by this program.'],
    flavour: 'Every mote a boon and a curse.',
  },
  {
    name: 'Vines of Uruth',
    cardId: 'SC-068P-EN',
    type: 'Command',
    cost: 2,
    rules: ['Heal 2 [H].'],
    flavour: '"Everything deserves to grow." -Kodama',
  },
  {
    name: 'Caustic Tincture',
    cardId: 'SC-069P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Unattach target patch with cost 2 or less.'],
    flavour: '"Here, this infusion is custom tailored to take the rough edges off your code." -Kodama',
  },
  {
    name: 'Tea of Discussion',
    cardId: 'SC-070P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Heal 1 [H].'],
    flavour: 'Enrich the mind, enrich the body, enrich the soul.',
  },
  {
    name: 'Acidic Core',
    cardId: 'SC-071P-EN',
    type: 'Patch: Any',
    cost: 5,
    rules: ['During Update, this character takes 4 [C].'],
    flavour: '"It is one thing to see code crash. Quite another to watch it melt." -Bronwyn',
  },
  {
    name: 'Fungal Possession',
    cardId: 'SC-072P-EN',
    type: 'Patch: Any',
    cost: 4,
    rules: ["Programs on top of this character's stack may be activated by any other character."],
    flavour: '"Well, it can hardly be considered against your will if you don\'t even know you are doing it." -Jean O.K.',
  },
  {
    name: 'Lotus Hex',
    cardId: 'SC-073P-EN',
    type: 'Patch: Any',
    cost: 4,
    rules: ['During Initialize, unattach a patch other than Lotus Hex from this character. If you cannot, this character takes 2 [C].'],
    flavour: '"Their code will fall like petals from a wilting flower." -Divina the Opulent',
  },
  {
    name: 'Putrid Blossoms',
    cardId: 'SC-074P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: ['When this character activates a program they take 1 [C].'],
    flavour: '"Decay begets beauty, beauty begets decay." -Hana Mori Proverb',
  },
  {
    name: 'Viral Venom',
    cardId: 'SC-075P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: ['During Update, this character takes 1 [C].'],
    flavour: 'Suspended death, twisted into new life.',
  },
  {
    name: 'Catalyst',
    cardId: 'SC-076P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: [
      'All patches attached to, and [EXE] or [RCT] effects used by this character get +1 [C] and +1 [H].',
      'Unattach this when there are no other patches attached to this character.',
    ],
    flavour: '"With the right mix, any experiment can flourish!" -Deepvine Cultivator, Sevy',
  },
];

const arkTotem: CardedText[] = [
  {
    name: 'Winds of Purity',
    cardId: 'SC-047P-EN',
    type: 'Command',
    cost: 2,
    rules: ['Unattach target patch with cost 3 + X or less. X is equal to all your active Totems.'],
    flavour: '"A breath taken in solace parts the immaculate from the corrupt." -Ritual of Mending',
  },
  {
    name: 'F0x Totem',
    cardId: 'SC-048P-EN',
    type: 'Patch: Self',
    subType: 'Totem',
    cost: 1,
    rules: [
      'Adaptive',
      '[EXE]: Suspend this character, then gain 1 virtual [RAM].',
    ],
    flavour: '"Fox hunts the unseen tracts of the forgotten hardware." -Codex for the Newly Lost F:2 8',
  },
  {
    name: 'H4re Totem',
    cardId: 'SC-049P-EN',
    type: 'Patch: Self',
    subType: 'Totem',
    cost: 1,
    rules: [
      'Adaptive',
      '[EXE]: Suspend this character, then gain 1 virtual [RAM].',
    ],
    flavour: '"The processor cycles turn with the timing of the Hare." -Codex for the Newly Lost B:4 0',
  },
  {
    name: 'R4ven Totem',
    cardId: 'SC-050P-EN',
    type: 'Patch: Self',
    subType: 'Totem',
    cost: 1,
    rules: [
      'Adaptive',
      '[EXE]: Suspend this character, then gain 1 virtual [RAM].',
    ],
    flavour: '"Raven\'s dream is the memory that holds us all." -Codex for the Newly Lost B:4 E',
  },
  {
    name: 'Beaches of the Moon',
    cardId: 'SC-051P-EN',
    type: 'Patch: Any',
    cost: 5,
    rules: [
      'When any character becomes suspended, heal that character by 2 [H].',
      '[EXE]: Unattach up to X target patches with cost X - 1 or less. X is equal to all your active Totems.',
    ],
    flavour: '"... tonight, where a silver light meets a distant shore." -Third Surviving Line of the Gathering Reflection',
  },
  {
    name: 'Silt of the Swamp',
    cardId: 'SC-052P-EN',
    type: 'Patch: Self',
    cost: 3,
    rules: [
      'All programs get +1 [C].',
      '[EXE]: Heal X + 1 [H]. X is equal to all your active Totems.',
    ],
    flavour: '"We\'ve created a churning nexus where life and death dance together." -Bronwyn',
  },
  {
    name: 'Timber of the Taiga',
    cardId: 'SC-053P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: [
      'This character cannot be suspended.',
      '[EXE]: Deal X + 1 [P]. X is equal to all your active Totems.',
    ],
    flavour: '"The trees of the taiga cannot be cut down. They contain the old code." -Kodama',
  },
  {
    name: 'Dust of the Desert',
    cardId: 'SC-054P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: [
      'You may give programs that target this character cost +1.',
      '[RCT]: When a command is activated, that command gets -X [P]. X is equal to all your active Totems.',
    ],
    flavour: '"For the Dawn Shamans, scarcity is sanctity." -Elsa Verity',
  },
  {
    name: 'Sunlight of the Savanna',
    cardId: 'SC-055P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: [
      'During Initialize, this character may heal itself by 1 [H].',
      '[EXE]: Deal X [C]. X is equal to all your active Totems.',
    ],
    flavour: '"The sun creates. The sun destroys. So shall we." -Codex for the Newly Lost 1:3 A',
  },
  {
    name: 'Drifting Gardens',
    cardId: 'SC-056P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: [
      'Totem patches cannot be targeted by programs.',
      '[EXE]: Up to X different target characters lose 1 [H]. X is equal to all your active Totems.',
    ],
    flavour: '"True peace is unshakeable, but few will ever find it." -Elsa Verity',
  },
];

const feralesque: CardedText[] = [
  {
    name: 'Natural Order',
    cardId: 'SC-117P-EN',
    type: 'Command',
    cost: 3,
    rules: ['You may spend [RAM] equal to the number of active player squads. If you do, unattach all patches.'],
    flavour: '"From the unformed Fractal Sea to the endless Broken Heap, time will raze all to dust." -The Binary Insight',
  },
  {
    name: 'Ferocious Bite',
    cardId: 'SC-118P-EN',
    type: 'Command',
    cost: 4,
    rules: ['The highest [H] character in target squad takes 5 [P]. You may choose between ties.'],
    flavour: '"Our simulations demonstrate again and again that hunger was the most powerful of motivators." -M:V Log#112AF',
  },
  {
    name: 'Maul',
    cardId: 'SC-119P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Deal 3 [P]. Then if the target has damage equal to or greater than its max [H], you may return this to the top of its origin stack.'],
    flavour: '"Oh my. How instinctual... how viciously primal! I love it!" -Snap Dragon Lily',
  },
  {
    name: 'Hunt the Weak',
    cardId: 'SC-120P-EN',
    type: 'Command',
    cost: 1,
    rules: ['The lowest [H] character in target enemy squad takes 1 [P]. You may choose between ties. If that character has 4 or less [H], they take 2 [P] instead.'],
    flavour: '"All simulations show organic survival depends entirely on ruthless opportunism." -M:V Log#66B76',
  },
  {
    name: 'Irritant Scratch',
    cardId: 'SC-121P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Deal 1 [C].'],
    flavour: '"For ancient life, it appears that even the smallest scratches could fester into mortal threat." -M:V Log#90906',
  },
  {
    name: 'Scarification',
    cardId: 'SC-122P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: ['[RCT]: When this character takes damage, if their [H] is greater than 0, this character heals itself by 3 [H].'],
    flavour: '"Simulation #246 shows solidity increases with threat. Check this box... lovely." -Jean O.K.',
  },
  {
    name: 'Ravening Swarm',
    cardId: 'SC-123P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: ["The first time this character takes [C] damage each turn, all active damaged characters in this character's squad take 1 [C], including this character."],
    flavour: '"The swarm is one of the only simulations that is universally feared. Shame it\'s so anti-social." -Jean O.K.',
  },
  {
    name: 'Tooth and Claw',
    cardId: 'SC-124P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: ['If this character is damaged, this character cannot deactivate.'],
    flavour: '"Time and again, these are the most fundamental tools of survival on the Veldt." -M:V Log#4688B',
  },
  {
    name: 'Counter Chomp',
    cardId: 'SC-125P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: ['[RCT]: When a damage-dealing command targeting a friendly character has resolved, deal 3 [P] to the character that activated that command.'],
    flavour: '"Unnatural stillness is a common prelude to the most savage acts." -M:V Log#4688B',
  },
  {
    name: 'Dive for the Bushes',
    cardId: 'SC-126P-EN',
    type: 'Patch: Self',
    cost: 1,
    rules: ['[RCT]: When a command targets this character, choose a different friendly target for that command.'],
    flavour: '"In the Mimetic Veldt, self preservation and pack success are one and the same." -M:V Log#5GAF6',
  },
];

const deCrypt: CardedText[] = [
  {
    name: 'Corroded Stim Module',
    cardId: 'DC-006P-EN',
    type: 'Command',
    cost: 2,
    rules: [
      'Reclamation',
      'Heal 2 [H]. If an undead character activates this command, deal 3 [C] instead.',
    ],
    flavour: '"It\'s just like the Hippocratic Oath, forgotten and in need of an upgrade." -F1lch',
  },
  {
    name: 'Decrepit Amulet',
    cardId: 'DC-007P-EN',
    type: 'Command',
    cost: 2,
    rules: [
      'Reclamation',
      'You may move one damage from this character to another target character.',
    ],
    flavour: '"Be wary of its power. Her intention is clear." -Calamity',
  },
  {
    name: 'Essence Drain',
    cardId: 'DC-008P-EN',
    type: 'Command',
    cost: 3,
    rules: [
      'Reclamation',
      'This character may spend up to 5 [H]. If they do, unattach target patch with cost X or less. X is the amount of [H] spent.',
    ],
    flavour: "Not to worry. Neither of us will remember what we've lost.",
  },
  {
    name: 'Memory Failure',
    cardId: 'DC-009P-EN',
    type: 'Command',
    cost: 2,
    rules: [
      'Reclamation',
      'For every 2 damage on this character up to their max [H], you may spend 1 additional [RAM]. Deal 2X [C]. X is the amount of additional [RAM] spent.',
    ],
    flavour: "Soul code is nearly inaccessible, unless there's excess code to act as a doorway.",
  },
  {
    name: 'Necrotic Implement',
    cardId: 'DC-010P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: [
      'If this character has damage that is equal to or greater than its max [H], it is undead.',
      'During Update, this character takes 1 [C].',
    ],
    flavour: 'Its usefulness undermines its finality.',
  },
  {
    name: 'Virus Injection',
    cardId: 'DC-011P-EN',
    type: 'Patch: Any',
    cost: 7,
    rules: [
      'If this character has damage that is equal to or greater than its max [H], it is undead. During Initialize, this character takes 1 [C].',
      '[EXE]: Deal X + 2 [C]. X is equal to the amount of damage on this character up to its max [H].',
    ],
    flavour: '"What\'s mine is yours, friend." -Voss',
  },
  {
    name: 'Shisha Sosei',
    cardId: 'DC-012P-EN',
    type: 'Patch: Crashed Ally',
    cost: 3,
    rules: [
      'On attach, if the target is not crashed, crash Shisha Sosei. Otherwise, revive this character, then they lose all [H].',
      'This character is undead.',
    ],
    flavour: 'From the Fractal Sea to the Broken Heap: to break the cycle, you must understand it.',
  },
  {
    name: 'Deadly Transmission',
    cardId: 'DC-013P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: ['During Update, this character takes 1 [C], then attach this to the enemy character with the most damage.'],
    flavour: 'The burden is shared. The reaping is not.',
  },
  {
    name: 'Derelict Countermeasure',
    cardId: 'DC-014P-EN',
    type: 'Patch: Self',
    cost: 4,
    rules: ['Undead characters may activate programs at cost -2 to a minimum of 1.'],
    flavour: 'With no need for self-preservation, all effort turns to dealing death.',
  },
  {
    name: "Charon's Gate",
    cardId: 'DC-015P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: ['During Update, you may move one damage from any target character to any friendly character.'],
    flavour: '"Seven times I\'ve passed through the gate. Seven times I\'ve wished I hadn\'t." -Kar\'abbad, Fractal Reclaimer',
  },
];

const infiniteDivine: CardedText[] = [
  {
    name: 'Transference',
    cardId: 'SC-137P-EN',
    type: 'Command',
    cost: 8,
    rules: ['Exchange the damage on two target characters. If this character has 2 or less [H], this gets cost -4.'],
    flavour: '"Reality bends to a pristine mind, and even destiny can be rewritten." -Shiho Zenji',
  },
  {
    name: 'Procession of Stars',
    cardId: 'SC-138P-EN',
    type: 'Command',
    cost: 6,
    rules: ['Deal 1 [P] three times. You may choose a different target for each.'],
    flavour: '"Three glittering shards fell from the simulated heavens." -Prophecy of the Fall',
  },
  {
    name: 'Echoing Hymn',
    cardId: 'SC-139P-EN',
    type: 'Command',
    cost: 2,
    rules: ['Heal X [H]. X is the number of patches attached to the target.'],
    flavour: '"The right chants will echo through code and time alike." -Pram, Temple Priestess',
  },
  {
    name: 'Inscrutable Koan',
    cardId: 'SC-140P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Deal 2 [P]. If the target has damage equal to or greater than its [H], crash this program. Otherwise, heal that character by 2 [H].'],
    flavour: '"What is the answer to this very question?" -The Binary Insight',
  },
  {
    name: 'Izanami Install',
    cardId: 'SC-141P-EN',
    type: 'Command',
    cost: 1,
    rules: ['You may spend additional [RAM] equal to the cost of target crashed program. If you do, this character activates it.'],
    flavour: '"Crashing reveals what was necessary all along." -Pram, Temple Priestess',
  },
  {
    name: 'Yin and Yang',
    cardId: 'SC-142P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Deal 0 [P] or heal 0 [H], then you may spend 1 additional [RAM] to deal 0 [P] or heal 0 [H].'],
    flavour: 'Untold potential balanced within itself.',
  },
  {
    name: 'Seven Gates Release',
    cardId: 'SC-143P-EN',
    type: 'Patch: Ally',
    cost: 7,
    rules: [
      'Commands this character activates get +X [P] or +X [H]. X is the damage on this character.',
      'Whenever this character would take 2 or more damage, this character takes 2 damage instead.',
    ],
    flavour: '"Enter the seventh gate through the seventh door where the Autumn Network awaits." -Iro',
  },
  {
    name: 'Nechro Exhauriat',
    cardId: 'SC-144P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: ['When this character deals X [P], this character heals itself by X - 1 [H].'],
    flavour: '"The story of the crashed will live on in you." -Magus',
  },
  {
    name: 'Cascading Illumination',
    cardId: 'SC-145P-EN',
    type: 'Patch: Any',
    cost: 1,
    rules: ['[RCT]: When this character is healed by X, heal X [H] to a different target.'],
    flavour: '"Adherents to the second insight will perceive the glowing threads that bind us all." -Mi-KO',
  },
  {
    name: 'Focus Soul',
    cardId: 'SC-146P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: ['[RCT]: When a command is activated, that command gets +X [P] or +X [H]. X is the number of crashed characters up to a maximum of 4.'],
    flavour: '"The memory in the network is zero sum. The code of the fallen surrounds us." -Magus',
  },
];

const onryokiNoh: CardedText[] = [
  {
    name: 'Hypnotic Hit',
    cardId: 'SC-147P-EN',
    type: 'Command',
    cost: 7,
    rules: ['Deal 8 [P] to target character, then suspend that character.'],
    flavour: '"When you awaken, you won\'t remember I was here... you won\'t remember at all." -Iro',
  },
  {
    name: 'Folded Steel Strike',
    cardId: 'SC-148P-EN',
    type: 'Command',
    cost: 4,
    rules: ['Deal 4 [P]. This cannot be modified to have less than 4 [P].'],
    flavour: 'Hardened code, forged in the Black Furnace and folded a thousand times over.',
  },
  {
    name: "Re'gine's Retribution",
    cardId: 'SC-149P-EN',
    type: 'Command',
    cost: 4,
    rules: ['This character loses 2 [H], then deal 5 [P].'],
    flavour: 'This code seethes with the malice of a forgotten spirit.',
  },
  {
    name: 'Bamboo Splitter',
    cardId: 'SC-150P-EN',
    type: 'Command',
    cost: 2,
    rules: ['Deal 1 [P]. If the target has 11 or more [H], deal 4 [P] instead.'],
    flavour: '"The thicker the opponent, the more a single swing will sever." -Toshiro',
  },
  {
    name: 'Hungering Kunai',
    cardId: 'SC-151P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Deal 2 [P]. If the target has 4 or less [H], deal 4 [P] instead.'],
    flavour: '"If an opening exists, these kunai will find it. They thirst for weakness." -Toshiro',
  },
  {
    name: 'Needle Senbon',
    cardId: 'SC-152P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Deal X + 2 [P]. X is the number of characters in this squad with stealth.'],
    flavour: '"Be wary, Sparrow. We are surrounded by the starless sky." -Record of the Third Flame Ascendancy',
  },
  {
    name: 'Sensu of Dusk',
    cardId: 'SC-153P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: [
      'This character has stealth and cannot be targeted by [EXE] or [RCT] effects.',
      'When this character is targeted by a program, unattach this.',
    ],
    flavour: '"Stars shine because of the darkness, not despite it." -Shiho Zenji',
  },
  {
    name: 'Flesh for Security',
    cardId: 'SC-154P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: [
      'This character has stealth.',
      'When this character activates a program, they lose 1 [H].',
    ],
    flavour: '"I can teach you a program that will make your blood run dark... darker than the deepest night." -Rexis, the Gilded Blaze',
  },
  {
    name: 'Oni Shift',
    cardId: 'SC-155P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: [
      'This character is not suspended after activation.',
      'If this character was activated this turn, commands this character activates get +1 [P].',
    ],
    flavour: '"They emerged from the digital rift: powerful, unrecognizable, void of concience." -Record of the Third Flame Ascendancy',
  },
  {
    name: 'Shadow Strike',
    cardId: 'SC-156P-EN',
    type: 'Patch: Self',
    cost: 3,
    rules: [
      'This character has stealth.',
      'When this character activates a command, give that command +2 [P]. When it resolves, crash this patch.',
    ],
    flavour: '"Every light will cast a shadow, and every shadow will cast a blade." -Record of the Third Flame Descension',
  },
];

const zodiacReliquary: CardedText[] = [
  {
    name: 'Muramasa',
    cardId: 'SC-167P-EN',
    type: 'Command',
    cost: 4,
    rules: ["You may lose 2 max [RAM]. If you do, deal 7 [P]. This program's cost cannot be modified."],
    flavour: '"It only gives as much as it takes. What do you have to offer?" -Kagemusha',
  },
  {
    name: 'Spirit Flask',
    cardId: 'SC-168P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Heal 2 [H], then place a relic token on any target patch.'],
    flavour: '"Surely it\'s not a ghost... but it does possess a terrible hunger." -Yua, Apprentice Archivist',
  },
  {
    name: 'Astral Tei-Bako',
    cardId: 'SC-169P-EN',
    type: 'Patch: Ally',
    cost: 4,
    rules: [
      'During Initialize, you may add 1 relic token to any target patch, then heal X [H]. X is equal to the relic tokens on this patch.',
      'During Update, you may redistribute any relic tokens between patches attached to friendly characters.',
    ],
    flavour: 'An endless reservoir of ancient energy, limited only by how fast you unlock its mysteries.',
  },
  {
    name: 'Amulet of Kill Process',
    cardId: 'SC-170P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: [
      'On attach, add 1 relic token to this.',
      'When this character is targeted by a command, you may remove 1 relic token from this to cancel that command. If this has no relic tokens on it, crash it.',
    ],
    flavour: '"None understand its intention, but all crave its power." -Kagemusha',
  },
  {
    name: "Sparrow's Imperial Seal",
    cardId: 'SC-171P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: ['Other patches attached to this character cannot be targeted.'],
    flavour: '"Even centuries later, it\'s still imposing the will of that ill-fated emperor." -Yama Uba',
  },
  {
    name: 'Tome of Ancient Scripts',
    cardId: 'SC-172P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: [
      'On attach, you may lose 1 max [RAM]. If you do, add 2 relic tokens to this.',
      'When this character activates a command, you may remove 1 relic token from this to give it +2 [P], +2 [A], or +2 [H].',
    ],
    flavour: '"No one can open it, let alone translate it. Strangely, neither seems necessary." -Starless, Guiding Reliquarian',
  },
  {
    name: 'Shining Moon Netsuke',
    cardId: 'SC-173P-EN',
    type: 'Patch: Ally',
    cost: 1,
    rules: [
      'On attach, you may lose 1 max [RAM]. If you do, add 1 relic token to this.',
      'During Update, you may remove 1 relic token from this to unattach a patch from target character.',
    ],
    flavour: '"Contemplate the moon and impure thoughts will flee you." -Ritual of Mending',
  },
  {
    name: 'Skeleton Key',
    cardId: 'SC-174P-EN',
    type: 'Patch: Ally',
    cost: 1,
    rules: [
      'On attach, you may lose up to 3 max [RAM]. Add that many relic tokens to this.',
      'When a character would activate a program, you may remove up to 1 relic token from this to give it cost -2 to a minimum of 1.',
    ],
    flavour: '"Every wish a cost, and through each lock, consequence in turn." -Riddle of the Key',
  },
  {
    name: 'Temple Bell Kotto',
    cardId: 'SC-175P-EN',
    type: 'Patch: Ally',
    cost: 1,
    rules: [
      'On attach, you may lose 1 max [RAM]. If you do add 1 relic token to this.',
      'While this has at least 1 relic token on it, commands that target this character get -3 [P], -3 [A] and -3 [C].',
    ],
    flavour: 'Found gathering dust in a small, unnamed shrine to the Original Architect.',
  },
  {
    name: 'Nightshade Needles',
    cardId: 'SC-176P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: ['[EXE]: Deal 2 [P]. You may remove 1 relic token from target patch attached to a friendly character to give this +2 [P].'],
    flavour: '"Wrest these from the vault, Kazuo, and your rewards will know no end." -Crest, Oyabun',
  },
];

const forbiddenArchives: CardedText[] = [
  {
    name: 'Inkstone',
    cardId: 'FA-006P-EN',
    type: 'Command',
    cost: 1,
    rules: ['If the total number of patches attached to friendly characters is 3 or more, gain an ink token.'],
    flavour: 'The greatest stories begin in a pool of formless black.',
  },
  {
    name: 'Shorthand Rec0rd',
    cardId: 'FA-007P-EN',
    type: 'Command',
    cost: 5,
    rules: [
      'Spend X ink. Deal X - 1 [P].',
      'You may spend 2 ink to treat this card as cost 1 when using it to reset.',
    ],
    flavour: 'The smallest strokes make the deepest marks.',
  },
  {
    name: 'Agile Stroke',
    cardId: 'FA-008P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: [
      '[EXE]: Deal 1 [P].',
      'Scribe 2: This program, all other commands, and all [EXE] and [RCT] effects get +1 [H] this phase.',
    ],
    flavour: 'All tales start from one impulsive stroke.',
  },
  {
    name: 'Stroke of Midnight',
    cardId: 'FA-009P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: [
      'Enemy programs that target patches attached to friendly characters gain cost +1.',
      'Scribe 1: Cycle target character.',
    ],
    flavour: 'She read the script, and the darkest hour followed.',
  },
  {
    name: 'Dissolution Kana',
    cardId: 'FA-010P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: [
      'Treat all friendly programs as cost -1 when using them to reset down to a minimum of 1.',
      'Scribe 2: Deal 1 [P].',
    ],
    flavour: 'Some words are written, other words are unwritten.',
  },
  {
    name: 'Stroke of Genius',
    cardId: 'FA-011P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: [
      'This character cannot be cycled by enemy characters or enemy programs.',
      'Scribe 1: Ready target character.',
    ],
    flavour: 'A single word has infinite power, if properly timed and placed.',
  },
  {
    name: "Engraver's Mark",
    cardId: 'FA-012P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: [
      "Once during each opponent's turn when a patch is unattached from an enemy character, you may deal 1 [P].",
      'Scribe 2: This program, all other commands, and all [EXE] and [RCT] effects get +1 [P] this phase.',
    ],
    flavour: 'An undeniable signature of authorial authenticity.',
  },
  {
    name: 'Gilded Cryptek',
    cardId: 'FA-013P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: [
      'Enemy programs get cost +1 when used to reset.',
      'Scribe 1: Unattach target patch with cost 2 or less.',
    ],
    flavour: 'Words are the best tools for creating understanding. They are also the best tools for completely obscuring it.',
  },
  {
    name: 'Crackling Stroke',
    cardId: 'FA-014P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: [
      'During Update, this character may heal itself 1 by [H].',
      'Scribe 2: Target character loses 1 [H].',
    ],
    flavour: 'The phrase pierced like cinders through silk.',
  },
  {
    name: "Revisionist's Stroke",
    cardId: 'FA-015P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: [
      "[EXE]: Heal X [H]. X is the number of programs in this character's stack.",
      "Scribe 1: Rearrange all programs in target friendly character's stack.",
    ],
    flavour: 'A timely reprieve for some, a sudden blinding for many.',
  },
  {
    name: 'The Ironclad Chronicle',
    cardId: 'FA-016P-EN',
    type: 'Command',
    subType: 'Scroll',
    cost: 3,
    rules: [
      'Transcribe',
      "Add 2 armor to target character. This program's cost cannot be reduced.",
    ],
    flavour: '"Each deletion refined it. When perfection was reached, it allowed no more." -The Ironclad Chronicle',
  },
  {
    name: 'Codex of the Lost',
    cardId: 'FA-017P-EN',
    type: 'Command',
    subType: 'Scroll',
    cost: 3,
    rules: [
      'Transcribe',
      "Gain 1 virtual RAM. This program's cost cannot be reduced.",
    ],
    flavour: '"The underworld\'s history was written by many unseen hands. God help those who attempt to read it." -Ral Kaid',
  },
  {
    name: 'Rec0rd Totem',
    cardId: 'FA-018P-EN',
    type: 'Patch: Self',
    subType: 'Scroll Totem',
    cost: 3,
    rules: [
      "This program's cost cannot be reduced.",
      '[EXE]: Transcribe. Deal 1 [P].',
    ],
    flavour: '"No glyph or rune is more sacred than a cairn left for the lost." -Unattributed',
  },
  {
    name: 'Tale of Flowing Water',
    cardId: 'FA-019P-EN',
    type: 'Command',
    subType: 'Scroll',
    cost: 3,
    rules: [
      'Transcribe',
      "Heal 2 [H]. This program's cost cannot be reduced.",
    ],
    flavour: '"They searched for the Golden Hedron and never returned, though some say they marked their path with water." -The Binary Insight',
  },
  {
    name: 'The Forgotten Truth',
    cardId: 'FA-020P-EN',
    type: 'Command',
    subType: 'Scroll',
    cost: 3,
    rules: [
      'Transcribe',
      "This program's cost cannot be modified.",
    ],
    flavour: '"That cursed scroll is the anthology of tales too dangerous to be remembered." -Ri:se',
  },
];

const dataNation: CardedText[] = [
  {
    name: 'Holo Kingdom',
    cardId: 'SC-097P-EN',
    type: 'Command',
    cost: 6,
    rules: ["This character may immediately activate the top program of up to two tagged characters' stacks at cost 0 if those progams are cost X or less. X is your max [RAM] to a maximum of 7."],
    flavour: '"I never imagined there could be such a beautiful, perfect simulation of future thought." -Sector Probe',
  },
  {
    name: 'Bit Trail',
    cardId: 'SC-098P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Deal 3 [A]. If the target is tagged, deal 4 [A] instead.'],
    flavour: '"With a dangling pointer to critical data, the damage one can do is absolutely delightful." -Sector Probe',
  },
  {
    name: 'Hypothetical Scenario',
    cardId: 'SC-099P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Deal 0 [A]. If the target is tagged, deal 2 [A] instead.'],
    flavour: '"Feed me the juiciest information, and then watch as the plausible becomes probable, and the probable becomes truth." -Archidex',
  },
  {
    name: 'Nexus Compiler',
    cardId: 'SC-100P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Gain 1 virtual [RAM] for every tagged character up to a maximum of 2.'],
    flavour: '"Oh come on... nobody will miss 3 or 4 of their cycles. We\'re practically doing them a favor... somehow." -/naix',
  },
  {
    name: 'Systems Analysis',
    cardId: 'SC-101P-EN',
    type: 'Command',
    cost: 1,
    rules: ["You may spend additional [RAM] equal to the cost of a command on top of target character's stack. If you do, this gains the effects of that command until it resolves. Select new valid targets for the effect, ignoring any cost modification."],
    flavour: '"Break it down to its fundamentals, and the rest is clear." -Archidex',
  },
  {
    name: 'Data Tunnel',
    cardId: 'SC-102P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: ['When this character targets a tagged character with a command, that command gets +2 [P] and +1 [A], then unattach all tags on all targeted characters.'],
    flavour: '"Creating complete euphoria, or its exact opposite, is all a matter of access." -Grandmaster Hash',
  },
  {
    name: 'Cryptographic Hex',
    cardId: 'SC-103P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: ['This character cannot use [EXE] or [RCT] effects.'],
    flavour: '"... hold on. I think I heaPfu+zLoQEA+j9xo2qQb9YyZRdu2hzCKGNMOZIf9XETw=" -Akako, Brilliant Blade',
  },
  {
    name: 'TAG Theta',
    cardId: 'SC-104P-EN',
    type: 'Patch: Any',
    subType: 'Tag',
    cost: 1,
    rules: [
      'Adaptive',
      'When this character deactivates, unattach this. This character is tagged.',
    ],
    flavour: '5da31299-abb5-40ff-b0a2-967c3b474387',
  },
  {
    name: 'TAG Omega',
    cardId: 'SC-105P-EN',
    type: 'Patch: Any',
    subType: 'Tag',
    cost: 1,
    rules: [
      'Adaptive',
      'When this character deactivates, unattach this. This character is tagged.',
    ],
    flavour: 'dec2aa8b-10a6-4aa0-a10c-8936af903002',
  },
  {
    name: 'Mirror Drive',
    cardId: 'SC-106P-EN',
    type: 'Patch: Self',
    cost: 3,
    rules: ['[EXE]: Copy the [EXE] effect of target patch.'],
    flavour: 'The most sophisticated tool for black box construction and deconstruction analysis.',
  },
];

const hostileRewrite: CardedText[] = [
  {
    name: 'Internal Combustion',
    cardId: 'SC-127P-EN',
    type: 'Command',
    cost: 6,
    rules: ['Deal 7 [A].'],
    flavour: '"Complete, total, indiscriminate destruction." -Crush Vermillion',
  },
  {
    name: 'Hostile Conscription',
    cardId: 'SC-128P-EN',
    type: 'Command',
    cost: 5,
    rules: ['Unattach target patch, then attach it to a different character ignoring any attachment restrictions.'],
    flavour: '"How does it feel to know that a part of you is now a part of me?" -4L1ss',
  },
  {
    name: 'Binary Dissonance',
    cardId: 'SC-129P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Deal 2X [P]. X is the number of patches attached to the target.'],
    flavour: '"Every bit of excess code means less of you is you." -The Binary Insight',
  },
  {
    name: 'Tear The Core',
    cardId: 'SC-130P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Unattach target patch with cost 3 or less, then the character it was attached to takes X [P]. X is the cost of the target patch.'],
    flavour: '"Let\'s get right to the heart of the matter." -Crush Vermillion',
  },
  {
    name: 'Spyder Virus',
    cardId: 'SC-131P-EN',
    type: 'Patch: Any',
    cost: 5,
    rules: [
      'During Update, this character takes 2 [A], then if able, attach this to a different friendly character.',
      'When this character deactivates or crashes, unattach this, then attach it to a different friendly target character.',
    ],
    flavour: '"Remember: unbelievably dangerous, incredibly illegal, and this meeting never happened. Enjoy!" -Sector Probe',
  },
  {
    name: 'Overclock',
    cardId: 'SC-132P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: ['Commands this character activates get cost -1 to a minimum of 1. When this patch is unattached, suspend this character.'],
    flavour: '"Cognitive link confirmed. Acceleration protocol... irreversible." -Null Constructor',
  },
  {
    name: 'Polar Flip',
    cardId: 'SC-133P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: ['If this character has not taken damage this turn and would be healed by X [H], they take X [A] instead.'],
    flavour: '"Input to input. Output to output. Everything... aligned." -Miya Sparkle',
  },
  {
    name: 'Sabotage',
    cardId: 'SC-134P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: ["When this character resolves a program, they lose X [H] and become suspended, then unattach this. X is that program's cost."],
    flavour: '"These ones are special. They only dismantle what you tell them to. Mostly." -Sector Probe',
  },
  {
    name: 'Underclock',
    cardId: 'SC-135P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: ['Commands this character activates get cost +1.'],
    flavour: '"I just wanted to... to... to... to ... ..." -Joi',
  },
  {
    name: 'Kill Switch',
    cardId: 'SC-136P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: ['When this character becomes suspended they take 3 [A], then unattach this.'],
    flavour: '"Wait... there\'s a new function in my code. Why is it called \'Press for fun\'? Why is access set to public?" -Jammy Complex',
  },
];

const endlessChain: CardedText[] = [
  {
    name: 'Memory Scream',
    cardId: 'SC-107P-EN',
    type: 'Command',
    cost: 3,
    rules: ["Deal X [A]. X is the cost of the top program on target character's stack to a maximum of 9."],
    flavour: '"The more memory you accumulate, the more it\'ll come back to bite you." -EgoHack#134',
  },
  {
    name: 'Rotation 13',
    cardId: 'SC-108P-EN',
    type: 'Command',
    cost: 3,
    rules: ["You may reorder target character's stack. When this targets a friendly character, it gets cost -1. When this resolves, return it to any position in its origin stack."],
    flavour: 'N fvzcyr, ryrtnag genafsbezngvba, rfcrpvnyyl sbe gubfr jub ner jvyyvat.',
  },
  {
    name: 'Taze Mind',
    cardId: 'SC-109P-EN',
    type: 'Command',
    cost: 3,
    rules: ['Cycle target character. If the cycled program has a cost of 2 or less, deal 3 [A] to that character.'],
    flavour: '"Lie back and relax. Empty your mind. This will be a quick adjustment." -4L1ss',
  },
  {
    name: 'Channel: RAW',
    cardId: 'SC-110P-EN',
    type: 'Command',
    cost: 1,
    rules: ['You may spend X additional [RAM], then deal X [A].'],
    flavour: '"For total deconstruction, may I suggest quantity over quality?" -Cosma',
  },
  {
    name: 'Feedback Matrix',
    cardId: 'SC-111P-EN',
    type: 'Patch: Any',
    cost: 4,
    rules: ['The first time each character is cycled each turn, they take 2 [A].'],
    flavour: '"Data must move in straight lines, and never end to end..." -The Binary Insight',
  },
  {
    name: 'Domination Protocol',
    cardId: 'SC-112P-EN',
    type: 'Patch: Any',
    cost: 4,
    rules: [
      'This character cannot activate commands.',
      '[EXE]: This character takes 5 [A] and is suspended.',
    ],
    flavour: '"Submission is so much easier, don\'t you think?" -4L1ss',
  },
  {
    name: 'Ego Shackle',
    cardId: 'SC-113P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: [
      'This character cannot activate patches from their stack.',
      '[EXE]: This character takes 3 [A] and is suspended.',
    ],
    flavour: '"Every emotion you feel is just another opportunity for control." -Tori-Daiyu',
  },
  {
    name: 'Razor Wire',
    cardId: 'SC-114P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: ['Whenever this character would deactivate they take 4 [A] before deactivation.'],
    flavour: '"Generally I love crossing lines, but this one\'s a bit spiky!" -The Great Ezplosio',
  },
  {
    name: 'Mutex',
    cardId: 'SC-115P-EN',
    type: 'Patch: Any',
    cost: 2,
    rules: [
      'This character cannot activate more than one program each turn.',
      '[EXE]: This character takes 2 [A] and is suspended.',
    ],
    flavour: '"It\'s like a game of Red Light, Green Light, but for your brain!" -Kiu-T',
  },
  {
    name: 'Spirit Chain',
    cardId: 'SC-116P-EN',
    type: 'Patch: Any',
    cost: 1,
    rules: ['This character treats programs as cost +2 when resetting. When this character resets, unattach this.'],
    flavour: '"There is no stronger shackle than an unwavering conviction to your current course." -EgoHack#57',
  },
];

const masquerade: CardedText[] = [
  {
    name: 'Danse Macabre',
    cardId: 'MQ-006P-EN',
    type: 'Patch: Self',
    cost: 3,
    rules: [
      'Characters with 3 or more programs in their stack must spend 1 [RAM] to deactivate.',
      '[EXE]: Cycle target character.',
    ],
    flavour: "It's a glitch that we can all share.",
  },
  {
    name: 'Grand Ball',
    cardId: 'MQ-007P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: ["When an enemy character resolves a [MSK] effect during their Activation phase, you may place that Mask on the bottom of target enemy character's stack if they have not activated that Mask this turn."],
    flavour: 'Revelry, degeneracy, lunacy, madness.',
  },
  {
    name: 'Mask of Endless Revelry',
    cardId: 'MQ-008P-EN',
    type: 'Command',
    subType: 'Mask',
    cost: 1,
    rules: [
      'Adaptive, Possession',
      '[MSK]: This character updates, then initializes, then loses 1 [H].',
    ],
    flavour: '"Every day\'s worth celebrating, don\'t you think? Come. I\'ll take good care of you." -Pendulum\'s Imprint',
  },
  {
    name: "Mask of Selecta's Purge",
    cardId: 'MQ-009P-EN',
    type: 'Command',
    subType: 'Mask',
    cost: 1,
    rules: [
      'Adaptive, Possession',
      '[MSK]: Target opponent receives a battery.',
    ],
    flavour: '"Why try so hard to change yourself? You know, you are perfect just the way you are." -Selecta\'s Imprint',
  },
  {
    name: 'Mask of the Silent Name',
    cardId: 'MQ-010P-EN',
    type: 'Command',
    subType: 'Mask',
    cost: 1,
    rules: [
      'Adaptive, Possession',
      '[MSK]: Unattach the lowest cost patch attached to a friendly character.',
    ],
    flavour: '"It\'s easier to forget, isn\'t it? Just go with the flow... see what happens." -Plexil\'s Imprint',
  },
  {
    name: 'Mask of Broken Cephalons',
    cardId: 'MQ-011P-EN',
    type: 'Command',
    subType: 'Mask',
    cost: 1,
    rules: [
      'Adaptive, Possession',
      '[MSK]: The character in this squad with the lowest [H] takes 3 [A].',
    ],
    flavour: '"Something feels broken inside, doesn\'t it? Your code may not be as reliable as you thought." -G4g3\'s Imprint',
  },
  {
    name: 'Mask of the Demon Machine',
    cardId: 'MQ-012P-EN',
    type: 'Command',
    subType: 'Mask',
    cost: 1,
    rules: [
      'Adaptive, Possession',
      '[MSK]: The character in this squad with the lowest [H] takes 3 [P].',
    ],
    flavour: '"Sleep and rest are weakness. Train yourself until you fall to pieces. When you are done, get up and do it again." -Zakhi\'s Shadow Imprint',
  },
  {
    name: 'Mask of Tabula Rasa',
    cardId: 'MQ-013P-EN',
    type: 'Command',
    subType: 'Mask',
    cost: 1,
    rules: [
      'Adaptive, Possession',
      '[MSK]: Cycle all friendly characters that do not have a Mask on top of their stack.',
    ],
    flavour: '"Problems manifest when the tethers between selves erode, but differing expressions are natural." -Ix\'s Imprint',
  },
  {
    name: 'Tempting Invitation',
    cardId: 'MQ-014P-EN',
    type: 'Command',
    cost: 3,
    rules: ["Deal X - 1 [A]. X is equal to the number of programs in the target character's stack."],
    flavour: 'A venue to exercise our basest impulse.',
  },
  {
    name: 'Drifting Shadows',
    cardId: 'MQ-015P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: ['When this character is targeted by a command, [EXE] effect, or [RCT] effect, cancel that program, then unattach this patch.'],
    flavour: 'The art of getting lost in the crowd.',
  },
];

const commonCore: CardedText[] = [
  {
    name: 'Decode',
    cardId: 'SC-087P-EN',
    type: 'Command',
    cost: 4,
    rules: ['Unattach target patch or patches with a total cost 4 of or less. You may treat this as cost 2 when using it to reset.'],
    flavour: '"Nothing is impossible to undo, so long as you understand exactly how it was done." -Ral Kaid, Archivist',
  },
  {
    name: 'Daze Memory',
    cardId: 'SC-088P-EN',
    type: 'Command',
    cost: 4,
    rules: ['Suspend target character.'],
    flavour: 'Code is constant, but consciousness is fickle.',
  },
  {
    name: 'End Process',
    cardId: 'SC-089P-EN',
    type: 'Command',
    cost: 2,
    rules: ['Cycle target character.'],
    flavour: 'I was just... g0oing... to... [Processing Has Ended]',
  },
  {
    name: 'Jab',
    cardId: 'SC-090P-EN',
    type: 'Command',
    cost: 2,
    rules: ['Deal 2 [P].'],
    flavour: 'A swift jab to the tender bits.',
  },
  {
    name: 'Backhand',
    cardId: 'SC-091P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Deal 1 [P].'],
    flavour: '"Far from my favorite thing to wake up to." -Shirei, Vagrant Dragon',
  },
  {
    name: 'Bit Shift',
    cardId: 'SC-092P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Deal 1 [A].'],
    flavour: '"Cognitive processing, huh? Sounds fun! Let\'s just... umm... move this 0 over here?" -/naix',
  },
  {
    name: 'Trim the Line',
    cardId: 'SC-093P-EN',
    type: 'Command',
    cost: 1,
    rules: ['You may spend X additional [RAM] equal to the cost of target patch. If you do, unattach it.'],
    flavour: 'With Trim the Line, anyone can cut some excess code!',
  },
  {
    name: 'Wall Hacks',
    cardId: 'SC-094P-EN',
    type: 'Patch: Ally',
    cost: 1,
    rules: ['[EXE]: Ready target character that was activated this turn.'],
    flavour: '"Engaging is so much more efficient when nothing is in the way." -Hanbei',
  },
  {
    name: 'Restore',
    cardId: 'SC-095P-EN',
    type: 'Patch: Any',
    cost: 3,
    rules: ['[EXE]: This character may heal itself by 3 [H], then suspend this character.'],
    flavour: '"Good down time leads to good up time!" -Scrapper',
  },
  {
    name: 'Glitch Pact',
    cardId: 'SC-096P-EN',
    type: 'Patch: Self',
    cost: 3,
    rules: ['During Initialize, gain 1 virtual [RAM] and this character loses 1 [H].'],
    flavour: 'Incalculable power lies at the edge of understanding.',
  },
];

const commonEx1: CardedText[] = [
  {
    name: 'Back from the Brink',
    cardId: 'DC-005P-EN',
    type: 'Patch: Ally',
    cost: 3,
    rules: ["[RCT]: When this character would crash due to taking damage, instead, set this character's [H] to 1."],
    flavour: 'With just a few bits duplicated and encrypted, we can approximate a rudimentary regeneration.',
  },
  {
    name: 'S.P.4.4.M.',
    cardId: 'MB-005P-EN',
    type: 'Patch: Self',
    subType: 'Food',
    cost: 2,
    rules: ['Consume 3: This character takes 1 [P]. Deal 1 [P].'],
    flavour: 'All-you-can-eat.',
  },
  {
    name: 'Softcopy Scroll',
    cardId: 'FA-005P-EN',
    type: 'Command',
    cost: 3,
    rules: [
      'Transcribe',
      "This program's cost cannot be reduced.",
    ],
    flavour: 'Everyone has a story to tell.',
  },
  {
    name: 'Blank Mask',
    cardId: 'MQ-005P-EN',
    type: 'Command',
    subType: 'Mask',
    cost: 1,
    rules: ["Place this program on the bottom of target enemy character's stack."],
    flavour: 'A clean slate. A borrowed face. A new beginning.',
  },
];

/* Printed set code is LUX. Recorded as CORE, the box these ship in. */

const luxVault: CardedText[] = [
  {
    name: 'Fur L0W',
    cardId: 'SC-182P-EN',
    type: 'Patch: Ally',
    cost: 2,
    rules: ["[RCT]: When this character's squad is targeted by a command, suspend this character and this character ignores all effects of that command."],
    flavour: '',
    unlock: 'Endian Key: Win a game with either 5 overload or 1 max [RAM].',
  },
  {
    name: 'Cat Tales',
    cardId: 'SC-181P-EN',
    type: 'Command',
    cost: 1,
    rules: ['Target character loses 1 [H] if they have an attached patch of cost 3 or more.'],
    flavour: '',
    unlock: "Endian Key: Win a game with no programs left in any of your characters' stacks.",
  },
  {
    name: 'Nine Lives',
    cardId: 'SC-183P-EN',
    type: 'Patch: Self',
    cost: 2,
    rules: ["[RCT]: When this character would crash due to taking damage, instead, set this character's [H] to 1."],
    flavour: '',
    unlock: 'Endian Key: In one game, heal LuX by a total 9 [H] while LuX is undead.',
  },
  {
    name: 'Canned 2NA',
    cardId: 'SC-184P-EN',
    type: 'Patch: Self',
    subType: 'Food',
    cost: 2,
    rules: ['Consume 3: This character loses 1 [H]. Heal 2 [H].'],
    flavour: '',
    unlock: 'Endian Key: Attach three different Food patches to LuX with a single activation of Second Helping.',
  },
  {
    name: 'MT. Scroll Box',
    cardId: 'SC-185P-EN',
    type: 'Command',
    cost: 4,
    rules: [
      'Transcribe. Reduce the ink cost of the first scribe effect added to this program by 1, to a minimum of 0.',
      "This program's cost cannot be reduced.",
    ],
    flavour: '',
    unlock: "Endian Key: Spend six or more ink on one activation of Softcopy Scroll from LuX's stack.",
  },
  {
    name: 'Mask of the Locked Heart',
    cardId: 'SC-186P-EN',
    type: 'Command',
    subType: 'Mask',
    cost: 2,
    rules: ["Place this program on the bottom of target enemy character's stack."],
    flavour: '',
    unlock: 'Endian Key: Crash a character with seven or more programs in their stack.',
  },
];

/* Gallery order follows `brands[]` in universe.ts. */
/* Both ids are derived, so a duplicate slug or a duplicate printed id would leave one card unreachable. */
function assertProgramIds(): void {
  if (import.meta.env.PROD) return;
  const seen = new Map<string, string>();
  for (const program of allPrograms) {
    const clash = seen.get(program.slug);
    if (clash) console.warn(`[programs] "${program.name}" and "${clash}" both slug to "${program.slug}".`);
    seen.set(program.slug, program.name);
  }
  const cards = new Set<string>();
  for (const program of allPrograms) {
    if (cards.has(program.cardId)) console.warn(`[programs] duplicate printed id ${program.cardId}.`);
    cards.add(program.cardId);
  }
}

export const allPrograms: Program[] = [
  ...brandCards('scrap-brigade', 'CORE', scrapBrigade),
  ...brandCards('benobasas-fist', 'CORE', benobasasFist),
  ...brandCards('chaos-verve', 'CORE', chaosVerve),
  ...brandCards('mega-byte', 'EX1', megaByte),
  ...brandCards('bloom-and-never', 'CORE', bloomAndNever),
  ...brandCards('ark-totem', 'CORE', arkTotem),
  ...brandCards('feralesque', 'CORE', feralesque),
  ...brandCards('de-crypt', 'EX1', deCrypt),
  ...brandCards('infinite-divine', 'CORE', infiniteDivine),
  ...brandCards('onryoki-noh', 'CORE', onryokiNoh),
  ...brandCards('zodiac-reliquary', 'CORE', zodiacReliquary),
  ...brandCards('forbidden-archives', 'EX1', forbiddenArchives),
  ...brandCards('data-nation', 'CORE', dataNation),
  ...brandCards('hostile-rewrite', 'CORE', hostileRewrite),
  ...brandCards('endless-chain', 'CORE', endlessChain),
  ...brandCards('masquerade', 'EX1', masquerade),
  ...brandCards('common', 'CORE', commonCore),
  ...brandCards('common', 'EX1', commonEx1),
  ...brandCards('lux-vault', 'CORE', luxVault),
];
assertProgramIds();

/* PARKED — printed cards that are not programs, deliberately exported so the text is not lost; nothing renders any of it and none of it is added to `allPrograms`.
   TODO — each needs a type and a surface of its own.
   ========================================================================== */

/* Not one of Forbidden Archives' fifteen cards. */
export const libraryZone: CardText = {
  name: 'Library',
  cardId: 'FA-021Z-EN',
  type: 'Zone',
  cost: 0,//doesnt have a cost.
  rules: ['(Reminder: You may have up to 8 ink tokens. Programs activated from the Library return to the Library.)'],
  flavour: '',
};

/* Every one is set `INC` and brand Architech Design, so neither is stored per entry — `CardText` carries neither field. */
export const architechDesigns: CardText[] = [
  {
    name: 'Treasure Cache',
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 2,
    rules: ['[EXE]: Gain 1 virtual [RAM].'],
    flavour: 'A subspace pocket of resources, hidden in plain sight.',
  },
  {
    name: 'Scroll of Dispel Code',
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 2,
    rules: ['[EXE]: You may spend 2 [RAM] to unattach target patch.'],
    flavour: 'A single use debug code for prior state restoration.',
  },
  {
    name: "Fortune's Cross",
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 2,
    rules: ["[EXE]: You may reorder target friendly character's stack."],
    flavour: 'A prediction of the most likely immediate outcome, allowing time for adaptation.',
  },
  {
    name: 'Blessing of One',
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 1,
    rules: ['[EXE]: Heal 3 [H].'],
    flavour: 'A back-up allocation of memory redundancy for soul code.',
  },
  {
    name: 'Small Boots',
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 1,
    rules: ['[EXE]: If the next program you activate this phase is cost 2 or less, it activates at cost 0.'],
    flavour: 'Pre-boot loading for simple operations.',
  },
  {
    name: 'Green Torch',
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 2,
    rules: ['[EXE]: Ready target character.'],
    flavour: 'An efficient helper function for reinitialization.',
  },
  {
    name: 'Skip-Skip',
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 2,
    rules: ['[EXE]: Reset target friendly character for 0 [RAM].'],
    flavour: 'An ancient GOTO command exploit.',
  },
  {
    name: 'Rejuvenating Aura',
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 3,
    rules: ['During Initialize, this character may heal itself by 1 [H].'],
    flavour: 'Background processes for regenerating partial data.',
  },
  {
    name: 'Protocol of Holding',
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 3,
    rules: ['During Update, if you have unspent max [RAM], you may gain a battery.'],
    flavour: 'An experimental storage protocol for unused resources.',
  },
  {
    name: 'Blue Screams',
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 2,
    rules: ['During Update, if you have unspent max [RAM], you may cycle target character.'],
    flavour: 'Forced cascading of excess resource allocation.',
  },
  {
    name: 'Rainbow Ink',
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 2,
    rules: ["[EXE]: Unattach target patch, then lose X [H]. X is equal to the patch's cost."],
    flavour: 'A low level function for 1-to-1 bit deletion.',
  },
  {
    name: 'Force Cantrip',
    type: 'Patch: Ally',
    subType: 'Architech Design',
    cost: 3,
    rules: ['[RCT]: Give target command +1 [P] or -1 [P].'],
    flavour: 'A deft modification of mid-sequence code.',
  },
];

export interface EnvironmentCard {
  name: string;

  ability: string;
  /** Exact printed rules text. */
  rules: string;
  flavour: string;
}

/* All six print "Environment" as their type line, so it is not stored. */
export const environments: EnvironmentCard[] = [
  {
    name: 'Railway Network',
    ability: 'Event Scheduler',
    rules: 'When you swap a character out, unattach all of their attached patches, then reattach them to active friendly characters.',
    flavour: 'No programs on the network are ever out of reach.',
  },
  {
    name: 'Molten Horizon',
    ability: 'Over-surge',
    rules: 'The cap for max [RAM] before gaining overload is now 5.',
    flavour: "It's a burning nexus of memory-scorching heat, endlessly churning, endlessly recycling.",
  },
  {
    name: 'Pristine Creation',
    ability: 'Memory Lattice',
    rules: 'During Refresh, skip the Deactivate [RAM] step. During Start-Up, before you ready max [RAM], gain virtual [RAM] equal to your unspent [RAM].',
    flavour: 'The perfect construction of the garden distorts reality, slowing and accelerating time together.',
  },
  {
    name: 'Darklight Fracture',
    ability: 'Fog of War',
    rules: 'Characters with no damage have stealth.',
    flavour: 'Below lies an endless abyss of dark, dotted only by the last flickering remnants of the shattered city.',
  },
  {
    name: 'Hall of Echoes',
    ability: 'Inhabitance',
    rules: 'Each turn, players must perform a swap if able.',
    flavour: 'Each in turn must play their part, then exit with a bow.',
  },
  {
    name: 'Prismatarium',
    ability: 'Starstruck',
    rules: "During your first turn, gain 5 virtual [RAM]. Characters cannot be crashed or reduced below 1 [H] on any player's first turn.",
    flavour: 'When the right confluence of ancient stars align, a strange and mysterious energy emerges.',
  },
];
