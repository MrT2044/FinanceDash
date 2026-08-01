import { AlertTriangle, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DismissRecommendationButton } from "./dismiss-recommendation-button";

export type RecommendationView = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning";
};

export function RecommendationCard({
  recommendation,
  dismissible = true,
}: {
  recommendation: RecommendationView;
  dismissible?: boolean;
}) {
  const isWarning = recommendation.severity === "warning";
  const Icon = isWarning ? AlertTriangle : Lightbulb;

  return (
    <Card className="card-elevated">
      <CardContent className="flex gap-3 p-5">
        <span
          className={
            isWarning
              ? "grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : "grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
          }
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-sm font-semibold leading-snug">{recommendation.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {recommendation.description}
          </p>
        </div>
        {dismissible ? <DismissRecommendationButton id={recommendation.id} /> : null}
      </CardContent>
    </Card>
  );
}
