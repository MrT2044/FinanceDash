"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dismissRecommendationAction } from "@/server/actions/recommendations.actions";

export function DismissRecommendationButton({ id }: { id: string }) {
  return (
    <form action={dismissRecommendationAction}>
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        aria-label="Empfehlung ausblenden"
        className="text-muted-foreground"
      >
        <X className="size-3.5" />
      </Button>
    </form>
  );
}
