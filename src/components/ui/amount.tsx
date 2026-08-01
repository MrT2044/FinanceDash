import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

export type AmountTone = "auto" | "expense" | "income" | "neutral";

/**
 * Einzige Stelle, an der über die Farbe eines Geldbetrags entschieden wird.
 *
 * Projektkonvention: negativ = Ausgabe, positiv = Einnahme. `auto` färbt danach
 * ein. Aggregierte Ausgabensummen werden im Projekt als positive Zahl geführt
 * (siehe `sumExpenses`) — dafür gibt es `tone="expense"`, damit sie trotzdem
 * rot erscheinen und nicht fälschlich als Einnahme gelesen werden.
 */
export function Amount({
  value,
  tone = "auto",
  className,
  signed = false,
}: {
  value: number;
  tone?: AmountTone;
  className?: string;
  /** Erzwingt ein sichtbares Pluszeichen bei positiven Werten. */
  signed?: boolean;
}) {
  const resolved =
    tone === "auto" ? (value < 0 ? "expense" : value > 0 ? "income" : "neutral") : tone;

  const formatted = formatCurrency(value);

  return (
    <span
      className={cn(
        "tabular-nums",
        resolved === "expense" && "text-negative",
        resolved === "income" && "text-positive",
        resolved === "neutral" && "text-foreground",
        className,
      )}
    >
      {signed && value > 0 ? "+" : ""}
      {formatted}
    </span>
  );
}
