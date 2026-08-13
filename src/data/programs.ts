/* ============================================================================
   PROGRAM CARD TEXT — the printed cards, as data.

   Four rules, in the order they are easy to break:

     1. TRANSCRIBE, DO NOT EDIT. These strings are the printed wording, typos
        and all ("a total cost 4 of or less" on Decode; "progams" on Holo
        Kingdom; "concience" on Oni Shift). A string that reads differently from
        the box makes this file a second, wrong rulebook. Fix the print run
        first.
     2. `rules` is one entry per printed line. Joining them invents punctuation
        the card does not have.
     3. Nothing internal goes in this file. It ships in the JS bundle and is
        readable in devtools, so "in this file" means published — which is also
        why an unannounced card is simply absent rather than `revealed: false`.
        `BrandView` pads its grid to `brand.programCount`.
     4. Ids are `<brandId>-NN` in printed order and are a CONTRACT: errata cite
        them in `affectedProgramIds` (content/en/news/). Append, never reorder.
   ========================================================================== */

import type { Program, SetCode } from './types';

/** A card as written down. Id, art and reveal state are mechanical and are
    filled in by `brandCards`, so they cannot drift per entry. */
interface CardText {
  name: string;
  /** Printed type line, without the sub-type. */
  type: string;
  /** "Totem", "Tag". Absent on most cards. */
  subType?: string;
  cost: number;
  /** One entry per printed line, in printed order. */
  rules: string[];
  /** '' when the card prints an `unlock` line in place of flavour. */
  flavour: string;
  /** LuX only: the printed Endian Key that opens the card. */
  unlock?: string;
}

const brandCards = (brandId: string, set: SetCode, cards: CardText[]): Program[] =>
  cards.map((card, index) => ({
    id: `${brandId}-${String(index + 1).padStart(2, '0')}`,
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
    /* Not interchangeable — see the ART COMES IN LAYERS note in types.ts.
       `src: null` draws the placeholder frame until the files land. */
    art: { src: null, alt: `${card.name}, program art`, artist: null },
    cardArt: { src: null, alt: `${card.name} card`, artist: null },
  }));

const scrapBrigade: CardText[] = [
  {
    name: 'Armor Up',
    type: 'Command',
    cost: 4,
    rules: ['Add 2 armor to each active character in target squad.'],
    flavour: '"A scrap for you and a scrap for you." -Tao, the Stringless Puppet',
  },
  {
    name: 'Rocket Crush',
    type: 'Command',
    cost: 3,
    rules: ['Deal 2 [P]. This character may remove 1 armor to deal 4 [P] instead.'],
    flavour: '"Sometimes when I\'m bored, I like to strap incredibly dangerous rockets onto whatever\'s closest to me... that helps a lot." -The Great Ezplosio',
  },
  {
    name: 'Pass the Plate, Mate',
    type: 'Command',
    cost: 2,
    rules: ['Add 2 armor to target character. When this program is used to reset, gain 1 armor.'],
    flavour: '"Just found this code out in the heap. No clue what it does, but I\'d be happy to bolt it on!" -Scrapper',
  },
  {
    name: 'Defrag',
    type: 'Command',
    cost: 3,
    rules: ['Remove X armor from friendly characters, then deal X [P].'],
    flavour: '"No! It\'s not meant to be \'graceful\'. Ugh, I can\'t roll my eyes hard enough. Just aim the garbage that way!" -The Great Ezplosio',
  },
  {
    name: 'Scrap and Weld',
    type: 'Command',
    cost: 1,
    rules: ['Redistribute armor in any way between friendly active characters.'],
    flavour: '"You\'d be surprised how much of you I\'ve replaced over the years." -Super Joe',
  },
  {
    name: 'Insta-mesh',
    type: 'Patch: Any',
    cost: 2,
    rules: ['[RCT]: When this character takes X damage, they gain X armor.'],
    flavour: '"You asked for an impenetrable fortress. I made it pocket-size! Just, uh... give it a sec to unfold." -Scrapper',
  },
  {
    name: 'Mechanize',
    type: 'Patch: Any',
    cost: 3,
    rules: ['When this character activates a command, they gain 1 armor before that command resolves.'],
    flavour: '"Every program produces some junk memory. Waste not want not I always say!" -Scrapper',
  },
  {
    name: 'Forcefield of BOOM!',
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
    type: 'Patch: Any',
    cost: 4,
    rules: [
      'During Initialize, add 1 armor to this character.',
      '[EXE]: This character gains 3 armor.',
    ],
    flavour: '"Let\'s make you a code magnet! You know the ladies dig a guy covered in rusty junk." -Scrapper to Zaximus',
  },
];

