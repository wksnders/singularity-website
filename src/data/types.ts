/* Ids, relations, colours and facts only — every user-visible sentence lives in content/<locale>/, where a doc of the same slug overrides the name/epithet/tagline fallbacks here. */

// Reference spec: docs/architecture/modules.md#types
// CARD art (`cardArt`) is the printed card, rules text and all: never crop it and never use it as a backdrop, because a crop removes printed rules.
// TODO add in cool parallax with this when we eventually have the art, parked till we get art.

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
  /** Brand mark at `/brands/<id>.png`, built by scripts/brand-icons.py; several marks are deliberately not circular, so never clip one to a circle. */
  icon: string | null;
  /** `personal` and `universal` are both faction-less: test `factionId`, never `kind`, or the any-faction filter drops them. */
  kind: 'faction' | 'personal' | 'universal';

  unlock?: 'challenges';
  /** The announced print run only; real card counts are derived from the programs that exist. */
  announcedCount?: number;
  facetSubType?: string;
}

export interface Program {
  /** URL identity derived from the ENGLISH name, never a translation: a filter param must name the same card in every locale. */
  slug: string;
  /** The id printed on the card, locale-specific: errata cite it and every asset URL is named for it. */
  cardId: string;
  brandId: string;
  name: string;
  cost: string;
  /** Printed type line: "Command", "Patch: Self", "Patch: Ally", "Patch: Any". */
  type: string;
  /** Printed qualifier after the type line ("Totem", "Tag"); its own field because rules text counts sub-types. */
  subType?: string;
  /** Printed rules lines in printed order, one entry per printed line: joining them invents punctuation the card does not have. */
  rules: string[];
  /** May be empty: a card that prints an `unlock` line instead has no flavour. */
  flavour: string;
  /** The printed Endian Key line: never styled as flavour, not tracked state, and not a spoiler marker. */
  unlock?: string;
  /** Unrevealed programs render as a sealed slot, not as an empty card. */
  revealed: boolean;
  /** ILLUSTRATION — the program's art alone, no card frame around it. */
  art: Art;
  /** CARD — the whole printed card. What the gallery shows. */
  cardArt: Art;

  set: SetCode;
}

/** "any" is the wildcard: LuX is any-faction. */
export type FactionMembership = string[] | 'any';

export type SetCode = 'CORE' | 'EX1' | 'INC';

/* One printed edition: art always, identity only where it differs — mechanics stay on the character, so errata against an ability hit every printing. */
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
  /** The id printed on the card. Every asset URL is named for it. */
  cardId: string;
  /* Display order, not print order, numbered in tens so an insert never renumbers the rest; never derived from the name, which translates. */
  order: number;
  name: string;
  epithet: string;
  /** Multi-faction membership is canon: the first entry owns the page's colour, the rest render as further emblems. */
  factionIds: FactionMembership;
  /** Faction brands they play, in printed order. No limit on how many. */
  brandIds: string[];

  set: SetCode;
  personalBrandId?: string | null;
  /** ILLUSTRATION — the character alone, no background. Tiles, story pins. */
  art: Art;
  /** SCENE — subject and background as printed, without the rules text. */
  sceneArt: Art;
  /** CARD — the printed character card. Never cropped: a crop removes rules. */
  cardArt: Art;

  storyIds?: string[];

  printings?: Printing[];

  hp: number;

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

export interface RogueAI {
  id: string;
  name: string;
  art: Art;
  brand: string | null;
}

// Reference spec: docs/architecture/modules.md#types
// `Product.boxCount` is the claim and `Product.boxIds` the enumeration; `assertProductShape()` in universe.ts requires they agree.

/** A physical box, never a SKU: no price and no component list — `summary` is a one-line gloss and the only component claim the site makes. */
export interface Box {
  id: string;
  name: string;

  summary: string | null;
  relatedBrandIds: string[];
}

/** Something you can buy. Bundles boxes; never holds components itself. */
export interface Product {
  id: string;
  name: string;
  /** edition = a way to buy the game. expansion = content added to a line. */
  kind: 'edition' | 'expansion' | 'accessory';
  /** `sold-out` is a real renderable state, not an absence, and never implies a reprint — say only what is true in `note`. */
  status: 'available' | 'sold-out' | 'announced' | 'upcoming';
  /** Display string including currency; the store is the source of truth. */
  price: string | null;
  /** Announced box count, its own field rather than `boxIds.length`: "six boxes" is sayable while the six are still unnamed. */
  boxCount: number | null;
  /** The boxes, once they are known. May be shorter than `boxCount`. */
  boxIds: string[];
  /** Things that arrive outside any box. NOT a second contents list. */
  extras: string[];

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
  /** Boxes, never products; empty is valid — a story release with no box is the case this split exists to allow. */
  boxIds: string[];
}

export interface Story {
  id: string;
  chapterId: string;
  title: string;

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

export interface PressGroup {
  id: string;
  state: 'ready' | 'empty' | 'pending';
  files: number;
  size: string | null;
  formats: string | null;
  zipBytes: number | null;
  cover: Art | null;
  fit: 'cover' | 'contain';
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
  /** The rules reference PDF, separate from `rulebook`: the rulebook teaches the game, the reference is the lookup document. */
  rulesReference: string | null;
  discord: string | null;
  youtube: string | null;
  instagram: string | null;
  twitter: string | null;
  boardgamegeek: string | null;
}

export type OutboundKey = keyof OutboundUrls;

/** Where a form POSTs: `url` must accept JSON and answer with CORS headers — an endpoint needing `mode: 'no-cors'` leaves the form reporting "sent" when it failed. */
export interface FormEndpoint {
  /** Absolute https URL. */
  url: string;
  /** Merged into every payload, for provider credentials that are public by design — never a secret, this ships in the bundle. */
  fields?: Record<string, string>;
}
