/* ============================================================================
   Universe data types.

   The split that matters:
   - THIS file (and universe.ts) hold IDS, RELATIONS, COLOURS and FACTS —
     things a translator must never touch.
   - Every user-visible sentence lives in a markdown file under content/<locale>/
     and is merged in at read time (see src/composables/useUniverse.ts).
   The `name` / `epithet` / `tagline` fields below are FALLBACKS so the site
   renders before any markdown exists; a doc of the same slug always wins.
   ========================================================================== */

/** Every image on the site is an art object, never a bare path. */
export interface Art {
  src: string | null;
  /** "" only for decorative art. Missing alt on meaningful art is a bug. */
  alt: string;
  /** 0–1 focal point so a crop never cuts a face. */
  focal?: { x: number; y: number };
  artist?: string | null;
}

export interface Faction {
  id: string;
  /** Identifier tone: dots, 2–3px edges, ≤10% washes. Never body text. */
  color: string;
  /** Lightened tone, mandatory wherever the colour touches type on dark. */
  colorText: string;
  name: string;
  tagline: string;
  brandIds: string[];
}

export interface Brand {
  id: string;
  factionId: string | null;
  name: string;
  /** Personal brands (LuX, Incursion unlocks) sit outside the faction maths. */
  kind: 'faction' | 'personal';
  /** How a personal brand's programs are earned. */
  unlock?: 'challenges' | 'beat-incursion';
  programCount: number;
}

export interface Program {
  id: string;
  brandId: string;
  name: string;
  cost: string;
  type: string;
  rules: string;
  flavour: string;
  /** Unrevealed programs render as a sealed slot, not as an empty card. */
  revealed: boolean;
  art: Art;
}

/** "any" is the wildcard: LuX and every Incursion unlock are any-faction. */
export type FactionMembership = string[] | 'any';

export interface Character {
  id: string;
  name: string;
  epithet: string;
  factionIds: FactionMembership;
  brandId: string | null;
  personalBrandId?: string | null;
  /** Earned by beating an Incursion — editorial content, never tracked state. */
  unlockedVia?: 'incursions';
  /** The boss whose abilities this character channels in competitive play. */
  fromRogueAIId?: string | null;
  art: Art;
  /** Stories this character appears in — drives the story graph's pins. */
  storyIds?: string[];
}

export interface RogueAI {
  id: string;
  name: string;
  /** The character this boss unlocks. */
  unlockCharacterId: string | null;
  art: Art;
}

/** A set is both a product and a story chapter. */
export interface GameSet {
  id: string;
  name: string;
  kind: 'core' | 'expansion';
  status: 'available' | 'upcoming' | 'announced';
  chapter: number;
  chapterTitle: string;
  contents: string[];
  carriesIncursions?: boolean;
  buyUrl: string | null;
  relatedBrandIds: string[];
}

export interface Story {
  id: string;
  setId: string;
  title: string;
  /** Pins on the story graph are derived from this — zero editorial cost. */
  castIds: string[];
}

export interface PlayMode {
  id: string;
  name: string;
  players?: string;
}

export interface Video {
  id: string;
  title: string;
  youTubeId: string | null;
  /** Printed rulebook QR codes point at this stable slug, never a video id. */
  qrSlug: string;
  captioned: boolean;
  presenter: string | null;
  durationSec: number | null;
}

export interface NewsCategory {
  id: string;
  name: string;
}

export interface WallpaperKind {
  id: string;
  name: string;
  size: string;
}

/** Every outbound URL on the site. `null` = not live yet → routes to /soon. */
export interface OutboundUrls {
  buy: string | null;
  printAndPlay: string | null;
  tabletopSimulator: string | null;
  rulebook: string | null;
  discord: string | null;
  youtube: string | null;
  instagram: string | null;
  boardgamegeek: string | null;
}

export type OutboundKey = keyof OutboundUrls;
