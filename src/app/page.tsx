import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Lock, Sparkles, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const features = [
  {
    icon: Upload,
    title: "CSV-Import aus deiner Bank",
    text: "Lade den Umsatzexport von Sparkasse, DKB, ING, Comdirect oder deiner Volksbank hoch — den Rest übernimmt die App.",
  },
  {
    icon: Sparkles,
    title: "Automatische Kategorien",
    text: "Buchungen werden selbstständig einsortiert. Korrigierst du einmal, merkt sich die App die Zuordnung für die Zukunft.",
  },
  {
    icon: BarChart3,
    title: "Klare Auswertungen",
    text: "Einnahmen, Ausgaben, Sparrate und Kategorienverteilung — verständlich aufbereitet statt in Zahlenkolonnen versteckt.",
  },
  {
    icon: Lock,
    title: "Deine Daten bleiben deine",
    text: "Strikte Datentrennung auf Datenbankebene, verschlüsselte Übertragung, Hosting in der EU und jederzeit löschbar.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center justify-between px-5 md:px-10">
        <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            F
          </span>
          FinanceDash
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Anmelden
          </Link>
          <Link href="/register" className={buttonVariants({ size: "sm" })}>
            Kostenlos starten
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 pt-10 md:px-10 md:pt-20">
        <section className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Persönliches Finanzdashboard</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Endlich verstehen, wohin dein Geld fließt.
          </h1>
          <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            FinanceDash liest deine Kontoumsätze ein, sortiert sie automatisch in Kategorien
            und zeigt dir auf einen Blick, wo Sparpotenzial steckt. Ohne Tabellenchaos und
            ohne deine Bankzugangsdaten weiterzugeben.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Konto erstellen
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Ich habe bereits ein Konto
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/60 bg-card/50 p-6 transition-colors hover:border-border"
            >
              <Icon className="size-5 text-primary" />
              <h2 className="mt-4 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 px-5 py-6 text-sm text-muted-foreground md:px-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} FinanceDash</span>
          <nav className="flex gap-5">
            <Link href="/datenschutz" className="hover:text-foreground">
              Datenschutz
            </Link>
            <Link href="/impressum" className="hover:text-foreground">
              Impressum
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
