// programSlugs holds the book's printed order: index 0 is the top slot, an empty slot stays null in place, and programs are referenced by slug because cardId is locale-specific.

import { characters, programBySlug, programsOfBrand } from './universe';

export const SLOT_KEYS = ['top', 'middle', 'bottom'] as const;

export type SlotKey = (typeof SLOT_KEYS)[number];

export const STACK_SIZE = SLOT_KEYS.length;

// No published stack may use a special-construction brand; the exception copy is owed before such a seed can ship.
export const SPECIAL_CONSTRUCTION_BRAND_IDS = ['forbidden-archives'];

export type DeckKind = 'starter' | 'list';

export interface DeckStack {
  characterId: string;

  programSlugs: string[];
}

export interface StarterDeck {
  id: string;
  name: string;
  /** `starter` is one of the four decks in the box; `list` is book-only. */
  kind: DeckKind;
  factionId: string;
  source: string;
  stacks: DeckStack[];
}

export interface StackSeed extends DeckStack {
  deckId: string;
  deckName: string;
  kind: DeckKind;
  source: string;
}

export const starterDecks: StarterDeck[] = [
  {
    id: 'blaze-of-shadow',
    name: 'Blaze of Shadow',
    kind: 'starter',
    factionId: 'celestial-shogunate',
    source: 'Learn to Play, p.30',
    stacks: [
      { characterId: 'satellite-137', programSlugs: ['amulet-of-kill-process', 'sensu-of-dusk', 'regines-retribution'] },
      { characterId: 'shiho-zenji', programSlugs: ['flesh-for-security', 'needle-senbon', 'inscrutable-koan'] },
      { characterId: 'shred', programSlugs: ['irritant-scratch', 'scarification', 'maul'] },
      { characterId: 'toshiro', programSlugs: ['shadow-strike', 'procession-of-stars', 'izanami-install'] },
      { characterId: 'kagemusha', programSlugs: ['restore', 'taze-mind', 'muramasa'] },
    ],
  },
  {
    id: 'blade-and-bastion',
    name: 'Blade & Bastion',
    kind: 'list',
    factionId: 'celestial-shogunate',
    source: 'Learn to Play, p.30',
    stacks: [
      { characterId: 'toshiro', programSlugs: ['oni-shift', 'bamboo-splitter', 'jab'] },
      { characterId: '101', programSlugs: ['glitch-pact', 'inscrutable-koan', 'izanami-install'] },
      { characterId: 'benobasa', programSlugs: ['shadow-strike', 'benobasas-block', 'stone-hands'] },
      { characterId: 'yama-uba', programSlugs: ['r4ven-totem', 'temple-bell-kotto', 'tome-of-ancient-scripts'] },
      { characterId: 'hanbei', programSlugs: ['wall-hacks', 'muramasa', 'rotation-13'] },
    ],
  },
  {
    id: 'rune-of-the-stars',
    name: 'Rune of the Stars',
    kind: 'list',
    factionId: 'celestial-shogunate',
    source: 'Learn to Play, p.30',
    stacks: [
      { characterId: 'magus', programSlugs: ['temple-bell-kotto', 'shining-moon-netsuke', 'amulet-of-kill-process'] },
      { characterId: 'iro', programSlugs: ['sparrows-imperial-seal', 'inscrutable-koan', 'nightshade-needles'] },
      { characterId: 'hanbei', programSlugs: ['backhand', 'tome-of-ancient-scripts', 'muramasa'] },
      { characterId: 'yama-uba', programSlugs: ['skeleton-key', 'astral-tei-bako', 'spirit-flask'] },
      { characterId: 'zakhi', programSlugs: ['channel-raw', 'izanami-install', 'rotation-13'] },
    ],
  },
  {
    id: 'metal-reign',
    name: 'Metal Reign',
    kind: 'starter',
    factionId: 'monarchy-of-boom',
    source: 'Learn to Play, p.31',
    stacks: [
      { characterId: 'zaximus-defender', programSlugs: ['pump-it-up', 'pass-the-plate-mate', 'defrag'] },
      { characterId: 'tonk0r', programSlugs: ['break-beats', 'rocket-crush', 'mechanize'] },
      { characterId: 'scrapper', programSlugs: ['bit-shift', 'scrap-and-weld', 'armor-up'] },
      { characterId: 'overtoad', programSlugs: ['ora-ora', 'decode', 'bass-drop-jutsu'] },
      { characterId: 'onibaba', programSlugs: ['forcefield-of-boom', 'folded-steel-strike', 'jab'] },
    ],
  },
  {
    id: 'block-party',
    name: 'Block Party',
    kind: 'list',
    factionId: 'monarchy-of-boom',
    source: 'Learn to Play, p.31',
    stacks: [
      { characterId: 'ezplosio', programSlugs: ['kill-switch', 'binary-dissonance', 'internal-combustion'] },
      { characterId: 'joi', programSlugs: ['baqs-battery-backpack', 'doorway-to-dreamland', 'overclock'] },
      { characterId: 'roxie-the-mallet', programSlugs: ['disco-hand-grenade', 'amplitude', '2nd-encore'] },
      { characterId: 'grandmaster-hash', programSlugs: ['psycho-graffiti', 'pyrotechnix', 'mirror-drive'] },
      { characterId: 'bliztron', programSlugs: ['hyperwave', 'combo-breaker', 'sonic-flare'] },
    ],
  },
  {
    id: 'no-no-hit-me',
    name: 'No, No, Hit ME!',
    kind: 'list',
    factionId: 'monarchy-of-boom',
    source: 'Learn to Play, p.31',
    stacks: [
      { characterId: 'benobasa', programSlugs: ['wall-hacks', 'monarchys-rumble', 'dragon-feet'] },
      { characterId: 'scrapper', programSlugs: ['amplitude', 'baqs-battery-backpack', 'backhand'] },
      { characterId: 'roxie-the-mallet', programSlugs: ['ora-ora', 'stone-hands', 'pyrotechnix'] },
      { characterId: 'tonk0r', programSlugs: ['pass-the-plate-mate', 'rocket-crush', 'combo-breaker'] },
      { characterId: 'zaximus-defender', programSlugs: ['pump-it-up', 'crisis-engine', 'jab'] },
    ],
  },
  {
    id: 'terras-anchor',
    name: 'Terra’s Anchor',
    kind: 'starter',
    factionId: 'hana-mori',
    source: 'Learn to Play, p.32',
    stacks: [
      { characterId: 'kodama', programSlugs: ['tea-of-discussion', 'vines-of-uruth', 'caustic-tincture'] },
      { characterId: 'moka', programSlugs: ['f0x-totem', 'dust-of-the-desert', 'timber-of-the-taiga'] },
      { characterId: 'dugu-squad', programSlugs: ['putrid-blossoms', 'catalyst', 'glitch-pact'] },
      { characterId: 'calamity', programSlugs: ['h4re-totem', 'r4ven-totem', 'ferocious-bite'] },
      { characterId: 'j-kuma', programSlugs: ['drifting-gardens', 'silt-of-the-swamp', 'sunlight-of-the-savanna'] },
    ],
  },
  {
    id: 'twisted-totems',
    name: 'Twisted Totems',
    kind: 'list',
    factionId: 'hana-mori',
    source: 'Learn to Play, p.32',
    stacks: [
      { characterId: 'yama-uba', programSlugs: ['nightshade-needles', 'f0x-totem', 'dust-of-the-desert'] },
      { characterId: 'mi-ko', programSlugs: ['inscrutable-koan', 'cascading-illumination', 'putrid-blossoms'] },
      { characterId: 'twisted-6', programSlugs: ['counter-chomp', 'dive-for-the-bushes', 'irritant-scratch'] },
      { characterId: 'moka', programSlugs: ['h4re-totem', 'r4ven-totem', 'timber-of-the-taiga'] },
      { characterId: 'j-kuma', programSlugs: ['sunlight-of-the-savanna', 'winds-of-purity', 'muramasa'] },
    ],
  },
  {
    id: 'frostflower-toxins',
    name: 'Frostflower Toxins',
    kind: 'list',
    factionId: 'hana-mori',
    source: 'Learn to Play, p.32',
    stacks: [
      { characterId: 'jean-ok', programSlugs: ['polar-flip', 'kill-switch', 'binary-dissonance'] },
      { characterId: 'kodama', programSlugs: ['glitch-pact', 'tea-of-discussion', 'vines-of-uruth'] },
      { characterId: 'overtoad', programSlugs: ['ora-ora', 'dust-of-the-desert', 'bass-drop-jutsu'] },
      { characterId: 'mi-ko', programSlugs: ['cascading-illumination', 'viral-venom', 'putrid-blossoms'] },
      { characterId: 'yvelette', programSlugs: ['hyperwave', 'disco-hand-grenade', 'amplitude'] },
    ],
  },
  {
    id: 'terminus-complex',
    name: 'Terminus Complex',
    kind: 'starter',
    factionId: 'subnet-86',
    source: 'Learn to Play, p.33',
    stacks: [
      { characterId: 'naix', programSlugs: ['systems-analysis', 'domination-protocol', 'cryptographic-hex'] },
      { characterId: 'joi', programSlugs: ['baqs-battery-backpack', 'kill-switch', 'doorway-to-dreamland'] },
      { characterId: '101', programSlugs: ['tag-omega', 'hypothetical-scenario', 'bit-trail'] },
      { characterId: 'archidex', programSlugs: ['tag-theta', 'holo-kingdom', 'nexus-compiler'] },
      { characterId: 'tori-daiyu', programSlugs: ['data-tunnel', 'backhand', 'channel-raw'] },
    ],
  },
  {
    id: 'lazer-tag',
    name: 'Lazer Tag',
    kind: 'list',
    factionId: 'subnet-86',
    source: 'Learn to Play, p.33',
    stacks: [
      { characterId: 'white-noise', programSlugs: ['feedback-matrix', 'combo-breaker', 'break-beats'] },
      { characterId: 'sector-probe', programSlugs: ['tag-omega', 'hypothetical-scenario', 'wall-hacks'] },
      { characterId: 'cosma', programSlugs: ['caustic-tincture', 'vines-of-uruth', 'taze-mind'] },
      { characterId: 'archidex', programSlugs: ['tag-theta', 'nexus-compiler', 'bit-trail'] },
      { characterId: 'null-constructor', programSlugs: ['data-tunnel', 'sabotage', 'binary-dissonance'] },
    ],
  },
  {
    id: 'catalytic-control',
    name: 'Catalytic Control',
    kind: 'list',
    factionId: 'hana-mori',
    source: 'Learn to Play, p.33',
    stacks: [
      { characterId: 'cosma', programSlugs: ['viral-venom', 'ego-shackle', 'domination-protocol'] },
      { characterId: 'overtoad', programSlugs: ['combo-breaker', 'dust-of-the-desert', 'silt-of-the-swamp'] },
      { characterId: 'shred', programSlugs: ['dive-for-the-bushes', 'irritant-scratch', 'bit-shift'] },
      { characterId: 'snap-dragon-lily', programSlugs: ['putrid-blossoms', 'ravening-swarm', 'catalyst'] },
      { characterId: 'rekka', programSlugs: ['tooth-and-claw', 'insta-mesh', 'ferocious-bite'] },
    ],
  },
];

