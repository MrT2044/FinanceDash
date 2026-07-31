import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata: Metadata = { title: "Passwort zurücksetzen — FinanceDash" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Passwort zurücksetzen"
      description="Wir schicken dir einen Link, mit dem du ein neues Passwort vergeben kannst."
      footer={
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Zurück zur Anmeldung
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
