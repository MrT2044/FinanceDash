import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Datenschutz — FinanceDash" };

const sections = [
  {
    title: "Welche Daten wir verarbeiten",
    body: "Für dein Konto speichern wir deine E-Mail-Adresse und optional einen Anzeigenamen. Darüber hinaus verarbeiten wir ausschließlich die Kontoumsätze, die du selbst als CSV hochlädst: Buchungsdatum, Betrag, Verwendungszweck und Empfänger. Von deiner IBAN speichern wir nur die letzten Stellen in maskierter Form.",
  },
  {
    title: "Keine Bankverbindung",
    body: "FinanceDash greift zu keinem Zeitpunkt auf dein Online-Banking zu. Es werden keine Bankzugangsdaten, PINs oder TANs abgefragt oder gespeichert.",
  },
  {
    title: "Trennung der Nutzerdaten",
    body: "Deine Finanzdaten sind auf Datenbankebene über Row Level Security an dein Konto gebunden. Jede Datenbankabfrage prüft die Zugehörigkeit — ein Zugriff auf fremde Daten ist technisch ausgeschlossen, nicht nur durch die Anwendungslogik verhindert.",
  },
  {
    title: "Verschlüsselung",
    body: "Die Übertragung erfolgt ausschließlich über HTTPS/TLS. Die Datenbank wird verschlüsselt gespeichert (Encryption at Rest) und in einem Rechenzentrum innerhalb der EU betrieben.",
  },
  {
    title: "Passwörter",
    body: "Passwörter werden niemals im Klartext gespeichert, sondern ausschließlich als kryptografischer Hash mit modernem Verfahren. Auch Administratoren können dein Passwort nicht einsehen.",
  },
  {
    title: "Optionale KI-Unterstützung",
    body: "Wenn du beim Import die KI-Kategorisierung aktivierst, werden Händlername, Verwendungszweck und Betrag der betroffenen Buchungen an die Google-Gemini-API übermittelt, um eine Kategorie vorzuschlagen. Es werden dabei weder dein Name noch deine E-Mail-Adresse oder Kontonummern übertragen. Die Funktion ist standardmäßig deaktiviert.",
  },
  {
    title: "Protokollierung",
    body: "Zur Erkennung von Angriffen protokollieren wir sicherheitsrelevante Ereignisse wie Anmeldeversuche. IP-Adressen werden dabei ausschließlich als Hashwert gespeichert, nicht im Klartext. Inhalte deiner Buchungen werden nicht protokolliert.",
  },
  {
    title: "Deine Rechte",
    body: "Du kannst deine gespeicherten Daten jederzeit unter „Einstellungen“ vollständig als JSON-Datei herunterladen (Art. 20 DSGVO) und dein Konto samt aller Finanzdaten unwiderruflich löschen (Art. 17 DSGVO). Die Löschung erfolgt sofort und umfasst alle abhängigen Datensätze.",
  },
  {
    title: "Keine Weitergabe",
    body: "Deine Finanzdaten werden nicht verkauft, nicht für Werbung genutzt und nicht an Dritte weitergegeben. Es findet kein Tracking und keine Profilbildung zu Werbezwecken statt.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12 md:px-8 md:py-16">
      <Link
        href="/"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Zurück
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Datenschutz</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        FinanceDash verarbeitet ausschließlich die Daten, die für die Auswertung deiner
        Finanzen nötig sind. Diese Seite fasst zusammen, welche das sind und wie sie
        geschützt werden.
      </p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-12 rounded-lg border border-border/60 bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        Hinweis für den Betrieb: Diese Seite beschreibt die technische Umsetzung. Für einen
        öffentlichen Betrieb müssen zusätzlich der Verantwortliche, Kontaktdaten, die
        Rechtsgrundlagen der Verarbeitung, Speicherfristen und eingesetzte Auftragsverarbeiter
        (Hosting, KI-Dienst) konkret benannt werden.
      </p>
    </div>
  );
}
