import { z } from "zod";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [".csv", ".txt"];

export const uploadSchema = z.object({
  accountId: z.string().uuid().optional(),
  newAccountName: z
    .string()
    .trim()
    .min(1, "Bitte gib einen Kontonamen an.")
    .max(80, "Der Kontoname darf höchstens 80 Zeichen lang sein.")
    .optional(),
  useAi: z.boolean().default(false),
});

export function validateUploadFile(file: File | null): string | null {
  if (!file) return "Bitte wähle eine CSV-Datei aus.";
  if (file.size === 0) return "Die ausgewählte Datei ist leer.";
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Die Datei ist größer als 5 MB. Bitte exportiere einen kürzeren Zeitraum.";
  }

  const name = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return "Es werden nur CSV-Dateien unterstützt.";
  }

  return null;
}
