"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  updateProfileAction,
  type AccountActionState,
} from "@/server/actions/account.actions";

const initialState: AccountActionState = {};

export function ProfileForm({ displayName }: { displayName: string | null }) {
  const [state, formAction] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormAlert error={state.error} success={state.success} />

      <div className="space-y-2">
        <Label htmlFor="displayName">Anzeigename</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName ?? ""}
          maxLength={80}
          placeholder="Wie sollen wir dich nennen?"
        />
      </div>

      <SubmitButton>Speichern</SubmitButton>
    </form>
  );
}
