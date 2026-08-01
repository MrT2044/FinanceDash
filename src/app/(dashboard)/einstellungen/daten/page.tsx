import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SettingsShell } from "@/components/settings/settings-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Meine Daten — FinanceDash" };

export default async function DataSettingsPage() {
  const supabase = await createClient();

  const [{ count: transactionCount }, { count: accountCount }, { count: batchCount }] =
    await Promise.all([
      supabase.from("transactions").select("id", { count: "exact", head: true }),
      supabase.from("accounts").select("id", { count: "exact", head: true }),
      supabase.from("import_batches").select("id", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "Buchungen", value: transactionCount ?? 0 },
    { label: "Konten", value: accountCount ?? 0 },
    { label: "Importe", value: batchCount ?? 0 },
  ];

  return (
    <SettingsShell href="/einstellungen/daten">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Gespeicherter Bestand</CardTitle>
          <CardDescription>Was FinanceDash aktuell für dich vorhält.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-muted/60 px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Datenexport</CardTitle>
          <CardDescription>
            Enthält alle Konten, Buchungen, Kategorien und Importe als JSON-Datei —
            vollständig und maschinenlesbar (DSGVO Art. 20).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/api/export" download className={buttonVariants({ variant: "outline" })}>
            <Download className="size-4" />
            Alle Daten herunterladen
          </a>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
