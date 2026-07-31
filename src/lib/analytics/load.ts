import "server-only";
import { createClient } from "@/lib/supabase/server";
import { addMonths, currentMonthKey, lastMonths, monthEnd, monthStart } from "@/lib/utils/date";
import type { CategoryMeta, TransactionRecord } from "./types";

export type DashboardData = {
  monthKey: string;
  monthKeys: string[];
  transactions: TransactionRecord[];
  categories: CategoryMeta[];
  hasAnyTransactions: boolean;
  /** Saldo über alle Buchungen, unabhängig vom geladenen Zeitfenster. */
  balance: number;
};

const HISTORY_WINDOW = 12;

/**
 * Lädt den Datenbestand für die Auswertungsseiten. Alle Queries laufen über den
 * nutzergebundenen Client, sodass RLS die Datentrennung erzwingt — es ist
 * bewusst kein user_id-Filter im Code nötig, der versehentlich fehlen könnte.
 */
export async function loadDashboardData(monthKeyParam?: string): Promise<DashboardData> {
  const supabase = await createClient();
  const monthKey = /^\d{4}-\d{2}$/.test(monthKeyParam ?? "")
    ? monthKeyParam!
    : currentMonthKey();

  const monthKeys = lastMonths(monthKey, HISTORY_WINDOW);

  const [{ data: transactions }, { data: categories }, { count }, { data: balance }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, booking_date, amount, purpose, counterparty_name, category_id, category_source, account_id",
        )
        .gte("booking_date", monthStart(addMonths(monthKey, -(HISTORY_WINDOW - 1))))
        .lte("booking_date", monthEnd(monthKey))
        .order("booking_date", { ascending: false }),
      supabase.from("categories").select("id, name, slug, color, icon").order("sort_order"),
      supabase.from("transactions").select("id", { count: "exact", head: true }),
      // Summiert in der Datenbank über alle Buchungen, nicht nur über das Fenster.
      supabase.rpc("current_balance"),
    ]);

  return {
    monthKey,
    monthKeys,
    transactions: transactions ?? [],
    categories: categories ?? [],
    hasAnyTransactions: (count ?? 0) > 0,
    balance: Number(balance ?? 0),
  };
}
