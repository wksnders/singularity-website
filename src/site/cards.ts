/* One row shape over every printed card. `cost: null` and `printedType: null` mean the card PRINTS no such line — a printed 0 is `0`, and the facets must tell them apart. Search reads only what a reader would read off the card face; everything it leaves out — set, epithet, unlock, flavour, ability names — has a facet instead. */

import { t } from '@/content';
import {
  brandById,
  brands,
  characters,
  factionById,
  factions,
  printingsOf,
  programs,
} from '@/data/universe';
import { otherCards } from '@/data/programs';
import { brandAbbr } from '@/site/brands';
import { expandIcons, matchesQuery, nameHaystack, searchHaystack } from '@/site/cardText';
import type { CardLine } from '@/site/cardText';
import type { Art, Character, Printing, Program, SetCode } from '@/data/types';
import type { OtherCard } from '@/data/programs';

/** The `?type=` facet, and the row discriminant. */
type CardKind = 'characters' | 'programs' | 'architech' | 'environments';

interface RowBase {
  /** URL identity. Unique across every kind — `assertCardSlugs()` is the guard. */
  slug: string;
  name: string;
  /** SCENE — the illustration with its printed background, uncropped. Not `art`, which is the subject cut out. */
  sceneArt: Art;
  /** CARD — the whole printed card, always 63/88. */
  cardArt: Art;
  set: SetCode;
  /** Resolved faction ids. Empty means the card belongs to no faction. */
  factionIds: string[];
  /** Playable in EVERY faction, which is not belonging to none: these pass every faction filter as well as `universal`. */
  anyFaction: boolean;
  /** Programs print one; characters play several; nothing else has any. */
  brandIds: string[];
  /** The printed type line. Null where the card prints no cost/type pair. */
  printedType: string | null;
  cost: number | null;
  rules: string[];
  flavour: string;
}

export type CardRow =
  | (RowBase & { kind: 'characters'; character: Character })
  | (RowBase & { kind: 'programs'; program: Program })
  | (RowBase & { kind: 'architech' | 'environments'; other: OtherCard });

function characterRow(c: Character): CardRow {
  const any = c.factionIds === 'any';
  return {
    kind: 'characters',
    character: c,
    slug: c.id,
    name: c.name,
    sceneArt: c.sceneArt,
    cardArt: c.cardArt,
    set: c.set,
    factionIds: any ? [] : [...c.factionIds],
    anyFaction: any,
    brandIds: [...c.brandIds, ...(c.personalBrandId ? [c.personalBrandId] : [])],
    printedType: null,
    cost: null,
    rules: c.abilityText.split('\n').map((line) => line.trim()),
    flavour: c.flavour,
  };
}

function programRow(p: Program): CardRow {
  const factionId = brandById(p.brandId)?.factionId ?? null;
  return {
    kind: 'programs',
    program: p,
    slug: p.slug,
    name: p.name,
    sceneArt: p.sceneArt,
    cardArt: p.cardArt,
    set: p.set,
    factionIds: factionId ? [factionId] : [],
    anyFaction: false,
    brandIds: [p.brandId],
    printedType: p.type,
    /* `cost` is a printed string on a Program and a number here, so "10" does not sort beside "2". */
    cost: p.cost === '' ? null : Number(p.cost),
    rules: p.rules,
    flavour: p.flavour,
  };
}

function otherRow(o: OtherCard): CardRow {
  return {
    kind: o.kind === 'architech' ? 'architech' : 'environments',
    other: o,
    slug: o.slug,
    name: o.name,
    sceneArt: o.sceneArt,
    cardArt: o.cardArt,
    set: o.set,
    factionIds: [],
    anyFaction: false,
    brandIds: [],
    /* Both kinds, not just Architechs: a type the facet cannot reach is a card the reader can see but not filter to. */
    printedType: o.type,
    cost: o.cost,
    rules: o.rules,
    flavour: o.flavour,
  };
}

