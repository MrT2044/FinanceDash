"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateInsights } from "@/lib/analytics/insights-engine";

const dismissSchema = z.object({ id: z.string().uuid() });

export async function dismissRecommendationAction(formData: FormData) {
  const parsed = dismissSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS stellt zusätzlich sicher, dass nur eigene Empfehlungen betroffen sind.
  await supabase
    .from("recommendations")
    .update({ dismissed: true })
    .eq("id", parsed.data.id);

  revalidatePath("/empfehlungen");
  revalidatePath("/dashboard");
}

export async function refreshInsightsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await generateInsights(supabase, user.id);

  revalidatePath("/empfehlungen");
  revalidatePath("/dashboard");
}