export function seedsFor(characterId: string): StackSeed[] {
  const out: StackSeed[] = [];
  for (const deck of starterDecks) {
    for (const stack of deck.stacks) {
      if (stack.characterId !== characterId) continue;
      out.push({
        deckId: deck.id,
        deckName: deck.name,
        kind: deck.kind,
        source: deck.source,
        characterId: stack.characterId,
        programSlugs: stack.programSlugs,
      });
    }
  }
  return out;
}

function assertStarterStacks(): void {
  if (import.meta.env.PROD) return;
  for (const deck of starterDecks) {
    for (const stack of deck.stacks) {
      const where = `${deck.id}/${stack.characterId}`;
      const character = characters.find((c) => c.id === stack.characterId);
      if (!character) {
        console.warn(`[starterStacks] ${where}: no such character.`);
        continue;
      }
      const brandIds = [
        ...character.brandIds,
        ...(character.personalBrandId ? [character.personalBrandId] : []),
        'common',
      ];
      if (brandIds.some((id) => SPECIAL_CONSTRUCTION_BRAND_IDS.includes(id))) {
        console.warn(
          `[starterStacks] ${where} plays a special-construction brand; the exception copy is owed before this seed can ship.`,
        );
      }
      const pool = new Set(brandIds.flatMap((id) => programsOfBrand(id).map((p) => p.slug)));
      for (const slug of stack.programSlugs) {
        if (!programBySlug(slug)) console.warn(`[starterStacks] ${where}: no program "${slug}".`);
        else if (!pool.has(slug)) console.warn(`[starterStacks] ${where}: "${slug}" is outside their brand access.`);
      }
    }
  }
}
assertStarterStacks();
