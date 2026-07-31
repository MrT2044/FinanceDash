import type { BankParser, ParsedTransaction, RawRow } from "../types";
import {
  applyDebitCreditFlag,
  cleanText,
  deriveMerchantName,
  extractIban,
  parseGermanAmount,
  parseGermanDate,
} from "../normalize";
import { pick } from "./column-lookup";

function buildTransaction(input: {
  bookingDate: string | undefined;
  valueDate?: string | undefined;
  amount: string | undefined;
  debitCreditFlag?: string | undefined;
  currency?: string | undefined;
  purpose: string | undefined;
  counterparty?: string | undefined;
  iban?: string | undefined;
}): ParsedTransaction | null {
  const bookingDate = parseGermanDate(input.bookingDate);
  const rawAmount = parseGermanAmount(input.amount);

  if (!bookingDate || rawAmount === null || rawAmount === 0) return null;

  const amount = applyDebitCreditFlag(rawAmount, input.debitCreditFlag);
  const purpose = cleanText(input.purpose);

  return {
    bookingDate,
    valueDate: parseGermanDate(input.valueDate),
    amount,
    currency: (input.currency?.trim() || "EUR").slice(0, 3).toUpperCase(),
    purpose: purpose.slice(0, 2000),
    counterpartyName: deriveMerchantName(input.counterparty, purpose),
    counterpartyIban: extractIban(input.iban),
  };
}

/**
 * Sparkasse (CSV-CAMT-Export). Führt Soll/Haben nicht separat, das Vorzeichen
 * steht direkt im Betragsfeld.
 */
const sparkasse: BankParser = {
  bankType: "sparkasse",
  label: "Sparkasse",
  // Signaturen müssen mindestens eine Spalte enthalten, die es nur bei dieser
  // Bank gibt — sonst greift der erste passende Parser auf ein fremdes Format zu.
  signatures: [
    ["Auftragskonto", "Buchungstag", "Betrag"],
    ["Beguenstigter/Zahlungspflichtiger", "Buchungstag"],
    ["Begünstigter/Zahlungspflichtiger", "Buchungstag"],
  ],
  parseRow: (row: RawRow) =>
    buildTransaction({
      bookingDate: pick(row, ["Buchungstag"]),
      valueDate: pick(row, ["Valutadatum", "Wertstellung"]),
      amount: pick(row, ["Betrag"]),
      currency: pick(row, ["Waehrung", "Währung"]),
      purpose: pick(row, ["Verwendungszweck"]),
      counterparty: pick(row, [
        "Beguenstigter/Zahlungspflichtiger",
        "Begünstigter/Zahlungspflichtiger",
      ]),
      iban: pick(row, ["Kontonummer/IBAN", "IBAN"]),
    }),
};

/** DKB, aktuelles Format (ab 2023) mit getrennten Zahlungspflichtigen-Feldern. */
const dkb: BankParser = {
  bankType: "dkb",
  label: "DKB",
  signatures: [
    ["Zahlungsempfänger", "Buchungsdatum"],
    ["Auftraggeber / Begünstigter", "Buchungstag"],
  ],
  parseRow: (row: RawRow) => {
    const amountValue = pick(row, ["Betrag (€)", "Betrag (EUR)", "Betrag"]);
    const parsedAmount = parseGermanAmount(amountValue);
    if (parsedAmount === null) return null;

    // Im neuen Format steht der Gegenpart je nach Richtung in einem anderen Feld.
    const counterparty =
      parsedAmount < 0
        ? pick(row, ["Zahlungsempfänger*in", "Zahlungsempfaenger*in", "Zahlungsempfänger"])
        : pick(row, ["Zahlungspflichtige*r", "Zahlungspflichtiger"]);

    return buildTransaction({
      bookingDate: pick(row, ["Buchungsdatum", "Buchungstag"]),
      valueDate: pick(row, ["Wertstellung"]),
      amount: amountValue,
      purpose: pick(row, ["Verwendungszweck"]),
      counterparty:
        counterparty ?? pick(row, ["Auftraggeber / Begünstigter", "Auftraggeber/Beguenstigter"]),
      iban: pick(row, ["IBAN", "Kontonummer"]),
    });
  },
};

/** ING (früher ING-DiBa). */
const ing: BankParser = {
  bankType: "ing",
  label: "ING",
  signatures: [["Auftraggeber/Empfänger", "Buchung", "Betrag"]],
  parseRow: (row: RawRow) =>
    buildTransaction({
      bookingDate: pick(row, ["Buchung", "Buchungstag"]),
      valueDate: pick(row, ["Valuta", "Valutadatum"]),
      amount: pick(row, ["Betrag"]),
      currency: pick(row, ["Währung", "Waehrung"]),
      purpose: pick(row, ["Verwendungszweck"]),
      counterparty: pick(row, ["Auftraggeber/Empfänger", "Auftraggeber/Empfaenger"]),
    }),
};

/**
 * Comdirect. Der Verwendungszweck steckt hier in einem kombinierten
 * Buchungstext-Feld, das zusätzlich den Empfänger enthält.
 */
