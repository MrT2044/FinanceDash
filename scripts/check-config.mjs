#!/usr/bin/env node
/**
 * Prüft die Konfiguration gegen die echten Dienste.
 *
 * Hintergrund: Ein falscher Secret Key fällt im Betrieb nicht auf, weil das
 * Audit-Logging Fehler bewusst schluckt (es darf keinen Request scheitern
 * lassen). Dieses Skript macht solche Probleme sichtbar — lokal und vor einem
 * Deployment.
 *
 *   npm run check:config
 */

import { readFileSync, existsSync } from "node:fs";

const ENV_FILE = ".env.local";

function loadEnv() {
  // In CI/Vercel stehen die Werte bereits in process.env.
  if (!existsSync(ENV_FILE)) return { ...process.env };

  const parsed = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match) parsed[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return { ...parsed, ...process.env };
}

const env = loadEnv();
let fehler = 0;
let warnungen = 0;

const ok = (t) => console.log(`  \x1b[32mOK\x1b[0m      ${t}`);
const warn = (t) => { warnungen++; console.log(`  \x1b[33mHINWEIS\x1b[0m ${t}`); };
const fail = (t) => { fehler++; console.log(`  \x1b[31mFEHLER\x1b[0m  ${t}`); };

async function main() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("\nPflichtangaben");
  if (!url) fail("NEXT_PUBLIC_SUPABASE_URL fehlt");
  else if (!/^https:\/\/.+\.supabase\.co$/.test(url))
    warn(`NEXT_PUBLIC_SUPABASE_URL sieht ungewoehnlich aus: ${url}`);
  else ok(`Projekt-URL ${url}`);

  if (!anon) fail("NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt");
  if (!secret) fail("SUPABASE_SERVICE_ROLE_KEY fehlt");

  if (url && anon) {
    console.log("\nVerbindung mit oeffentlichem Schluessel");
    try {
      const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anon } });
      if (res.ok) {
        const settings = await res.json();
        ok("Schluessel gueltig, Auth-Dienst erreichbar");
        if (settings.mailer_autoconfirm === true)
          warn("E-Mail-Bestaetigung ist deaktiviert — fuer den oeffentlichen Betrieb einschalten");
        else ok("E-Mail-Bestaetigung aktiv");
        if (settings.disable_signup === true)
          warn("Registrierung ist in Supabase global deaktiviert");
      } else {
        fail(`Oeffentlicher Schluessel abgelehnt (HTTP ${res.status})`);
      }
    } catch (error) {
      fail(`Supabase nicht erreichbar: ${error.message}`);
    }
  }

  if (url && secret) {
    console.log("\nVerbindung mit Secret Key");
    try {
      const res = await fetch(`${url}/auth/v1/admin/users?per_page=1`, {
        headers: { apikey: secret, Authorization: `Bearer ${secret}` },
      });
      if (res.ok) {
        ok("Secret Key gueltig — DSGVO-Loeschung und Audit-Log funktionieren");
      } else {
        fail(
          `Secret Key abgelehnt (HTTP ${res.status}). Kontoloeschung und Audit-Log ` +
            `sind ausser Betrieb. Aktuellen Wert holen: Supabase -> Project Settings -> API Keys.`,
        );
      }
    } catch (error) {
      fail(`Admin-API nicht erreichbar: ${error.message}`);
    }
  }

  console.log("\nBetrieb");
  const site = env.NEXT_PUBLIC_SITE_URL;
  if (!site) {
    warn("NEXT_PUBLIC_SITE_URL fehlt — Links in Bestaetigungsmails koennen falsch sein");
  } else if (site.endsWith("/")) {
    warn(`NEXT_PUBLIC_SITE_URL endet auf "/" — bitte ohne Schraegstrich: ${site}`);
  } else {
    ok(`Site-URL ${site}`);
    if (site.startsWith("http://") && !site.includes("localhost"))
      fail("NEXT_PUBLIC_SITE_URL nutzt http statt https");
  }

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    ok("Rate-Limiting ueber Upstash konfiguriert");
  } else {
    warn(
      "Upstash nicht konfiguriert. Lokal unkritisch; auf serverlosen Plattformen " +
        "zaehlt das In-Memory-Limit pro Instanz und der Brute-Force-Schutz ist wirkungslos.",
    );
  }

  if (env.REGISTRATION_ALLOWLIST) {
    const anzahl = env.REGISTRATION_ALLOWLIST.split(",").filter((e) => e.trim()).length;
    ok(`Registrierung auf ${anzahl} Adresse(n) begrenzt`);
  } else {
    warn("REGISTRATION_ALLOWLIST leer — jeder mit der Adresse kann ein Konto anlegen");
  }

  ok(`Automatische Abmeldung nach ${env.SESSION_IDLE_TIMEOUT_MINUTES ?? 30} Minuten`);
  if (!env.GEMINI_API_KEY) ok("Kategorisierung laeuft rein regelbasiert (KI optional)");

  console.log(
    `\n${fehler} Fehler, ${warnungen} Hinweis(e).` +
      (fehler === 0 ? " Konfiguration einsatzbereit.\n" : " Bitte Fehler beheben.\n"),
  );
  process.exit(fehler > 0 ? 1 : 0);
}

main();
