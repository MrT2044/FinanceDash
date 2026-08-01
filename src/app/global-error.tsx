"use client";

/**
 * Letzte Auffanglinie: greift nur, wenn das Root-Layout selbst scheitert.
 * Ersetzt das komplette Dokument und muss darum eigene html/body-Tags mitbringen
 * — und ohne Design-Tokens auskommen, weil das Stylesheet Teil des Layouts ist.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <main style={{ maxWidth: "24rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
            FinanceDash konnte nicht geladen werden
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#475569", margin: "0 0 1.25rem" }}>
            Bitte versuche es erneut. Bleibt der Fehler bestehen, lade die Seite neu.
          </p>
          {error.digest ? (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                fontFamily: "ui-monospace, monospace",
                margin: "0 0 1.25rem",
              }}
            >
              Fehlerkennung: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              cursor: "pointer",
              border: 0,
              borderRadius: "0.625rem",
              background: "#2563eb",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              padding: "0.625rem 1.125rem",
            }}
          >
            Erneut versuchen
          </button>
        </main>
      </body>
    </html>
  );
}
