import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-Role-Client mit vollen Rechten (umgeht RLS).
 * Ausschließlich für serverseitige DSGVO-Operationen (Export/Löschung) verwenden,
 * niemals im normalen Request-Pfad und niemals im Client-Bundle.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
