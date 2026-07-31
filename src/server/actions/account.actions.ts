"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSecurityEvent } from "@/lib/security/audit-log";

export type AccountActionState = { error?: string; success?: string };

const displayNameSchema = z.object({
  displayName: z.string().trim().max(80),
});

export async function updateProfileAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = displayNameSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
  });

  if (!parsed.success) {
    return { error: "Der Name darf höchstens 80 Zeichen lang sein." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName || null })
    .eq("id", user.id);

  if (error) return { error: "Der Name konnte nicht gespeichert werden." };

  revalidatePath("/einstellungen");
  return { success: "Änderungen gespeichert." };
}

const deleteSchema = z.object({
  confirmation: z.literal("LÖSCHEN", {
    message: 'Bitte tippe exakt "LÖSCHEN", um fortzufahren.',
  }),
});

/**
 * DSGVO Art. 17: vollständige Löschung des Kontos samt aller Finanzdaten.
 * Das Löschen des auth.users-Eintrags räumt über ON DELETE CASCADE alle
 * abhängigen Tabellen mit ab.
 */
export async function deleteAccountAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = deleteSchema.safeParse({
    confirmation: (formData.get("confirmation") as string)?.trim().toUpperCase(),
  });

  if (!parsed.success) {
    return { error: 'Bitte tippe exakt "LÖSCHEN", um fortzufahren.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };

  await logSecurityEvent("account_deleted", { userId: user.id });

  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) {
    return { error: "Das Konto konnte nicht gelöscht werden. Bitte versuche es erneut." };
  }

  await supabase.auth.signOut();
  redirect("/?geloescht=1");
}
