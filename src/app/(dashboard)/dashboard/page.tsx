import type { Metadata } from "next";
import { Suspense } from "react";
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { loadDashboardData } from "@/lib/analytics/load";
import {
  buildCategorySummaries,
  buildMonthlySeries,
  computeKpis,
  filterByMonth,
} from "@/lib/analytics/kpi";
import { createClient } from "@/lib/supabase/server";
import { addMonths, lastMonths } from "@/lib/utils/date";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Übersicht — FinanceDash" };

async function DashboardContent({ monthKey }: { monthKey?: string }) {
  const data = await loadDashboardData(monthKey);

  if (!data.hasAnyTransactions) {
    return <EmptyState />;
  }

  const kpis = computeKpis(data.transactions, data.monthKey, data.balance);
  const series = buildMonthlySeries(data.transactions, lastMonths(data.monthKey, 6));
  const categorySummaries = buildCategorySummaries(data.transactions, data.categories, {
    monthKey: data.monthKey,
    previousMonthKeys: lastMonths(addMonths(data.monthKey, -1), 3),
  });
  const monthTransactions = filterByMonth(data.transactions, data.monthKey);

  const supabase = await createClient();
  const { data: recommendations } = await supabase
    .from("recommendations")
    .select("id, title, description, severity")
    .eq("dismissed", false)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Kontostand"
          value={formatCurrency(kpis.balance)}
          hint="Summe aller importierten Buchungen"
          icon={Wallet}
          tone={kpis.balance < 0 ? "negative" : "neutral"}
        />
        <KpiCard
          label="Einnahmen"
          value={formatCurrency(kpis.monthIncome)}
          hint="in diesem Monat"
          icon={TrendingUp}
          tone="positive"
        />
        <KpiCard
          label="Ausgaben"
          value={formatCurrency(kpis.monthExpenses)}
          hint="in diesem Monat"
          icon={TrendingDown}
          tone="negative"
        />
        <KpiCard
          label="Sparrate"
          value={kpis.savingsRate === null ? "—" : formatPercent(kpis.savingsRate)}
          hint={`Verfügbar: ${formatCurrency(kpis.available)}`}
          icon={PiggyBank}
          tone={kpis.available < 0 ? "negative" : "positive"}
        />
      </div>

      {recommendations?.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation as never}
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-border/60 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Einnahmen &amp; Ausgaben</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <IncomeExpenseChart data={series} />
          </CardContent>
        </Card>

        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ausgaben nach Kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            {categorySummaries.length ? (
              <CategoryPieChart data={categorySummaries} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Für diesen Monat liegen keine Ausgaben vor.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <RecentTransactions
        transactions={monthTransactions.length ? monthTransactions : data.transactions}
        categories={data.categories}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[104px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-[360px] rounded-xl lg:col-span-3" />
        <Skeleton className="h-[360px] rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ monat?: string }>;
}) {
  const { monat } = await searchParams;

  return (
    <>
      <PageHeader
        title="Übersicht"
        description="Deine Finanzen auf einen Blick."
        action={<MonthPicker monthKey={monat ?? new Date().toISOString().slice(0, 7)} />}
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent monthKey={monat} />
      </Suspense>
    </>
  );
}