/** PRINTED ORDER: the cast, then programs by brand, then the designs, the board, the zone. */
export const cardRows: CardRow[] = [
  ...characters.map(characterRow),
  ...programs.map(programRow),
  ...otherCards.map(otherRow),
];

export const cardBySlug = (slug: string): CardRow | null =>
  cardRows.find((row) => row.slug === slug) ?? null;

/** Two kinds minting the same slug would make one of them unreachable, and nothing in the type system stops it. */
function assertCardSlugs(): void {
  if (import.meta.env.PROD) return;
  const seen = new Set<string>();
  for (const row of cardRows) {
    if (seen.has(row.slug)) console.warn(`[cards] duplicate card slug "${row.slug}"`);
    seen.add(row.slug);
  }
}
assertCardSlugs();

export const FACET_KEYS = ['type', 'faction', 'box', 'brand', 'printed', 'cost'] as const;
export type FacetKey = (typeof FACET_KEYS)[number];
export type FacetState = Record<FacetKey, string>;

/** Facets behind the MORE FILTERS disclosure. */
export const EXTRA_FACETS: FacetKey[] = ['brand', 'printed', 'cost'];

export const ALL = 'all';
export const defaultFacets = (): FacetState => ({
  type: ALL,
  faction: ALL,
  box: ALL,
  brand: ALL,
  printed: ALL,
  cost: ALL,
});

export const isDefault = (facets: FacetState): boolean =>
  FACET_KEYS.every((key) => facets[key] === ALL);

function matchesFacet(row: CardRow, key: FacetKey, value: string): boolean {
  if (value === ALL) return true;
  switch (key) {
    case 'type':
      return row.kind === value;
    case 'faction':
      /* `universal` means "belongs to no faction". An any-faction card belongs to none AND plays in all, so it answers to every value here. */
      return row.anyFaction || (value === 'universal' ? !row.factionIds.length : row.factionIds.includes(value));
    case 'box':
      return row.set === value;
    case 'brand':
      /* A COMMA-SEPARATED LIST IS LEGAL HERE, and only here: a character's pool spans several brands, so `?brand=` carries more than one. `facetGroups` splits the same way. */
      return value.split(',').some((id) => row.brandIds.includes(id));
    case 'printed':
      return row.printedType === value;
    case 'cost':
      return row.cost !== null && String(row.cost) === value;
  }
}

/* Memoised on the row, which is safe only because `cardRows` is a module-level constant: mutable rows would stale this cache silently. */
const haystacks = new WeakMap<CardRow, string>();

function haystackOf(row: CardRow): string {
  const cached = haystacks.get(row);
  if (cached !== undefined) return cached;
  const built = buildHaystack(row);
  haystacks.set(row, built);
  return built;
}

/** What is printed on the face, both spellings of every icon. A stat goes in as its BARE NUMBER, the way it is printed: "5", not "cost 5". */
function buildHaystack(row: CardRow): string {
  const shared = [
    row.name,
    row.printedType,
    row.cost === null ? null : String(row.cost),
    row.rules.join(' '),
  ];
  if (row.kind === 'characters') return searchHaystack([...shared, String(row.character.hp)]);
  if (row.kind === 'programs') return searchHaystack([...shared, row.program.subType]);
  return searchHaystack([...shared, row.other.type, row.other.subType, row.other.ability]);
}

/** Everything a reader half-types: names, not prose. */
function buildNames(row: CardRow): string {
  const parts = [row.name, row.printedType];
  if (row.kind === 'programs') parts.push(row.program.subType);
  if (row.kind === 'architech' || row.kind === 'environments') parts.push(row.other.subType);
  return nameHaystack(parts);
}

const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The full spellings a brand answers to, all lower case: its name, that name with `&` written out, and either with separators stripped. A part of a name is never one of them, because browsing a brand is what the facet is for. */
function brandSpellings(id: string): string[] {
  const name = brandById(id)?.name.toLowerCase();
  if (!name) return [];
  const written = name.replace(/&/g, 'and');
  const squash = (value: string) => value.replace(/[^a-z0-9]+/g, '');
  return [...new Set([name, written, squash(name), squash(written)])];
}

