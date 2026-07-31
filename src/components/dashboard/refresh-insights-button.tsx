"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";
import { refreshInsightsAction } from "@/server/actions/recommendations.actions";

function Inner() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      <RefreshCw className={pending ? "size-3.5 animate-spin" : "size-3.5"} />
      Neu berechnen
    </Button>
  );
}

export function RefreshInsightsButton() {
  return (
    <form action={refreshInsightsAction}>
      <Inner />
    </form>
  );
}
