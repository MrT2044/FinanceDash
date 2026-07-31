import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ImportForm } from "@/components/import/import-form";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Import — FinanceDash" };

const SUPPORTED_BANKS = [
  "Sparkasse",
  "DKB",
  "ING",
  "comdirect",
  "Volksbank / VR-Bank",
  "N26",
];

export default async function ImportPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: batches }] = await Promise.all([
    supabase.from("accounts").select("id, name").order("name"),
    supabase
      .from("import_batches")
      .select("id, filename, detected_format, imported_count, duplicate_count, created_at, status")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <>
      <PageHeader
        title="Umsätze importieren"
        description="Lade den CSV-Export aus deinem Online-Banking hoch."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ImportForm
            accounts={accounts ?? []}
            aiAvailable={Boolean(process.env.GEMINI_API_KEY)}
          />
        </div>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Unterstützte Formate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {SUPPORTED_BANKS.map((bank) => (
                  <li key={bank}>{bank}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Andere Banken werden über eine allgemeine Erkennung eingelesen, sofern der
                Export Spalten für Datum, Betrag und Verwendungszweck enthält.
              </p>
            </CardContent>
          </Card>

          {batches?.length ? (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Letzte Importe</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {batches.map((batch) => (
                    <li key={batch.id} className="space-y-0.5">
                      <p className="truncate text-sm font-medium">{batch.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(batch.created_at.slice(0, 10))} ·{" "}
                        {batch.imported_count} importiert
                        {batch.duplicate_count > 0
                          ? `, ${batch.duplicate_count} Duplikate`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
