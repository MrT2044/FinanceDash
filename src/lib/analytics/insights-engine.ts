import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InsightType, Json } from "@/types/database.types";
import { addMonths, currentMonthKey, lastMonths, monthEnd, monthStart, toMonthKey } from "@/lib/utils/date";
import { formatCurrency, formatMonth, formatSignedPercent } from "@/lib/utils/format";
import {
  buildCategorySummaries,
  filterByMonth,
  sumExpenses,
  sumIncome,
} from "./kpi";
import type { CategoryMeta, TransactionRecord } from "./types";

type Client = SupabaseClient<Database>;

type DraftInsight = {
  type: InsightType;
  fingerprint: string;
  title: string;
  description: string;
  severity: "info" | "warning";
  payload: Record<string, Json>;
};

/** Ab dieser relativen Zunahme gilt eine Kategorie als auffällig gestiegen. */
const INCREASE_THRESHOLD = 0.2;
/** Kategorien unter diesem Betrag erzeugen keine Empfehlung (zu wenig Signal). */
const MIN_RELEVANT_AMOUNT = 25;
const HISTORY_MONTHS = 3;

function categoryIncreaseInsights(
  transactions: TransactionRecord[],
  categories: CategoryMeta[],
  monthKey: string,
): DraftInsight[] {
  const previousMonthKeys = lastMonths(addMonths(monthKey, -1), HISTORY_MONTHS);
  const summaries = buildCategorySummaries(transactions, categories, {
    monthKey,
    previousMonthKeys,
  });

  return summaries
    .filter(
      (summary) =>
        summary.changeRatio !== null &&
        summary.changeRatio >= INCREASE_THRESHOLD &&
        summary.total >= MIN_RELEVANT_AMOUNT,
    )
    .slice(0, 3)
    .map((summary) => {
      const difference = summary.total - summary.averagePrevious;
      return {
        type: "category_increase" as const,
        fingerprint: `category_increase:${monthKey}:${summary.slug}`,
        title: `${summary.name}: ${formatSignedPercent(summary.changeRatio!)} gegenüber deinem Schnitt`,
        description: `Im ${formatMonth(monthKey)} hast du ${formatCurrency(summary.total)} für ${summary.name} ausgegeben — ${formatCurrency(difference)} mehr als im Durchschnitt der letzten Monate (${formatCurrency(summary.averagePrevious)}).`,
        severity: summary.changeRatio! >= 0.5 ? ("warning" as const) : ("info" as const),
        payload: {
          categoryId: summary.categoryId,
          total: summary.total,
          average: summary.averagePrevious,
          changeRatio: summary.changeRatio,
        },
      };
    });
}

function savingsPotentialInsights(
  transactions: TransactionRecord[],
  categories: CategoryMeta[],
  monthKey: string,
): DraftInsight[] {
  const previousMonthKeys = lastMonths(addMonths(monthKey, -1), HISTORY_MONTHS);
  const summaries = buildCategorySummaries(transactions, categories, {
    monthKey,
    previousMonthKeys,
  });

  // Sparpotenzial = Differenz zum eigenen bisherigen Durchschnitt. Bewusst kein
  // externer Richtwert, sondern das eigene Verhalten als Maßstab.
  const candidates = summaries
    .filter(
      (summary) =>
        summary.averagePrevious > 0 &&
        summary.total - summary.averagePrevious >= 20 &&
        ["freizeit", "shopping", "abonnements", "essen"].includes(summary.slug),
    )
    .slice(0, 2);

  return candidates.map((summary) => {
    const potential = summary.total - summary.averagePrevious;
    return {
      type: "savings_potential" as const,
      fingerprint: `savings_potential:${monthKey}:${summary.slug}`,
      title: `Rund ${formatCurrency(potential)} Sparpotenzial bei ${summary.name}`,
      description: `Wenn du bei ${summary.name} wieder auf dein übliches Niveau von ${formatCurrency(summary.averagePrevious)} pro Monat kommst, sparst du etwa ${formatCurrency(potential)} monatlich.`,
      severity: "info" as const,
      payload: {
        categoryId: summary.categoryId,
        potential,
        average: summary.averagePrevious,
      },
    };
  });
}

/**
 * Erkennt Abos: gleicher Händler, ähnlicher Betrag, in mindestens drei der
 * letzten Monate genau einmal gebucht.
 */
function subscriptionInsights(
  transactions: TransactionRecord[],
  monthKey: string,
): DraftInsight[] {
  const window = lastMonths(monthKey, 4);
  const byMerchant = new Map<string, Map<string, number[]>>();

  for (const transaction of transactions) {
    if (transaction.amount >= 0) continue;
    const month = toMonthKey(transaction.booking_date);
    if (!window.includes(month)) continue;

    const merchant = transaction.counterparty_name?.trim().toLowerCase();
    if (!merchant || merchant.length < 3) continue;

    const months = byMerchant.get(merchant) ?? new Map<string, number[]>();
    const amounts = months.get(month) ?? [];
    amounts.push(Math.abs(transaction.amount));
    months.set(month, amounts);
    byMerchant.set(merchant, months);
  }

  const subscriptions: { merchant: string; monthly: number }[] = [];

  for (const [merchant, months] of byMerchant) {
    if (months.size < 3) continue;

    const monthlyAmounts = [...months.values()].map((amounts) =>
      amounts.reduce((total, value) => total + value, 0),
    );
    const average =
      monthlyAmounts.reduce((total, value) => total + value, 0) / monthlyAmounts.length;

    // Beträge müssen konstant sein — sonst ist es ein Händler, kein Abo.
    const isStable = monthlyAmounts.every(
      (amount) => Math.abs(amount - average) <= Math.max(1, average * 0.15),
    );

    if (isStable && average >= 2) {
      subscriptions.push({ merchant, monthly: average });
    }
  }

  if (subscriptions.length < 2) return [];

  const total = subscriptions.reduce((sum, item) => sum + item.monthly, 0);
  const names = subscriptions
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, 5)
    .map((item) => item.merchant);

  return [
    {
      type: "subscription_detected",
      fingerprint: `subscription_detected:${monthKey}`,
      title: `${subscriptions.length} wiederkehrende Zahlungen — ${formatCurrency(total)} pro Monat`,
      description: `Du zahlst regelmäßig an: ${names.join(", ")}. Das sind ${formatCurrency(total * 12)} im Jahr. Prüf kurz, ob du alles davon noch nutzt.`,
      severity: "info",
      payload: { count: subscriptions.length, monthlyTotal: total, merchants: names },
    },
  ];
}

