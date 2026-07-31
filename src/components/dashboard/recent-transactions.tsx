import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { CategoryMeta, TransactionRecord } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

export function RecentTransactions({
  transactions,
  categories,
}: {
  transactions: TransactionRecord[];
  categories: CategoryMeta[];
}) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return (
    <Card className="border-border/60">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Letzte Buchungen</CardTitle>
        <Link
          href="/transaktionen"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Alle ansehen
        </Link>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <ul className="divide-y divide-border/50">
          {transactions.slice(0, 8).map((transaction) => {
            const category = transaction.category_id
              ? categoryById.get(transaction.category_id)
              : undefined;

            return (
              <li key={transaction.id} className="flex items-center gap-3 px-3 py-2.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: category?.color ?? "#94a3b8" }}
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
                <span
                  className={cn(
                    "shrink-0 text-sm font-medium tabular-nums",
                    transaction.amount > 0 && "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {formatCurrency(transaction.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
