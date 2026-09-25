/* Entity name plus `meta.suffix`, or `meta.fallback` when the name is empty. */

import { watchEffect } from 'vue';
import { t } from '@/content';

export function useDocumentTitle(source: () => string): void {
  watchEffect(() => {
    const name = source().trim();
    document.title = name ? `${name}${t('meta.suffix')}` : t('meta.fallback');
  });
}