const benobasasFist: CardText[] = [
  {
    name: 'Bass Drop Jutsu',
    type: 'Command',
    cost: 6,
    rules: ['Target squad loses 3 [H].'],
    flavour: '"Just like Benobasa to ruin perfection simply by taking it way too far." -Grandmaster Hash',
  },
  {
    name: 'Dragon Feet',
    type: 'Command',
    cost: 4,
    rules: ['Deal 3 [P], then deal 2 [P] to a different target.'],
    flavour: '"The air is warm. The ground is burning... our feet are burning!" -Revelations of Master Jaya',
  },
  {
    name: 'Stone Hands',
    type: 'Command',
    cost: 3,
    rules: ['Deal 2 [P], then deal 1 [P] to a different target.'],
    flavour: "It's rumored that Benobasa originally distributed this program in the archaic form of a book.",
  },
  {
    name: 'Break Beats',
    type: 'Command',
    cost: 2,
    rules: ['Deal 1 [P], then deal 1 [P] to a different target.'],
    flavour: '"Regular rhythm is predictable. Don\'t be predictable." -Benobasa',
  },
  {
    name: 'Combo Breaker',
    type: 'Patch: Ally',
    cost: 3,
    rules: ['When this character takes damage, you may add it to this instead, then if the damage on this patch is 3 or more, unattach it.'],
    flavour: '"Take their best. If you\'re still standing, they\'ll have nothing left." -Benobasa',
  },
  {
    name: 'Show me your Moves',
    type: 'Patch: Self',
    cost: 2,
    rules: ['While this character has 7 or more [H], they have taunt.'],
    flavour: '"How amusing. Fine, then. Step forward and prove it." -Sk4di, 12th Disciple',
  },
  {
    name: "Monarchy's Rumble",
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
    type: 'Patch: Self',
    cost: 3,
    rules: ['[RCT]: When a command or [EXE] effect is activated or used, that command or [EXE] effect gets -4 [P] and -4 [A].'],
    flavour: '"Sung, this may shock you, but the best defense is usually just a good defense." -Benobasa',
  },
  {
    name: 'Ora Ora',
    type: 'Patch: Self',
    cost: 2,
    rules: ['While this character has no other attached patches, they have taunt.'],
    flavour: '"Command all the attention that your strength can handle." -Benobasa',
  },
];

const chaosVerve: CardText[] = [
  {
    name: 'Sonic Flare',
    type: 'Command',
    cost: 7,
    rules: ['Target squad takes 1 [P], then suspend that squad. You may treat this as cost 1 when using it to reset.'],
    flavour: '"It\'s the height of euphoric, synesthetic overload! It\'s like getting punched in the face, and you... will... love it." -Roxie',
  },
  {
    name: 'Hyperwave',
    type: 'Command',
    cost: 2,
    rules: ['Suspend the character with the lowest [H] in target squad. You may choose between ties.'],
    flavour: '"These frequencies resonate perfectly with most cognitive code. It\'s a total trip. Just don\'t overdo it." -Grandmaster Hash',
  },
  {
    name: 'Disco Hand Grenade',
    type: 'Command',
    cost: 3,
    rules: ['Suspend target character, or deal 4 [A] to target suspended character.'],
    flavour: '"Yeah, there\'s \'make\' them dance... and then there\'s \'-make-\' them dance. Know what I mean?" -White Noise',
  },
  {
    name: 'Pyrotechnix',
    type: 'Command',
    cost: 2,
    rules: ['Deal 1 [A] and 1 [P] to target character.'],
    flavour: '"YES! The best part of the concert! This is where it all blows up!" -The Great Ezplosio',
  },
  {
    name: '2nd Encore',
    type: 'Command',
    cost: 1,
    rules: ['Deal 1 [P] to each suspended character in target squad.'],
    flavour: '"You\'re tired, they\'re tired... but that\'s exactly when you\'ve got to double down. Just part of the job." -White Noise',
  },
  {
    name: 'Amplitude',
    type: 'Command',
    cost: 1,
    rules: ['Deal 1 [A] to target enemy character. If the target is suspended, gain 1 virtual [RAM].'],
    flavour: '"The best jams are the ones that come back to you." -Grandmaster Hash',
  },
  {
    name: 'Psycho Graffiti',
    type: 'Patch: Self',
    cost: 2,
    rules: ['Each turn, the first command this character activates that targets a suspended character gets +1 [P] and +1 [A].'],
    flavour: '"True art is not yours. It takes on a life of its own." -Twisted-6',
  },
  {
    name: 'Doorway to Dreamland',
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
    type: 'Patch: Self',
    cost: 2,
    rules: ['[EXE]: Suspend this character, then gain 2 virtual [RAM].'],
    flavour: '"Baq, we don\'t need to light the whole server! This is seriously the last time I carry this." -Joi',
  },
  {
    name: 'Infinite Youth',
    type: 'Patch: Self',
    cost: 1,
    rules: ['[EXE]: Gain 1 virtual [RAM].'],
    flavour: '"Attitude is the name of the game. History won\'t see you from someone else\'s shadow." -Benobasa',
  },
];

