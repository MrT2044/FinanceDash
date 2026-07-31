"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit-log";
import { parseCsv } from "@/lib/csv-import/parse-csv";
import { computeDedupeHash, dedupeWithinFile } from "@/lib/csv-import/deduplicate";
import { CsvImportError } from "@/lib/csv-import/types";
import {
  categorizeBatch,
  loadCategories,
  loadRules,
} from "@/lib/categorization/service";
import { validateUploadFile } from "@/lib/validation/import.schema";
import { generateInsights } from "@/lib/analytics/insights-engine";

export type ImportState = {
  error?: string;
  result?: {
    bankLabel: string;
    imported: number;
    duplicates: number;
    skipped: number;
    categorized: number;
    warnings: string[];
  };
};

export async function importCsvAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Bitte melde dich erneut an." };

  const limit = await checkRateLimit("import", user.id);
  if (!limit.success) {
    await logSecurityEvent("rate_limited", {
      userId: user.id,
      detail: { action: "import" },
    });
    return { error: "Zu viele Importe in kurzer Zeit. Bitte warte einen Moment." };
  }

  const file = formData.get("file");
  const fileError = validateUploadFile(file instanceof File ? file : null);
  if (fileError || !(file instanceof File)) return { error: fileError ?? "Ungültige Datei." };

  const accountIdRaw = formData.get("accountId");
  const newAccountName = formData.get("newAccountName");
  const useAi = formData.get("useAi") === "on";

  let parsed;
  try {
    parsed = parseCsv(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof CsvImportError) return { error: error.message };
    return { error: "Die Datei konnte nicht gelesen werden." };
  }

  // Konto ermitteln oder anlegen.
  let accountId: string;
  if (typeof accountIdRaw === "string" && accountIdRaw && accountIdRaw !== "new") {
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", accountIdRaw)
      .maybeSingle();

    if (!account) return { error: "Das gewählte Konto existiert nicht." };
    accountId = account.id;
  } else {
    const name =
      typeof newAccountName === "string" && newAccountName.trim()
        ? newAccountName.trim().slice(0, 80)
        : `${parsed.bankLabel} Konto`;

    const { data: account, error } = await supabase
      .from("accounts")
      .insert({ user_id: user.id, name, bank_type: parsed.bankType })
      .select("id")
      .single();

    if (error || !account) {
      return {
        error: "Das Konto konnte nicht angelegt werden. Existiert bereits ein Konto mit diesem Namen?",
      };
    }
    accountId = account.id;
  }

  const { data: batch } = await supabase
    .from("import_batches")
    .insert({
      user_id: user.id,
      account_id: accountId,
      filename: file.name.slice(0, 255),
      detected_format: parsed.bankType,
      row_count: parsed.transactions.length,
    })
    .select("id")
    .single();

  const withHashes = parsed.transactions.map((transaction) => ({
    ...transaction,
    dedupeHash: computeDedupeHash(accountId, transaction),
  }));
  const { unique, duplicateCount: inFileDuplicates } = dedupeWithinFile(withHashes);

  // Bereits importierte Buchungen herausfiltern.
  const { data: existing } = await supabase
    .from("transactions")
    .select("dedupe_hash")
    .in(
      "dedupe_hash",
      unique.map((item) => item.dedupeHash),
    );

  const existingHashes = new Set((existing ?? []).map((row) => row.dedupe_hash));
  const fresh = unique.filter((item) => !existingHashes.has(item.dedupeHash));
  const duplicates = inFileDuplicates + (unique.length - fresh.length);

  if (!fresh.length) {
    await supabase
      .from("import_batches")
      .update({
        status: "committed",
        imported_count: 0,
        duplicate_count: duplicates,
        committed_at: new Date().toISOString(),
      })
      .eq("id", batch!.id);

    return {
      result: {
        bankLabel: parsed.bankLabel,
        imported: 0,
        duplicates,
        skipped: parsed.skippedRows,
        categorized: 0,
        warnings: parsed.warnings,
      },
    };
  }

  const [categories, rules] = await Promise.all([
    loadCategories(supabase),
    loadRules(supabase),
  ]);

  const categorized = await categorizeBatch(
    fresh.map((item) => ({
      ...item,
      merchant: item.counterpartyName,
      purpose: item.purpose,
      amount: item.amount,
    })),
    { categories, rules, useAi },
  );

  const { error: insertError } = await supabase.from("transactions").insert(
    categorized.map((item) => ({
      user_id: user.id,
      account_id: accountId,
      import_batch_id: batch?.id ?? null,
      booking_date: item.bookingDate,
      value_date: item.valueDate,
      amount: item.amount,
      currency: item.currency,
      purpose: item.purpose || null,
      counterparty_name: item.counterpartyName || null,
      counterparty_iban: item.counterpartyIban,
      category_id: item.categoryId,
      category_source: item.categorySource,
      category_confidence: item.categoryConfidence,
      dedupe_hash: item.dedupeHash,
    })),
  );

  if (insertError) {
    await supabase
      .from("import_batches")
      .update({ status: "failed", error_message: insertError.message.slice(0, 500) })
      .eq("id", batch!.id);
    return { error: "Die Buchungen konnten nicht gespeichert werden." };
  }

  await supabase
    .from("import_batches")
    .update({
      status: "committed",
      imported_count: categorized.length,
      duplicate_count: duplicates,
      committed_at: new Date().toISOString(),
    })
    .eq("id", batch!.id);

  await logSecurityEvent("import_committed", {
    userId: user.id,
    detail: { count: categorized.length, format: parsed.bankType },
  });

  await generateInsights(supabase, user.id);

  revalidatePath("/dashboard");
  revalidatePath("/transaktionen");

  return {
    result: {
      bankLabel: parsed.bankLabel,
      imported: categorized.length,
      duplicates,
      skipped: parsed.skippedRows,
      categorized: categorized.filter((item) => item.categoryId !== null).length,
      warnings: parsed.warnings,
    },
  };
}
