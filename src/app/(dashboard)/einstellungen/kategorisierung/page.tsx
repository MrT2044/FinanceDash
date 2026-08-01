import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsShell } from "@/components/settings/settings-shell";
import {
  CategoryManager,
  type ManagedCategory,
} from "@/components/settings/category-manager";
import { RuleList, type LearnedRule } from "@/components/settings/rule-list";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kategorisierung — FinanceDash" };

export default async function CategorizationSettingsPage() {
  const supabase = await createClient();

  // RLS liefert System-Kategorien plus die eigenen; ein Nutzerfilter ist hier
  // bewusst nicht gesetzt (siehe Sicherheitsmodell).
  const [{ data: categories }, { data: rules }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, color, kind, is_system, user_id")
      .order("sort_order"),
    supabase
      .from("category_rules")
      .select("id, match_value, category_id, user_id")
      .not("user_id", "is", null)
      .order("hit_count", { ascending: false })
      .limit(50),
  ]);

  const managed: ManagedCategory[] = (categories ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    color: category.color,
    kind: category.kind,
    isSystem: category.is_system,
  }));

  const categoryById = new Map(managed.map((category) => [category.id, category]));

  const learned: LearnedRule[] = (rules ?? []).map((rule) => ({
    id: rule.id,
    matchValue: rule.match_value,
    categoryName: categoryById.get(rule.category_id)?.name ?? "Unbekannt",
    categoryColor: categoryById.get(rule.category_id)?.color ?? "#94a3b8",
  }));

  return (
    <SettingsShell href="/einstellungen/kategorisierung">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Kategorien</CardTitle>
          <CardDescription>
            Eigene Kategorien ergänzen die vorgegebenen. Vorgegebene lassen sich nicht
            ändern, damit die automatische Zuordnung verlässlich bleibt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={managed} />
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Gelernte Zuordnungen</CardTitle>
          <CardDescription>
            {learned.length
              ? `${learned.length} ${learned.length === 1 ? "Regel" : "Regeln"} aus deinen manuellen Korrekturen.`
              : "Aus deinen manuellen Korrekturen entstehen automatisch Regeln."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RuleList rules={learned} />
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
