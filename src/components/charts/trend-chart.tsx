"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrencyCompact, formatMonthShort } from "@/lib/utils/format";
import type { MonthlySummary } from "@/lib/analytics/types";
import { CurrencyTooltip } from "./chart-tooltip";

export function TrendChart({
  data,
  metric,
  color,
  label,
}: {
  data: MonthlySummary[];
  metric: "income" | "expenses" | "net";
  color: string;
  label: string;
}) {
  const chartData = data.map((entry) => ({
    month: formatMonthShort(entry.monthKey),
    [label]: entry[metric],
  }));

  const gradientId = `gradient-${metric}`;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          className="text-xs fill-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(value: number) => formatCurrencyCompact(value)}
          className="text-xs fill-muted-foreground"
        />
        <Tooltip content={<CurrencyTooltip />} />
        <Area
          type="monotone"
          dataKey={label}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
