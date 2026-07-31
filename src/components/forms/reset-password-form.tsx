"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordResetAction,
  type ActionState,
} from "@/server/actions/auth.actions";
import { FieldError, FormAlert } from "./form-feedback";
import { SubmitButton } from "./submit-button";

const initialState: ActionState = {};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  if (state.success) {
    return <FormAlert success={state.success} />;
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormAlert error={state.error} />

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail-Adresse</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="du@beispiel.de"
          required
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <SubmitButton className="w-full">Link anfordern</SubmitButton>
    </form>
  );
}
