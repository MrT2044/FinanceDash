import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/forms/auth-shell";
import { FragmentSessionRecovery } from "@/components/forms/fragment-session-recovery";
import { ResendConfirmationForm } from "@/components/forms/resend-confirmation-form";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Link ungültig — FinanceDash" };

const REASONS: Record<string, string> = {
  anderes_geraet:
    "Der Link wurde in einem anderen Browser geöffnet als dem, in dem du dich registriert hast. Öffne ihn dort erneut — oder fordere unten eine neue Bestätigung an.",
  otp_expired:
    "Der Bestätigungslink ist abgelaufen. Links sind aus Sicherheitsgründen nur begrenzt gültig.",
  access_denied: "Die Bestätigung wurde abgelehnt. Bitte fordere einen neuen Link an.",
  kein_token:
    "Dem Link fehlen die nötigen Daten. Das passiert, wenn er beim Weiterleiten oder Kopieren gekürzt wurde.",
  link_ungueltig:
    "Der Bestätigungslink ist abgelaufen oder wurde bereits verwendet. Manche Mail-Programme rufen Links automatisch ab und verbrauchen sie dabei.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ grund?: string; detail?: string }>;
}) {
  const { grund, detail } = await searchParams;

  return (
    <AuthShell
      title="Der Link hat nicht funktioniert"
      description={
        (grund && REASONS[grund]) ??
        "Die Bestätigung konnte nicht abgeschlossen werden. Fordere unten einfach eine neue E-Mail an."
      }
      footer={
        <>
          Zurück zur{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Anmeldung
          </Link>
        </>
      }
    >
      {/*
        Manche Mail-Programme und ältere Supabase-Vorlagen übergeben die Session
        im URL-Fragment. Der Server sieht das nicht — dieser Baustein liest es im
        Browser aus und schließt die Anmeldung nachträglich ab.
      */}
      <FragmentSessionRecovery />

      <div className="space-y-5">
        <ResendConfirmationForm />

        <Separator />

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Bestätigungslinks lassen sich nur einmal verwenden. Öffne den Link am
            besten direkt aus der E-Mail heraus und im selben Browser, in dem du
            dich registriert hast.
          </p>
          <Link
            href="/reset-password"
            className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Passwort stattdessen zurücksetzen
          </Link>
        </div>

        {/* Originalmeldung, damit die Ursache nachvollziehbar bleibt. */}
        {detail ? (
          <details>
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Technische Details
            </summary>
            <p className="mt-2 rounded-lg bg-muted p-3 font-mono text-xs break-words">
              {grund ? `${grund}: ` : ""}
              {detail}
            </p>
          </details>
        ) : null}
      </div>
    </AuthShell>
  );
}