/* Longest first, so "mega byte" is never read as a shorter brand that happens to sit inside it. */
const BRAND_NAMES = [...new Set(brands.flatMap((brand) => brandSpellings(brand.id)))].sort(
  (a, b) => b.length - a.length,
);

const ABBR_OF = new Map(Object.entries(brandAbbr).map(([id, abbr]) => [abbr, id]));

/** A brand is lifted OUT of the query so the rest still searches: "scrap brigade crisis" is the brand plus "crisis". An acronym counts only IN CAPS, or "on" and "at" would quietly become brand filters. */
function liftBrand(query: string): { brand: string | null; rest: string } {
  const lower = query.toLowerCase();
  for (const name of BRAND_NAMES) {
    const found = new RegExp(`(^|[^a-z0-9"-])(${escapeRe(name)})([^a-z0-9"]|$)`).exec(lower);
    if (!found) continue;
    const at = found.index + found[1].length;
    return { brand: name, rest: query.slice(0, at) + query.slice(at + name.length) };
  }
  for (const [abbr, id] of ABBR_OF) {
    const found = new RegExp(`(^|[^A-Za-z0-9"-])(${abbr})([^A-Za-z0-9"]|$)`).exec(query);
    if (!found) continue;
    const at = found.index + found[1].length;
    return { brand: id, rest: query.slice(0, at) + query.slice(at + abbr.length) };
  }
  return { brand: null, rest: query };
}

const exacts = new WeakMap<CardRow, Set<string>>();

/** Every spelling this row's brands answer to, plus their ids, which is what `liftBrand` reports for an acronym. */
function exactOf(row: CardRow): Set<string> {
  const cached = exacts.get(row);
  if (cached !== undefined) return cached;
  const built = new Set(row.brandIds.flatMap((id) => [id, ...brandSpellings(id)]));
  exacts.set(row, built);
  return built;
}

const names = new WeakMap<CardRow, string>();

function namesOf(row: CardRow): string {
  const cached = names.get(row);
  if (cached !== undefined) return cached;
  const built = buildNames(row);
  names.set(row, built);
  return built;
}

const matchesSearch = (row: CardRow, query: string, loose: boolean): boolean => {
  const { brand, rest } = liftBrand(query);
  if (brand && !exactOf(row).has(brand)) return false;
  return matchesQuery(haystackOf(row), rest, namesOf(row), loose);
};

export function matches(row: CardRow, facets: FacetState, query: string, loose = false): boolean {
  return (
    FACET_KEYS.every((key) => matchesFacet(row, key, facets[key])) &&
    matchesSearch(row, query, loose)
  );
}

interface FacetOption {
  id: string;
  label: string;
  /** Identifier tone for the dot. Null renders the hollow ring. */
  color: string | null;
  showDot: boolean;
  count: number;
  on: boolean;
}

interface FacetGroup {
  key: FacetKey;
  label: string;
  aria: string;
  options: FacetOption[];
}

const KIND_ORDER: CardKind[] = ['characters', 'programs', 'architech', 'environments'];
const SETS: SetCode[] = ['CORE', 'EX1', 'INC'];

/** Every value the pool actually contains, in a stable order. */
function optionIds(key: FacetKey): string[] {
  switch (key) {
    case 'type':
      return KIND_ORDER.filter((kind) => cardRows.some((row) => row.kind === kind));
    case 'faction':
      return [...factions.map((f) => f.id), 'universal'];
    case 'box':
      return SETS.filter((set) => cardRows.some((row) => row.set === set));
    case 'brand':
      return brands.filter((b) => cardRows.some((row) => row.brandIds.includes(b.id))).map((b) => b.id);
    case 'printed':
      return [...new Set(cardRows.map((row) => row.printedType).filter(Boolean) as string[])].sort();
    case 'cost':
      return [...new Set(cardRows.map((row) => row.cost).filter((c): c is number => c !== null))]
        .sort((a, b) => a - b)
        .map(String);
  }
}

