import { describe, expect, it } from "vitest";
import { applyRules } from "@/lib/categorization/rule-engine";
import type { CategoryRule } from "@/lib/categorization/types";

function rule(overrides: Partial<CategoryRule> & { matchValue: string }): CategoryRule {
  return {
    id: `rule-${overrides.matchValue}`,
    categoryId: "cat-default",
    matchType: "keyword",
    priority: 100,
    hitCount: 0,
    isUserRule: false,
    ...overrides,
  };
}

const input = {
  merchant: "REWE Markt GmbH",
  purpose: "REWE SAGT DANKE 123456 Berlin",
  amount: -42.37,
};

describe("applyRules", () => {
  it("findet einen Keyword-Treffer unabhängig von Groß-/Kleinschreibung", () => {
    const result = applyRules(input, [
      rule({ matchValue: "rewe", categoryId: "cat-essen" }),
    ]);

    expect(result?.categoryId).toBe("cat-essen");
    expect(result?.source).toBe("rule");
  });

  it("gibt null zurück, wenn keine Regel passt", () => {
    expect(applyRules(input, [rule({ matchValue: "netflix" })])).toBeNull();
  });

  it("bevorzugt gelernte Nutzerregeln vor System-Regeln", () => {
    const result = applyRules(input, [
      rule({ matchValue: "rewe", categoryId: "cat-system", priority: 900 }),
      rule({
        matchValue: "rewe markt gmbh",
        matchType: "merchant_exact",
        categoryId: "cat-user",
        priority: 10,
        isUserRule: true,
      }),
    ]);

    expect(result?.categoryId).toBe("cat-user");
    expect(result?.confidence).toBe(1);
  });

  it("bevorzugt bei gleicher Herkunft die höhere Priorität", () => {
    const result = applyRules(input, [
      rule({ matchValue: "rewe", categoryId: "cat-low", priority: 50 }),
      rule({ matchValue: "sagt danke", categoryId: "cat-high", priority: 150 }),
    ]);

    expect(result?.categoryId).toBe("cat-high");
  });

  it("bevorzugt bei gleicher Priorität den spezifischeren Match", () => {
    const result = applyRules(input, [
      rule({ matchValue: "rewe", categoryId: "cat-kurz" }),
      rule({ matchValue: "rewe sagt danke", categoryId: "cat-lang" }),
    ]);

    expect(result?.categoryId).toBe("cat-lang");
  });

  it("matcht merchant_exact nur gegen den Händlernamen, nicht den Zweck", () => {
    const result = applyRules(input, [
      rule({
        matchValue: "rewe sagt danke 123456 berlin",
        matchType: "merchant_exact",
        categoryId: "cat-falsch",
        isUserRule: true,
      }),
    ]);

    expect(result).toBeNull();
  });

  it("matcht merchant_contains gegen den Händlernamen", () => {
    const result = applyRules(input, [
      rule({
        matchValue: "rewe markt",
        matchType: "merchant_contains",
        categoryId: "cat-essen",
        isUserRule: true,
      }),
    ]);

    expect(result?.categoryId).toBe("cat-essen");
  });
});
