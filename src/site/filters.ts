/** One chip in a filter bar. Options are always built from data. */
export interface FilterOption {
  id: string;
  label: string;
  color?: string | null;
  showDot?: boolean;
}
