import type { CategorySource, RuleMatchType } from "@/types/database.types";

export type CategoryRef = {
  id: string;
  slug: string;
  name: string;
};

export type CategoryRule = {
  id: string;
  categoryId: string;
  matchType: RuleMatchType;
  matchValue: string;
  priority: number;
  hitCount: number;
  /** Nutzerregeln schlagen System-Regeln, unabhängig von der Priorität. */
  isUserRule: boolean;
};

export type CategorizationInput = {
  merchant: string;
  purpose: string;
  amount: number;
};

export type CategorizationResult = {
  categoryId: string;
  confidence: number;
  source: Extract<CategorySource, "rule" | "ai">;
  /** Für gelernte Regeln: welche Regel gegriffen hat. */
  ruleId?: string;
};

/**
 * Austauschbare Kategorisierungsquelle. Die Regel-Engine und der KI-Fallback
 * implementieren dasselbe Interface, sodass Anbieter ohne Änderungen an der
 * Import-Pipeline ausgetauscht oder ergänzt werden können.
 */
export interface CategorizationProvider {
  readonly name: string;
  categorize(
    input: CategorizationInput,
    categories: CategoryRef[],
  ): Promise<CategorizationResult | null>;
}
