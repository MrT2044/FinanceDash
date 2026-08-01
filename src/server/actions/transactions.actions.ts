"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { learnFromCorrection } from "@/lib/categorization/service";

const updateCategorySchema = z.object({
  transactionId: z.uuid(),
  categoryId: z.uuid(),
  /** Wenn true, wird die Zuordnung als Regel für künftige Buchungen gemerkt. */
  learn: z.boolean(),
});

export type CategoryUpdateResult = { ok: true } | { ok: false; error: string };

/**
 * Ordnet eine Buchung manuell einer Kategorie zu.
 *
 * Gibt Fehler bewusst als Rückgabewert zurück statt zu werfen: Die Action wird
 * aus einem `startTransition` heraus aufgerufen, und eine dort geworfene
 * Ausnahme reißt die gesamte Seite in die Fehlergrenze — genau das führte beim
 * Ändern der Kategorie zur leeren Fehlerseite.
 */
export async function updateTransactionCategoryAction(
  formData: FormData,
): Promise<CategoryUpdateResult> {
  const parsed = updateCategorySchema.safeParse({
    transactionId: formData.get("transactionId"),
    categoryId: formData.get("categoryId"),
    learn: formData.get("learn") !== "false",
  });

  if (!parsed.success) {
    return { ok: false, error: "Ungültige Auswahl." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Bitte melde dich erneut an." };

    // RLS begrenzt den Zugriff auf eigene Buchungen; das select liefert daher
    // nur dann einen Treffer, wenn die Buchung wirklich dem Nutzer gehört.
    const { data: transaction } = await supabase
      .from("transactions")
      .select("id, counterparty_name")
      .eq("id", parsed.data.transactionId)
      .maybeSingle();

    if (!transaction) return { ok: false, error: "Buchung nicht gefunden." };

    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("id", parsed.data.categoryId)
      .maybeSingle();

    if (!category) return { ok: false, error: "Kategorie nicht gefunden." };

    const { error } = await supabase
      .from("transactions")
      .update({
        category_id: parsed.data.categoryId,
        category_source: "manual",
        category_confidence: 1,
      })
      .eq("id", parsed.data.transactionId);

    if (error) {
      return { ok: false, error: "Die Kategorie konnte nicht gespeichert werden." };
    }

    if (parsed.data.learn && transaction.counterparty_name) {
      // Scheitert das Lernen, ist die Zuordnung selbst trotzdem gespeichert.
      await learnFromCorrection(supabase, {
        userId: user.id,
        merchant: transaction.counterparty_name,
        categoryId: parsed.data.categoryId,
      });
    }

    revalidatePath("/transaktionen");
    revalidatePath("/dashboard");
    revalidatePath("/kategorien");
    revalidatePath("/ausgaben");

    return { ok: true };
  } catch {
    return { ok: false, error: "Die Kategorie konnte nicht gespeichert werden." };
  }
}
