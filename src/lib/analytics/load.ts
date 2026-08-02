import "server-only";
import { createClient } from "@/lib/supabase/server";
import { addMonths, currentMonthKey, lastMonths, monthEnd, monthStart } from "@/lib/utils/date";
import type { CategoryMeta, TransactionRecord } from "./types";

export type AccountMeta = { id: string; name: string };

export type DashboardData = {
  monthKey: string;
  monthKeys: string[];
  transactions: TransactionRecord[];
  categories: CategoryMeta[];
  accounts: AccountMeta[];
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

  const [
    { data: transactions },
    { data: categories },
    { data: accounts },
    { count },
    { data: balance },
  ] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, booking_date, amount, purpose, counterparty_name, category_id, category_source, account_id, accounting_month",
        )
        // Einen Monat Puffer nach beiden Seiten: Eine Buchung kann einem
        // anderen Monat zugeordnet sein als ihrem Buchungsdatum. Ohne den
        // Puffer fiele ein am 1. August gebuchtes Julie-Gehalt aus dem Fenster
        // und fehlte in der Juli-Auswertung.
        .gte("booking_date", monthStart(addMonths(monthKey, -HISTORY_WINDOW)))
        .lte("booking_date", monthEnd(addMonths(monthKey, 1)))
        .order("booking_date", { ascending: false }),
      supabase.from("categories").select("id, name, slug, color, icon").order("sort_order"),
      supabase.from("accounts").select("id, name").order("name"),
      supabase.from("transactions").select("id", { count: "exact", head: true }),
      // Summiert in der Datenbank über alle Buchungen, nicht nur über das Fenster.
      supabase.rpc("current_balance"),
    ]);

  return {
    monthKey,
    monthKeys,
    transactions: transactions ?? [],
    categories: categories ?? [],
    accounts: accounts ?? [],
    hasAnyTransactions: (count ?? 0) > 0,
    balance: Number(balance ?? 0),
  };
}
