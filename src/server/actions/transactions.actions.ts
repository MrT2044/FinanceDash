"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { learnFromCorrection } from "@/lib/categorization/service";

const updateCategorySchema = z.object({
  transactionId: z.string().uuid(),
  categoryId: z.string().uuid(),
  /** Wenn true, wird die Zuordnung als Regel für künftige Buchungen gemerkt. */
  learn: z.boolean(),
});

export async function updateTransactionCategoryAction(formData: FormData) {
  const parsed = updateCategorySchema.safeParse({
    transactionId: formData.get("transactionId"),
    categoryId: formData.get("categoryId"),
    learn: formData.get("learn") !== "false",
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS begrenzt den Zugriff auf eigene Buchungen; das select liefert daher
  // nur dann einen Treffer, wenn die Buchung wirklich dem Nutzer gehört.
  const { data: transaction } = await supabase
    .from("transactions")
    .select("id, counterparty_name")
    .eq("id", parsed.data.transactionId)
    .maybeSingle();

  if (!transaction) return;

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.data.categoryId)
    .maybeSingle();

  if (!category) return;

  await supabase
    .from("transactions")
    .update({
      category_id: parsed.data.categoryId,
      category_source: "manual",
      category_confidence: 1,
    })
    .eq("id", parsed.data.transactionId);

  if (parsed.data.learn && transaction.counterparty_name) {
    await learnFromCorrection(supabase, {
      userId: user.id,
      merchant: transaction.counterparty_name,
      categoryId: parsed.data.categoryId,
    });
  }

  revalidatePath("/transaktionen");
  revalidatePath("/dashboard");
  revalidatePath("/kategorien");
}
