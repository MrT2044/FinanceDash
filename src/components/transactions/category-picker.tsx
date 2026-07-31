"use client";

import { useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
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
  const [isPending, startTransition] = useTransition();
  const current = categories.find((category) => category.id === categoryId);

  const assign = (nextCategoryId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("transactionId", transactionId);
      formData.set("categoryId", nextCategoryId);
      formData.set("learn", "true");
      await updateTransactionCategoryAction(formData);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            className="-ml-1.5 max-w-[11rem] justify-start gap-1.5 font-normal"
          />
        }
      >
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: current?.color ?? "#94a3b8" }}
        />
        <span className="truncate">{current?.name ?? "Zuordnen"}</span>
        <ChevronDown className="ml-auto size-3 shrink-0 opacity-50" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Kategorie wählen</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {categories.map((category) => (
          <DropdownMenuItem key={category.id} onClick={() => assign(category.id)}>
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="truncate">{category.name}</span>
            {category.id === categoryId ? <Check className="ml-auto size-3.5" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal text-[11px] leading-snug">
          Deine Auswahl wird gemerkt: künftige Buchungen desselben Händlers werden
          automatisch so einsortiert.
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
