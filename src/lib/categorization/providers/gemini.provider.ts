import "server-only";
import { generateJson, isGeminiConfigured } from "@/lib/ai/gemini-client";
import type {
  CategorizationInput,
  CategorizationProvider,
  CategorizationResult,
  CategoryRef,
} from "../types";

/** Unterhalb dieser Konfidenz wird die Buchung lieber unkategorisiert gelassen. */
const MIN_CONFIDENCE = 0.6;

type GeminiResponse = {
  items: { index: number; slug: string; confidence: number }[];
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer" },
          slug: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["index", "slug", "confidence"],
      },
    },
  },
  required: ["items"],
};

function buildPrompt(inputs: CategorizationInput[], categories: CategoryRef[]): string {
  const categoryList = categories
    .map((category) => `- ${category.slug}: ${category.name}`)
    .join("\n");

  const transactionList = inputs
    .map(
      (input, index) =>
        `${index}. Händler: "${input.merchant}" | Verwendungszweck: "${input.purpose.slice(0, 200)}" | Betrag: ${input.amount.toFixed(2)} EUR`,
    )
    .join("\n");

  return [
    "Du bist ein Assistent, der deutsche Bankbuchungen kategorisiert.",
    "",
    "Verfügbare Kategorien (nutze ausschließlich diese slugs):",
    categoryList,
    "",
    "Buchungen (negativer Betrag = Ausgabe, positiver Betrag = Einnahme):",
    transactionList,
    "",
    "Ordne jeder Buchung genau eine Kategorie zu. Gib für jede Buchung den Index,",
    "den slug und eine Konfidenz zwischen 0 und 1 an. Wenn du dir unsicher bist,",
    'nutze den slug "sonstiges" mit niedriger Konfidenz.',
  ].join("\n");
}

/**
 * KI-Fallback für Buchungen, die keine Regel trifft. Arbeitet im Batch, um die
 * Anzahl der API-Aufrufe (und damit den Verbrauch des kostenlosen Kontingents)
 * gering zu halten.
 */
export class GeminiCategorizationProvider implements CategorizationProvider {
  readonly name = "gemini";

  static isAvailable(): boolean {
    return isGeminiConfigured();
  }

  async categorize(
    input: CategorizationInput,
    categories: CategoryRef[],
  ): Promise<CategorizationResult | null> {
    const results = await this.categorizeBatch([input], categories);
    return results[0] ?? null;
  }

  async categorizeBatch(
    inputs: CategorizationInput[],
    categories: CategoryRef[],
  ): Promise<(CategorizationResult | null)[]> {
    if (!inputs.length || !categories.length) return [];

    const response = await generateJson<GeminiResponse>(
      buildPrompt(inputs, categories),
      RESPONSE_SCHEMA,
    );

    const results: (CategorizationResult | null)[] = inputs.map(() => null);
    if (!response?.items) return results;

    const bySlug = new Map(categories.map((category) => [category.slug, category.id]));

    for (const item of response.items) {
      const categoryId = bySlug.get(item.slug);
      const confidence = Number(item.confidence);

      if (
        categoryId &&
        Number.isInteger(item.index) &&
        item.index >= 0 &&
        item.index < inputs.length &&
        Number.isFinite(confidence) &&
        confidence >= MIN_CONFIDENCE
      ) {
        results[item.index] = {
          categoryId,
          confidence: Math.min(1, confidence),
          source: "ai",
        };
      }
    }

    return results;
  }
}
