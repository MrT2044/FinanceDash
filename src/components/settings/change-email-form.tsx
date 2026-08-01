"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormAlert } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { changeEmailAction, type ActionState } from "@/server/actions/auth.actions";

const initialState: ActionState = {};

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction] = useActionState(changeEmailAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormAlert error={state.error} success={state.success} />

      <div className="space-y-2">
        <Label htmlFor="newEmail">Neue E-Mail-Adresse</Label>
        <Input
          id="newEmail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={currentEmail}
          required
        />
        <p className="text-xs text-muted-foreground">
          Die Änderung greift erst, wenn du den Bestätigungslink geöffnet hast. Bis
          dahin meldest du dich weiter mit der bisherigen Adresse an.
        </p>
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <SubmitButton variant="outline">Adresse ändern</SubmitButton>
    </form>
  );
}
