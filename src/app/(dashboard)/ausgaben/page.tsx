import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Amount } from "@/components/ui/amount";
import { PageHeader } from "@/components/dashboard/page-header";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { EmptyState } from "@/components/dashboard/empty-state";
import { TrendChart } from "@/components/charts/trend-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { loadDashboardData } from "@/lib/analytics/load";
import { resolveMonthKey } from "@/lib/analytics/month";
import {
  buildCategorySummaries,
  buildMonthlySeries,
  filterByMonth,
  sumExpenses,
  topMerchants,
} from "@/lib/analytics/kpi";
import { addMonths, lastMonths } from "@/lib/utils/date";
import { formatCurrency, formatMonth, formatSignedPercent } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Ausgaben — FinanceDash" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ monat?: string }>;
}) {
  const { monat } = await searchParams;
  const data = await loadDashboardData(await resolveMonthKey(monat));

  const series = buildMonthlySeries(data.transactions, lastMonths(data.monthKey, 12));
  const monthTransactions = filterByMonth(data.transactions, data.monthKey);
  const currentTotal = sumExpenses(monthTransactions);
  const previousTotal = sumExpenses(
    filterByMonth(data.transactions, addMonths(data.monthKey, -1)),
  );
  const changeRatio = previousTotal > 0 ? (currentTotal - previousTotal) / previousTotal : null;

  const categorySummaries = buildCategorySummaries(data.transactions, data.categories, {
    monthKey: data.monthKey,
    previousMonthKeys: lastMonths(addMonths(data.monthKey, -1), 3),
  });
  const merchants = topMerchants(monthTransactions, 8);

  return (
    <>
      <PageHeader
        title="Ausgaben"
        description="Wohin dein Geld fließt — im Verlauf und nach Kategorien."
        action={<MonthPicker monthKey={data.monthKey} />}
      />

      {!data.hasAnyTransactions ? (
        <EmptyState />
      ) : (
        <div className="animate-rise space-y-4 md:space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="card-elevated">
              <CardContent className="space-y-1 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ausgaben {formatMonth(data.monthKey)}
                </p>
                <Amount
                  value={currentTotal}
                  tone="expense"
                  className="block text-2xl font-semibold tracking-tight"
                />
                {changeRatio !== null ? (
                  <p className="text-xs text-muted-foreground">
                    {formatSignedPercent(changeRatio)} gegenüber dem Vormonat (
                    {formatCurrency(previousTotal)})
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="space-y-1 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Größte Kategorie
                </p>
                <p className="truncate text-2xl font-semibold tracking-tight">
                  {categorySummaries[0]?.name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {categorySummaries[0]
                    ? `${formatCurrency(categorySummaries[0].total)} · ${monthTransactions.filter((t) => t.amount < 0).length} Buchungen insgesamt`
                    : "Keine Ausgaben in diesem Monat"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Ausgabenverlauf</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
              <TrendChart data={series} metric="expenses" color="#f43f5e" label="Ausgaben" />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Verteilung nach Kategorie</CardTitle>
              </CardHeader>
              <CardContent>
                {categorySummaries.length ? (
                  <CategoryPieChart data={categorySummaries} />
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Keine Ausgaben in diesem Monat.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Größte Ausgabenquellen</CardTitle>
              </CardHeader>
              <CardContent>
                {merchants.length ? (
                  <ul className="space-y-3">
                    {merchants.map((merchant) => (
                      <li key={merchant.name} className="flex items-center gap-3 text-sm">
                        <span className="min-w-0 flex-1 truncate">{merchant.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {merchant.count}×
                        </span>
                        <span className="w-24 shrink-0 text-right font-medium tabular-nums">
                          {formatCurrency(merchant.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Keine Ausgaben in diesem Monat.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
