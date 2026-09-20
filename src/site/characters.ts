import { t } from '@/content';
import { factions, factionsOf } from '@/data/universe';
import type { Character } from '@/data/types';
import type { FilterOption } from '@/site/filters';

export const factionTags = (character: Character): { label: string; color: string | null }[] =>
  character.factionIds === 'any'
    ? [{ label: t('universe.anyFaction'), color: null }]
    : factionsOf(character).map((f) => ({ label: f.name, color: f.color }));

/** The ids are what `matchesFactionFilter` reads: each faction's, then `'universal'`. */
export const characterFactionOptions = (universalLabel: string): FilterOption[] => [
  ...factions.map((f) => ({ id: f.id, label: f.name, color: f.color, showDot: true })),
  { id: 'universal', label: universalLabel, showDot: true, color: null },
];
