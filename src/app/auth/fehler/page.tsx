import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/forms/auth-shell";
import { buttonVariants } from "@/components/ui/button";
import { FragmentSessionRecovery } from "@/components/forms/fragment-session-recovery";

export const metadata: Metadata = { title: "Link ungültig — FinanceDash" };

const REASONS: Record<string, string> = {
  link_ungueltig:
    "Der Bestätigungslink ist abgelaufen oder wurde bereits verwendet. Fordere dir einfach einen neuen an.",
  kein_token:
    "Dem Link fehlen die nötigen Daten. Das passiert, wenn er beim Weiterleiten oder Kopieren gekürzt wurde.",
  otp_expired:
    "Der Bestätigungslink ist abgelaufen. Links sind aus Sicherheitsgründen nur begrenzt gültig.",
  access_denied:
    "Die Bestätigung wurde abgelehnt. Bitte fordere einen neuen Link an.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ grund?: string }>;
}) {
  const { grund } = await searchParams;

  return (
    <AuthShell
      title="Der Link hat nicht funktioniert"
      description={
        (grund && REASONS[grund]) ??
        "Die Bestätigung konnte nicht abgeschlossen werden. Bitte fordere einen neuen Link an."
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

      <div className="space-y-4">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Bestätigungslinks lassen sich nur einmal verwenden.</li>
          <li>Öffne den Link am besten direkt aus der E-Mail heraus.</li>
          <li>Prüfe, ob eine neuere Bestätigungs-E-Mail im Postfach liegt.</li>
        </ul>

        <div className="flex flex-wrap gap-2">
          <Link href="/register" className={buttonVariants()}>
            Neue Bestätigung anfordern
          </Link>
          <Link
            href="/reset-password"
            className={buttonVariants({ variant: "outline" })}
          >
            Passwort zurücksetzen
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