const bloomAndNever: CardText[] = [
  {
    name: 'Witch Dust',
    type: 'Command',
    cost: 5,
    rules: ['Heal target squad by 1 [H], then deal X [C]. X is equal to the amount of damage healed by this program.'],
    flavour: 'Every mote a boon and a curse.',
  },
  {
    name: 'Vines of Uruth',
    type: 'Command',
    cost: 2,
    rules: ['Heal 2 [H].'],
    flavour: '"Everything deserves to grow." -Kodama',
  },
  {
    name: 'Caustic Tincture',
    type: 'Command',
    cost: 1,
    rules: ['Unattach target patch with cost 2 or less.'],
    flavour: '"Here, this infusion is custom tailored to take the rough edges off your code." -Kodama',
  },
  {
    name: 'Tea of Discussion',
    type: 'Command',
    cost: 1,
    rules: ['Heal 1 [H].'],
    flavour: 'Enrich the mind, enrich the body, enrich the soul.',
  },
  {
    name: 'Acidic Core',
    type: 'Patch: Any',
    cost: 5,
    rules: ['During Update, this character takes 4 [C].'],
    flavour: '"It is one thing to see code crash. Quite another to watch it melt." -Bronwyn',
  },
  {
    name: 'Fungal Possession',
    type: 'Patch: Any',
    cost: 4,
    rules: ["Programs on top of this character's stack may be activated by any other character."],
    flavour: '"Well, it can hardly be considered against your will if you don\'t even know you are doing it." -Jean O.K.',
  },
  {
    name: 'Lotus Hex',
    type: 'Patch: Any',
    cost: 4,
    rules: ['During Initialize, unattach a patch other than Lotus Hex from this character. If you cannot, this character takes 2 [C].'],
    flavour: '"Their code will fall like petals from a wilting flower." -Divina the Opulent',
  },
  {
    name: 'Putrid Blossoms',
    type: 'Patch: Any',
    cost: 2,
    rules: ['When this character activates a program they take 1 [C].'],
    flavour: '"Decay begets beauty, beauty begets decay." -Hana Mori Proverb',
  },
  {
    name: 'Viral Venom',
    type: 'Patch: Any',
    cost: 2,
    rules: ['During Update, this character takes 1 [C].'],
    flavour: 'Suspended death, twisted into new life.',
  },
  {
    name: 'Catalyst',
    type: 'Patch: Any',
    cost: 2,
    rules: [
      'All patches attached to, and [EXE] or [RCT] effects used by this character get +1 [C] and +1 [H].',
      'Unattach this when there are no other patches attached to this character.',
    ],
    flavour: '"With the right mix, any experiment can flourish!" -Deepvine Cultivator, Sevy',
  },
];

const arkTotem: CardText[] = [
  {
    name: 'Winds of Purity',
    type: 'Command',
    cost: 2,
    rules: ['Unattach target patch with cost 3 + X or less. X is equal to all your active Totems.'],
    flavour: '"A breath taken in solace parts the immaculate from the corrupt." -Ritual of Mending',
  },
  {
    name: 'F0x Totem',
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
    type: 'Patch: Self',
    cost: 2,
    rules: [
      'Totem patches cannot be targeted by programs.',
      '[EXE]: Up to X different target characters lose 1 [H]. X is equal to all your active Totems.',
    ],
    flavour: '"True peace is unshakeable, but few will ever find it." -Elsa Verity',
  },
];

