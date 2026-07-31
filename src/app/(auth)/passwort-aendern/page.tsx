import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { UpdatePasswordForm } from "@/components/forms/update-password-form";

export const metadata: Metadata = { title: "Neues Passwort — FinanceDash" };

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      title="Neues Passwort vergeben"
      description="Wähle ein starkes Passwort, das du nirgendwo sonst verwendest."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
