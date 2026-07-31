"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction, type ActionState } from "@/server/actions/auth.actions";
import { FieldError, FormAlert } from "./form-feedback";
import { SubmitButton } from "./submit-button";

const initialState: ActionState = {};

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);

  if (state.success) {
    return <FormAlert success={state.success} />;
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormAlert error={state.error} />

      <div className="space-y-2">
        <Label htmlFor="displayName">Name (optional)</Label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          placeholder="Wie sollen wir dich nennen?"
        />
        <FieldError messages={state.fieldErrors?.displayName} />
      </div>

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
        <Label htmlFor="password">Passwort</Label>
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

      <div className="space-y-2">
        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="acceptPrivacy"
            required
            className="mt-0.5 size-4 rounded border-input accent-primary"
          />
          <span>
            Ich habe die{" "}
            <Link href="/datenschutz" className="underline underline-offset-4">
              Datenschutzhinweise
            </Link>{" "}
            gelesen und stimme der Verarbeitung meiner Daten zu.
          </span>
        </label>
        <FieldError messages={state.fieldErrors?.acceptPrivacy} />
      </div>

      <SubmitButton className="w-full">Konto erstellen</SubmitButton>
    </form>
  );
}
