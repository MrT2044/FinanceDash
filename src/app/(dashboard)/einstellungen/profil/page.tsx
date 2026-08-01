import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsShell } from "@/components/settings/settings-shell";
import { ProfileForm } from "@/components/settings/profile-form";
import { ChangeEmailForm } from "@/components/settings/change-email-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Profil — FinanceDash" };

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .maybeSingle();

  const email = user?.email ?? "";
  const pendingEmail = user?.new_email ?? null;

  return (
    <SettingsShell href="/einstellungen/profil">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Name</CardTitle>
          <CardDescription>
            {profile?.created_at
              ? `Konto seit ${formatDate(profile.created_at.slice(0, 10))}`
              : "So wirst du in der Anwendung angesprochen."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm displayName={profile?.display_name ?? null} />
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>E-Mail-Adresse</CardTitle>
          <CardDescription>Aktuell angemeldet als {email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingEmail ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Änderung auf <span className="font-medium">{pendingEmail}</span> ist
              angefordert. Sie greift, sobald du den Bestätigungslink geöffnet hast.
            </p>
          ) : null}
          <ChangeEmailForm currentEmail={email} />
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Passwort ändern</CardTitle>
          <CardDescription>
            Zur Sicherheit wird zuerst dein aktuelles Passwort abgefragt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
