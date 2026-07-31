import { toMonthKey } from "@/lib/utils/date";
import type {
  CategoryMeta,
  CategorySummary,
  DashboardKpis,
  MonthlySummary,
  TransactionRecord,
} from "./types";

const UNCATEGORIZED: Pick<CategoryMeta, "name" | "color" | "slug"> = {
  name: "Nicht zugeordnet",
  color: "#94a3b8",
  slug: "nicht-zugeordnet",
};

export function isExpense(transaction: TransactionRecord): boolean {
  return transaction.amount < 0;
}

export function sumExpenses(transactions: TransactionRecord[]): number {
  return transactions.reduce(
    (total, transaction) => (transaction.amount < 0 ? total - transaction.amount : total),
    0,
  );
}

export function sumIncome(transactions: TransactionRecord[]): number {
  return transactions.reduce(
    (total, transaction) => (transaction.amount > 0 ? total + transaction.amount : total),
    0,
  );
}

export function filterByMonth(
  transactions: TransactionRecord[],
  monthKey: string,
): TransactionRecord[] {
  return transactions.filter(
    (transaction) => toMonthKey(transaction.booking_date) === monthKey,
  );
}

export function computeKpis(
  allTransactions: TransactionRecord[],
  monthKey: string,
): DashboardKpis {
  const monthTransactions = filterByMonth(allTransactions, monthKey);
  const monthIncome = sumIncome(monthTransactions);
  const monthExpenses = sumExpenses(monthTransactions);

  // Der Kontostand ergibt sich aus der Summe aller importierten Buchungen.
  // Ohne Anfangssaldo aus der Bank ist das die bestmögliche Näherung.
  const balance = allTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );

  return {
    balance,
    monthIncome,
    monthExpenses,
    available: monthIncome - monthExpenses,
    savingsRate: monthIncome > 0 ? (monthIncome - monthExpenses) / monthIncome : null,
  };
}

export function buildMonthlySeries(
  transactions: TransactionRecord[],
  monthKeys: string[],
): MonthlySummary[] {
  const buckets = new Map<string, MonthlySummary>(
    monthKeys.map((monthKey) => [
      monthKey,
      { monthKey, income: 0, expenses: 0, net: 0 },
    ]),
  );

  for (const transaction of transactions) {
    const bucket = buckets.get(toMonthKey(transaction.booking_date));
    if (!bucket) continue;

    if (transaction.amount < 0) bucket.expenses -= transaction.amount;
    else bucket.income += transaction.amount;
    bucket.net += transaction.amount;
  }

  return monthKeys.map((monthKey) => buckets.get(monthKey)!);
}

/**
 * Aggregiert Ausgaben je Kategorie für einen Monat und vergleicht sie mit dem
 * Durchschnitt der angegebenen Vormonate.
 */
export function buildCategorySummaries(
  transactions: TransactionRecord[],
  categories: CategoryMeta[],
  options: { monthKey: string; previousMonthKeys: string[]; kind?: "expense" | "income" },
): CategorySummary[] {
  const kind = options.kind ?? "expense";
  const relevant = (transaction: TransactionRecord) =>
    kind === "expense" ? transaction.amount < 0 : transaction.amount > 0;

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const currentTotals = new Map<string | null, { total: number; count: number }>();
  const previousTotals = new Map<string | null, number[]>();

  for (const transaction of transactions) {
    if (!relevant(transaction)) continue;

    const value = Math.abs(transaction.amount);
    const month = toMonthKey(transaction.booking_date);
    const key = transaction.category_id;

    if (month === options.monthKey) {
      const entry = currentTotals.get(key) ?? { total: 0, count: 0 };
      entry.total += value;
      entry.count += 1;
      currentTotals.set(key, entry);
    } else if (options.previousMonthKeys.includes(month)) {
      const monthIndex = options.previousMonthKeys.indexOf(month);
      const list = previousTotals.get(key) ?? options.previousMonthKeys.map(() => 0);
      list[monthIndex] += value;
      previousTotals.set(key, list);
    }
  }

  const grandTotal = [...currentTotals.values()].reduce(
    (total, entry) => total + entry.total,
    0,
  );

  const summaries: CategorySummary[] = [...currentTotals.entries()].map(
    ([categoryId, entry]) => {
      const meta = categoryId ? categoryById.get(categoryId) : undefined;
      const history = previousTotals.get(categoryId) ?? [];
      const averagePrevious = history.length
        ? history.reduce((total, value) => total + value, 0) / history.length
        : 0;

      return {
        categoryId,
        name: meta?.name ?? UNCATEGORIZED.name,
        color: meta?.color ?? UNCATEGORIZED.color,
        slug: meta?.slug ?? UNCATEGORIZED.slug,
        total: entry.total,
        share: grandTotal > 0 ? entry.total / grandTotal : 0,
        transactionCount: entry.count,
        changeRatio:
          averagePrevious > 0 ? (entry.total - averagePrevious) / averagePrevious : null,
        averagePrevious,
      };
    },
  );

  return summaries.sort((a, b) => b.total - a.total);
}

/** Größte einzelne Ausgabenquellen (Händler) im Zeitraum. */
export function topMerchants(
  transactions: TransactionRecord[],
  limit = 5,
): { name: string; total: number; count: number }[] {
  const totals = new Map<string, { total: number; count: number }>();

  for (const transaction of transactions) {
    if (transaction.amount >= 0) continue;
    const name = transaction.counterparty_name?.trim() || "Unbekannt";
    const entry = totals.get(name) ?? { total: 0, count: 0 };
    entry.total += Math.abs(transaction.amount);
    entry.count += 1;
    totals.set(name, entry);
  }

  return [...totals.entries()]
    .map(([name, entry]) => ({ name, ...entry }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
