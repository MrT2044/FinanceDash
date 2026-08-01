import { type NextRequest } from "next/server";
import { handleAuthCallback } from "@/lib/auth/callback";

/**
 * Von Supabase empfohlener Pfad für E-Mail-Bestätigungen mit `token_hash`.
 * Die E-Mail-Vorlagen in `supabase/templates/` zeigen hierher; `/auth/callback`
 * bleibt für ältere Links und OAuth bestehen.
 */
export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}
