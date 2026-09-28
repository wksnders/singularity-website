/* Web Animations and layout maths can't read var(): they take tokens.css values through these. */
const root = () => getComputedStyle(document.documentElement);

export const token = (name: string): string => root().getPropertyValue(name).trim();

export const tokenMs = (name: string): number => parseFloat(token(name));

/** Px, for a px, rem or unitless token. */
export function tokenPx(name: string): number {
  const value = token(name);
  return value.endsWith('rem') ? parseFloat(value) * parseFloat(root().fontSize) : parseFloat(value) || 0;
}
