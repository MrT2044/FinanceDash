"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarSync, Check, Loader2, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateTransactionMonthAction } from "@/server/actions/transactions.actions";
import { addMonths, toMonthKey } from "@/lib/utils/date";
import { formatMonth } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

/**
 * Ordnet eine Buchung einem abweichenden Abrechnungsmonat zu.
 *
 * Zur Auswahl stehen die Monate rund um das Buchungsdatum — der typische Fall
 * ist eine Verschiebung um genau einen Monat (Gehalt am Monatsende). Eine freie
 * Datumsauswahl wäre hier mehr Aufwand als Nutzen.
 */
export function MonthAssignment({
  transactionId,
  bookingDate,
  accountingMonth,
}: {
  transactionId: string;
  bookingDate: string;
  accountingMonth: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const bookingMonth = toMonthKey(bookingDate);
  const current = accountingMonth ?? bookingMonth;
  const isOverridden = accountingMonth !== null && accountingMonth !== bookingMonth;

  // Zwei Monate vor bis zwei nach dem Buchungsmonat.
  const options = [-2, -1, 0, 1, 2].map((offset) => addMonths(bookingMonth, offset));

  const assign = (monthKey: string) => {
    const next = monthKey === bookingMonth ? "" : monthKey;
    if ((accountingMonth ?? "") === next) return;

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("transactionId", transactionId);
      formData.set("monthKey", next);

      const result = await updateTransactionMonthAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="min-w-0">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              className={cn(
                "-ml-1.5 h-9 max-w-[10rem] justify-start gap-1.5 font-normal",
                isOverridden && "text-primary",
              )}
            />
          }
        >
          {isPending ? (
            <Loader2 className="size-3 shrink-0 animate-spin" />
          ) : (
            <CalendarSync
              className={cn("size-3.5 shrink-0", !isOverridden && "opacity-50")}
            />
          )}
          <span className="truncate">{formatMonth(current)}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Zählt zum Monat</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {options.map((monthKey) => (
            <DropdownMenuItem
              key={monthKey}
              className="min-h-9"
              onClick={() => assign(monthKey)}
            >
              <span className="truncate">{formatMonth(monthKey)}</span>
              {monthKey === bookingMonth ? (
                <span className="ml-auto text-[11px] text-muted-foreground">
                  gebucht
                </span>
              ) : null}
              {monthKey === current && monthKey !== bookingMonth ? (
                <Check className="ml-auto size-3.5" />
              ) : null}
            </DropdownMenuItem>
          ))}

          {isOverridden ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-9" onClick={() => assign(bookingMonth)}>
                <RotateCcw className="size-3.5" />
                Zurücksetzen
              </DropdownMenuItem>
            </>
          ) : null}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] leading-snug font-normal">
            Nützlich für Gehalt, das am Monatsende eingeht, aber zum nächsten Monat
            zählen soll.
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>

      {error ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
