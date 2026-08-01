# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

FinanceDash ist ein persönliches Finanzdashboard für den deutschen Markt: CSV-Import
aus Online-Banking, automatische Kategorisierung, Auswertungen. Next.js 16 (App
Router) + Supabase. Einrichtung und Deployment stehen in der `README.md`.

## Befehle

```bash
npm run dev            # Entwicklungsserver
npm run build          # Produktionsbuild
npm run lint           # ESLint
npm test               # alle Tests (vitest)
npm run check:config   # Umgebungsvariablen gegen die echten Dienste prüfen
npx tsc --noEmit       # Typprüfung
```

Einzelne Tests:

```bash
npx vitest run tests/csv-import/parsers.test.ts
npx vitest run -t "Sparkasse"
```

`npm run check:config` prüft, ob die Schlüssel tatsächlich gültig sind, statt nur
ob sie gesetzt sind. Sinnvoll nach jeder Änderung an `.env.local` und vor einem
Deployment.

## Sprache

Benutzeroberfläche, Routen (`/ausgaben`, `/einnahmen`, `/kategorien`), Codekommentare
und Commit-Nachrichten sind deutsch. Bezeichner im Code sind englisch.

## Sicherheitsmodell

**Row Level Security ist die Zugriffsgrenze, nicht der Anwendungscode.** Jede Tabelle
mit `user_id` hat Policies auf `auth.uid() = user_id`. Queries filtern deshalb bewusst
*nicht* selbst nach Benutzer — ein vergessener Filter kann keine fremden Daten
preisgeben. Beim Ergänzen von Queries diese Trennung nicht durch eigene
Benutzerfilter aufweichen und bei neuen Tabellen immer Policies mitliefern.

Zwei Supabase-Clients mit klar getrennten Rollen:

| Datei | Rolle | Einsatz |
| --- | --- | --- |
| `src/lib/supabase/server.ts` | Benutzerkontext, RLS greift | normaler Request-Pfad |
| `src/lib/supabase/admin.ts` | Service Role, umgeht RLS | **nur** DSGVO-Löschung und Audit-Log |

`admin.ts` ist mit `server-only` markiert und darf niemals in den regulären
Request-Pfad wandern.

Mutationen laufen über Server Actions in `src/server/actions/*.actions.ts` (CSRF-sicher
by design). Route Handler gibt es nur dort, wo es nötig ist: `/api/export` (Datei-Download)
und `/auth/callback`.

`src/lib/security/audit-log.ts` schluckt Fehler bewusst — ein defektes Audit-Log darf
keinen Request scheitern lassen. Nebenwirkung: Ein ungültiger Service-Role-Key fällt
im Betrieb nicht auf. Dafür gibt es `npm run check:config`.

## Next.js 16: abweichende Konventionen

- Die Middleware heißt **`src/proxy.ts`** und exportiert `proxy()`, nicht `middleware()`.
  Sie delegiert an `updateSession()` in `src/lib/supabase/middleware.ts`, wo
  Session-Erneuerung, Route-Schutz und die Inaktivitäts-Abmeldung liegen.
- Die Vitest-Konfiguration ist `vitest.config.mts` (nicht `.ts`).

## Datenbank und Migrationen

Migrationen liegen als `supabase/migrations/<zeitstempel>_<name>.sql`. Der Zeitstempel
ist Pflicht, sonst ignoriert die Supabase-CLI die Datei.

**`supabase/bootstrap.sql` ist generiert** — eine Verkettung aller Migrationen mit
vorangestelltem Aufräumblock, zum Einspielen über den SQL-Editor ohne CLI-Login. Nach
jeder neuen Migration neu erzeugen, sonst laufen beide Wege auseinander.

`src/types/database.types.ts` wird generiert
(`npx supabase gen types typescript --linked`), enthält am Dateiende aber einen
handgepflegten Aliasblock (`BankType`, `CategorySource`, `CategoryKind` …), der nach
einer Neugenerierung wieder angefügt werden muss.

Beim Schreiben von Upserts: `ON CONFLICT` funktioniert nicht auf partiellen
Unique-Indizes, weil PostgREST deren `WHERE`-Bedingung nicht mitschicken kann. Für
`category_rules` löst das ein Index mit `nulls not distinct`.

## CSV-Import

`src/lib/csv-import/` — Ablauf: Format über Header-Signaturen erkennen → Bank-Parser →
Normalisierung → Duplikatprüfung → Commit.

Die Parser in `parsers/index.ts` sind Datenobjekte mit `signatures` und `parseRow`.
Eine neue Bank ergänzt man dort und registriert sie in `bankParsers`. Signaturen
müssen mindestens eine Spalte enthalten, die es nur bei dieser Bank gibt — sonst
greift der erste passende Parser auf ein fremdes Format zu. `genericParser` fängt
unbekannte Exporte über gängige Spaltennamen ab.

Deutsche Eigenheiten, die `normalize.ts` abdeckt: `TT.MM.JJJJ`, `1.234,56`,
Encoding ISO-8859-1/Windows-1252, getrennte Soll/Haben-Spalten. Vorzeichenkonvention
im ganzen Projekt: **negativ = Ausgabe, positiv = Einnahme.**

Duplikate: SHA-256 über Konto, Datum, Betrag und normalisierten Verwendungszweck,
zusätzlich abgesichert durch einen Unique-Index auf `(user_id, dedupe_hash)`.

## Kategorisierung

`src/lib/categorization/` — Reihenfolge pro Buchung:

1. gelernte Regeln des Benutzers (`category_rules` mit `user_id`)
2. globale System-Regeln (`user_id IS NULL`, 222 Keyword-Regeln aus dem Seed)
3. Gemini-Fallback, sofern `GEMINI_API_KEY` gesetzt ist
4. sonst `uncategorized`

RLS sorgt dafür, dass `loadRules()` automatisch nur System-Regeln plus die eigenen
gelernten Regeln liefert. Eine manuelle Korrektur in der UI ruft
`learnFromCorrection()` auf und legt eine `merchant_exact`-Regel an, sodass derselbe
Händler künftig automatisch zugeordnet wird.

Der KI-Teil liegt hinter dem Interface `CategorizationProvider` in
`categorization/types.ts`, implementiert von `providers/gemini.provider.ts`. Ein
anderer Anbieter ersetzt nur diese Implementierung; Regelwerk und Schema bleiben
unberührt.

## Auswertungen

`src/lib/analytics/load.ts` lädt bewusst nur ein 12-Monats-Fenster. Der Kontostand
darf deshalb **nicht** aus diesen Zeilen summiert werden — dafür gibt es die
Datenbankfunktion `current_balance()`, die den gesamten Bestand abdeckt.

`insights-engine.ts` erzeugt Empfehlungen und schreibt sie nach `recommendations`.
Persistiert statt live berechnet, damit Nutzer sie ausblenden können. Ein
`fingerprint` mit Unique-Index verhindert Dubletten beim Neuberechnen.

## Tests

Vitest, Node-Umgebung, nur `tests/**/*.test.ts`. Abgedeckt sind die reinen
Funktionen: Bank-Parser gegen Fixtures in `tests/fixtures/` und die Regel-Engine.
Alles, was Supabase braucht, ist nicht durch Unit-Tests abgedeckt und muss gegen
das echte Projekt geprüft werden.
