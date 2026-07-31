# FinanceDash

Persönliches Finanzdashboard für den deutschen Markt: Bank-CSVs importieren,
Ausgaben automatisch kategorisieren, Auswertungen und Sparhinweise erhalten.

## Stack

- **Next.js 16** (App Router) + TypeScript, Tailwind CSS v4, shadcn/ui (Base UI)
- **Supabase** — Postgres, Auth, Row Level Security
- **Recharts** für Diagramme, **Zod** für Validierung, **Papaparse** + iconv-lite für CSV
- **Google Gemini** (optional) als KI-Fallback für unbekannte Händler
- **Upstash Redis** (optional) für verteiltes Rate-Limiting

## Einrichtung

### 1. Supabase-Projekt anlegen

Auf [supabase.com](https://supabase.com) ein Projekt erstellen — **Region: `eu-central-1`
(Frankfurt)**, damit die Daten die EU nicht verlassen.

### 2. Umgebungsvariablen setzen

`.env.example` nach `.env.local` kopieren und ausfüllen. Die Werte stehen im
Supabase-Dashboard unter *Project Settings → API*:

| Variable | Pflicht | Quelle |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ja | Supabase → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ja | Supabase → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | ja | Supabase → API → service_role (**niemals im Client verwenden**) |
| `GEMINI_API_KEY` | nein | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (kostenlos) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | nein | [console.upstash.com](https://console.upstash.com) (kostenlos) |

Ohne `GEMINI_API_KEY` läuft die Kategorisierung rein regelbasiert. Ohne Upstash greift
ein In-Memory-Rate-Limit, das nur einen einzelnen Serverprozess schützt — für
Produktion ist Upstash (oder ein Äquivalent) nötig.

### 3. Datenbank migrieren

**Variante A — SQL-Editor (kein CLI-Login nötig):** Den Inhalt von
`supabase/bootstrap.sql` in den Supabase SQL-Editor einfügen und ausführen. Die
Datei fasst alle Migrationen zusammen und trägt am Ende die Migrations-Historie
ein, sodass ein späteres `db push` konsistent bleibt.

**Variante B — CLI:**

```bash
npx supabase login
```

```bash
npx supabase link --project-ref <deine-project-ref>
```

```bash
npx supabase db push
```

Beide Wege legen Schema, RLS-Policies und die System-Kategorien an.

### 4. Auth konfigurieren

Im Supabase-Dashboard unter *Authentication → URL Configuration* die Site-URL und
`<deine-domain>/auth/callback` als Redirect-URL eintragen.

### 5. Starten

```bash
npm install
```

```bash
npm run dev
```

Registriere dich mit einer **echten** E-Mail-Adresse: Supabase prüft die Domain und
lehnt erfundene Adressen mit `email_address_invalid` ab. Nach der Bestätigungsmail
kannst du `beispieldaten/sparkasse-beispiel.csv` importieren — vier Monate
Beispielumsätze, mit denen Dashboard, Kategorien und Empfehlungen sofort gefüllt sind.

## Befehle

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm test
```

## Architektur

```
src/
├── app/
│   ├── (auth)/          Login, Registrierung, Passwort-Reset
│   ├── (dashboard)/     Geschützte Seiten (Übersicht, Ausgaben, Kategorien, …)
│   ├── api/export/      DSGVO-Datenexport
│   └── auth/callback/   E-Mail-Bestätigung & Reset-Links
├── lib/
│   ├── supabase/        Browser-, Server- und Admin-Client
│   ├── csv-import/      Format-Erkennung, Bank-Parser, Normalisierung, Dedupe
│   ├── categorization/  Regel-Engine, Lernmechanismus, Provider-Interface
│   ├── analytics/       KPIs und Insights-Engine
│   ├── rate-limit/      Upstash mit In-Memory-Fallback
│   └── security/        Audit-Logging
├── server/actions/      Server Actions (Mutationen)
└── proxy.ts             Session-Refresh und Route-Guard
supabase/migrations/     Schema + RLS-Policies
tests/                   Parser- und Regel-Engine-Tests mit Bank-Fixtures
```

### Sicherheitsmodell

Der Kernschutz ist **Row Level Security**: Jede Tabelle mit `user_id` erlaubt nur
Zeilen mit `auth.uid() = user_id`. Die Anwendung filtert nicht selbst nach Nutzer —
ein vergessener Filter kann daher keine fremden Daten preisgeben. Der
Service-Role-Client (umgeht RLS) wird ausschließlich für DSGVO-Export und
Kontolöschung genutzt und ist über `server-only` gegen Import im Client-Bundle
geschützt.

Weitere Maßnahmen: Passwort-Hashing durch Supabase Auth (nie im Klartext),
Rate-Limiting auf Login/Registrierung/Import/Export, serverseitige Zod-Validierung
an jedem Eingabepunkt, Audit-Log mit gehashten IP-Adressen, generische
Fehlermeldungen beim Login (keine Auskunft, ob eine Adresse registriert ist).

### Unterstützte Bank-Formate

Sparkasse, DKB, ING, comdirect, Volksbank/VR-Bank, N26. Unbekannte Formate werden
über eine allgemeine Erkennung eingelesen, sofern Spalten für Datum, Betrag und
Verwendungszweck vorhanden sind. Encoding (UTF-8/Windows-1252), Trennzeichen und
die Position der Header-Zeile werden automatisch erkannt.

### Kategorisierung

1. Gelernte Nutzerregeln (aus manuellen Korrekturen)
2. System-Keyword-Regeln (~200 deutsche Händler)
3. Optionaler Gemini-Fallback (nur wenn im Import aktiviert)
4. Sonst: unkategorisiert, manuelle Zuordnung in der Transaktionsliste

Jede manuelle Korrektur legt automatisch eine Regel für den Händler an.

## Vorbereitet für später

Das Schema und die Interfaces sind so angelegt, dass ohne Umbau ergänzt werden kann:
2FA (Supabase TOTP), Budgetplanung (`budgets`-Tabelle existiert bereits),
PDF-Reports, PSD2/Open-Banking-Anbindung als weiterer Import-Adapter, und ein
KI-Finanzassistent über `lib/ai/llm-provider.interface.ts`.

## Deployment (Vercel)

Repository verbinden, die Umgebungsvariablen aus `.env.local` in den
Projekteinstellungen hinterlegen (getrennt für Production und Preview) und
deployen. HTTPS ist automatisch aktiv.
