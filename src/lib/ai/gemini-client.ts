import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Anbieterspezifischer Wrapper. Die Anwendung greift nur über die Interfaces in
 * lib/categorization/types.ts darauf zu, sodass ein Wechsel des LLM-Anbieters
 * keine Änderungen an der Import-Pipeline erfordert.
 */
const MODEL = "gemini-2.0-flash";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateJson<T>(
  prompt: string,
  responseSchema: Record<string, unknown>,
): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: MODEL,
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        // @ts-expect-error responseSchema wird vom SDK-Typ noch nicht abgedeckt.
        responseSchema,
      },
    });

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text()) as T;
  } catch {
    // Die KI ist bewusst optional: schlägt sie fehl, bleibt die Buchung
    // unkategorisiert und der Nutzer ordnet sie manuell zu.
    return null;
  }
}
