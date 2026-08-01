import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/security/audit-log";

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/** Nur relative Pfade zulassen, damit kein Open Redirect entsteht. */
function safeNext(value: string | null): string | null {
  return value && /^\/(?!\/)[A-Za-z0-9\-._~/]*$/.test(value) ? value : null;
}

function isOtpType(value: string | null): value is EmailOtpType {
  return OTP_TYPES.includes(value as EmailOtpType);
}

/**
 * Nach welcher Bestätigungsart wohin: Ein Recovery-Link muss auf das Formular
 * zum Setzen eines neuen Passworts führen, alles andere ins Dashboard.
 */
function defaultTarget(type: EmailOtpType | null): string {
  return type === "recovery" ? "/passwort-aendern" : "/dashboard";
}

/**
 * Wertet Rückläufer aus E-Mail-Links und OAuth aus.
 *
 * Beide Übergabewege werden unterstützt: `code` (PKCE) und `token_hash` + `type`
 * (E-Mail-Vorlagen). Der `token_hash`-Weg ist der verlässlichere, weil er ohne
 * den im Browser hinterlegten Code-Verifier auskommt und deshalb auch dann
 * funktioniert, wenn der Link auf einem anderen Gerät oder in der Vorschau des
 * Mail-Programms geöffnet wird — genau dort scheiterte die Bestätigung bisher.
 *
 * Jeder Fehlerfall landet auf einer erklärenden Seite statt auf einer leeren.
 */
export async function handleAuthCallback(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const type = isOtpType(searchParams.get("type")) ? searchParams.get("type")! : null;
  const next = safeNext(searchParams.get("next")) ?? defaultTarget(type);

  // Supabase hängt bei abgelaufenen oder bereits benutzten Links einen Fehler an.
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    return failure(origin, searchParams.get("error_code") ?? "link_ungueltig");
  }

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return failure(origin, "link_ungueltig");

    await logSecurityEvent("email_verified", { detail: { type } });
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return failure(origin, "link_ungueltig");

    await logSecurityEvent("email_verified", { detail: { type: type ?? "code" } });
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Weder Code noch Token: Supabase hat die Daten vermutlich im URL-Fragment
  // übergeben, das der Server nicht sieht. Die Fehlerseite liest es im Browser aus.
  return failure(origin, "kein_token");
}

function failure(origin: string, reason: string) {
  const url = new URL("/auth/fehler", origin);
  url.searchParams.set("grund", reason);
  return NextResponse.redirect(url);
}
