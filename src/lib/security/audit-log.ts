import "server-only";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export type SecurityEventType =
  | "login_success"
  | "login_failed"
  | "register_success"
  | "register_failed"
  | "logout"
  | "password_reset_requested"
  | "password_changed"
  | "rate_limited"
  | "data_exported"
  | "account_deleted"
  | "import_committed";

/**
 * Hasht die IP mit einem serverseitigen Pepper. Klartext-IPs werden bewusst
 * nicht gespeichert (DSGVO), der Hash reicht aus, um wiederholte Angriffe
 * derselben Quelle zu erkennen.
 */
function hashIp(ip: string): string {
  const pepper = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHash("sha256").update(`${pepper}:${ip}`).digest("hex");
}

export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

export async function logSecurityEvent(
  eventType: SecurityEventType,
  options: { userId?: string | null; detail?: Record<string, Json> } = {},
): Promise<void> {
  try {
    const headerList = await headers();
    const ip = await getClientIp();

    await createAdminClient()
      .from("security_events")
      .insert({
        user_id: options.userId ?? null,
        event_type: eventType,
        ip_hash: ip === "unknown" ? null : hashIp(ip),
        user_agent: headerList.get("user-agent")?.slice(0, 300) ?? null,
        detail: options.detail ?? {},
      });
  } catch {
    // Audit-Logging darf den eigentlichen Request niemals scheitern lassen.
  }
}
