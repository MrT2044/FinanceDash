import {
  Database,
  FileSpreadsheet,
  ShieldCheck,
  Tags,
  Trash2,
  UserRound,
} from "lucide-react";

/**
 * Die Einstellungen sind in eigenständige Seiten aufgeteilt statt in eine lange
 * Liste. Diese Aufstellung dient sowohl der Übersichtsseite als auch der
 * Kopfzeile der Unterseiten, damit Titel und Beschreibung nur an einer Stelle
 * gepflegt werden.
 */
export const settingsSections = [
  {
    href: "/einstellungen/profil",
    label: "Profil",
    description: "Name, E-Mail-Adresse und Passwort ändern.",
    icon: UserRound,
  },
  {
    href: "/einstellungen/kategorisierung",
    label: "Kategorisierung",
    description: "Eigene Kategorien anlegen und gelernte Regeln verwalten.",
    icon: Tags,
  },
  {
    href: "/einstellungen/csv",
    label: "CSV-Verwaltung",
    description: "Importe einsehen, einzeln oder vollständig löschen.",
    icon: FileSpreadsheet,
  },
  {
    href: "/einstellungen/daten",
    label: "Meine Daten",
    description: "Alle gespeicherten Daten als Datei herunterladen.",
    icon: Database,
  },
  {
    href: "/einstellungen/datenschutz",
    label: "Datenschutz & Sicherheit",
    description: "Wie deine Daten geschützt werden und was zuletzt passiert ist.",
    icon: ShieldCheck,
  },
  {
    href: "/einstellungen/konto",
    label: "Konto",
    description: "Dein Konto endgültig löschen.",
    icon: Trash2,
    tone: "destructive" as const,
  },
] as const;

export function findSettingsSection(href: string) {
  return settingsSections.find((section) => section.href === href);
}
