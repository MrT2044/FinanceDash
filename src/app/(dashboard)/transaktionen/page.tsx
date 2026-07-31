import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CategoryPicker } from "@/components/transactions/category-picker";
import { loadDashboardData } from "@/lib/analytics/load";
import { filterByMonth } from "@/lib/analytics/kpi";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Transaktionen — FinanceDash" };

const SOURCE_LABELS: Record<string, string> = {
  rule: "Regel",
  ai: "KI",
  manual: "Manuell",
  uncategorized: "Offen",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ monat?: string; kategorie?: string }>;
}) {
  const { monat, kategorie } = await searchParams;
  const data = await loadDashboardData(monat);

  let transactions = filterByMonth(data.transactions, data.monthKey);
  if (kategorie === "keine") {
    transactions = transactions.filter((transaction) => transaction.category_id === null);
  } else if (kategorie) {
    transactions = transactions.filter(
      (transaction) => transaction.category_id === kategorie,
    );
  }

  const uncategorizedCount = transactions.filter(
    (transaction) => transaction.category_id === null,
  ).length;

  return (
    <>
      <PageHeader
        title="Transaktionen"
        description={
          uncategorizedCount
            ? `${uncategorizedCount} ${uncategorizedCount === 1 ? "Buchung wartet" : "Buchungen warten"} noch auf eine Kategorie.`
            : "Alle Buchungen des gewählten Monats."
        }
        action={<MonthPicker monthKey={data.monthKey} />}
      />

      {!data.hasAnyTransactions ? (
        <EmptyState />
      ) : !transactions.length ? (
        <EmptyState
          title="Keine Buchungen gefunden"
          description="Für diesen Monat und Filter liegen keine Buchungen vor."
        />
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[6.5rem]">Datum</TableHead>
                    <TableHead>Händler / Zweck</TableHead>
                    <TableHead className="w-[12rem]">Kategorie</TableHead>
                    <TableHead className="w-[5.5rem]">Quelle</TableHead>
                    <TableHead className="w-[7.5rem] text-right">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(transaction.booking_date)}
                      </TableCell>
                      <TableCell className="max-w-0">
                        <p className="truncate text-sm font-medium">
                          {transaction.counterparty_name || "Unbekannt"}
                        </p>
                        {transaction.purpose ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {transaction.purpose}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <CategoryPicker
                          transactionId={transaction.id}
                          categoryId={transaction.category_id}
                          categories={data.categories}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.category_source === "uncategorized"
                              ? "outline"
                              : "secondary"
                          }
                          className="text-[11px] font-normal"
                        >
                          {SOURCE_LABELS[transaction.category_source] ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "whitespace-nowrap text-right text-sm font-medium tabular-nums",
                          transaction.amount > 0 && "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
