"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type CategoryActionState = { error?: string; success?: string };

/** Aus dem Namen einen Slug bilden, der die Prüfbedingung der Tabelle erfüllt. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Bitte gib einen Namen ein.")
    .max(60, "Der Name darf höchstens 60 Zeichen lang sein."),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Bitte wähle eine Farbe.")
    .default("#64748b"),
  kind: z.enum(["expense", "income", "transfer"]).default("expense"),
});

export async function createCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") ?? "#64748b",
    kind: formData.get("kind") ?? "expense",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const slug = toSlug(parsed.data.name);
  if (!slug) return { error: "Bitte gib einen Namen mit Buchstaben oder Ziffern ein." };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Bitte melde dich erneut an." };

    const { error } = await supabase.from("categories").insert({
      user_id: user.id,
      slug,
      name: parsed.data.name,
      color: parsed.data.color,
      kind: parsed.data.kind,
      is_system: false,
    });

    if (error) {
      // Der partielle Unique-Index greift pro Nutzer und Slug.
      return {
        error:
          error.code === "23505"
            ? "Eine Kategorie mit diesem Namen existiert bereits."
            : "Die Kategorie konnte nicht angelegt werden.",
      };
    }

    revalidateCategoryViews();
    return { success: `„${parsed.data.name}" wurde angelegt.` };
  } catch {
    return { error: "Die Kategorie konnte nicht angelegt werden." };
  }
}

export async function updateCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const id = z.uuid().safeParse(formData.get("id"));
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") ?? "#64748b",
    kind: formData.get("kind") ?? "expense",
  });

  if (!id.success) return { error: "Unbekannte Kategorie." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  try {
    const supabase = await createClient();

    // System-Kategorien haben user_id IS NULL; RLS lässt daran kein Update zu.
    // Der zusätzliche Filter sorgt für eine verständliche Meldung statt eines
    // stillen Treffers von null Zeilen.
    const { data, error } = await supabase
      .from("categories")
      .update({
        name: parsed.data.name,
        color: parsed.data.color,
        kind: parsed.data.kind,
      })
      .eq("id", id.data)
      .eq("is_system", false)
      .select("id");

    if (error) return { error: "Die Kategorie konnte nicht gespeichert werden." };
    if (!data?.length) {
      return { error: "Vorgegebene Kategorien lassen sich nicht bearbeiten." };
    }

    revalidateCategoryViews();
    return { success: "Änderungen gespeichert." };
  } catch {
    return { error: "Die Kategorie konnte nicht gespeichert werden." };
  }
}

/**
 * Löscht eine eigene Kategorie. Zugeordnete Buchungen verlieren dabei nur ihre
 * Zuordnung (`on delete set null` auf `transactions.category_id`) — es gehen
 * also keine Buchungen verloren.
 */
export async function deleteCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Unbekannte Kategorie." };

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id.data)
      .eq("is_system", false)
      .select("id");

    if (error) return { error: "Die Kategorie konnte nicht gelöscht werden." };
    if (!data?.length) {
      return { error: "Vorgegebene Kategorien lassen sich nicht löschen." };
    }

    revalidateCategoryViews();
    return { success: "Die Kategorie wurde gelöscht." };
  } catch {
    return { error: "Die Kategorie konnte nicht gelöscht werden." };
  }
}

/** Entfernt eine gelernte Zuordnungsregel. */
export async function deleteCategoryRuleAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Unbekannte Regel." };

  try {
    const supabase = await createClient();

    // RLS lässt nur eigene Regeln zu; System-Regeln (user_id IS NULL) bleiben
    // dadurch unberührt.
    const { error } = await supabase
      .from("category_rules")
      .delete()
      .eq("id", id.data)
      .not("user_id", "is", null);

    if (error) return { error: "Die Regel konnte nicht gelöscht werden." };

    revalidateCategoryViews();
    return { success: "Die Regel wurde gelöscht." };
  } catch {
    return { error: "Die Regel konnte nicht gelöscht werden." };
  }
}

function revalidateCategoryViews() {
  for (const path of [
    "/kategorien",
    "/transaktionen",
    "/dashboard",
    "/ausgaben",
    "/einstellungen/kategorisierung",
  ]) {
    revalidatePath(path);
  }
}
