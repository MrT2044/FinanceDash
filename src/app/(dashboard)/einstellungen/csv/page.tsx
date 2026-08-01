import type { Metadata } from "next";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SettingsShell } from "@/components/settings/settings-shell";
import { ImportList, type ImportBatchView } from "@/components/settings/import-list";
import { DeleteAllImportsDialog } from "@/components/settings/delete-all-imports-dialog";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CSV-Verwaltung — FinanceDash" };

export default async function CsvSettingsPage() {
  const supabase = await createClient();

  const [{ data: batches }, { count: transactionCount }] = await Promise.all([
    supabase
      .from("import_batches")
      .select("id, filename, created_at, imported_count, duplicate_count, detected_format")
      .order("created_at", { ascending: false }),
    supabase.from("transactions").select("id", { count: "exact", head: true }),
  ]);

  // Wie viele Buchungen aktuell noch an jedem Import hängen. `imported_count`
  // ist der Stand zum Importzeitpunkt und stimmt nicht mehr, sobald einzelne
  // Buchungen gelöscht wurden.
  const { data: linked } = await supabase
    .from("transactions")
    .select("import_batch_id")
    .not("import_batch_id", "is", null);

  const countByBatch = new Map<string, number>();
  for (const row of linked ?? []) {
    if (!row.import_batch_id) continue;
    countByBatch.set(row.import_batch_id, (countByBatch.get(row.import_batch_id) ?? 0) + 1);
  }

  const views: ImportBatchView[] = (batches ?? []).map((batch) => ({
    id: batch.id,
    filename: batch.filename,
    created_at: batch.created_at,
    imported_count: batch.imported_count,
    duplicate_count: batch.duplicate_count,
    detected_format: batch.detected_format,
    transactionCount: countByBatch.get(batch.id) ?? 0,
  }));

  return (
    <SettingsShell href="/einstellungen/csv">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Importierte Dateien</CardTitle>
          <CardDescription>
            Jeder Import lässt sich einzeln entfernen — samt der Buchungen, die daraus
            entstanden sind.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportList batches={views} />
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Weitere Umsätze einlesen</CardTitle>
          <CardDescription>
            Doppelte Buchungen erkennt FinanceDash automatisch und überspringt sie.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/import" className={buttonVariants({ variant: "outline" })}>
            <Upload className="size-4" />
            CSV importieren
          </Link>
          <a href="/api/export" download className={buttonVariants({ variant: "outline" })}>
            <Download className="size-4" />
            Daten exportieren
          </a>
        </CardContent>
      </Card>

      {views.length ? (
        <Card className="card-elevated border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Alles zurücksetzen</CardTitle>
            <CardDescription>
              Entfernt sämtliche importierten Buchungen und Import-Protokolle. Dein Konto
              bleibt vollständig bestehen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAllImportsDialog transactionCount={transactionCount ?? 0} />
          </CardContent>
        </Card>
      ) : null}
    </SettingsShell>
  );
}
