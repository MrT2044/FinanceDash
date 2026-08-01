"use client";

import { useActionState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  deleteAllImportsAction,
  type ImportActionState,
} from "@/server/actions/imports.actions";

const initialState: ImportActionState = {};

export function DeleteAllImportsDialog({ transactionCount }: { transactionCount: number }) {
  const [state, formAction] = useActionState(deleteAllImportsAction, initialState);

  return (
    <div className="space-y-3">
      <FormAlert success={state.success} />

      <Dialog>
        <DialogTrigger render={<Button variant="destructive" />}>
          Alle CSV-Importe löschen
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <form action={formAction}>
            <DialogHeader>
              <DialogTitle>Alle importierten Daten löschen?</DialogTitle>
              <DialogDescription>
                {transactionCount} {transactionCount === 1 ? "Buchung" : "Buchungen"} und
                sämtliche Import-Protokolle werden entfernt. Dein Konto, deine Konten und
                deine gelernten Kategorien bleiben bestehen.
              </DialogDescription>
            </DialogHeader>

            <div className="my-5 space-y-3">
              <FormAlert error={state.error} />
              <div className="space-y-2">
                <Label htmlFor="confirmAllImports">
                  Tippe <span className="font-mono font-semibold">LÖSCHEN</span> zur
                  Bestätigung
                </Label>
                <Input
                  id="confirmAllImports"
                  name="confirmation"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <SubmitButton variant="destructive" className="w-full">
                Alle Importe löschen
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
