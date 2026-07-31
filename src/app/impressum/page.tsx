import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Impressum — FinanceDash" };

export default function ImprintPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12 md:px-8 md:py-16">
      <Link
        href="/"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Zurück
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Impressum</h1>

      <p className="mt-6 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        Diese Anwendung wird derzeit nicht öffentlich betrieben. Vor einer Veröffentlichung
        sind hier die nach § 5 DDG erforderlichen Angaben zu ergänzen: Name und Anschrift des
        Anbieters, Kontaktmöglichkeit (E-Mail, Telefon) sowie gegebenenfalls Registereintrag
        und Umsatzsteuer-Identifikationsnummer.
      </p>
    </div>
  );
}
