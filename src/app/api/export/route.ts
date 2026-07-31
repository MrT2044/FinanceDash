import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit-log";

/**
 * DSGVO Art. 20 (Datenübertragbarkeit): vollständiger Export aller Daten des
 * angemeldeten Nutzers als JSON. Alle Queries laufen über den nutzergebundenen
 * Client, sodass RLS die Abgrenzung erzwingt.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const limit = await checkRateLimit("export", user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Zu viele Exporte. Bitte versuche es später erneut." },
      { status: 429 },
    );
  }

  const [profile, accounts, transactions, categories, rules, batches, recommendations] =
    await Promise.all([
      supabase.from("profiles").select("*").maybeSingle(),
      supabase.from("accounts").select("*"),
      supabase.from("transactions").select("*").order("booking_date"),
      supabase.from("categories").select("*").not("user_id", "is", null),
      supabase.from("category_rules").select("*").not("user_id", "is", null),
      supabase.from("import_batches").select("*"),
      supabase.from("recommendations").select("*"),
    ]);

  await logSecurityEvent("data_exported", { userId: user.id });

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile.data,
    accounts: accounts.data ?? [],
    transactions: transactions.data ?? [],
    ownCategories: categories.data ?? [],
    learnedRules: rules.data ?? [],
    imports: batches.data ?? [],
    recommendations: recommendations.data ?? [],
  };

  const filename = `financedash-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