/** Einzelne Ausgaben, die deutlich über dem üblichen Niveau liegen. */
function unusualSpendingInsights(
  transactions: TransactionRecord[],
  monthKey: string,
): DraftInsight[] {
  const monthTransactions = filterByMonth(transactions, monthKey).filter(
    (transaction) => transaction.amount < 0,
  );
  if (monthTransactions.length < 5) return [];

  const historyAmounts = transactions
    .filter(
      (transaction) =>
        transaction.amount < 0 && toMonthKey(transaction.booking_date) !== monthKey,
    )
    .map((transaction) => Math.abs(transaction.amount))
    .sort((a, b) => a - b);

  if (historyAmounts.length < 20) return [];

  const median = historyAmounts[Math.floor(historyAmounts.length / 2)];
  const threshold = Math.max(median * 8, 200);

  const outlier = monthTransactions
    .map((transaction) => ({ transaction, value: Math.abs(transaction.amount) }))
    .filter((item) => item.value >= threshold)
    .sort((a, b) => b.value - a.value)[0];

  if (!outlier) return [];

  const merchant = outlier.transaction.counterparty_name?.trim() || "einem Händler";

  return [
    {
      type: "unusual_spending",
      fingerprint: `unusual_spending:${monthKey}:${outlier.transaction.id}`,
      title: `Größte Einzelausgabe: ${formatCurrency(outlier.value)}`,
      description: `Am ${outlier.transaction.booking_date.split("-").reverse().join(".")} hast du ${formatCurrency(outlier.value)} an ${merchant} gezahlt — deutlich über deinen üblichen Einzelbuchungen.`,
      severity: "info",
      payload: { transactionId: outlier.transaction.id, amount: outlier.value },
    },
  ];
}

function savingsRateInsight(
  transactions: TransactionRecord[],
  monthKey: string,
): DraftInsight[] {
  const monthTransactions = filterByMonth(transactions, monthKey);
  const income = sumIncome(monthTransactions);
  const expenses = sumExpenses(monthTransactions);

  if (income <= 0) return [];

  const rate = (income - expenses) / income;

  return [
    {
      type: "savings_rate",
      fingerprint: `savings_rate:${monthKey}`,
      title:
        rate >= 0
          ? `Deine Sparrate liegt bei ${formatSignedPercent(rate).replace("+", "")}`
          : "Du gibst diesen Monat mehr aus, als du einnimmst",
      description:
        rate >= 0
          ? `Von ${formatCurrency(income)} Einnahmen bleiben dir im ${formatMonth(monthKey)} ${formatCurrency(income - expenses)} übrig.`
          : `Im ${formatMonth(monthKey)} stehen ${formatCurrency(expenses)} Ausgaben nur ${formatCurrency(income)} Einnahmen gegenüber. Das Minus beträgt ${formatCurrency(expenses - income)}.`,
      severity: rate < 0 ? "warning" : "info",
      payload: { income, expenses, rate },
    },
  ];
}

/**
 * Berechnet alle Insights für den laufenden Monat neu und schreibt sie in die
 * Datenbank. Bereits ausgeblendete Empfehlungen bleiben ausgeblendet, weil der
 * Upsert über den Fingerprint läuft und `dismissed` nicht überschreibt.
 */
export async function generateInsights(
  supabase: Client,
  userId: string,
  reference = new Date(),
): Promise<void> {
  const monthKey = currentMonthKey(reference);
  const windowStart = monthStart(addMonths(monthKey, -5));

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, booking_date, amount, purpose, counterparty_name, category_id, category_source, account_id",
      )
      .gte("booking_date", windowStart)
      .lte("booking_date", monthEnd(monthKey)),
    supabase.from("categories").select("id, name, slug, color, icon"),
  ]);

  if (!transactions?.length) return;

  const drafts = [
    ...savingsRateInsight(transactions, monthKey),
    ...categoryIncreaseInsights(transactions, categories ?? [], monthKey),
    ...savingsPotentialInsights(transactions, categories ?? [], monthKey),
    ...subscriptionInsights(transactions, monthKey),
    ...unusualSpendingInsights(transactions, monthKey),
  ];

  if (!drafts.length) return;

  await supabase.from("recommendations").upsert(
    drafts.map((draft) => ({
      user_id: userId,
      type: draft.type,
      fingerprint: draft.fingerprint,
      period_start: monthStart(monthKey),
      period_end: monthEnd(monthKey),
      title: draft.title.slice(0, 200),
      description: draft.description.slice(0, 1000),
      payload: draft.payload,
      severity: draft.severity,
    })),
    { onConflict: "user_id,fingerprint", ignoreDuplicates: false },
  );
}
