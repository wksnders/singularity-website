/* Bundled, not from the CDN: a CSS mask is fetched in CORS mode and the Space sends no CORS header. */
const files = import.meta.glob<string>('/src/assets/patterns/*.webp', {
  eager: true,
  import: 'default',
});

/** `name` is the file stem, e.g. `hana-mori-texture` or `incursions-feature`. */
export function patternUrl(name: string): string | null {
  return files[`/src/assets/patterns/${name}.webp`] ?? null;
}