const comdirect: BankParser = {
  bankType: "comdirect",
  label: "comdirect",
  signatures: [
    ["Umsatz in EUR", "Buchungstag"],
    ["Wertstellung (Valuta)", "Buchungstag", "Vorgang"],
  ],
  parseRow: (row: RawRow) => {
    const bookingText = pick(row, ["Buchungstext"]) ?? "";
    // Format: "Empfänger: NAME Buchungstext: ZWECK Ref. 4711AB"
    const recipient = /Empfänger:\s*(.+?)(?=\s+(?:Buchungstext|Kto\/IBAN|Ref\.)|$)/i.exec(
      bookingText,
    )?.[1];
    const purposeMatch = /Buchungstext:\s*(.+?)(?=\s+Ref\.|$)/i.exec(bookingText)?.[1];

    return buildTransaction({
      bookingDate: pick(row, ["Buchungstag"]),
      valueDate: pick(row, ["Wertstellung (Valuta)", "Wertstellung"]),
      amount: pick(row, ["Umsatz in EUR", "Umsatz", "Betrag"]),
      purpose: purposeMatch ?? bookingText,
      counterparty: recipient,
      iban: bookingText,
    });
  },
};

/** Volksbank / VR-Bank (Genossenschaftsbanken, häufig identisches Exportschema). */
const volksbank: BankParser = {
  bankType: "volksbank",
  label: "Volksbank / VR-Bank",
  signatures: [
    ["Name Zahlungsbeteiligter", "Buchungstag"],
    ["Bezeichnung Auftragskonto", "Buchungstag"],
  ],
  parseRow: (row: RawRow) =>
    buildTransaction({
      bookingDate: pick(row, ["Buchungstag"]),
      valueDate: pick(row, ["Valutadatum", "Wertstellung"]),
      amount: pick(row, ["Betrag"]),
      debitCreditFlag: pick(row, ["Soll/Haben", "Waehrung Soll/Haben", "SH"]),
      currency: pick(row, ["Waehrung", "Währung"]),
      purpose: pick(row, ["Verwendungszweck"]),
      counterparty: pick(row, ["Name Zahlungsbeteiligter", "Zahlungsbeteiligter"]),
      iban: pick(row, ["IBAN Zahlungsbeteiligter"]),
    }),
};

/** N26 (Export wahlweise deutsch oder englisch). */
const n26: BankParser = {
  bankType: "n26",
  label: "N26",
  signatures: [
    ["Partner Name", "Booking Date"],
    ["Partner Iban", "Datum"],
  ],
  parseRow: (row: RawRow) =>
    buildTransaction({
      bookingDate: pick(row, ["Booking Date", "Datum", "Wertstellung"]),
      valueDate: pick(row, ["Value Date"]),
      amount: pick(row, ["Amount (EUR)", "Betrag (EUR)", "Betrag"]),
      purpose: pick(row, ["Payment Reference", "Verwendungszweck"]),
      counterparty: pick(row, ["Partner Name", "Empfänger", "Empfaenger"]),
      iban: pick(row, ["Partner Iban", "Kontonummer"]),
    }),
};

/**
 * Fallback für unbekannte Formate: versucht, die üblichen Spaltennamen zu finden.
 * Greift, wenn keine Bank-Signatur passt, das Format aber Standardspalten hat.
 */
const generic: BankParser = {
  bankType: "generic",
  label: "Allgemeines CSV-Format",
  signatures: [],
  parseRow: (row: RawRow) =>
    buildTransaction({
      bookingDate: pick(row, [
        "Buchungstag",
        "Buchungsdatum",
        "Datum",
        "Date",
        "Booking Date",
        "Buchung",
      ]),
      valueDate: pick(row, ["Valutadatum", "Wertstellung", "Valuta", "Value Date"]),
      amount: pick(row, ["Betrag", "Amount", "Umsatz", "Betrag (EUR)", "Amount (EUR)"]),
      debitCreditFlag: pick(row, ["Soll/Haben", "SH"]),
      currency: pick(row, ["Waehrung", "Währung", "Currency"]),
      purpose: pick(row, [
        "Verwendungszweck",
        "Buchungstext",
        "Beschreibung",
        "Description",
        "Payment Reference",
      ]),
      counterparty: pick(row, [
        "Beguenstigter/Zahlungspflichtiger",
        "Begünstigter/Zahlungspflichtiger",
        "Auftraggeber/Empfänger",
        "Name Zahlungsbeteiligter",
        "Empfänger",
        "Partner Name",
        "Payee",
      ]),
      iban: pick(row, ["IBAN", "Kontonummer/IBAN", "Partner Iban"]),
    }),
};

export const bankParsers: BankParser[] = [
  sparkasse,
  dkb,
  ing,
  comdirect,
  volksbank,
  n26,
];

export const genericParser = generic;

export function findParser(bankType: string): BankParser {
  return bankParsers.find((parser) => parser.bankType === bankType) ?? generic;
}
