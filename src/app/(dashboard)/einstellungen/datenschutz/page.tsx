import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, Lock, ShieldCheck, Timer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsShell } from "@/components/settings/settings-shell";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Datenschutz — FinanceDash" };

const EVENT_LABELS: Record<string, string> = {
  login_success: "Erfolgreich angemeldet",
  login_failed: "Fehlgeschlagene Anmeldung",
  logout: "Abgemeldet",
  register_success: "Konto erstellt",
  email_verified: "E-Mail-Adresse bestätigt",
  email_change_requested: "Änderung der E-Mail-Adresse angefordert",
  password_reset_requested: "Passwort-Zurücksetzung angefordert",
  password_changed: "Passwort geändert",
  rate_limited: "Zu viele Versuche blockiert",
  data_exported: "Daten exportiert",
  account_deleted: "Konto gelöscht",
  import_committed: "Umsätze importiert",
};

const GUARANTEES = [
  {
    icon: Lock,
    title: "Datentrennung in der Datenbank",
    text: "Jede Zeile ist an dein Konto gebunden. Die Datenbank selbst verweigert den Zugriff auf fremde Daten — nicht erst die Anwendung.",
  },
  {
    icon: KeyRound,
    title: "Keine Bankzugangsdaten",
    text: "FinanceDash liest ausschließlich CSV-Dateien, die du selbst hochlädst. Es besteht zu keinem Zeitpunkt eine Verbindung zu deiner Bank.",
  },
  {
    icon: Timer,
    title: "Automatische Abmeldung",
    text: "Nach 30 Minuten ohne Seitenaufruf wird deine Sitzung serverseitig beendet.",
  },
];

export default async function PrivacySettingsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("security_events")
    .select("event_type, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <SettingsShell href="/einstellungen/datenschutz">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Wie deine Daten geschützt sind
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {GUARANTEES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}

          <p className="text-sm text-muted-foreground">
            Ausführlich nachzulesen in den{" "}
            <Link
              href="/datenschutz"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Datenschutzhinweisen
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Letzte Aktivitäten</CardTitle>
          <CardDescription>
            Sicherheitsrelevante Ereignisse deines Kontos. IP-Adressen werden nur als
            Prüfsumme gespeichert, nie im Klartext.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events?.length ? (
            <ul className="space-y-2 text-sm">
              {events.map((event, index) => (
                <li key={index} className="flex justify-between gap-3">
                  <span>{EVENT_LABELS[event.event_type] ?? event.event_type}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatDate(event.created_at.slice(0, 10))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Noch keine Ereignisse aufgezeichnet.
            </p>
          )}
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
