import { type NextRequest } from "next/server";
import { handleAuthCallback } from "@/lib/auth/callback";

/**
 * Rückläufer aus E-Mail-Links und OAuth. Beide Varianten laufen hier zusammen:
 * `?code=` (PKCE) und `?token_hash=&type=` (E-Mail-Bestätigung, Passwort-Reset).
 */
export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}
