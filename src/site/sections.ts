/** A deep-linkable section on a page. `id` is a public URL and never changes. */
export interface SectionEntry {
  id: string;
  label: string;
  /** Used for the Convergence chip while a vote is open. */
  accent?: boolean;
  group?: string;
}

/** One step in the breadcrumb spine. No `to` = the current page. */
export interface Crumb {
  label: string;
  to?: import('vue-router').RouteLocationRaw;
}
