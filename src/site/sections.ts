/** A deep-linkable section on a page. `id` is a public URL and never changes. */
export interface SectionEntry {
  id: string;
  /** Unique per row; `id` repeats when one target sits under several groups. */
  key?: string;
  label: string;
  /** Rail label, where the full one would wrap. */
  short?: string;
  /** Faction tone for the chip's dot: data, never a token. */
  color?: string | null;

  accent?: boolean;
  group?: string;
}

/** One step in the breadcrumb spine; omitting `to` marks the current page. */
export interface Crumb {
  label: string;
  to?: import('vue-router').RouteLocationRaw;
}
