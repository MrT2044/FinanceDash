"use client";

import { useActionState, useState } from "react";
import { Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  createCategoryAction,
  deleteCategoryAction,
  type CategoryActionState,
} from "@/server/actions/categories.actions";

export type ManagedCategory = {
  id: string;
  name: string;
  color: string;
  kind: string;
  isSystem: boolean;
};

const initialState: CategoryActionState = {};

const KIND_LABELS: Record<string, string> = {
  expense: "Ausgabe",
  income: "Einnahme",
  transfer: "Umbuchung",
};

export function CategoryManager({ categories }: { categories: ManagedCategory[] }) {
  const [createState, createAction] = useActionState(createCategoryAction, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCategoryAction,
    initialState,
  );
  const [color, setColor] = useState("#2563eb");

  const own = categories.filter((category) => !category.isSystem);
  const system = categories.filter((category) => category.isSystem);

  return (
    <div className="space-y-6">
      <form action={createAction} className="space-y-3">
        <FormAlert error={createState.error} success={createState.success} />

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="categoryName">Neue Kategorie</Label>
            <Input
              id="categoryName"
              name="name"
              maxLength={60}
              placeholder="z. B. Hobby"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryColor">Farbe</Label>
            <input
              id="categoryColor"
              name="color"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-11 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1 md:h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryKind">Art</Label>
            <select
              id="categoryKind"
              name="kind"
              defaultValue="expense"
              className="h-11 rounded-lg border border-input bg-transparent px-2.5 text-base md:h-9 md:text-sm dark:bg-input/30"
            >
              <option value="expense">Ausgabe</option>
              <option value="income">Einnahme</option>
              <option value="transfer">Umbuchung</option>
            </select>
          </div>

          <SubmitButton className="h-11 md:h-9">
            <Plus className="size-4" />
            Anlegen
          </SubmitButton>
        </div>
      </form>

      <div className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Eigene Kategorien
        </p>
        <FormAlert error={deleteState.error} success={deleteState.success} />

        {own.length ? (
          <ul className="divide-y divide-border/60">
            {own.map((category) => (
              <li key={category.id} className="flex items-center gap-3 py-2.5">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {KIND_LABELS[category.kind] ?? category.kind}
                </span>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon-sm"
                    disabled={isDeleting}
                    aria-label={`Kategorie ${category.name} löschen`}
                    className="size-10 text-muted-foreground hover:text-destructive md:size-8"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Du hast noch keine eigenen Kategorien angelegt.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Beim Löschen bleiben die Buchungen erhalten; sie gelten danach als nicht
          zugeordnet.
        </p>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Lock className="size-3" />
          Vorgegebene Kategorien
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {system.map((category) => (
            <li
              key={category.id}
              className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
