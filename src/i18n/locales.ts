/* ============================================================================
   Locales.

   Adding a language is: drop content/<code>/ next to content/en/, add the code
   here. Nothing else. English is always the fallback, per string and per file.
   Section anchors and filter query params are locale-INDEPENDENT:
   /story#chapters and /de/story#chapters resolve to the same id.
   ========================================================================== */

import { ref } from 'vue';

export const LOCALES = ['en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Route segment pattern used by the router: /:locale(de|fr)?/… */
export const LOCALE_ROUTE_PATTERN = LOCALES.filter((l) => l !== DEFAULT_LOCALE).join('|');

export const currentLocale = ref<Locale>(DEFAULT_LOCALE);

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function setLocale(value: unknown): void {
  const next = isLocale(value) ? value : DEFAULT_LOCALE;
  currentLocale.value = next;

  /* The <html lang> in index.html is static, so without this a German page
     would still declare itself English and a screen reader would read it in an
     English voice (WCAG 3.1.1). The router calls setLocale on every
     navigation, so this is the one place that has to know. */
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next;
  }
}
