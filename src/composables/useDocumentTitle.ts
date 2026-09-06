/* Title is the entity name plus the `meta.suffix` content key (`meta.fallback` when the name is empty), set in setup so it wins over the router's afterEach title. */

import { watchEffect } from 'vue';
import { t } from '@/content';

export function useDocumentTitle(source: () => string): void {
  watchEffect(() => {
    const name = source().trim();
    document.title = name ? `${name}${t('meta.suffix')}` : t('meta.fallback');
  });
}
