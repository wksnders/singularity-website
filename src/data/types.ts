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
  /**
   * The brand mark: `/brands/<id>.png`, built by scripts/brand-icons.py from
   * the masters in assets/brand-icons/. null while a brand does not exist
   *
   * The mark is a SHAPE, not a colour swatch: each carries a unique glyph
   * inside a faction-coloured ring, which is why it may stand in for the
   * faction dot. Several are deliberately not circular — never clip to one.
   */
  icon: string | null;
  /**
   * A faction brand is shared across its characters; a personal brand belongs
   * to one. Says nothing about the brand's faction — read `factionId` for that,
   * which a personal brand may also have.
   */
  kind: 'faction' | 'personal';
  /**
   * How THIS brand's programs are gated, if they are. Absent is the normal
   * case, not an unfilled blank — most brands gate nothing.
   */
  unlock?: 'challenges';
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

/** "any" is the wildcard: the character can be played in any faction. */
export type FactionMembership = string[] | 'any';

export interface Character {
  id: string;
  name: string;
  epithet: string;
  /**
   * Multi-faction membership is canon. The first entry is the character's main
   * faction and owns their colour everywhere; later entries are secondary and
   * render as additional emblems even though the character is still a part of 
   * those factions. Character factions are stored rather than infered from the
   * brand to keep it consistent with other places we store character data.
   * Note that some characters like Lux can go in 'Any' Faction 
   */
  factionIds: FactionMembership;
  /**
   * Faction brands the character plays, in printed order. The FIRST is
   * primary faction. Most characters have two; a few have three; or only 1.
   * but there isnt a set limit to number of brands.
   */
  brandIds: string[];
  personalBrandId?: string | null;
  art: Art;
  /** Stories this character appears in — drives the story graph's pins. */
  storyIds?: string[];

  /* --- Printed card face. Text, never pixels — same rule as Program. ------ */

  /** Starting health, as printed. */
  hp: number;
  /** The named ability, e.g. "Casual Tactics". */
  abilityName: string;
  /** Exact printed ability text, brackets and all: [AMB], [P], [H], [RAM]. */
  abilityText: string;
  /** The italic line under the rules box. Not lore prose — one printed line. */
  flavour: string;
}

/** An Incursion boss. */
export interface RogueAI {
  id: string;
  name: string;
  art: Art;
}

/* ---------------------------------------------------------------------------
   THREE LEVELS, AND THEY ARE NOT INTERCHANGEABLE. Never merge any two of them
   into one type — each collapse propagates into every view that reads it.

     · A BOX is a physical thing with components in it. It is the unit the
       contents list describes, and the unit the story ships inside.
     · A PRODUCT (SKU) is a way to pay. It bundles one or more boxes. Core
       Edition is one box; Gameplay Complete Edition is six. A box that is sold
       on its own later simply gains a product of its own containing only it —
       which is why `Box` has no `price` and no "sold separately" flag. The
       existence of a product pointing at one box IS that fact, and keeping it
       in one place stops the two from disagreeing.
     · A CHAPTER is story. It rides in boxes, not in SKUs: bundling six boxes
       into an edition does not create a chapter, and story also ships with no
       box at all.

   The invariants, in order of how easy they are to break:

     1. Contents live on `Box`, never on `Product`. A SKU-only extra (a pledge
        exclusive, a promo) goes in `Product.extras`, which is for things that
        arrive OUTSIDE any box — not a convenient second contents list.
     2. `Chapter.boxIds` points at boxes, never at products.
     3. `Product.boxCount` is the claim; `Product.boxIds` is the enumeration.
        When both are present they must agree — `assertProductShape()` in
        universe.ts checks this in dev, because "six boxes" listing five is the
        exact error nobody notices.
   -------------------------------------------------------------------------- */

/** A physical box. Has contents. Has no price — a box is not a SKU. */
export interface Box {
  id: string;
  name: string;
  /** Component list, in box order. One line item per entry. */
  contents: string[];
  /** One line for fact strips. The full list is `contents`. */
  summary: string | null;
  relatedBrandIds: string[];
}

/** Something you can buy. Bundles boxes; never holds components itself. */
export interface Product {
  id: string;
  name: string;
  /** edition = a way to buy the game. expansion = content added to a line. */
  kind: 'edition' | 'expansion' | 'accessory';
  /**
   * `sold-out` is a real, renderable state, not an absence: people search for
   * a discontinued edition and deserve an answer. It never implies a reprint —
   * say what is true in `note` and promise nothing.
   */
  status: 'available' | 'sold-out' | 'announced' | 'upcoming';
  /** Display string including currency; the store is the source of truth. */
  price: string | null;
  /**
   * How many boxes ship in this SKU. Known before the boxes themselves are, so
   * it is its own field rather than `boxIds.length` — "six boxes" is sayable
   * and true while the six are still unnamed.
   */
  boxCount: number | null;
  /** The boxes, once they are known. May be shorter than `boxCount`. */
  boxIds: string[];
  /** Things that arrive outside any box. NOT a second contents list. */
  extras: string[];
  /** Qualifier rendered under the contents. Reprint status, caveats. */
  note: string | null;
  /** null falls back to `urls.buy`, so a single storefront is one edit. */
  buyUrl: string | null;
}

/** A beat of the story. May ride in boxes, may ship alone. */
export interface Chapter {
  id: string;
  /** Drives the `#ch-01` anchors, which are public URL contracts. */
  number: number;
  title: string;
  status: 'published' | 'upcoming' | 'announced';
  /**
   * Boxes whose release carries this chapter — BOXES, not products. EMPTY IS
   * VALID: a story release with no box is the case this split exists to allow.
   */
  boxIds: string[];
}

export interface Story {
  id: string;
  chapterId: string;
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
  /** The rules reference PDF. Separate from `rulebook`: the rulebook teaches the
      game (it is the learn-to-play guide), the reference is the lookup document
      the HTML rules page will eventually replace. */
  rulesReference: string | null;
  discord: string | null;
  youtube: string | null;
  instagram: string | null;
  boardgamegeek: string | null;
}

export type OutboundKey = keyof OutboundUrls;
