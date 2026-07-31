import { createHash } from "crypto";
import type { ParsedTransaction } from "./types";

/**
 * Stabiler Fingerabdruck einer Buchung. Grundlage der Duplikaterkennung:
 * derselbe Umsatz darf pro Konto nur einmal existieren, auch wenn die Datei
 * mehrfach hochgeladen oder Zeiträume überlappend exportiert werden.
 *
 * Der Verwendungszweck wird normalisiert, weil Banken Groß-/Kleinschreibung
 * und Leerzeichen zwischen Exportversionen unterschiedlich setzen.
 */
export function computeDedupeHash(
  accountId: string,
  transaction: ParsedTransaction,
): string {
  const normalizedPurpose = transaction.purpose
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const payload = [
    accountId,
    transaction.bookingDate,
    transaction.amount.toFixed(2),
    normalizedPurpose,
    transaction.counterpartyName.toLowerCase().trim(),
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Entfernt Duplikate innerhalb derselben Datei. Echte Doppelbuchungen (gleicher
 * Betrag, Tag und Zweck) sind in Bankexporten praktisch nicht von versehentlichen
 * Duplikaten unterscheidbar — hier wird bewusst dedupliziert, der Nutzer kann
 * fehlende Buchungen manuell ergänzen.
 */
export function dedupeWithinFile<T extends { dedupeHash: string }>(
  items: T[],
): { unique: T[]; duplicateCount: number } {
  const seen = new Set<string>();
  const unique: T[] = [];
  let duplicateCount = 0;

  for (const item of items) {
    if (seen.has(item.dedupeHash)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(item.dedupeHash);
    unique.push(item);
  }

  return { unique, duplicateCount };
}
