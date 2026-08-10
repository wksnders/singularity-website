/* ============================================================================
   Page title for the routes whose name is data, not a route constant.

   Static pages carry `meta.titleKey` and the router's afterEach handles them.
   Faction, brand and character pages cannot: their title is the entity's name,
   which comes from front matter first and the data file second. This runs in
   setup — after the router's afterEach — so the entity name wins.

   The separator lives in `meta.suffix` so a translator can change it.
   ========================================================================== */

import { watchEffect } from 'vue';
import { t } from '@/content';

/** Sets document.title to "<name><suffix>", reactively. */
export function useDocumentTitle(source: () => string): void {
  watchEffect(() => {
    const name = source().trim();
    document.title = name ? `${name}${t('meta.suffix')}` : t('meta.fallback');
  });
}
