import "server-only";
import { cookies } from "next/headers";
import { currentMonthKey, type MonthKey } from "@/lib/utils/date";

/** Merkt den zuletzt gewählten Monat bereichsübergreifend. */
export const MONTH_COOKIE = "fd-monat";

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

/**
 * Bestimmt den anzuzeigenden Monat für alle Auswertungsseiten.
 *
 * Reihenfolge: `?monat=` in der URL (teilbare Links gewinnen) → zuletzt
 * gewählter Monat aus dem Cookie → laufender Monat. Über das Cookie übernehmen
 * Diagramme, Transaktionen und Statistiken denselben Zeitraum, auch wenn man
 * über die Navigation ohne Parameter dorthin wechselt.
 */
export async function resolveMonthKey(param?: string): Promise<MonthKey> {
  if (isMonthKey(param)) return param;

  const stored = (await cookies()).get(MONTH_COOKIE)?.value;
  if (isMonthKey(stored)) return stored;

  return currentMonthKey();
}
