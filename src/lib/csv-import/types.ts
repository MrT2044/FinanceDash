import type { BankType } from "@/types/database.types";

/** Eine geparste, aber noch nicht normalisierte CSV-Zeile. */
export type RawRow = Record<string, string>;

/**
 * Vereinheitlichte Transaktion nach dem Parsen.
 * amount: negativ = Ausgabe, positiv = Einnahme (unabhängig vom Bankformat).
 */
export type ParsedTransaction = {
  bookingDate: string;
  valueDate: string | null;
  amount: number;
  currency: string;
  purpose: string;
  counterpartyName: string;
  counterpartyIban: string | null;
};

export type BankParser = {
  bankType: BankType;
  label: string;
  /** Header-Fragmente, an denen das Format erkannt wird (lowercase). */
  signatures: string[][];
  /** Zeilen vor der eigentlichen Tabelle, die übersprungen werden. */
  findHeaderLine?: (lines: string[]) => number;
  parseRow: (row: RawRow) => ParsedTransaction | null;
};

export type ParseResult = {
  bankType: BankType;
  bankLabel: string;
  transactions: ParsedTransaction[];
  skippedRows: number;
  /** Fehler, die einzelne Zeilen betreffen, aber den Import nicht abbrechen. */
  warnings: string[];
};

export class CsvImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvImportError";
  }
}
