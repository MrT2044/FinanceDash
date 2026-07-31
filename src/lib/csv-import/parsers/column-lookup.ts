import type { RawRow } from "../types";

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[äÄ]/g, "a")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Sucht einen Spaltenwert anhand normalisierter Kandidatennamen.
 * Banken variieren Schreibweisen zwischen Exportversionen (Umlaute, Klammern,
 * Leerzeichen), daher wird der Header normalisiert statt exakt verglichen.
 */
export function pick(row: RawRow, candidates: string[]): string | undefined {
  const normalizedCandidates = candidates.map(normalizeHeader);

  for (const [key, value] of Object.entries(row)) {
    if (normalizedCandidates.includes(normalizeHeader(key))) {
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    }
  }

  // Zweiter Durchlauf: Präfix-Treffer, z.B. "Betrag (EUR)" für Kandidat "Betrag".
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeHeader(key);
    if (normalizedCandidates.some((candidate) => normalizedKey.startsWith(candidate))) {
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    }
  }

  return undefined;
}

/** Prüft, ob eine Header-Zeile alle geforderten Spalten enthält. */
export function headerMatches(headers: string[], required: string[]): boolean {
  const normalized = headers.map(normalizeHeader);
  return required.every((candidate) => {
    const normalizedCandidate = normalizeHeader(candidate);
    return normalized.some((header) => header.startsWith(normalizedCandidate));
  });
}
