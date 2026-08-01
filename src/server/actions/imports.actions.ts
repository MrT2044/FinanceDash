"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ImportActionState = { error?: string; success?: string };

/**
 * Löscht einen einzelnen Import samt der daraus entstandenen Buchungen.
 *
 * Der Fremdschlüssel auf `import_batches` ist `on delete set null` — ein reines
 * Löschen des Batches ließe die Buchungen also verwaist zurück. Sie müssen
 * darum zuerst weg. RLS begrenzt beide Löschungen auf eigene Zeilen; ein
 * fremder Batch trifft schlicht keine Zeile.
 */
export async function deleteImportBatchAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const parsed = z.uuid().safeParse(formData.get("batchId"));
  if (!parsed.success) return { error: "Ungültiger Import." };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Bitte melde dich erneut an." };

    const { error: transactionError } = await supabase
      .from("transactions")
      .delete()
      .eq("import_batch_id", parsed.data);

    if (transactionError) {
      return { error: "Die Buchungen konnten nicht gelöscht werden." };
    }

    const { error: batchError } = await supabase
      .from("import_batches")
      .delete()
      .eq("id", parsed.data);

    if (batchError) return { error: "Der Import konnte nicht gelöscht werden." };

    // Empfehlungen beruhen auf den gelöschten Buchungen und wären nun falsch.
    await supabase.from("recommendations").delete().eq("dismissed", false);

    revalidateDataViews();
    return { success: "Der Import wurde gelöscht." };
  } catch {
    return { error: "Der Import konnte nicht gelöscht werden." };
  }
}

const deleteAllSchema = z.object({
  confirmation: z.literal("LÖSCHEN", {
    message: 'Bitte tippe exakt "LÖSCHEN", um fortzufahren.',
  }),
});

/**
 * Löscht sämtliche importierten Daten, lässt das Konto aber bestehen.
 *
 * Bewusst erhalten bleiben: Profil, angelegte Konten und die aus manuellen
 * Korrekturen gelernten Kategorieregeln — sie sind Einstellungen des Nutzers,
 * keine importierten Daten, und wären nach einem Neuimport wieder nützlich.
 */
export async function deleteAllImportsAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const parsed = deleteAllSchema.safeParse({
    confirmation: (formData.get("confirmation") as string)?.trim().toUpperCase(),
  });

  if (!parsed.success) {
    return { error: 'Bitte tippe exakt "LÖSCHEN", um fortzufahren.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Bitte melde dich erneut an." };

    // RLS beschränkt jede dieser Löschungen auf die eigenen Zeilen. Die
    // `neq`-Bedingung auf einer nie zutreffenden UUID ist nur nötig, weil
    // PostgREST ein Löschen ohne jeden Filter ablehnt.
    const never = "00000000-0000-0000-0000-000000000000";

    const { error: transactionError } = await supabase
      .from("transactions")
      .delete()
      .neq("id", never);
    if (transactionError) {
      return { error: "Die Buchungen konnten nicht gelöscht werden." };
    }

    await supabase.from("import_batches").delete().neq("id", never);
    await supabase.from("recommendations").delete().neq("id", never);

    revalidateDataViews();
    return { success: "Alle importierten Daten wurden gelöscht." };
  } catch {
    return { error: "Die Daten konnten nicht gelöscht werden." };
  }
}

function revalidateDataViews() {
  for (const path of [
    "/dashboard",
    "/transaktionen",
    "/ausgaben",
    "/einnahmen",
    "/kategorien",
    "/empfehlungen",
    "/import",
    "/einstellungen/csv",
  ]) {
    revalidatePath(path);
  }
}
