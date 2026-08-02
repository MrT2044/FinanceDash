import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Der Wert wird beim Import des Moduls einmalig ausgewertet. Für jeden Fall
 * muss das Modul deshalb frisch geladen werden.
 */
async function loadTimeout(value: string | undefined): Promise<number> {
  vi.resetModules();

  if (value === undefined) delete process.env.SESSION_IDLE_TIMEOUT_MINUTES;
  else process.env.SESSION_IDLE_TIMEOUT_MINUTES = value;

  const { resolveIdleTimeoutMs } = await import("@/lib/supabase/middleware");
  return resolveIdleTimeoutMs();
}

const MINUTE = 60_000;

describe("Inaktivitätsfenster", () => {
  afterEach(() => {
    delete process.env.SESSION_IDLE_TIMEOUT_MINUTES;
  });

  it("nutzt den Standard von 30 Minuten, wenn nichts gesetzt ist", async () => {
    await expect(loadTimeout(undefined)).resolves.toBe(30 * MINUTE);
  });

  it("übernimmt einen gültigen Wert", async () => {
    await expect(loadTimeout("45")).resolves.toBe(45 * MINUTE);
  });

  /*
   * Der eigentliche Fehlerfall: Eine auf der Plattform angelegte, aber leer
   * gelassene Variable ergab früher ein Fenster von null Millisekunden. Jede
   * Sitzung galt sofort als abgelaufen — die Anmeldung lief in eine Schleife.
   */
  it("fällt bei leerem Wert auf den Standard zurück statt auf null", async () => {
    await expect(loadTimeout("")).resolves.toBe(30 * MINUTE);
    await expect(loadTimeout("   ")).resolves.toBe(30 * MINUTE);
  });

  it("fällt bei unlesbarem Wert auf den Standard zurück", async () => {
    await expect(loadTimeout("abc")).resolves.toBe(30 * MINUTE);
  });

  it("verhindert Fenster von null oder negativer Länge", async () => {
    await expect(loadTimeout("0")).resolves.toBe(30 * MINUTE);
    await expect(loadTimeout("-5")).resolves.toBe(30 * MINUTE);
  });

  it("hebt zu kleine Werte auf die Untergrenze an", async () => {
    await expect(loadTimeout("0.2")).resolves.toBe(1 * MINUTE);
  });
});
