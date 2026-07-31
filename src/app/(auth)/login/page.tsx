import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = { title: "Anmelden — FinanceDash" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <AuthShell
      title="Willkommen zurück"
      description="Melde dich an, um deine Finanzen im Blick zu behalten."
      footer={
        <>
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Jetzt registrieren
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthShell>
  );
}
