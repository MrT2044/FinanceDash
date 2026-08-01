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

      {/*
        Die eigentliche Fehlermeldung wird angezeigt, nicht verschluckt — ohne
        sie ist von außen nicht zu erkennen, was schiefging. Bei Fehlern aus dem
        Server-Rendern liefert Next.js in der Produktion bewusst nur die
        `digest`-Kennung; die passende Meldung steht dann im Server-Log.
      */}
      {error.message || error.digest ? (
        <details className="w-full text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Technische Details
          </summary>
          <div className="mt-2 space-y-1 rounded-lg bg-muted p-3">
            {error.message ? (
              <p className="font-mono text-xs break-words text-foreground">
                {error.message}
              </p>
            ) : null}
            {error.digest ? (
              <p className="font-mono text-xs text-muted-foreground">
                Kennung: {error.digest}
              </p>
            ) : null}
          </div>
        </details>
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
