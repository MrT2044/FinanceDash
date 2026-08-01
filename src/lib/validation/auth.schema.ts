import { z } from "zod";

/**
 * Passwortrichtlinie: mindestens 12 Zeichen sowie Groß-/Kleinbuchstaben und eine
 * Ziffer. Länge schlägt Komplexität, daher ist die Mindestlänge deutlich über
 * dem verbreiteten Minimum von 8 Zeichen angesetzt.
 */
export const passwordSchema = z
  .string()
  .min(12, "Das Passwort muss mindestens 12 Zeichen lang sein.")
  .max(128, "Das Passwort darf höchstens 128 Zeichen lang sein.")
  .regex(/[a-z]/, "Das Passwort muss einen Kleinbuchstaben enthalten.")
  .regex(/[A-Z]/, "Das Passwort muss einen Großbuchstaben enthalten.")
  .regex(/[0-9]/, "Das Passwort muss eine Ziffer enthalten.");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Bitte gib deine E-Mail-Adresse ein.")
  .max(254)
  .email("Bitte gib eine gültige E-Mail-Adresse ein.")
  .transform((value) => value.toLowerCase());

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Bitte gib dein Passwort ein.").max(128),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    displayName: z
      .string()
      .trim()
      .max(80, "Der Name darf höchstens 80 Zeichen lang sein.")
      .optional()
      .or(z.literal("")),
    password: passwordSchema,
    passwordConfirm: z.string(),
    acceptPrivacy: z.literal(true, {
      message: "Bitte bestätige die Datenschutzhinweise.",
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

/** Passwortwechsel im angemeldeten Zustand — mit Prüfung des alten Passworts. */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Bitte gib dein aktuelles Passwort ein.").max(128),
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

export const emailChangeSchema = z.object({
  email: emailSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type EmailChangeInput = z.infer<typeof emailChangeSchema>;
