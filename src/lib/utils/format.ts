const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("de-DE", {
  style: "percent",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
});

const shortMonthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "short",
  year: "2-digit",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCurrencyCompact(value: number): string {
  return compactCurrencyFormatter.format(value);
}

export function formatPercent(ratio: number): string {
  return percentFormatter.format(ratio);
}

/** Formatiert eine Veränderung mit Vorzeichen, z.B. "+25,4 %". */
export function formatSignedPercent(ratio: number): string {
  const formatted = percentFormatter.format(Math.abs(ratio));
  return `${ratio >= 0 ? "+" : "−"}${formatted}`;
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00`));
}

/** monthKey im Format "2026-07". */
export function formatMonth(monthKey: string): string {
  return monthFormatter.format(new Date(`${monthKey}-01T00:00:00`));
}

export function formatMonthShort(monthKey: string): string {
  return shortMonthFormatter.format(new Date(`${monthKey}-01T00:00:00`));
}
