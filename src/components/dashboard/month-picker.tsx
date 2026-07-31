"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addMonths, currentMonthKey } from "@/lib/utils/date";
import { formatMonth } from "@/lib/utils/format";

export function MonthPicker({ monthKey }: { monthKey: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = (target: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("monat", target);
    router.push(`${pathname}?${params.toString()}`);
  };

  const isCurrent = monthKey >= currentMonthKey();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/60 p-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Vorheriger Monat"
        onClick={() => navigate(addMonths(monthKey, -1))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[9.5rem] text-center text-sm font-medium">
        {formatMonth(monthKey)}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Nächster Monat"
        disabled={isCurrent}
        onClick={() => navigate(addMonths(monthKey, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
