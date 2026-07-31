import type {
  CategorizationInput,
  CategorizationResult,
  CategoryRule,
} from "./types";

/**
 * Text, gegen den Regeln matchen: Händlername und Verwendungszweck kombiniert,
 * normalisiert auf Kleinschreibung ohne Mehrfach-Leerzeichen.
 */
function buildHaystack(input: CategorizationInput): {
  merchant: string;
  combined: string;
} {
  const merchant = input.merchant.toLowerCase().replace(/\s+/g, " ").trim();
  const purpose = input.purpose.toLowerCase().replace(/\s+/g, " ").trim();
  return { merchant, combined: `${merchant} ${purpose}`.trim() };
}

function matches(rule: CategoryRule, haystack: { merchant: string; combined: string }): boolean {
  switch (rule.matchType) {
    case "merchant_exact":
      return haystack.merchant === rule.matchValue;
    case "merchant_contains":
      return haystack.merchant.includes(rule.matchValue);
    case "keyword":
      return haystack.combined.includes(rule.matchValue);
    case "iban":
      return haystack.combined.includes(rule.matchValue.toLowerCase());
  }
}

/**
 * Rangfolge bei mehreren Treffern:
 *   1. Gelernte Nutzerregeln vor System-Regeln
 *   2. Höhere Priorität
 *   3. Spezifischerer (längerer) Match-Wert
 *   4. Häufiger genutzte Regel
 */
function scoreRule(rule: CategoryRule): number[] {
  return [
    rule.isUserRule ? 1 : 0,
    rule.priority,
    rule.matchValue.length,
    rule.hitCount,
  ];
}

function compareRules(a: CategoryRule, b: CategoryRule): number {
  const scoreA = scoreRule(a);
  const scoreB = scoreRule(b);
  for (let index = 0; index < scoreA.length; index += 1) {
    if (scoreA[index] !== scoreB[index]) return scoreB[index] - scoreA[index];
  }
  return 0;
}

/** Konfidenz aus der Art des Treffers — exakte Händlertreffer sind am sichersten. */
function confidenceFor(rule: CategoryRule): number {
  if (rule.isUserRule) return rule.matchType === "merchant_exact" ? 1 : 0.95;
  return rule.matchType === "merchant_exact" ? 0.9 : 0.8;
}

export function applyRules(
  input: CategorizationInput,
  rules: CategoryRule[],
): CategorizationResult | null {
  const haystack = buildHaystack(input);
  const hits = rules.filter((rule) => matches(rule, haystack));

  if (!hits.length) return null;

  const best = hits.sort(compareRules)[0];

  return {
    categoryId: best.categoryId,
    confidence: confidenceFor(best),
    source: "rule",
    ruleId: best.id,
  };
}
