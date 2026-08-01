import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = { title: "Registrieren — FinanceDash" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Konto erstellen"
      description="Starte in wenigen Minuten mit deinem persönlichen Finanzdashboard."
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
