/* ============================================================================
   Universe data types.

   This file and universe.ts hold IDS, RELATIONS, COLOURS and FACTS — things a
   translator must never touch. Every user-visible sentence lives in
   content/<locale>/ instead. The `name` / `epithet` / `tagline` fields here are
   FALLBACKS: a doc of the same slug always wins.
   ========================================================================== */

/* ---------------------------------------------------------------------------
   ART COMES IN LAYERS, AND THEY ARE NOT INTERCHANGEABLE.

   All three are the same painting at different depths of the printed card:

     · ILLUSTRATION (`art`) — the subject as they appear on the card, with the
       background cut away. Croppable, focal-pointable, safe behind text.
       TODO add in cool parallax with this when we eventually have the art, parked till we get art.
     · SCENE (`sceneArt`) — characters only: subject and background as printed,
       without the rules text.
     · CARD (`cardArt`) — the card as it is in play, rules text and all. Never
       cropped, never a backdrop: a crop removes printed rules.

   Separate fields so a surface cannot reach for the wrong one. A surface
   showing the ILLUSTRATION must not carry the card's wording: art plus text is
   a reconstruction of a card, not a card. Show the card, or show the art.
   -------------------------------------------------------------------------- */

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
  environment: Art | null;
}

export interface Brand {
  id: string;
  factionId: string | null;
  name: string;
  /**
   * The brand mark: `/brands/<id>.png`, built by scripts/brand-icons.py from
   * the masters in private/brand-icons/. null while a brand has no mark.
   *
   * The mark is a SHAPE, not a colour swatch: each carries a unique glyph
   * inside a faction-coloured ring, which is why it may stand in for the
   * faction dot. Several are deliberately not circular — never clip to one.
   */
  icon: string | null;
  /**
   * `personal` and `universal` are both faction-less. Anything asking "does this
   * brand belong to a faction?" tests `factionId`, never `kind` — the
   * any-faction filter has to return both.
   */
  kind: 'faction' | 'personal' | 'universal';
  /** How a personal brand's programs are earned. if they are earned. */
  unlock?: 'challenges';
  /** The announced print run. Card counts are DERIVED from the programs that
      exist; this only states the gap in words ("6 of 10 revealed"). */
  announcedCount?: number;
  facetSubType?: string;
}

export interface Program {
  id: string;
  brandId: string;
  name: string;
  cost: string;
  /** Printed type line: "Command", "Patch: Self", "Patch: Ally", "Patch: Any". */
  type: string;
  /**
   * The printed qualifier after the type line — "Totem", "Tag". Its own field
   * rather than part of `type`: rules text counts sub-types ("X is equal to all
   * your active Totems"), so it has to be readable on its own.
   */
  subType?: string;
  /**
   * Printed rules lines in printed order, one entry per printed line. Joining
   * them invents punctuation the card does not have, and errata quote this.
   */
  rules: string[];
  /** May be empty: a card that prints an `unlock` line instead has no flavour. */
  flavour: string;
  /**
   * The printed Endian Key line. Never styled as flavour: flavour is decoration,
   * this is an instruction the reader can act on. It is not tracked state — see
   * `Brand.unlock` — and it does not mark a card as a spoiler.
   */
  unlock?: string;
  /** Unrevealed programs render as a sealed slot, not as an empty card. */
  revealed: boolean;
  /** ILLUSTRATION — the program's art alone, no card frame around it. */
  art: Art;
  /** CARD — the whole printed card. What the gallery shows. */
  cardArt: Art;
  /** Which release printed this card. Same codes as `Character.set`. */
  set: SetCode;
}

/** "any" is the wildcard: LuX is any-faction. */
export type FactionMembership = string[] | 'any';

/** Printed set code. Widen as releases are announced. */
export type SetCode = 'CORE' | 'EX1' | 'INC';

/* One printed edition: art always, identity only where it differs. Mechanics
   stay on the character — errata against an ability hits every printing. */
