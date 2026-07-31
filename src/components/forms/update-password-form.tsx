"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updatePasswordAction,
  type ActionState,
} from "@/server/actions/auth.actions";
import { FieldError, FormAlert } from "./form-feedback";
import { SubmitButton } from "./submit-button";

const initialState: ActionState = {};

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormAlert error={state.error} success={state.success} />

      <div className="space-y-2">
        <Label htmlFor="password">Neues Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">
          Mindestens 12 Zeichen, mit Groß- und Kleinbuchstaben sowie einer Ziffer.
        </p>
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">Passwort bestätigen</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError messages={state.fieldErrors?.passwordConfirm} />
      </div>

      <SubmitButton className="w-full">Passwort speichern</SubmitButton>
    </form>
  );
}
