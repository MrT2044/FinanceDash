"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategorySummary } from "@/lib/analytics/types";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

export function CategoryPieChart({ data }: { data: CategorySummary[] }) {
  const chartData = data.slice(0, 8);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ResponsiveContainer width="100%" height={220} className="sm:max-w-[220px]">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="total"
            nameKey="name"
            innerRadius={58}
            outerRadius={90}
            paddingAngle={2}
            strokeWidth={0}
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
                <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="font-medium text-popover-foreground">{entry.name}</p>
                  <p className="text-muted-foreground">
                    {formatCurrency(entry.total)} · {formatPercent(entry.share)}
                  </p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="flex-1 space-y-2">
        {chartData.map((entry) => (
          <li key={entry.slug} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="min-w-0 flex-1 truncate">{entry.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatPercent(entry.share)}
            </span>
            <span className="w-24 shrink-0 text-right font-medium tabular-nums">
              {formatCurrency(entry.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