const feralesque: CardText[] = [
  {
    name: 'Natural Order',
    type: 'Command',
    cost: 3,
    rules: ['You may spend [RAM] equal to the number of active player squads. If you do, unattach all patches.'],
    flavour: '"From the unformed Fractal Sea to the endless Broken Heap, time will raze all to dust." -The Binary Insight',
  },
  {
    name: 'Ferocious Bite',
    type: 'Command',
    cost: 4,
    rules: ['The highest [H] character in target squad takes 5 [P]. You may choose between ties.'],
    flavour: '"Our simulations demonstrate again and again that hunger was the most powerful of motivators." -M:V Log#112AF',
  },
  {
    name: 'Maul',
    type: 'Command',
    cost: 3,
    rules: ['Deal 3 [P]. Then if the target has damage equal to or greater than its max [H], you may return this to the top of its origin stack.'],
    flavour: '"Oh my. How instinctual... how viciously primal! I love it!" -Snap Dragon Lily',
  },
  {
    name: 'Hunt the Weak',
    type: 'Command',
    cost: 1,
    rules: ['The lowest [H] character in target enemy squad takes 1 [P]. You may choose between ties. If that character has 4 or less [H], they take 2 [P] instead.'],
    flavour: '"All simulations show organic survival depends entirely on ruthless opportunism." -M:V Log#66B76',
  },
  {
    name: 'Irritant Scratch',
    type: 'Command',
    cost: 1,
    rules: ['Deal 1 [C].'],
    flavour: '"For ancient life, it appears that even the smallest scratches could fester into mortal threat." -M:V Log#90906',
  },
  {
    name: 'Scarification',
    type: 'Patch: Ally',
    cost: 2,
    rules: ['[RCT]: When this character takes damage, if their [H] is greater than 0, this character heals itself by 3 [H].'],
    flavour: '"Simulation #246 shows solidity increases with threat. Check this box... lovely." -Jean O.K.',
  },
  {
    name: 'Ravening Swarm',
    type: 'Patch: Any',
    cost: 3,
    rules: ["The first time this character takes [C] damage each turn, all active damaged characters in this character's squad take 1 [C], including this character."],
    flavour: '"The swarm is one of the only simulations that is universally feared. Shame it\'s so anti-social." -Jean O.K.',
  },
  {
    name: 'Tooth and Claw',
    type: 'Patch: Any',
    cost: 2,
    rules: ['If this character is damaged, this character cannot deactivate.'],
    flavour: '"Time and again, these are the most fundamental tools of survival on the Veldt." -M:V Log#4688B',
  },
  {
    name: 'Counter Chomp',
    type: 'Patch: Self',
    cost: 2,
    rules: ['[RCT]: When a damage-dealing command targeting a friendly character has resolved, deal 3 [P] to the character that activated that command.'],
    flavour: '"Unnatural stillness is a common prelude to the most savage acts." -M:V Log#4688B',
  },
  {
    name: 'Dive for the Bushes',
    type: 'Patch: Self',
    cost: 1,
    rules: ['[RCT]: When a command targets this character, choose a different friendly target for that command.'],
    flavour: '"In the Mimetic Veldt, self preservation and pack success are one and the same." -M:V Log#5GAF6',
  },
];

