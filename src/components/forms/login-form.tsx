"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type ActionState } from "@/server/actions/auth.actions";
import { FieldError, FormAlert } from "./form-feedback";
import { SubmitButton } from "./submit-button";

const initialState: ActionState = {};

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo ?? "/dashboard"} />
      <FormAlert error={state.error} success={state.success} />

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Passwort</Label>
          <Link
            href="/reset-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Passwort vergessen?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <SubmitButton className="w-full">Anmelden</SubmitButton>
    </form>
  );
}
