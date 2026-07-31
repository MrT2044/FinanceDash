import "server-only";

/**
 * Optionale Zugangsbeschränkung für die Registrierung.
 *
 * Ohne gesetzte Variable bleibt die Registrierung offen — sinnvoll für einen
 * öffentlichen Dienst. Für eine private Installation (z.B. nur die eigene
 * Familie) werden in REGISTRATION_ALLOWLIST die erlaubten Adressen hinterlegt,
 * kommagetrennt. Dann kann sich niemand sonst ein Konto anlegen, auch wenn
 * jemand die Adresse der Anwendung kennt.
 *
 * Beispiel:
 *   REGISTRATION_ALLOWLIST="anna@example.de, ben@example.de"
 */
export function isRegistrationAllowed(email: string): boolean {
  const raw = process.env.REGISTRATION_ALLOWLIST?.trim();
  if (!raw) return true;

  const allowed = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.trim().toLowerCase());
}

/** Für die Anzeige auf der Registrierungsseite. */
export function isRegistrationRestricted(): boolean {
  return Boolean(process.env.REGISTRATION_ALLOWLIST?.trim());
}
