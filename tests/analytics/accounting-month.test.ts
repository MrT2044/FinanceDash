import { describe, expect, it } from "vitest";
import {
  buildMonthlySeries,
  computeKpis,
  effectiveMonthKey,
  filterByMonth,
} from "@/lib/analytics/kpi";
import type { TransactionRecord } from "@/lib/analytics/types";

function buchung(overrides: Partial<TransactionRecord> = {}): TransactionRecord {
  return {
    id: crypto.randomUUID(),
    booking_date: "2026-07-31",
    amount: -50,
    purpose: null,
    counterparty_name: null,
    category_id: null,
    category_source: "uncategorized",
    account_id: "konto-1",
    accounting_month: null,
    ...overrides,
  };
}

describe("Abweichender Abrechnungsmonat", () => {
  it("nutzt ohne Zuordnung den Monat des Buchungsdatums", () => {
    expect(effectiveMonthKey(buchung({ booking_date: "2026-07-31" }))).toBe("2026-07");
  });

  it("nutzt die Zuordnung, wenn eine gesetzt ist", () => {
    expect(
      effectiveMonthKey(
        buchung({ booking_date: "2026-07-31", accounting_month: "2026-08" }),
      ),
    ).toBe("2026-08");
  });

  /*
   * Der eigentliche Anwendungsfall: Gehalt am 31. Juli gebucht, zaehlt zum
   * August. Es darf dann ausschliesslich im August auftauchen.
   */
  it("verschiebt eine Buchung vollständig in den zugeordneten Monat", () => {
    const gehalt = buchung({
      booking_date: "2026-07-31",
      amount: 3000,
      accounting_month: "2026-08",
    });
    const miete = buchung({ booking_date: "2026-07-05", amount: -900 });

    expect(filterByMonth([gehalt, miete], "2026-07")).toEqual([miete]);
    expect(filterByMonth([gehalt, miete], "2026-08")).toEqual([gehalt]);
  });

  it("berücksichtigt die Zuordnung in den Kennzahlen", () => {
    const transactions = [
      buchung({ booking_date: "2026-07-31", amount: 3000, accounting_month: "2026-08" }),
      buchung({ booking_date: "2026-08-03", amount: -600 }),
    ];

    const juli = computeKpis(transactions, "2026-07", 0);
    expect(juli.monthIncome).toBe(0);

    const august = computeKpis(transactions, "2026-08", 0);
    expect(august.monthIncome).toBe(3000);
    expect(august.monthExpenses).toBe(600);
  });

  it("berücksichtigt die Zuordnung im Monatsverlauf", () => {
    const serie = buildMonthlySeries(
      [buchung({ booking_date: "2026-07-31", amount: 3000, accounting_month: "2026-08" })],
      ["2026-07", "2026-08"],
    );

    expect(serie.find((m) => m.monthKey === "2026-07")?.income).toBe(0);
    expect(serie.find((m) => m.monthKey === "2026-08")?.income).toBe(3000);
  });
});
