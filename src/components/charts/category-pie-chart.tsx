"use client";

import { useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  type PieSectorShapeProps,
} from "recharts";
import type { CategorySummary } from "@/lib/analytics/types";
import { Amount } from "@/components/ui/amount";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

/**
 * Segmentform des Kuchendiagramms.
 *
 * Der aktive Zustand wird kreisförmig hervorgehoben: Das Segment wächst nach
 * außen und bekommt einen schmalen, ebenfalls gebogenen Begleitring. Der von
 * Recharts sonst gezeichnete rechteckige Fokusrahmen passt nicht zur Kreisform
 * und ist deshalb per `outline-none` abgeschaltet.
 */
function CategorySector(props: PieSectorShapeProps) {
  const { isActive, outerRadius = 0, innerRadius = 0, fill } = props;

  if (!isActive) {
    return <Sector {...props} className="outline-none" />;
  }

  return (
    <g className="outline-none">
      <Sector
        {...props}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 5}
        className="outline-none"
      />
      <Sector
        {...props}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
        opacity={0.4}
        className="outline-none"
      />
    </g>
  );
}

export function CategoryPieChart({ data }: { data: CategorySummary[] }) {
  const chartData = data.slice(0, 8);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ResponsiveContainer width="100%" height={220} className="sm:max-w-[220px]">
        <PieChart className="[&_*]:outline-none">
          <Pie
            data={chartData}
            dataKey="total"
            nameKey="name"
            innerRadius={54}
            outerRadius={82}
            paddingAngle={2}
            cornerRadius={4}
            strokeWidth={0}
            shape={CategorySector}
            animationDuration={450}
            onMouseEnter={(_, index) => setActiveSlug(chartData[index]?.slug ?? null)}
            onMouseLeave={() => setActiveSlug(null)}
          >
            {chartData.map((entry) => (
              <Cell key={entry.slug} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const entry = payload[0].payload as CategorySummary;
              return (
                <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 text-xs shadow-[var(--shadow-soft-md)]">
                  <p className="font-medium text-popover-foreground">{entry.name}</p>
                  <p className="text-muted-foreground">
                    <Amount value={entry.total} tone="neutral" /> ·{" "}
                    {formatPercent(entry.share)}
                  </p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="flex-1 space-y-0.5">
        {chartData.map((entry) => (
          <li
            key={entry.slug}
            onMouseEnter={() => setActiveSlug(entry.slug)}
            onMouseLeave={() => setActiveSlug(null)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors duration-200",
              activeSlug === entry.slug && "bg-muted",
            )}
          >
            <span
              className="size-2.5 shrink-0 rounded-full transition-transform duration-200"
              style={{
                backgroundColor: entry.color,
                transform: activeSlug === entry.slug ? "scale(1.3)" : undefined,
              }}
            />
            <span className="min-w-0 flex-1 truncate">{entry.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatPercent(entry.share)}
            </span>
            <Amount
              value={entry.total}
              tone="neutral"
              className="w-24 shrink-0 text-right font-medium"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
