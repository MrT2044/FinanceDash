/**
 * Anbieterunabhängiges LLM-Interface für den späteren Finanz-Chat-Assistenten.
 *
 * Im MVP wird nur die Kategorisierung über einen LLM abgewickelt (siehe
 * lib/categorization/providers/gemini.provider.ts). Dieses Interface hält die
 * Erweiterung um einen Chat offen, ohne dass die Anwendung an Gemini gebunden ist.
 */
export type LlmMessage = {
  role: "user" | "assistant";
  content: string;
};

export interface LlmProvider {
  readonly name: string;
  complete(messages: LlmMessage[], systemPrompt: string): Promise<string | null>;
}
