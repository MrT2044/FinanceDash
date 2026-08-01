import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Amount } from "@/components/ui/amount";
import { formatDate } from "@/lib/utils/format";
import type { CategoryMeta, TransactionRecord } from "@/lib/analytics/types";

export function RecentTransactions({
  transactions,
  categories,
}: {
  transactions: TransactionRecord[];
  categories: CategoryMeta[];
}) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return (
    <Card className="card-elevated">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Letzte Buchungen</CardTitle>
        <Link
          href="/transaktionen"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Alle ansehen
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <ul className="divide-y divide-border/50">
          {transactions.slice(0, 8).map((transaction) => {
            const category = transaction.category_id
              ? categoryById.get(transaction.category_id)
              : undefined;

            return (
              <li
                key={transaction.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: category?.color ?? "var(--muted-foreground)",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {transaction.counterparty_name || "Unbekannt"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDate(transaction.booking_date)} ·{" "}
                    {category?.name ?? "Nicht zugeordnet"}
                  </p>
                </div>
                <Amount
                  value={transaction.amount}
                  className="shrink-0 text-sm font-medium"
                />
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
