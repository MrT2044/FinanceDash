"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormAlert } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { changePasswordAction, type ActionState } from "@/server/actions/auth.actions";

const initialState: ActionState = {};

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormAlert error={state.error} success={state.success} />

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError messages={state.fieldErrors?.currentPassword} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Neues Passwort</Label>
        <Input
          id="newPassword"
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
        <Label htmlFor="newPasswordConfirm">Neues Passwort bestätigen</Label>
        <Input
          id="newPasswordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError messages={state.fieldErrors?.passwordConfirm} />
      </div>

      <SubmitButton>Passwort ändern</SubmitButton>
    </form>
  );
}
