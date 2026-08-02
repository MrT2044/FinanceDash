"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, logSecurityEvent } from "@/lib/security/audit-log";
import {
  emailChangeSchema,
  loginSchema,
  passwordChangeSchema,
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

/**
 * Übersetzt Supabase-Fehlercodes in verständliche Sätze.
 *
 * Wichtig für die Fehlersuche: Zuvor endete jeder Fehler in „Bitte versuche es
 * erneut", wodurch ein nicht verifizierter SMTP-Absender genauso aussah wie ein
 * Tippfehler in der Adresse. Unbekannte Codes werden deshalb mitsamt Code
 * ausgegeben statt verschluckt.
 */
function describeAuthError(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "email_address_invalid":
      return "Diese E-Mail-Adresse ist ungültig. Prüfe sie auf Tippfehler — häufig ist die Endung vertauscht (z. B. „.con“ statt „.com“).";
    case "email_exists":
    case "user_already_exists":
      return "Für diese Adresse gibt es bereits ein Konto. Melde dich an oder setze dein Passwort zurück.";
    case "over_email_send_rate_limit":
      return "Es wurden zu viele E-Mails in kurzer Zeit angefordert. Bitte warte etwa eine Stunde und versuche es dann erneut.";
    case "weak_password":
      return "Das Passwort ist zu schwach. Wähle ein längeres Passwort mit Groß- und Kleinbuchstaben sowie einer Ziffer.";
    case "signup_disabled":
      return "Die Registrierung ist derzeit deaktiviert.";
    case "over_request_rate_limit":
      return "Zu viele Anfragen. Bitte warte einen Moment.";
    case "unexpected_failure":
      // Praktisch immer der Mailversand: Supabase legt das Konto an, kann die
      // Bestätigung aber nicht zustellen und meldet 500.
      return "Das Konto konnte angelegt werden, aber die Bestätigungs-E-Mail ließ sich nicht zustellen. Der E-Mail-Versand des Servers ist nicht korrekt eingerichtet.";
    default:
      return `Die Registrierung ist fehlgeschlagen (${error.code ?? "unbekannt"}): ${error.message}`;
  }
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

    // Einzige Ausnahme von der generischen Meldung: Ohne diesen Hinweis sucht
    // man den Fehler beim Passwort, obwohl nur die Bestätigung fehlt.
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Deine E-Mail-Adresse ist noch nicht bestätigt. Bitte öffne den Link aus der Bestätigungs-E-Mail.",
      };
    }

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

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: parsed.data.displayName
        ? { display_name: parsed.data.displayName }
        : undefined,
    },
  });

  if (error) {
    // Code und Originalmeldung landen im Audit-Log, damit sich Fehlversuche
    // später nachvollziehen lassen, ohne die Serverlogs zu durchsuchen.
    await logSecurityEvent("register_failed", {
      detail: { code: error.code ?? null, message: error.message, status: error.status ?? null },
    });
    return { error: describeAuthError(error) };
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
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/confirm?next=/passwort-aendern`,
    });

    if (error) {
      await logSecurityEvent("password_reset_requested", {
        detail: { code: error.code ?? null, message: error.message },
      });

      // Fehler der Zustellung selbst verraten nichts über das Konto und dürfen
      // daher gezeigt werden — sonst wartet man vergeblich auf eine E-Mail,
      // die nie verschickt wurde.
      return { error: describeAuthError(error) };
    }

    await logSecurityEvent("password_reset_requested");
  } else {
    await logSecurityEvent("rate_limited", { detail: { action: "password_reset" } });
    return {
      error: "Zu viele Anfragen in kurzer Zeit. Bitte warte einen Moment.",
    };
  }

  // Sonst immer dieselbe Antwort, damit nicht erkennbar ist, ob die Adresse existiert.
  return {
    success:
      "Falls ein Konto mit dieser Adresse existiert, haben wir dir einen Link zum Zurücksetzen geschickt.",
  };
}

/**
 * Verschickt die Bestätigungs-E-Mail erneut.
 *
 * Nötig, weil Bestätigungslinks einmalig sind: Manche Mail-Programme und
 * Sicherheitsscanner rufen enthaltene Links automatisch ab und verbrauchen den
 * Link dadurch, bevor der Empfänger ihn anklickt.
 */
export async function resendConfirmationAction(
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
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data.email,
      options: { emailRedirectTo: `${origin}/auth/confirm` },
    });

    if (error) return { error: describeAuthError(error) };
  } else {
    await logSecurityEvent("rate_limited", { detail: { action: "resend_confirmation" } });
    return { error: "Zu viele Anfragen in kurzer Zeit. Bitte warte einen Moment." };
  }

  // Wie beim Passwort-Reset bewusst immer dieselbe Antwort.
  return {
    success:
      "Falls für diese Adresse eine Bestätigung aussteht, ist eine neue E-Mail unterwegs. Bitte öffne den Link direkt aus der E-Mail heraus.",
  };
}

/** Setzt ein neues Passwort nach einem Reset-Link (Session stammt aus dem Link). */
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

/**
 * Passwortwechsel im angemeldeten Zustand. Das aktuelle Passwort wird zuvor
 * geprüft — sonst könnte jemand an einem unbeaufsichtigten Gerät das Konto
 * übernehmen, ohne das alte Passwort zu kennen.
 */
export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
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

  if (!user?.email) return { error: "Bitte melde dich erneut an." };

  const ip = await getClientIp();
  const limit = await checkRateLimit("login", `${ip}:${user.email}`);
  if (!limit.success) {
    await logSecurityEvent("rate_limited", { detail: { action: "password_change" } });
    return { error: "Zu viele Versuche. Bitte warte einen Moment." };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (reauthError) {
    return { fieldErrors: { currentPassword: ["Das aktuelle Passwort ist falsch."] } };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "Das neue Passwort muss sich vom bisherigen unterscheiden."
          : "Das Passwort konnte nicht geändert werden. Bitte versuche es erneut.",
    };
  }

  await logSecurityEvent("password_changed", { userId: user.id });
  return { success: "Dein Passwort wurde geändert." };
}

/**
 * Ändert die Anmelde-E-Mail. Supabase verschickt einen Bestätigungslink an die
 * neue (und je nach Projekteinstellung auch an die alte) Adresse; erst danach
 * greift die Änderung.
 */
export async function changeEmailAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailChangeSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Bitte melde dich erneut an." };

  if (user.email?.toLowerCase() === parsed.data.email) {
    return { error: "Das ist bereits deine aktuelle E-Mail-Adresse." };
  }

  const origin = await getOrigin();
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${origin}/auth/confirm?next=/einstellungen` },
  );

  if (error) {
    return { error: "Die Adresse konnte nicht geändert werden. Bitte versuche es erneut." };
  }

  await logSecurityEvent("email_change_requested", { userId: user.id });
  revalidatePath("/einstellungen");
  return {
    success:
      "Wir haben dir einen Bestätigungslink an die neue Adresse geschickt. Die Änderung greift, sobald du ihn geöffnet hast.",
  };
}

/**
 * Meldet ab und verwirft die Session serverseitig.
 *
 * `signOut` wird bewusst nicht abgesichert übersprungen: Selbst wenn Supabase
 * nicht erreichbar ist, muss die Weiterleitung zur Anmeldung stattfinden —
 * andernfalls bliebe der Nutzer scheinbar angemeldet zurück. `redirect` wirft
 * intern und muss darum außerhalb des try-Blocks stehen.
 */
export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.auth.signOut({ scope: "local" });
    await logSecurityEvent("logout", { userId: user?.id });
  } catch {
    // Abmelden darf niemals an einem Netzwerkfehler scheitern.
  }

  redirect("/login?abgemeldet=1");
}
