import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/dashboard/page-header";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { EmptyState } from "@/components/dashboard/empty-state";
import { loadDashboardData } from "@/lib/analytics/load";
import { buildCategorySummaries } from "@/lib/analytics/kpi";
import { addMonths, lastMonths } from "@/lib/utils/date";
import { formatCurrency, formatPercent, formatSignedPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Kategorien — FinanceDash" };

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ monat?: string }>;
}) {
  const { monat } = await searchParams;
  const data = await loadDashboardData(monat);

  const summaries = buildCategorySummaries(data.transactions, data.categories, {
    monthKey: data.monthKey,
    previousMonthKeys: lastMonths(addMonths(data.monthKey, -1), 3),
  });

  return (
    <>
      <PageHeader
        title="Kategorien"
        description="Anteil, Entwicklung und Sparpotenzial je Kategorie."
        action={<MonthPicker monthKey={data.monthKey} />}
      />

      {!data.hasAnyTransactions ? (
        <EmptyState />
      ) : !summaries.length ? (
        <EmptyState
          title="Keine Ausgaben in diesem Monat"
          description="Wähle einen anderen Monat oder importiere weitere Umsätze."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {summaries.map((summary) => {
            // Sparpotenzial = Mehrausgabe gegenüber dem eigenen Durchschnitt.
            const potential = summary.averagePrevious
              ? Math.max(0, summary.total - summary.averagePrevious)
              : 0;

            return (
              <Card key={summary.slug} className="border-border/60">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: summary.color }}
                      />
                      <h2 className="truncate text-sm font-semibold">{summary.name}</h2>
                    </div>
                    <span className="shrink-0 text-base font-semibold tabular-nums">
                      {formatCurrency(summary.total)}
                    </span>
                  </div>

                  <Progress
                    value={summary.share * 100}
                    className="h-1.5"
                    aria-label={`Anteil ${summary.name}`}
                  />

                  <dl className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Anteil</dt>
                      <dd className="mt-0.5 font-medium tabular-nums">
                        {formatPercent(summary.share)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Entwicklung</dt>
                      <dd
                        className={cn(
                          "mt-0.5 font-medium tabular-nums",
                          summary.changeRatio !== null &&
                            summary.changeRatio > 0.05 &&
                            "text-rose-600 dark:text-rose-400",
                          summary.changeRatio !== null &&
                            summary.changeRatio < -0.05 &&
                            "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {summary.changeRatio === null
                          ? "—"
                          : formatSignedPercent(summary.changeRatio)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Sparpotenzial</dt>
                      <dd className="mt-0.5 font-medium tabular-nums">
                        {potential > 0 ? formatCurrency(potential) : "—"}
                      </dd>
                    </div>
                  </dl>

                  <p className="text-xs text-muted-foreground">
                    {summary.transactionCount}{" "}
                    {summary.transactionCount === 1 ? "Buchung" : "Buchungen"} · Schnitt der
                    Vormonate: {formatCurrency(summary.averagePrevious)}
                  </p>

                  <Link
                    href={`/transaktionen?kategorie=${summary.categoryId ?? "keine"}&monat=${data.monthKey}`}
                    className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Buchungen ansehen
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
