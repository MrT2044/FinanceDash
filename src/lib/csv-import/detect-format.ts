import iconv from "iconv-lite";
import { bankParsers, genericParser } from "./parsers";
import { headerMatches } from "./parsers/column-lookup";
import type { BankParser } from "./types";

/**
 * Deutsche Bankexporte sind häufig Windows-1252/ISO-8859-1 kodiert.
 * Erkennung über die UTF-8-BOM bzw. über typische Fehlzeichen nach einem
 * UTF-8-Dekodierversuch.
 */
export function decodeBuffer(buffer: Buffer): string {
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf8");
  }

  const utf8 = buffer.toString("utf8");
  // U+FFFD entsteht, wenn Bytes keine gültige UTF-8-Sequenz bilden.
  if (utf8.includes("�")) {
    return iconv.decode(buffer, "win1252");
  }

  return utf8;
}

/** Ermittelt das Trennzeichen anhand der Häufigkeit in den Kopfzeilen. */
export function detectDelimiter(sample: string): string {
  const candidates = [";", ",", "\t", "|"];
  const lines = sample.split(/\r?\n/).slice(0, 15).filter(Boolean);

  let best = ";";
  let bestScore = -1;

  for (const candidate of candidates) {
    const counts = lines.map(
      (line) => line.split(candidate).length - 1,
    );
    const max = Math.max(0, ...counts);
    // Ein gutes Trennzeichen kommt in mehreren Zeilen gleich oft vor.
    const consistent = counts.filter((count) => count === max && count > 0).length;
    const score = max * consistent;

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

export type FormatDetection = {
  parser: BankParser;
  /** 0-basierter Index der Header-Zeile (Bankexporte haben oft Meta-Zeilen davor). */
  headerLineIndex: number;
  delimiter: string;
};

/**
 * Erkennt Bank, Header-Zeile und Trennzeichen. Bankexporte enthalten häufig
 * mehrere Meta-Zeilen (Kontoinhaber, Zeitraum, Saldo) vor der eigentlichen
 * Tabelle, daher wird die Header-Zeile gesucht statt angenommen.
 */
export function detectFormat(content: string): FormatDetection {
  const delimiter = detectDelimiter(content);
  const lines = content.split(/\r?\n/);
  const searchDepth = Math.min(lines.length, 25);

  for (let index = 0; index < searchDepth; index += 1) {
    const line = lines[index];
    if (!line?.trim()) continue;

    const headers = line.split(delimiter).map((cell) => cell.replace(/^"|"$/g, "").trim());
    if (headers.length < 3) continue;

    for (const parser of bankParsers) {
      if (parser.signatures.some((signature) => headerMatches(headers, signature))) {
        return { parser, headerLineIndex: index, delimiter };
      }
    }
  }

  // Kein Bankformat erkannt: erste Zeile mit Datums- und Betragsspalte nutzen.
  for (let index = 0; index < searchDepth; index += 1) {
    const line = lines[index];
    if (!line?.trim()) continue;

    const headers = line.split(delimiter).map((cell) => cell.replace(/^"|"$/g, "").trim());
    const hasDate = headerMatches(headers, ["Buchungstag"]) ||
      headerMatches(headers, ["Datum"]) ||
      headerMatches(headers, ["Date"]) ||
      headerMatches(headers, ["Buchung"]);
    const hasAmount = headerMatches(headers, ["Betrag"]) ||
      headerMatches(headers, ["Amount"]) ||
      headerMatches(headers, ["Umsatz"]);

    if (hasDate && hasAmount) {
      return { parser: genericParser, headerLineIndex: index, delimiter };
    }
  }

  return { parser: genericParser, headerLineIndex: 0, delimiter };
}
