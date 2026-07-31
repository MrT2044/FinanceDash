import type { Metadata } from "next";
import Link from "next/link";
import { Download, KeyRound, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Einstellungen — FinanceDash" };

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

  return (
    <>
      <PageHeader title="Einstellungen" description="Konto, Datenschutz und Sicherheit." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Profil</CardTitle>
            <CardDescription>
              Angemeldet als {user?.email}
              {profile?.created_at
                ? ` · Konto seit ${formatDate(profile.created_at.slice(0, 10))}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm displayName={profile?.display_name ?? null} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Sicherheit</CardTitle>
            <CardDescription>
              Dein Passwort wird ausschließlich als Hash gespeichert und ist für niemanden
              lesbar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/reset-password"
              className={buttonVariants({ variant: "outline" })}
            >
              <KeyRound className="size-4" />
              Passwort ändern
            </Link>

            {events?.length ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Letzte Sicherheitsereignisse
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {events.map((event, index) => (
                      <li key={index} className="flex justify-between gap-3">
                        <span>{event.event_type}</span>
                        <span className="tabular-nums">
                          {formatDate(event.created_at.slice(0, 10))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Kategorisierung</CardTitle>
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

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" />
              Deine Daten
            </CardTitle>
            <CardDescription>
              Du kannst deine Daten jederzeit vollständig herunterladen oder löschen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a
              href="/api/export"
              download
              className={buttonVariants({ variant: "outline" })}
            >
              <Download className="size-4" />
              Alle Daten exportieren (JSON)
            </a>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
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
