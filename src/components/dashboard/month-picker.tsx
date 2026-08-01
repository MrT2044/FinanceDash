"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setSelectedMonthAction } from "@/server/actions/preferences.actions";
import { addMonths, currentMonthKey } from "@/lib/utils/date";
import { formatMonth } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export function MonthPicker({ monthKey }: { monthKey: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  /**
   * Der Monat landet zusätzlich in einem Cookie. Dadurch übernehmen ihn auch
   * Bereiche, die man später ohne `?monat=` über die Navigation aufruft.
   */
  const navigate = (target: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("monat", target);

    startTransition(async () => {
      await setSelectedMonthAction(target);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      router.refresh();
    });
  };

  const isCurrent = monthKey >= currentMonthKey();

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-0.5 rounded-xl border border-border/70 bg-card/60 p-1 shadow-[var(--shadow-soft-xs)] backdrop-blur transition-opacity sm:w-auto sm:justify-start",
        isPending && "opacity-60",
      )}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        // Auf Touch-Geräten größer, damit die Trefferfläche sicher passt.
        className="size-10 md:size-7"
        aria-label="Vorheriger Monat"
        disabled={isPending}
        onClick={() => navigate(addMonths(monthKey, -1))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span
        aria-live="polite"
        className="min-w-[8.5rem] text-center text-sm font-medium tabular-nums sm:min-w-[9.5rem]"
      >
        {formatMonth(monthKey)}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="size-10 md:size-7"
        aria-label="Nächster Monat"
        disabled={isCurrent || isPending}
        onClick={() => navigate(addMonths(monthKey, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