const infiniteDivine: CardText[] = [
  {
    name: 'Transference',
    type: 'Command',
    cost: 8,
    rules: ['Exchange the damage on two target characters. If this character has 2 or less [H], this gets cost -4.'],
    flavour: '"Reality bends to a pristine mind, and even destiny can be rewritten." -Shiho Zenji',
  },
  {
    name: 'Procession of Stars',
    type: 'Command',
    cost: 6,
    rules: ['Deal 1 [P] three times. You may choose a different target for each.'],
    flavour: '"Three glittering shards fell from the simulated heavens." -Prophecy of the Fall',
  },
  {
    name: 'Echoing Hymn',
    type: 'Command',
    cost: 2,
    rules: ['Heal X [H]. X is the number of patches attached to the target.'],
    flavour: '"The right chants will echo through code and time alike." -Pram, Temple Priestess',
  },
  {
    name: 'Inscrutable Koan',
    type: 'Command',
    cost: 1,
    rules: ['Deal 2 [P]. If the target has damage equal to or greater than its [H], crash this program. Otherwise, heal that character by 2 [H].'],
    flavour: '"What is the answer to this very question?" -The Binary Insight',
  },
  {
    name: 'Izanami Install',
    type: 'Command',
    cost: 1,
    rules: ['You may spend additional [RAM] equal to the cost of target crashed program. If you do, this character activates it.'],
    flavour: '"Crashing reveals what was necessary all along." -Pram, Temple Priestess',
  },
  {
    name: 'Yin and Yang',
    type: 'Command',
    cost: 1,
    rules: ['Deal 0 [P] or heal 0 [H], then you may spend 1 additional [RAM] to deal 0 [P] or heal 0 [H].'],
    flavour: 'Untold potential balanced within itself.',
  },
  {
    name: 'Seven Gates Release',
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
    type: 'Patch: Any',
    cost: 3,
    rules: ['When this character deals X [P], this character heals itself by X - 1 [H].'],
    flavour: '"The story of the crashed will live on in you." -Magus',
  },
  {
    name: 'Cascading Illumination',
    type: 'Patch: Any',
    cost: 1,
    rules: ['[RCT]: When this character is healed by X, heal X [H] to a different target.'],
    flavour: '"Adherents to the second insight will perceive the glowing threads that bind us all." -Mi-KO',
  },
  {
    name: 'Focus Soul',
    type: 'Patch: Self',
    cost: 2,
    rules: ['[RCT]: When a command is activated, that command gets +X [P] or +X [H]. X is the number of crashed characters up to a maximum of 4.'],
    flavour: '"The memory in the network is zero sum. The code of the fallen surrounds us." -Magus',
  },
];

const onryokiNoh: CardText[] = [
  {
    name: 'Hypnotic Hit',
    type: 'Command',
    cost: 7,
    rules: ['Deal 8 [P] to target character, then suspend that character.'],
    flavour: '"When you awaken, you won\'t remember I was here... you won\'t remember at all." -Iro',
  },
  {
    name: 'Folded Steel Strike',
    type: 'Command',
    cost: 4,
    rules: ['Deal 4 [P]. This cannot be modified to have less than 4 [P].'],
    flavour: 'Hardened code, forged in the Black Furnace and folded a thousand times over.',
  },
  {
    name: "Re'gine's Retribution",
    type: 'Command',
    cost: 4,
    rules: ['This character loses 2 [H], then deal 5 [P].'],
    flavour: 'This code seethes with the malice of a forgotten spirit.',
  },
  {
    name: 'Bamboo Splitter',
    type: 'Command',
    cost: 2,
    rules: ['Deal 1 [P]. If the target has 11 or more [H], deal 4 [P] instead.'],
    flavour: '"The thicker the opponent, the more a single swing will sever." -Toshiro',
  },
  {
    name: 'Hungering Kunai',
    type: 'Command',
    cost: 3,
    rules: ['Deal 2 [P]. If the target has 4 or less [H], deal 4 [P] instead.'],
    flavour: '"If an opening exists, these kunai will find it. They thirst for weakness." -Toshiro',
  },
  {
    name: 'Needle Senbon',
    type: 'Command',
    cost: 3,
    rules: ['Deal X + 2 [P]. X is the number of characters in this squad with stealth.'],
    flavour: '"Be wary, Sparrow. We are surrounded by the starless sky." -Record of the Third Flame Ascendancy',
  },
  {
    name: 'Sensu of Dusk',
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
    type: 'Patch: Self',
    cost: 3,
    rules: [
      'This character has stealth.',
      'When this character activates a command, give that command +2 [P]. When it resolves, crash this patch.',
    ],
    flavour: '"Every light will cast a shadow, and every shadow will cast a blade." -Record of the Third Flame Descension',
  },
];

