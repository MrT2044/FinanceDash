"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrencyCompact, formatMonthShort } from "@/lib/utils/format";
import type { MonthlySummary } from "@/lib/analytics/types";
import { CurrencyTooltip } from "./chart-tooltip";

export function IncomeExpenseChart({ data }: { data: MonthlySummary[] }) {
  const chartData = data.map((entry) => ({
    month: formatMonthShort(entry.monthKey),
    Einnahmen: entry.income,
    Ausgaben: entry.expenses,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
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
        <Tooltip content={<CurrencyTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "0.75rem", paddingTop: 8 }}
        />
        <Bar dataKey="Einnahmen" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="Ausgaben" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