function optionLabel(key: FacetKey, id: string): string {
  switch (key) {
    case 'type':
      return t(`cardsPage.kinds.${id}`);
    case 'faction':
      return id === 'universal' ? t('universe.anyFaction') : (factionById(id)?.name ?? id);
    case 'box':
      return t(`cardsPage.boxes.${id}`);
    case 'brand':
      return brandById(id)?.name ?? id;
    default:
      return id;
  }
}

function optionColor(key: FacetKey, id: string): string | null {
  if (key === 'faction') return id === 'universal' ? null : (factionById(id)?.color ?? null);
  if (key === 'brand') {
    const factionId = brandById(id)?.factionId;
    return factionId ? (factionById(factionId)?.color ?? null) : null;
  }
  return null;
}

/** Counted with the other facets and the query applied, so a count says what clicking it would leave. Zero-count options are dropped, except the selected one — clearing it needs a control still on screen. */
export function facetGroups(facets: FacetState, query: string, loose = false): FacetGroup[] {
  return FACET_KEYS.map((key) => {
    const options = optionIds(key)
      .map<FacetOption>((id) => ({
        id,
        label: optionLabel(key, id),
        color: optionColor(key, id),
        showDot: key === 'faction' || key === 'brand',
        count: cardRows.filter((row) => matches(row, { ...facets, [key]: id }, query, loose)).length,
        /* Split, so every brand in a multi-brand `?brand=` reads as selected rather than none of them. */
        on: facets[key].split(',').includes(id),
      }))
      .filter((option) => option.count > 0 || option.on);
    return { key, label: t(`cardsPage.facets.${key}`), aria: t(`cardsPage.facetAria.${key}`), options };
  });
}

export const SORTS = ['printed', 'name', 'cost'] as const;
export type SortKey = (typeof SORTS)[number];

/** A costless card sorts after every priced one rather than before all of them. */
export function sortRows(rows: CardRow[], sort: SortKey): CardRow[] {
  if (sort === 'printed') return rows;
  const out = [...rows];
  if (sort === 'name') return out.sort((a, b) => a.name.localeCompare(b.name));
  return out.sort((a, b) => (a.cost ?? Infinity) - (b.cost ?? Infinity));
}

/** THE PRINTED FACE, in printed order — the one builder. A second copy is a second transcription that can drift. */
export function linesOf(row: CardRow): CardLine[] {
  const tail: CardLine[] = [{ label: t('cards.set'), values: [t(`cards.sets.${row.set}`)] }];
  if (row.kind === 'characters') {
    const c = row.character;
    return [
      { label: t('character.statHp'), values: [String(c.hp)] },
      { label: t('character.statAbility'), values: [c.abilityName] },
      { label: t('cards.rules'), values: row.rules.map(expandIcons) },
      { label: t('cards.flavour'), values: [row.flavour] },
      ...tail,
    ].filter((line) => line.values.some(Boolean));
  }
  if (row.kind === 'programs') {
    const p = row.program;
    return [
      { label: t('cards.cost'), values: [p.cost] },
      { label: t('cards.type'), values: [p.subType ? `${p.type} · ${p.subType}` : p.type] },
      { label: t('cards.rules'), values: row.rules.map(expandIcons) },
      p.unlock
        ? { label: t('cards.unlock'), values: [expandIcons(p.unlock)] }
        : { label: t('cards.flavour'), values: [row.flavour] },
      ...tail,
    ].filter((line) => line.values.some(Boolean));
  }
  const o = row.other;
  return [
    { label: t('cards.cost'), values: [o.cost === null ? '' : String(o.cost)] },
    { label: t('cards.type'), values: [o.subType ? `${o.type} · ${o.subType}` : o.type] },
    { label: t('character.statAbility'), values: [o.ability ?? ''] },
    { label: t('cards.rules'), values: row.rules.map(expandIcons) },
    { label: t('cards.flavour'), values: [row.flavour] },
    ...tail,
  ].filter((line) => line.values.some(Boolean));
}