const zodiacReliquary: CardText[] = [
  {
    name: 'Muramasa',
    type: 'Command',
    cost: 4,
    rules: ["You may lose 2 max [RAM]. If you do, deal 7 [P]. This program's cost cannot be modified."],
    flavour: '"It only gives as much as it takes. What do you have to offer?" -Kagemusha',
  },
  {
    name: 'Spirit Flask',
    type: 'Command',
    cost: 3,
    rules: ['Heal 2 [H], then place a relic token on any target patch.'],
    flavour: '"Surely it\'s not a ghost... but it does possess a terrible hunger." -Yua, Apprentice Archivist',
  },
  {
    name: 'Astral Tei-Bako',
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
    type: 'Patch: Ally',
    cost: 2,
    rules: ['Other patches attached to this character cannot be targeted.'],
    flavour: '"Even centuries later, it\'s still imposing the will of that ill-fated emperor." -Yama Uba',
  },
  {
    name: 'Tome of Ancient Scripts',
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
    type: 'Patch: Ally',
    cost: 2,
    rules: ['[EXE]: Deal 2 [P]. You may remove 1 relic token from target patch attached to a friendly character to give this +2 [P].'],
    flavour: '"Wrest these from the vault, Kazuo, and your rewards will know no end." -Crest, Oyabun',
  },
];

const dataNation: CardText[] = [
  {
    name: 'Holo Kingdom',
    type: 'Command',
    cost: 6,
    rules: ["This character may immediately activate the top program of up to two tagged characters' stacks at cost 0 if those progams are cost X or less. X is your max [RAM] to a maximum of 7."],
    flavour: '"I never imagined there could be such a beautiful, perfect simulation of future thought." -Sector Probe',
  },
  {
    name: 'Bit Trail',
    type: 'Command',
    cost: 3,
    rules: ['Deal 3 [A]. If the target is tagged, deal 4 [A] instead.'],
    flavour: '"With a dangling pointer to critical data, the damage one can do is absolutely delightful." -Sector Probe',
  },
  {
    name: 'Hypothetical Scenario',
    type: 'Command',
    cost: 1,
    rules: ['Deal 0 [A]. If the target is tagged, deal 2 [A] instead.'],
    flavour: '"Feed me the juiciest information, and then watch as the plausible becomes probable, and the probable becomes truth." -Archidex',
  },
  {
    name: 'Nexus Compiler',
    type: 'Command',
    cost: 1,
    rules: ['Gain 1 virtual [RAM] for every tagged character up to a maximum of 2.'],
    flavour: '"Oh come on... nobody will miss 3 or 4 of their cycles. We\'re practically doing them a favor... somehow." -/naix',
  },
  {
    name: 'Systems Analysis',
    type: 'Command',
    cost: 1,
    rules: ["You may spend additional [RAM] equal to the cost of a command on top of target character's stack. If you do, this gains the effects of that command until it resolves. Select new valid targets for the effect, ignoring any cost modification."],
    flavour: '"Break it down to its fundamentals, and the rest is clear." -Archidex',
  },
  {
    name: 'Data Tunnel',
    type: 'Patch: Any',
    cost: 3,
    rules: ['When this character targets a tagged character with a command, that command gets +2 [P] and +1 [A], then unattach all tags on all targeted characters.'],
    flavour: '"Creating complete euphoria, or its exact opposite, is all a matter of access." -Grandmaster Hash',
  },
  {
    name: 'Cryptographic Hex',
    type: 'Patch: Any',
    cost: 2,
    rules: ['This character cannot use [EXE] or [RCT] effects.'],
    flavour: '"... hold on. I think I heaPfu+zLoQEA+j9xo2qQb9YyZRdu2hzCKGNMOZIf9XETw=" -Akako, Brilliant Blade',
  },
  {
    name: 'TAG Theta',
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
    type: 'Patch: Self',
    cost: 3,
    rules: ['[EXE]: Copy the [EXE] effect of target patch.'],
    flavour: 'The most sophisticated tool for black box construction and deconstruction analysis.',
  },
];

