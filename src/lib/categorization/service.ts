import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { applyRules } from "./rule-engine";
import { GeminiCategorizationProvider } from "./providers/gemini.provider";
import type {
  CategorizationInput,
  CategorizationResult,
  CategoryRef,
  CategoryRule,
} from "./types";

type Client = SupabaseClient<Database>;

export async function loadCategories(supabase: Client): Promise<CategoryRef[]> {
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name")
    .order("sort_order");

  return data ?? [];
}

export async function loadRules(supabase: Client): Promise<CategoryRule[]> {
  // RLS liefert automatisch nur System-Regeln und die eigenen gelernten Regeln.
  const { data } = await supabase
    .from("category_rules")
    .select("id, category_id, match_type, match_value, priority, hit_count, user_id");

  return (data ?? []).map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    matchType: row.match_type,
    matchValue: row.match_value,
    priority: row.priority,
    hitCount: row.hit_count,
    isUserRule: row.user_id !== null,
  }));
}

export type CategorizedItem<T> = T & {
  categoryId: string | null;
  categorySource: "rule" | "ai" | "uncategorized";
  categoryConfidence: number | null;
};

/**
 * Kategorisiert einen Stapel Buchungen: erst über Regeln, danach — sofern
 * konfiguriert — über den KI-Fallback für alles, was keine Regel getroffen hat.
 */
export async function categorizeBatch<T extends CategorizationInput>(
  items: T[],
  options: { categories: CategoryRef[]; rules: CategoryRule[]; useAi: boolean },
): Promise<CategorizedItem<T>[]> {
  const results: (CategorizationResult | null)[] = items.map((item) =>
    applyRules(item, options.rules),
  );

  const unresolved = results
    .map((result, index) => (result === null ? index : -1))
    .filter((index) => index >= 0);

  if (options.useAi && unresolved.length && GeminiCategorizationProvider.isAvailable()) {
    const provider = new GeminiCategorizationProvider();
    const aiResults = await provider.categorizeBatch(
      unresolved.map((index) => items[index]),
      options.categories,
    );

    for (const [position, index] of unresolved.entries()) {
      results[index] = aiResults[position] ?? null;
    }
  }

  return items.map((item, index) => {
    const result = results[index];
    return {
      ...item,
      categoryId: result?.categoryId ?? null,
      categorySource: result?.source ?? "uncategorized",
      categoryConfidence: result?.confidence ?? null,
    };
  });
}

/**
 * Merkt sich eine manuelle Korrektur als gelernte Regel, sodass gleiche Händler
 * künftig automatisch richtig einsortiert werden.
 */
export async function learnFromCorrection(
  supabase: Client,
  params: { userId: string; merchant: string; categoryId: string },
): Promise<void> {
  const matchValue = params.merchant.toLowerCase().replace(/\s+/g, " ").trim();

  // Zu kurze Händlernamen würden zu viele fremde Buchungen matchen.
  if (matchValue.length < 3) return;

  await supabase.from("category_rules").upsert(
    {
      user_id: params.userId,
      category_id: params.categoryId,
      match_type: "merchant_exact",
      match_value: matchValue.slice(0, 255),
      priority: 200,
      source: "learned",
    },
    { onConflict: "user_id,match_type,match_value" },
  );
}