export interface Printing {
  id: string;
  label: string;
  name?: string;
  abilityName?: string;
  flavour?: string;
  art: Art;
  sceneArt: Art;
  cardArt: Art;
  source?: string;
  licensor?: string;
}

export interface Character {
  id: string;
  /* What "12 of 57" counts. In tens so an insert does not renumber the rest;
     never from the name, which translates and would renumber per locale.
     Display order, not print order — they disagree at Jean O.K. and Tori-Daiyu. */
  order: number;
  name: string;
  epithet: string;
  /**
   * Multi-faction membership is canon. The first entry owns the page's colour;
   * the rest are equally real memberships and render as further emblems.
   */
  factionIds: FactionMembership;
  /** Faction brands they play, in printed order. No limit on how many. */
  brandIds: string[];
  /** Which release printed them. Required: array position does not carry it. */
  set: SetCode;
  personalBrandId?: string | null;
  /** ILLUSTRATION — the character alone, no background. Tiles, story pins. */
  art: Art;
  /** SCENE — subject and background as printed, without the rules text. */
  sceneArt: Art;
  /** CARD — the printed character card. Never cropped: a crop removes rules. */
  cardArt: Art;
  /** Stories this character appears in - drives the story graph's pins. */
  storyIds?: string[];
  /* Alt Arts BEYOND the standard one */
  printings?: Printing[];

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

/* Barrier ascending. Drives both the order of the try band and its grouping. */
export type TryTier = 'free' | 'effort' | 'owned';

interface TryRouteFacts {
  id: string;
  tier: TryTier;
  requiresKeys: string[];
  costNote: 'paid-third-party' | null;
  minutes: number | null;
  caveatKey: string | null;
  /** The Learn band that already offers this, so Learn can leave it out. */
  alsoOnLearn?: 'videos' | 'rules';
}

export type TryRoute = TryRouteFacts &
  ({ outbound: OutboundKey; route?: never } | { route: { name: string; hash?: string }; outbound?: never });

/** An Incursion boss. */
export interface RogueAI {
  id: string;
  name: string;
  art: Art;
  brand: string | null;
}

/* ---------------------------------------------------------------------------
   THREE LEVELS, AND THEY ARE NOT INTERCHANGEABLE.

     · A BOX is a physical thing with components in it, and the unit story
       ships inside.
     · A PRODUCT (SKU) is a way to pay, bundling one or more boxes. A box sold
       on its own later just gains a product containing only it - which is why
       `Box` has no price and no "sold separately" flag.
     · A CHAPTER is story. It rides in boxes, never in SKUs: bundling six boxes
       into an edition creates no chapter, and story also ships with no box.

   The invariants, in order of how easy they are to break:

     1. A box's component list is the STORE's and is not mirrored here.
        `Product.extras` is for things arriving OUTSIDE any box, not a way to
        reintroduce one.
     2. `Chapter.boxIds` points at boxes, never at products.
     3. `Product.boxCount` is the claim, `Product.boxIds` the enumeration, and
        `assertProductShape()` checks they agree. "six boxes" listing five is
        the error nobody notices.
   -------------------------------------------------------------------------- */

/**
 * A physical box. No price — a box is not a SKU — and no component list: the
 * store states what is in a box, and a second copy drifts from it. `summary`
 * is a one-line gloss for fact strips, not a short contents list, and it is
 * the only component claim the site makes.
 */
export interface Box {
  id: string;
  name: string;
  /** One line for fact strips. */
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
  twitter: string | null;
  boardgamegeek: string | null;
}

export type OutboundKey = keyof OutboundUrls;

/**
 * Where a form POSTs. `url` must accept JSON and answer with CORS headers:
 * an endpoint the browser cannot read the status of leaves the form unable to
 * tell "sent" from "failed", and it will report sent. Any endpoint requiring
 * `mode: 'no-cors'` fails this and does not belong here.
 */
export interface FormEndpoint {
  /** Absolute https URL. */
  url: string;
  /**
   * Merged into every payload, for provider credentials that are public by
   * design. Never a secret: this ships in the bundle.
   */
  fields?: Record<string, string>;
}
