"use client";

import { useActionState } from "react";
import { FileSpreadsheet, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/forms/form-feedback";
import {
  deleteImportBatchAction,
  type ImportActionState,
} from "@/server/actions/imports.actions";
import { formatDate } from "@/lib/utils/format";

export type ImportBatchView = {
  id: string;
  filename: string;
  created_at: string;
  imported_count: number;
  duplicate_count: number;
  detected_format: string;
  transactionCount: number;
};

const initialState: ImportActionState = {};

export function ImportList({ batches }: { batches: ImportBatchView[] }) {
  const [state, formAction, isPending] = useActionState(
    deleteImportBatchAction,
    initialState,
  );

  if (!batches.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine CSV-Datei importiert.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <FormAlert error={state.error} success={state.success} />

      <ul className="divide-y divide-border/60">
        {batches.map((batch) => (
          <li key={batch.id} className="flex items-center gap-3 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
              <FileSpreadsheet className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{batch.filename}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(batch.created_at.slice(0, 10))} · {batch.transactionCount}{" "}
                {batch.transactionCount === 1 ? "Buchung" : "Buchungen"}
                {batch.duplicate_count > 0
                  ? ` · ${batch.duplicate_count} Duplikate übersprungen`
                  : ""}
              </p>
            </div>

            {/*
              Eigenes Formular je Zeile: Ohne die Kennung im Formular müsste der
              Zustand im Client mitgeführt werden, was bei parallelen Löschungen
              auseinanderläuft.
            */}
            <form action={formAction}>
              <input type="hidden" name="batchId" value={batch.id} />
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                aria-label={`Import ${batch.filename} löschen`}
                className="size-10 text-muted-foreground hover:text-destructive md:size-8"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </form>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Beim Löschen eines Imports verschwinden auch die daraus entstandenen
        Buchungen. Deine Konten und gelernten Kategorien bleiben erhalten.
      </p>
    </div>
  );
}
