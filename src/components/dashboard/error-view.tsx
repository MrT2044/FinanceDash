"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Gemeinsame Fehlerdarstellung für alle error.tsx-Grenzen.
 *
 * Ohne eine solche Grenze ersetzt Next.js die ganze Seite durch seinen eigenen
 * Platzhalter ("This page couldn't load") — ohne Hinweis, was passiert ist und
 * ohne Weg zurück. Hier bleibt die Anwendung bedienbar und der Fehler wird
 * protokolliert.
 */
export function ErrorView({
  error,
  retry,
  title = "Da ist etwas schiefgelaufen",
  description = "Der Bereich konnte nicht geladen werden. Meist hilft es, es noch einmal zu versuchen.",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    console.error("[FinanceDash]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </span>

      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Die Kennung hilft beim Zuordnen im Server-Log, verrät aber nichts. */}
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">
          Fehlerkennung: {error.digest}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => retry()}>
          <RotateCcw className="size-4" />
          Erneut versuchen
        </Button>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Zur Übersicht
        </Link>
      </div>
    </div>
  );
}
