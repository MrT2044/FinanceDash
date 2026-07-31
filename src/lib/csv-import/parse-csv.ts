import Papa from "papaparse";
import { decodeBuffer, detectFormat } from "./detect-format";
import { CsvImportError, type ParseResult, type RawRow } from "./types";

const MAX_ROWS = 20_000;

/**
 * Liest einen CSV-Buffer ein und liefert normalisierte Transaktionen.
 * Erkennt Encoding, Trennzeichen, Bankformat und die Position der Header-Zeile.
 */
export function parseCsv(buffer: Buffer): ParseResult {
  const content = decodeBuffer(buffer);
  if (!content.trim()) {
    throw new CsvImportError("Die Datei ist leer.");
  }

  const { parser, headerLineIndex, delimiter } = detectFormat(content);

  // Meta-Zeilen vor der Tabelle abschneiden.
  const tableContent = content.split(/\r?\n/).slice(headerLineIndex).join("\n");

  const result = Papa.parse<RawRow>(tableContent, {
    header: true,
    delimiter,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^"|"$/g, "").trim(),
  });

  if (!result.data.length) {
    throw new CsvImportError(
      "In der Datei wurden keine Buchungen gefunden. Bitte prüfe, ob es sich um einen Umsatzexport handelt.",
    );
  }

  if (result.data.length > MAX_ROWS) {
    throw new CsvImportError(
      `Die Datei enthält mehr als ${MAX_ROWS.toLocaleString("de-DE")} Zeilen. Bitte teile den Export in kleinere Zeiträume auf.`,
    );
  }

  const transactions = [];
  const warnings: string[] = [];
  let skippedRows = 0;

  for (const [index, row] of result.data.entries()) {
    let parsed = null;
    try {
      parsed = parser.parseRow(row);
    } catch {
      parsed = null;
    }

    if (parsed) {
      transactions.push(parsed);
    } else {
      skippedRows += 1;
      if (warnings.length < 5) {
        warnings.push(`Zeile ${index + 2} konnte nicht gelesen werden und wurde übersprungen.`);
      }
    }
  }

  if (!transactions.length) {
    throw new CsvImportError(
      "Es konnten keine Buchungen gelesen werden. Möglicherweise wird das Format dieser Bank noch nicht unterstützt.",
    );
  }

  return {
    bankType: parser.bankType,
    bankLabel: parser.label,
    transactions,
    skippedRows,
    warnings,
  };
}
