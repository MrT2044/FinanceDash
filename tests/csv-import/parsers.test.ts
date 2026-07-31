import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseCsv } from "@/lib/csv-import/parse-csv";
import { computeDedupeHash, dedupeWithinFile } from "@/lib/csv-import/deduplicate";

function loadFixture(name: string): Buffer {
  return readFileSync(join(__dirname, "..", "fixtures", name));
}

describe("Sparkasse", () => {
  const result = parseCsv(loadFixture("sparkasse-sample.csv"));

  it("erkennt das Format", () => {
    expect(result.bankType).toBe("sparkasse");
    expect(result.transactions).toHaveLength(4);
  });

  it("normalisiert Datum und deutschen Tausenderpunkt", () => {
    const salary = result.transactions.find((t) => t.amount > 0)!;
    expect(salary.bookingDate).toBe("2026-07-01");
    expect(salary.amount).toBe(2450);
  });

  it("übernimmt Ausgaben mit negativem Vorzeichen", () => {
    const rewe = result.transactions.find((t) =>
      t.counterpartyName.includes("REWE"),
    )!;
    expect(rewe.amount).toBe(-42.37);
    expect(rewe.counterpartyIban).toBe("DE89370400440532013000");
  });
});

describe("DKB", () => {
  const result = parseCsv(loadFixture("dkb-sample.csv"));

  it("überspringt die Metazeilen vor der Tabelle", () => {
    expect(result.bankType).toBe("dkb");
    expect(result.transactions).toHaveLength(4);
  });

  it("wählt bei Ausgaben den Zahlungsempfänger als Händler", () => {
    const edeka = result.transactions.find((t) => t.amount === -63.18)!;
    expect(edeka.counterpartyName).toBe("EDEKA Sued");
  });

  it("wählt bei Einnahmen den Zahlungspflichtigen als Gegenpart", () => {
    const salary = result.transactions.find((t) => t.amount > 0)!;
    expect(salary.counterpartyName).toBe("Muster GmbH");
  });
});

describe("ING", () => {
  const result = parseCsv(loadFixture("ing-sample.csv"));

  it("erkennt das Format trotz vorangestelltem Kopfblock", () => {
    expect(result.bankType).toBe("ing");
    expect(result.transactions).toHaveLength(4);
  });

  it("liest Beträge ohne Tausenderpunkt korrekt", () => {
    const shell = result.transactions.find((t) =>
      t.counterpartyName.includes("Shell"),
    )!;
    expect(shell.amount).toBe(-72.3);
  });
});

describe("comdirect", () => {
  const result = parseCsv(loadFixture("comdirect-sample.csv"));

  it("erkennt das Format", () => {
    expect(result.bankType).toBe("comdirect");
    expect(result.transactions).toHaveLength(4);
  });

  it("extrahiert Empfänger und Zweck aus dem kombinierten Buchungstext", () => {
    const lidl = result.transactions.find((t) => t.amount === -27.84)!;
    expect(lidl.counterpartyName).toBe("LIDL DIENSTLEISTUNG");
    expect(lidl.purpose).toBe("LIDL SAGT DANKE");
  });
});

describe("Volksbank", () => {
  const result = parseCsv(loadFixture("volksbank-sample.csv"));

  it("erkennt das Format", () => {
    expect(result.bankType).toBe("volksbank");
    expect(result.transactions).toHaveLength(3);
  });

  it("liest den Zahlungsbeteiligten als Händler", () => {
    const kaufland = result.transactions.find((t) => t.amount === -84.21)!;
    expect(kaufland.counterpartyName).toBe("KAUFLAND");
  });
});

describe("Duplikaterkennung", () => {
  it("erzeugt für identische Buchungen denselben Hash", () => {
    const first = parseCsv(loadFixture("sparkasse-sample.csv")).transactions[0];
    const second = parseCsv(loadFixture("sparkasse-sample.csv")).transactions[0];

    expect(computeDedupeHash("konto-1", first)).toBe(
      computeDedupeHash("konto-1", second),
    );
  });

  it("unterscheidet Buchungen verschiedener Konten", () => {
    const transaction = parseCsv(loadFixture("sparkasse-sample.csv")).transactions[0];

    expect(computeDedupeHash("konto-1", transaction)).not.toBe(
      computeDedupeHash("konto-2", transaction),
    );
  });

  it("entfernt Duplikate innerhalb einer Datei", () => {
    const transactions = parseCsv(loadFixture("sparkasse-sample.csv")).transactions;
    const withHashes = [...transactions, transactions[0]].map((transaction) => ({
      ...transaction,
      dedupeHash: computeDedupeHash("konto-1", transaction),
    }));

    const { unique, duplicateCount } = dedupeWithinFile(withHashes);
    expect(unique).toHaveLength(transactions.length);
    expect(duplicateCount).toBe(1);
  });
});
