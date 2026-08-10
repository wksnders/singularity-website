/** One cell in a stat row. `reserved` renders the dashed [ TBD ] slot. */
export interface Stat {
  label: string;
  value?: string | null;
  reserved?: boolean;
}
