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
  deleteAccountAction,
  type AccountActionState,
} from "@/server/actions/account.actions";

const initialState: AccountActionState = {};

export function DeleteAccountDialog() {
  const [state, formAction] = useActionState(deleteAccountAction, initialState);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" />}>
        Konto endgültig löschen
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Konto wirklich löschen?</DialogTitle>
            <DialogDescription>
              Alle Konten, Buchungen, Kategorien und Auswertungen werden unwiderruflich
              gelöscht. Dieser Schritt kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>

          <div className="my-5 space-y-3">
            <FormAlert error={state.error} />
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Tippe <span className="font-mono font-semibold">LÖSCHEN</span> zur Bestätigung
              </Label>
              <Input id="confirmation" name="confirmation" autoComplete="off" required />
            </div>
          </div>

          <DialogFooter>
            <SubmitButton variant="destructive" className="w-full">
              Endgültig löschen
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
