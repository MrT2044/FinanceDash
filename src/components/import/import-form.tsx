"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormAlert } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { importCsvAction, type ImportState } from "@/server/actions/import.actions";

const initialState: ImportState = {};

export function ImportForm({
  accounts,
  aiAvailable,
}: {
  accounts: { id: string; name: string }[];
  aiAvailable: boolean;
}) {
  const [state, formAction] = useActionState(importCsvAction, initialState);
  const [fileName, setFileName] = useState<string | null>(null);
  const [accountChoice, setAccountChoice] = useState(accounts[0]?.id ?? "new");

  if (state.result) {
    const { result } = state;
    return (
      <Card className="card-elevated">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2.5 text-positive">
            <CheckCircle2 className="size-5" />
            <h2 className="text-base font-semibold">Import abgeschlossen</h2>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Format", value: result.bankLabel },
              { label: "Importiert", value: String(result.imported) },
              { label: "Duplikate", value: String(result.duplicates) },
              { label: "Kategorisiert", value: `${result.categorized}/${result.imported}` },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="mt-0.5 truncate text-sm font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>

          {result.skipped > 0 ? (
            <p className="text-xs text-muted-foreground">
              {result.skipped} Zeilen konnten nicht gelesen werden und wurden übersprungen.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/dashboard" className={buttonVariants()}>
              Zum Dashboard
            </Link>
            <Link
              href="/transaktionen"
              className={buttonVariants({ variant: "outline" })}
            >
              Buchungen prüfen
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <FormAlert error={state.error} />

      <Card className="card-elevated">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="file">CSV-Datei</Label>
            <label
              htmlFor="file"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <FileSpreadsheet className="size-6 text-muted-foreground" />
              <span className="text-sm font-medium">
                {fileName ?? "Datei auswählen oder hierher ziehen"}
              </span>
              <span className="text-xs text-muted-foreground">
                Umsatzexport deiner Bank, maximal 5 MB
              </span>
            </label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="sr-only"
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">Konto</Label>
            <select
              id="accountId"
              name="accountId"
              value={accountChoice}
              onChange={(event) => setAccountChoice(event.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
              <option value="new">Neues Konto anlegen …</option>
            </select>
          </div>

          {accountChoice === "new" ? (
            <div className="space-y-2">
              <Label htmlFor="newAccountName">Name des neuen Kontos</Label>
              <Input
                id="newAccountName"
                name="newAccountName"
                placeholder="z. B. Girokonto Sparkasse"
                maxLength={80}
              />
            </div>
          ) : null}

          {aiAvailable ? (
            <label className="flex items-start gap-2.5 rounded-lg border border-border/60 p-3 text-sm">
              <input
                type="checkbox"
                name="useAi"
                className="mt-0.5 size-4 rounded border-input accent-primary"
              />
              <span className="space-y-0.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="size-3.5 text-primary" />
                  KI für unbekannte Händler nutzen
                </span>
                <span className="block text-xs text-muted-foreground">
                  Buchungen, für die keine Regel greift, werden zur Kategorisierung an
                  Google Gemini gesendet. Es werden nur Händlername, Verwendungszweck und
                  Betrag übermittelt — keine Kontonummern oder Namen von dir.
                </span>
              </span>
            </label>
          ) : null}

          <SubmitButton className="w-full">Import starten</SubmitButton>
        </CardContent>
      </Card>
    </form>
  );
}
