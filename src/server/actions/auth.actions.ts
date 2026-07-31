"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, logSecurityEvent } from "@/lib/security/audit-log";
import { isRegistrationAllowed } from "@/lib/security/registration";
import {
  loginSchema,
  passwordUpdateSchema,
  registerSchema,
  resetRequestSchema,
} from "@/lib/validation/auth.schema";

export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

/** Nur relative Pfade zulassen, damit kein Open Redirect entsteht. */
function safeRedirectTarget(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  return /^\/(?!\/)[A-Za-z0-9\-._~/]*$/.test(raw) ? raw : "/dashboard";
}

async function getOrigin(): Promise<string> {
  const headerList = await headers();
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${headerList.get("host") ?? "localhost:3000"}`
  );
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const ip = await getClientIp();
  const limit = await checkRateLimit("login", `${ip}:${parsed.data.email}`);
  if (!limit.success) {
    await logSecurityEvent("rate_limited", { detail: { action: "login" } });
    return {
      error: `Zu viele Anmeldeversuche. Bitte warte ${Math.ceil(limit.retryAfterSeconds / 60)} Minuten.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    await logSecurityEvent("login_failed", { detail: { reason: error.name } });
    // Bewusst generische Meldung: verrät nicht, ob die E-Mail registriert ist.
    return { error: "E-Mail-Adresse oder Passwort ist falsch." };
  }

  await logSecurityEvent("login_success", { userId: data.user.id });
  redirect(safeRedirectTarget(formData.get("redirectTo")));
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName") ?? "",
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    acceptPrivacy: formData.get("acceptPrivacy") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const ip = await getClientIp();
  const limit = await checkRateLimit("register", ip);
  if (!limit.success) {
    await logSecurityEvent("rate_limited", { detail: { action: "register" } });
    return { error: "Zu viele Registrierungsversuche. Bitte versuche es später erneut." };
  }

  if (!isRegistrationAllowed(parsed.data.email)) {
    await logSecurityEvent("register_failed", { detail: { reason: "not_allowlisted" } });
    return {
      error:
        "Für diese E-Mail-Adresse ist keine Registrierung freigeschaltet. Bitte wende dich an den Betreiber dieser Installation.",
    };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: parsed.data.displayName
        ? { display_name: parsed.data.displayName }
        : undefined,
    },
  });

  if (error) {
    await logSecurityEvent("register_failed", { detail: { reason: error.name } });
    return { error: "Die Registrierung ist fehlgeschlagen. Bitte versuche es erneut." };
  }

  await logSecurityEvent("register_success");
  return {
    success:
      "Fast geschafft! Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte bestätige deine Adresse, um loszulegen.",
  };
}

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const ip = await getClientIp();
  const limit = await checkRateLimit("passwordReset", ip);

  if (limit.success) {
    const supabase = await createClient();
    const origin = await getOrigin();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/callback?next=/passwort-aendern`,
    });
    await logSecurityEvent("password_reset_requested");
  } else {
    await logSecurityEvent("rate_limited", { detail: { action: "password_reset" } });
  }

  // Immer dieselbe Antwort, damit nicht erkennbar ist, ob die Adresse existiert.
  return {
    success:
      "Falls ein Konto mit dieser Adresse existiert, haben wir dir einen Link zum Zurücksetzen geschickt.",
  };
}

export async function updatePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Der Link ist abgelaufen. Bitte fordere einen neuen an." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Das Passwort konnte nicht geändert werden. Bitte versuche es erneut." };
  }

  await logSecurityEvent("password_changed", { userId: user.id });
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();
  await logSecurityEvent("logout", { userId: user?.id });
  redirect("/login");
}
