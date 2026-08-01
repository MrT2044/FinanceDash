"use client";

import { ErrorView } from "@/components/dashboard/error-view";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <ErrorView
      error={error}
      retry={unstable_retry}
      description="Dieser Bereich konnte nicht geladen werden. Deine Daten sind davon nicht betroffen."
    />
  );
}
