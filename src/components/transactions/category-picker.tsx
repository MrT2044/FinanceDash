"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateTransactionCategoryAction } from "@/server/actions/transactions.actions";
import type { CategoryMeta } from "@/lib/analytics/types";

export function CategoryPicker({
  transactionId,
  categoryId,
  categories,
}: {
  transactionId: string;
  categoryId: string | null;
  categories: CategoryMeta[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  /**
   * Zeigt die Auswahl sofort an. `useOptimistic` fällt am Ende der Transition
   * automatisch auf den Wert aus den Props zurück — schlägt das Speichern fehl,
   * steht dort wieder die alte Kategorie, ohne dass wir sie selbst zurücksetzen.
   */
  const [optimisticId, setOptimisticId] = useOptimistic(categoryId);

  const current = categories.find((category) => category.id === optimisticId);

  const assign = (nextCategoryId: string) => {
    if (nextCategoryId === categoryId) return;
    setError(null);

    startTransition(async () => {
      setOptimisticId(nextCategoryId);

      const formData = new FormData();
      formData.set("transactionId", transactionId);
      formData.set("categoryId", nextCategoryId);
      formData.set("learn", "true");

      const result = await updateTransactionCategoryAction(formData);

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
              className="-ml-1.5 h-9 max-w-[11rem] justify-start gap-1.5 font-normal"
            />
          }
        >
          {isPending ? (
            <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: current?.color ?? "var(--muted-foreground)" }}
            />
          )}
          <span className="truncate">{current?.name ?? "Zuordnen"}</span>
          <ChevronDown className="ml-auto size-3 shrink-0 opacity-50" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="max-h-[60vh] w-64">
          <DropdownMenuLabel>Kategorie wählen</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {categories.map((category) => (
            <DropdownMenuItem
              key={category.id}
              className="min-h-9"
              onClick={() => assign(category.id)}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="truncate">{category.name}</span>
              {category.id === optimisticId ? (
                <Check className="ml-auto size-3.5" />
              ) : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] leading-snug font-normal">
            Deine Auswahl wird gemerkt: künftige Buchungen desselben Händlers werden
            automatisch so einsortiert.
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
