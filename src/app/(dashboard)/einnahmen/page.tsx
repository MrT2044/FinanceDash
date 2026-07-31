import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { EmptyState } from "@/components/dashboard/empty-state";
import { TrendChart } from "@/components/charts/trend-chart";
import { loadDashboardData } from "@/lib/analytics/load";
import { buildMonthlySeries, filterByMonth, sumIncome } from "@/lib/analytics/kpi";
import { addMonths, lastMonths } from "@/lib/utils/date";
import { formatCurrency, formatMonth, formatSignedPercent } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Einnahmen — FinanceDash" };

/** Gruppiert Einnahmen nach Quelle (Absender), um Gehalt von Sonstigem zu trennen. */
function incomeSources(
  transactions: { amount: number; counterparty_name: string | null }[],
): { name: string; total: number; count: number }[] {
  const totals = new Map<string, { total: number; count: number }>();

  for (const transaction of transactions) {
    if (transaction.amount <= 0) continue;
    const name = transaction.counterparty_name?.trim() || "Unbekannt";
    const entry = totals.get(name) ?? { total: 0, count: 0 };
    entry.total += transaction.amount;
    entry.count += 1;
    totals.set(name, entry);
  }

  return [...totals.entries()]
    .map(([name, entry]) => ({ name, ...entry }))
    .sort((a, b) => b.total - a.total);
}

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ monat?: string }>;
}) {
  const { monat } = await searchParams;
  const data = await loadDashboardData(monat);

  const series = buildMonthlySeries(data.transactions, lastMonths(data.monthKey, 12));
  const monthTransactions = filterByMonth(data.transactions, data.monthKey);
  const currentTotal = sumIncome(monthTransactions);
  const previousTotal = sumIncome(
    filterByMonth(data.transactions, addMonths(data.monthKey, -1)),
  );
  const changeRatio = previousTotal > 0 ? (currentTotal - previousTotal) / previousTotal : null;
  const sources = incomeSources(monthTransactions);

  return (
    <>
      <PageHeader
        title="Einnahmen"
        description="Woher dein Geld kommt und wie es sich entwickelt."
        action={<MonthPicker monthKey={data.monthKey} />}
      />

      {!data.hasAnyTransactions ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/60">
              <CardContent className="space-y-1 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Einnahmen {formatMonth(data.monthKey)}
                </p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(currentTotal)}
                </p>
                {changeRatio !== null ? (
                  <p className="text-xs text-muted-foreground">
                    {formatSignedPercent(changeRatio)} gegenüber dem Vormonat (
                    {formatCurrency(previousTotal)})
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="space-y-1 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Wichtigste Quelle
                </p>
                <p className="truncate text-2xl font-semibold tracking-tight">
                  {sources[0]?.name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sources[0]
                    ? `${formatCurrency(sources[0].total)} aus ${sources.length} ${sources.length === 1 ? "Quelle" : "Quellen"}`
                    : "Keine Einnahmen in diesem Monat"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Entwicklung über die Zeit</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
              <TrendChart data={series} metric="income" color="#10b981" label="Einnahmen" />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Einnahmequellen</CardTitle>
            </CardHeader>
            <CardContent>
              {sources.length ? (
                <ul className="space-y-3">
                  {sources.slice(0, 10).map((source) => (
                    <li key={source.name} className="flex items-center gap-3 text-sm">
                      <span className="min-w-0 flex-1 truncate">{source.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {source.count}×
                      </span>
                      <span className="w-24 shrink-0 text-right font-medium tabular-nums">
                        {formatCurrency(source.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Keine Einnahmen in diesem Monat.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
