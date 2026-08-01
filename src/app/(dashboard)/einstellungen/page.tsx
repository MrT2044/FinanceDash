import type { Metadata } from "next";
import { Download, KeyRound, LogOut, Mail, ShieldCheck, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { ChangeEmailForm } from "@/components/settings/change-email-form";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { LogoutButton } from "@/components/layout/logout-button";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Einstellungen — FinanceDash" };

/** Technische Ereignisnamen in verständliche Sätze übersetzen. */
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
  import_committed: "Umsätze importiert",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: rules }, { data: events }] = await Promise.all([
    supabase.from("profiles").select("display_name, created_at").maybeSingle(),
    supabase
      .from("category_rules")
      .select("id", { count: "exact", head: false })
      .not("user_id", "is", null),
    supabase
      .from("security_events")
      .select("event_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const email = user?.email ?? "";
  const pendingEmail = user?.new_email ?? null;

  return (
    <>
      <PageHeader title="Einstellungen" description="Konto, Datenschutz und Sicherheit." />

      <div className="grid animate-rise items-start gap-6 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>
              Angemeldet als {email}
              {profile?.created_at
                ? ` · Konto seit ${formatDate(profile.created_at.slice(0, 10))}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProfileForm displayName={profile?.display_name ?? null} />

            <Separator />

            <div className="space-y-3">
              <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <Mail className="size-3.5" />
                E-Mail-Adresse
              </p>
              {pendingEmail ? (
                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Änderung auf <span className="font-medium">{pendingEmail}</span> ist
                  angefordert. Sie greift, sobald du den Bestätigungslink geöffnet hast.
                </p>
              ) : null}
              <ChangeEmailForm currentEmail={email} />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              Passwort ändern
            </CardTitle>
            <CardDescription>
              Dein Passwort wird ausschließlich als Hash gespeichert und ist für niemanden
              lesbar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Sitzung &amp; Aktivität</CardTitle>
            <CardDescription>
              Die letzten sicherheitsrelevanten Ereignisse deines Kontos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {events?.length ? (
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {events.map((event, index) => (
                  <li key={index} className="flex justify-between gap-3">
                    <span>{EVENT_LABELS[event.event_type] ?? event.event_type}</span>
                    <span className="tabular-nums">
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

            <Separator />

            <LogoutButton className="w-auto min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted" />
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <LogOut className="mt-0.5 size-3.5 shrink-0" />
              Nach 30 Minuten ohne Seitenaufruf wirst du automatisch abgemeldet.
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Kategorisierung</CardTitle>
            <CardDescription>
              {rules?.length
                ? `${rules.length} gelernte ${rules.length === 1 ? "Regel" : "Regeln"} aus deinen manuellen Korrekturen.`
                : "Sobald du Buchungen manuell umsortierst, merkt sich FinanceDash die Zuordnung."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Jede manuelle Korrektur wird als Regel für den jeweiligen Händler gespeichert
              und beim nächsten Import automatisch angewendet.
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Deine Daten
            </CardTitle>
            <CardDescription>
              Du kannst deine Daten jederzeit vollständig herunterladen oder löschen.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Der Export enthält alle Konten, Buchungen und Kategorien als JSON-Datei.
              </p>
              <a
                href="/api/export"
                download
                className={buttonVariants({ variant: "outline" })}
              >
                <Download className="size-4" />
                Alle Daten exportieren
              </a>
            </div>

            <div className="space-y-3">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Trash2 className="mt-0.5 size-4 shrink-0 text-destructive" />
                Beim Löschen deines Kontos werden sämtliche Buchungen, Konten und
                Auswertungen unwiderruflich entfernt.
              </p>
              <DeleteAccountDialog />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