const hostileRewrite: CardText[] = [
  {
    name: 'Internal Combustion',
    type: 'Command',
    cost: 6,
    rules: ['Deal 7 [A].'],
    flavour: '"Complete, total, indiscriminate destruction." -Crush Vermillion',
  },
  {
    name: 'Hostile Conscription',
    type: 'Command',
    cost: 5,
    rules: ['Unattach target patch, then attach it to a different character ignoring any attachment restrictions.'],
    flavour: '"How does it feel to know that a part of you is now a part of me?" -4L1ss',
  },
  {
    name: 'Binary Dissonance',
    type: 'Command',
    cost: 3,
    rules: ['Deal 2X [P]. X is the number of patches attached to the target.'],
    flavour: '"Every bit of excess code means less of you is you." -The Binary Insight',
  },
  {
    name: 'Tear The Core',
    type: 'Command',
    cost: 3,
    rules: ['Unattach target patch with cost 3 or less, then the character it was attached to takes X [P]. X is the cost of the target patch.'],
    flavour: '"Let\'s get right to the heart of the matter." -Crush Vermillion',
  },
  {
    name: 'Spyder Virus',
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
    type: 'Patch: Any',
    cost: 3,
    rules: ['Commands this character activates get cost -1 to a minimum of 1. When this patch is unattached, suspend this character.'],
    flavour: '"Cognitive link confirmed. Acceleration protocol... irreversible." -Null Constructor',
  },
  {
    name: 'Polar Flip',
    type: 'Patch: Any',
    cost: 2,
    rules: ['If this character has not taken damage this turn and would be healed by X [H], they take X [A] instead.'],
    flavour: '"Input to input. Output to output. Everything... aligned." -Miya Sparkle',
  },
  {
    name: 'Sabotage',
    type: 'Patch: Any',
    cost: 3,
    rules: ["When this character resolves a program, they lose X [H] and become suspended, then unattach this. X is that program's cost."],
    flavour: '"These ones are special. They only dismantle what you tell them to. Mostly." -Sector Probe',
  },
  {
    name: 'Underclock',
    type: 'Patch: Any',
    cost: 3,
    rules: ['Commands this character activates get cost +1.'],
    flavour: '"I just wanted to... to... to... to ... ..." -Joi',
  },
  {
    name: 'Kill Switch',
    type: 'Patch: Any',
    cost: 2,
    rules: ['When this character becomes suspended they take 3 [A], then unattach this.'],
    flavour: '"Wait... there\'s a new function in my code. Why is it called \'Press for fun\'? Why is access set to public?" -Jammy Complex',
  },
];

const endlessChain: CardText[] = [
  {
    name: 'Memory Scream',
    type: 'Command',
    cost: 3,
    rules: ["Deal X [A]. X is the cost of the top program on target character's stack to a maximum of 9."],
    flavour: '"The more memory you accumulate, the more it\'ll come back to bite you." -EgoHack#134',
  },
  {
    name: 'Rotation 13',
    type: 'Command',
    cost: 3,
    rules: ["You may reorder target character's stack. When this targets a friendly character, it gets cost -1. When this resolves, return it to any position in its origin stack."],
    flavour: 'N fvzcyr, ryrtnag genafsbezngvba, rfcrpvnyyl sbe gubfr jub ner jvyyvat.',
  },
  {
    name: 'Taze Mind',
    type: 'Command',
    cost: 3,
    rules: ['Cycle target character. If the cycled program has a cost of 2 or less, deal 3 [A] to that character.'],
    flavour: '"Lie back and relax. Empty your mind. This will be a quick adjustment." -4L1ss',
  },
  {
    name: 'Channel: RAW',
    type: 'Command',
    cost: 1,
    rules: ['You may spend X additional [RAM], then deal X [A].'],
    flavour: '"For total deconstruction, may I suggest quantity over quality?" -Cosma',
  },
  {
    name: 'Feedback Matrix',
    type: 'Patch: Any',
    cost: 4,
    rules: ['The first time each character is cycled each turn, they take 2 [A].'],
    flavour: '"Data must move in straight lines, and never end to end..." -The Binary Insight',
  },
  {
    name: 'Domination Protocol',
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
    type: 'Patch: Any',
    cost: 3,
    rules: ['Whenever this character would deactivate they take 4 [A] before deactivation.'],
    flavour: '"Generally I love crossing lines, but this one\'s a bit spiky!" -The Great Ezplosio',
  },
  {
    name: 'Mutex',
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
    type: 'Patch: Any',
    cost: 1,
    rules: ['This character treats programs as cost +2 when resetting. When this character resets, unattach this.'],
    flavour: '"There is no stronger shackle than an unwavering conviction to your current course." -EgoHack#57',
  },
];

