import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { RegisterForm } from "@/components/forms/register-form";
import { isRegistrationRestricted } from "@/lib/security/registration";

export const metadata: Metadata = { title: "Registrieren — FinanceDash" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Konto erstellen"
      description={
        isRegistrationRestricted()
          ? "Diese Installation ist privat. Nur freigeschaltete E-Mail-Adressen können ein Konto anlegen."
          : "Starte in wenigen Minuten mit deinem persönlichen Finanzdashboard."
      }
      footer={
        <>
          Bereits registriert?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Zur Anmeldung
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
