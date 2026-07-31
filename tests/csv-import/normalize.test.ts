import { describe, expect, it } from "vitest";
import {
  applyDebitCreditFlag,
  deriveMerchantName,
  extractIban,
  parseGermanAmount,
  parseGermanDate,
} from "@/lib/csv-import/normalize";

describe("parseGermanDate", () => {
  it("liest deutsches Datumsformat", () => {
    expect(parseGermanDate("03.07.2026")).toBe("2026-07-03");
    expect(parseGermanDate("3.7.2026")).toBe("2026-07-03");
  });

  it("ergänzt zweistellige Jahre", () => {
    expect(parseGermanDate("03.07.26")).toBe("2026-07-03");
  });

  it("akzeptiert bereits normalisierte ISO-Daten", () => {
    expect(parseGermanDate("2026-07-03")).toBe("2026-07-03");
  });

  it("gibt null bei ungültigen Werten zurück", () => {
    expect(parseGermanDate("")).toBeNull();
    expect(parseGermanDate("kein Datum")).toBeNull();
    expect(parseGermanDate("32.13.2026")).toBeNull();
  });
});

describe("parseGermanAmount", () => {
  it("liest deutsches Zahlenformat mit Tausenderpunkt", () => {
    expect(parseGermanAmount("1.234,56")).toBe(1234.56);
    expect(parseGermanAmount("-45,00")).toBe(-45);
  });

  it("liest englisches Zahlenformat", () => {
    expect(parseGermanAmount("1234.56")).toBe(1234.56);
    expect(parseGermanAmount("1,234.56")).toBe(1234.56);
  });

  it("entfernt Währungszeichen und Leerzeichen", () => {
    expect(parseGermanAmount("1 234,56 EUR")).toBe(1234.56);
    expect(parseGermanAmount("€ -12,00")).toBe(-12);
  });

  it("gibt null bei ungültigen Werten zurück", () => {
    expect(parseGermanAmount("")).toBeNull();
    expect(parseGermanAmount("k.A.")).toBeNull();
  });
});

describe("applyDebitCreditFlag", () => {
  it("macht Soll-Buchungen negativ", () => {
    expect(applyDebitCreditFlag(50, "S")).toBe(-50);
    expect(applyDebitCreditFlag(-50, "S")).toBe(-50);
  });

  it("macht Haben-Buchungen positiv", () => {
    expect(applyDebitCreditFlag(-50, "H")).toBe(50);
  });

  it("lässt den Betrag ohne Kennzeichen unverändert", () => {
    expect(applyDebitCreditFlag(-50, undefined)).toBe(-50);
  });
});

describe("deriveMerchantName", () => {
  it("bevorzugt das explizite Empfängerfeld", () => {
    expect(deriveMerchantName("REWE Markt GmbH", "irgendein Zweck")).toBe(
      "REWE Markt GmbH",
    );
  });

  it("entfernt Referenz-Rauschen aus dem Verwendungszweck", () => {
    const result = deriveMerchantName(
      null,
      "SVWZ+NETFLIX ABO MREF+NFX998877 CRED+NL39ZZZ342359570000",
    );
    expect(result).toContain("NETFLIX");
    expect(result).not.toContain("MREF");
    expect(result).not.toContain("NL39ZZZ342359570000");
  });

  it("kürzt am ersten Trennzeichen", () => {
    expect(deriveMerchantName(null, "ALDI SUED/Muenchen/DE")).toBe("ALDI SUED");
  });
});

describe("extractIban", () => {
  it("findet eine IBAN im Text", () => {
    expect(extractIban("Ref DE89370400440532013000 Ende")).toBe(
      "DE89370400440532013000",
    );
  });

  it("ignoriert Werte ohne IBAN", () => {
    expect(extractIban("kein Konto", null, undefined)).toBeNull();
  });
});
