// A locale is added by dropping content/<code>/ beside content/en/ and listing its code here, with English as the per-string fallback; section anchors and filter query params stay locale-independent.

import { ref } from 'vue';

export const LOCALES = ['en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Feeds the router's optional locale segment; the default locale is excluded, so English URLs carry no prefix. */
export const LOCALE_ROUTE_PATTERN = LOCALES.filter((l) => l !== DEFAULT_LOCALE).join('|');

export const currentLocale = ref<Locale>(DEFAULT_LOCALE);

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function setLocale(value: unknown): void {
  const next = isLocale(value) ? value : DEFAULT_LOCALE;
  currentLocale.value = next;

  /* index.html ships a static <html lang>, so this is the only place the document language is corrected for screen readers (WCAG 3.1.1). */
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next;
  }
}
