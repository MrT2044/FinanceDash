"use client";

import { useActionState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/forms/form-feedback";
import {
  deleteCategoryRuleAction,
  type CategoryActionState,
} from "@/server/actions/categories.actions";

export type LearnedRule = {
  id: string;
  matchValue: string;
  categoryName: string;
  categoryColor: string;
};

const initialState: CategoryActionState = {};

export function RuleList({ rules }: { rules: LearnedRule[] }) {
  const [state, formAction, isPending] = useActionState(
    deleteCategoryRuleAction,
    initialState,
  );

  if (!rules.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Sobald du eine Buchung manuell umsortierst, merkt sich FinanceDash die
        Zuordnung und wendet sie beim nächsten Import automatisch an.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <FormAlert error={state.error} success={state.success} />

      <ul className="divide-y divide-border/60">
        {rules.map((rule) => (
          <li key={rule.id} className="flex items-center gap-3 py-2.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: rule.categoryColor }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{rule.matchValue}</p>
              <p className="text-xs text-muted-foreground">→ {rule.categoryName}</p>
            </div>
            <form action={formAction}>
              <input type="hidden" name="id" value={rule.id} />
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                aria-label={`Regel für ${rule.matchValue} löschen`}
                className="size-10 text-muted-foreground hover:text-destructive md:size-8"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
