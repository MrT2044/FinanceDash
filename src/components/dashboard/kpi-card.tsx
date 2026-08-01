import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "positive" | "negative";
  /** Ist ein Ziel gesetzt, wird die ganze Karte zur Schaltfläche. */
  href?: string;
}) {
  const card = (
    <Card className={cn("card-elevated h-full", href && "hover:border-primary/30")}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p
            className={cn(
              "truncate text-2xl font-semibold tracking-tight tabular-nums",
              tone === "positive" && "text-positive",
              tone === "negative" && "text-negative",
            )}
          >
            {value}
          </p>
          {hint ? (
            <p className="flex items-center gap-0.5 text-xs text-muted-foreground">
              {hint}
              {href ? <ChevronRight className="size-3" /> : null}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
            tone === "positive" && "bg-positive/10 text-positive",
            tone === "negative" && "bg-negative/10 text-negative",
            tone === "neutral" && "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-label={`${label}: ${value} — Buchungen ansehen`}
    >
      {card}
    </Link>
  );
}
