import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback für E-Mail-Bestätigung und Passwort-Reset-Links.
 * Tauscht den Code gegen eine Session und leitet dann weiter.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  // Nur relative Pfade zulassen (kein Open Redirect).
  const next = /^\/(?!\/)[A-Za-z0-9\-._~/]*$/.test(nextParam ?? "")
    ? nextParam!
    : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
