import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { RefreshInsightsButton } from "@/components/dashboard/refresh-insights-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Empfehlungen — FinanceDash" };

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const { data: recommendations } = await supabase
    .from("recommendations")
    .select("id, title, description, severity")
    .eq("dismissed", false)
    .order("severity", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Empfehlungen"
        description="Automatisch erkannte Muster in deinen Ausgaben."
        action={<RefreshInsightsButton />}
      />

      {recommendations?.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation as never}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/70">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Lightbulb className="size-5" />
            </span>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold">Noch keine Empfehlungen</h2>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Sobald du Umsätze aus mehreren Monaten importiert hast, erkennt FinanceDash
                Muster und zeigt dir hier konkrete Sparhinweise.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
