"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormAlert } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  resendConfirmationAction,
  type ActionState,
} from "@/server/actions/auth.actions";

const initialState: ActionState = {};

export function ResendConfirmationForm() {
  const [state, formAction] = useActionState(resendConfirmationAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <FormAlert error={state.error} success={state.success} />

      <div className="space-y-2">
        <Label htmlFor="resendEmail">E-Mail-Adresse</Label>
        <Input
          id="resendEmail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="du@beispiel.de"
          required
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <SubmitButton className="w-full">Neue Bestätigungs-E-Mail senden</SubmitButton>
    </form>
  );
}
