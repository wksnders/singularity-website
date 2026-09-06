/* An announced print run is named only as a shortfall ("6 of 10 revealed"),the cards figure is always what exists today. */

import { getDoc, metaString, t } from '@/content';
import { charactersOfBrand, programsOfBrand } from '@/data/universe';
import type { Brand } from '@/data/types';

export const brandOneLiner = (brand: Brand): string =>
  metaString(getDoc(`universe/brands/${brand.id}`), 'oneLiner', '');

function castNote(brand: Brand): string {
  if (brand.kind === 'universal') return t('brand.shelf.everySquad');

  const cast = charactersOfBrand(brand.id);
  /* A personal brand may be shared, so name an owner only where the cast is actually one. */
  if (brand.kind === 'personal' && cast.length === 1) {
    return t('brand.shelf.alone', { name: cast[0].name });
  }
  return `${cast.length} ${t(cast.length === 1 ? 'brand.shelf.castOne' : 'brand.shelf.cast')}`;
}

export function brandRowNote(brand: Brand): string {
  const written = programsOfBrand(brand.id).length;
  const announced = brand.announcedCount ?? 0;
  const cards =
    written < announced
      ? t('brand.shelf.revealed', { written, announced })
      : `${written} ${t('brand.shelf.cards')}`;

  return `${cards} · ${castNote(brand)}`;
}
