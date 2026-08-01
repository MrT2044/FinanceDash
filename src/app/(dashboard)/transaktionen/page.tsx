import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Amount } from "@/components/ui/amount";
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
import { resolveMonthKey } from "@/lib/analytics/month";
import { filterByMonth } from "@/lib/analytics/kpi";
import { formatDate } from "@/lib/utils/format";

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
  const data = await loadDashboardData(await resolveMonthKey(monat));

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
        <div className="animate-rise">
          {/*
            Unter 768px hat eine fünfspaltige Tabelle keinen Platz und erzwingt
            seitliches Scrollen. Dort wird jede Buchung darum als Karte gezeigt.
          */}
          <ul className="space-y-2 md:hidden">
            {transactions.map((transaction) => (
              <li key={transaction.id}>
                <Card className="card-elevated" size="sm">
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {transaction.counterparty_name || "Unbekannt"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.booking_date)}
                        </p>
                      </div>
                      <Amount
                        value={transaction.amount}
                        className="shrink-0 text-sm font-semibold"
                      />
                    </div>

                    {transaction.purpose ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {transaction.purpose}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CategoryPicker
                        transactionId={transaction.id}
                        categoryId={transaction.category_id}
                        categories={data.categories}
                      />
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
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <Card className="card-elevated hidden md:block">
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
                      <TableRow
                        key={transaction.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
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
                        <TableCell className="text-right whitespace-nowrap">
                          <Amount
                            value={transaction.amount}
                            className="text-sm font-medium"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
