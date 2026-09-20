import type { LocationQuery } from 'vue-router';

/** A repeated key (`?q=a&q=b`) arrives as an array and an empty one as `''`; both read as absent. */
export function queryString(query: LocationQuery, key: string): string | null {
  const value = query[key];
  return typeof value === 'string' && value !== '' ? value : null;
}