/** The tint on a tile's edge. A multi-faction card has no single colour; the first stands in. */
export const factionColorOf = (row: CardRow): string | null =>
  row.factionIds.length ? (factionById(row.factionIds[0])?.color ?? null) : null;

/** What the frame says while it is still a drop zone. */
export function placeholderOf(row: CardRow, face: 'art' | 'card'): string {
  if (face === 'card') return t('cardsPage.slots.card');
  if (row.kind === 'characters') return t('cardsPage.slots.character');
  if (row.kind === 'environments') return t('cardsPage.slots.environment');
  return t('cardsPage.slots.art');
}

/** The mono line above the card's name. Names the KIND first: the dialog is reached from four surfaces. */
export function zoomKicker(row: CardRow): string {
  const upper = (value: string) => value.toLocaleUpperCase();
  const setLabel = upper(t(`cards.sets.${row.set}`));
  if (row.kind === 'characters') return [upper(t('cardsPage.kindOne.character')), setLabel].join(' · ');
  if (row.kind === 'programs') {
    return [upper(t('cardsPage.kindOne.program')), upper(brandById(row.brandIds[0])?.name ?? '')]
      .filter(Boolean)
      .join(' · ');
  }
  if (row.kind === 'architech') {
    return [upper(row.other.subType ?? row.other.type), setLabel].join(' · ');
  }
  return [upper(row.other.type), setLabel].join(' · ');
}

export interface ZoomStat {
  label: string;
  value: string;
  to?: import('vue-router').RouteLocationRaw;
}

/** THE ROWS CARRY WHAT THE CARD DOES NOT PRINT — set, brand, printing, artist — because a second copy of the printed face can drift with nothing failing. Brand access is the one exception: a character plays several, and the row is where they become links. */
export function zoomStats(row: CardRow, brandTo: (id: string) => ZoomStat['to']): ZoomStat[] {
  const artist = row.sceneArt.artist || row.cardArt.artist;
  const tail: ZoomStat[] = artist ? [{ label: t('character.rowArtist'), value: artist }] : [];
  const set: ZoomStat = { label: t('cards.set'), value: t(`cards.sets.${row.set}`) };

  if (row.kind === 'characters') {
    const names = row.brandIds.flatMap((id) => {
      const name = brandById(id)?.name;
      return name && id !== 'common' ? [name] : [];
    });
    return [
      set,
      ...(names.length ? [{ label: t('cardsPage.stats.access'), value: names.join(' · ') }] : []),
      ...tail,
    ];
  }

  if (row.kind === 'programs') {
    const brand = brandById(row.brandIds[0]);
    return [
      ...(brand
        ? [{ label: t('character.rowBrand'), value: brand.name, to: brandTo(brand.id) }]
        : []),
      set,
      ...tail,
    ];
  }

  return [set, ...tail];
}

/** Alt arts, standard first. Only a character has any; everything else has one face. */
export function printingsForRow(row: CardRow): Printing[] {
  return row.kind === 'characters' ? printingsOf(row.character) : [];
}

/** The printing a `?printing=` names, or the standard one when it names nothing real. */
export function resolveRowPrinting(row: CardRow, id: string | null): Printing | null {
  const list = printingsForRow(row);
  if (!list.length) return null;
  return list.find((printing) => printing.id === id) ?? list[0];
}

/** A brand's stated print run minus the cards that exist. Both numbers derive from the data, so the footnote cannot drift from the grid. */
const PRINTED_SHORTFALL = brands.reduce((sum, brand) => {
  const have = cardRows.filter(
    (row) => row.kind === 'programs' && row.brandIds[0] === brand.id,
  ).length;
  return sum + Math.max(0, (brand.announcedCount ?? have) - have);
}, 0);

export const TRANSCRIBED_TOTAL = cardRows.length;
export const PRINTED_TOTAL = TRANSCRIBED_TOTAL + PRINTED_SHORTFALL;