const common: CardText[] = [
  {
    name: 'Decode',
    type: 'Command',
    cost: 4,
    rules: ['Unattach target patch or patches with a total cost 4 of or less. You may treat this as cost 2 when using it to reset.'],
    flavour: '"Nothing is impossible to undo, so long as you understand exactly how it was done." -Ral Kaid, Archivist',
  },
  {
    name: 'Daze Memory',
    type: 'Command',
    cost: 4,
    rules: ['Suspend target character.'],
    flavour: 'Code is constant, but consciousness is fickle.',
  },
  {
    name: 'End Process',
    type: 'Command',
    cost: 2,
    rules: ['Cycle target character.'],
    flavour: 'I was just... g0oing... to... [Processing Has Ended]',
  },
  {
    name: 'Jab',
    type: 'Command',
    cost: 2,
    rules: ['Deal 2 [P].'],
    flavour: 'A swift jab to the tender bits.',
  },
  {
    name: 'Backhand',
    type: 'Command',
    cost: 1,
    rules: ['Deal 1 [P].'],
    flavour: '"Far from my favorite thing to wake up to." -Shirei, Vagrant Dragon',
  },
  {
    name: 'Bit Shift',
    type: 'Command',
    cost: 1,
    rules: ['Deal 1 [A].'],
    flavour: '"Cognitive processing, huh? Sounds fun! Let\'s just... umm... move this 0 over here?" -/naix',
  },
  {
    name: 'Trim the Line',
    type: 'Command',
    cost: 1,
    rules: ['You may spend X additional [RAM] equal to the cost of target patch. If you do, unattach it.'],
    flavour: 'With Trim the Line, anyone can cut some excess code!',
  },
  {
    name: 'Wall Hacks',
    type: 'Patch: Ally',
    cost: 1,
    rules: ['[EXE]: Ready target character that was activated this turn.'],
    flavour: '"Engaging is so much more efficient when nothing is in the way." -Hanbei',
  },
  {
    name: 'Restore',
    type: 'Patch: Any',
    cost: 3,
    rules: ['[EXE]: This character may heal itself by 3 [H], then suspend this character.'],
    flavour: '"Good down time leads to good up time!" -Scrapper',
  },
  {
    name: 'Glitch Pact',
    type: 'Patch: Self',
    cost: 3,
    rules: ['During Initialize, gain 1 virtual [RAM] and this character loses 1 [H].'],
    flavour: 'Incalculable power lies at the edge of understanding.',
  },
];

/* TODO — CONFIRM BOX. Printed with set code LUX, recorded as CORE below. If
   that is wrong, `boxes[]` contents has to change with it. */

const luxVault: CardText[] = [
  {
    name: 'Fur L0W',
    type: 'Patch: Ally',
    cost: 2,
    rules: ["[RCT]: When this character's squad is targeted by a command, suspend this character and this character ignores all effects of that command."],
    flavour: '',
    unlock: 'Endian Key: Win a game with either 5 overload or 1 max [RAM].',
  },
  {
    name: 'Cat Tales',
    type: 'Command',
    cost: 1,
    rules: ['Target character loses 1 [H] if they have an attached patch of cost 3 or more.'],
    flavour: '',
    unlock: "Endian Key: Win a game with no programs left in any of your characters' stacks.",
  },
];

/* Gallery order follows `brands[]` in universe.ts. */
export const corePrograms: Program[] = [
  ...brandCards('scrap-brigade', 'CORE', scrapBrigade),
  ...brandCards('benobasas-fist', 'CORE', benobasasFist),
  ...brandCards('chaos-verve', 'CORE', chaosVerve),
  ...brandCards('bloom-and-never', 'CORE', bloomAndNever),
  ...brandCards('ark-totem', 'CORE', arkTotem),
  ...brandCards('feralesque', 'CORE', feralesque),
  ...brandCards('infinite-divine', 'CORE', infiniteDivine),
  ...brandCards('onryoki-noh', 'CORE', onryokiNoh),
  ...brandCards('zodiac-reliquary', 'CORE', zodiacReliquary),
  ...brandCards('data-nation', 'CORE', dataNation),
  ...brandCards('hostile-rewrite', 'CORE', hostileRewrite),
  ...brandCards('endless-chain', 'CORE', endlessChain),
  ...brandCards('common', 'CORE', common),
  ...brandCards('lux-vault', 'CORE', luxVault),
];
