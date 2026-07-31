/** Monatsschlüssel im Format "2026-07". */
export type MonthKey = string;

export function toMonthKey(isoDate: string): MonthKey {
  return isoDate.slice(0, 7);
}

export function currentMonthKey(reference = new Date()): MonthKey {
  return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(monthKey: MonthKey, delta: number): MonthKey {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Liefert die letzten `count` Monatsschlüssel inklusive `endMonth`, aufsteigend. */
export function lastMonths(endMonth: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, index) =>
    addMonths(endMonth, index - (count - 1)),
  );
}

export function monthStart(monthKey: MonthKey): string {
  return `${monthKey}-01`;
}

export function monthEnd(monthKey: MonthKey): string {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${monthKey}-${String(lastDay).padStart(2, "0")}`;
}
