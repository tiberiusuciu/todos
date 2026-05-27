import { extractEmoji, FALLBACK_EMOJI } from "../utils/emoji.js";

const TIMEOUT_MS = 15_000;

function getOllamaConfig() {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://ollama:11434",
    model: process.env.OLLAMA_MODEL ?? "llama3.2:1b",
  };
}

function buildPrompt(title: string): string {
  return `Pick the single most literal emoji that visually represents this todo task. Choose something specific to the activity or object — avoid generic symbols like briefcases unless the task is explicitly about office work.

Examples:
"Buy groceries" → 🛒
"Purchase new headphones" → 🎧
"Go for a run" → 🏃
"Dentist appointment" → 🦷
"Pay electricity bill" → 💡
"Call mom" → 📞

Task: "${title}"
Reply with only one emoji, nothing else.`;
}

export async function suggestEmoji(title: string): Promise<string> {
  const { baseUrl, model } = getOllamaConfig();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: buildPrompt(title),
        stream: false,
        options: { temperature: 0.2, num_predict: 16 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn("Ollama request failed:", res.status);
      return FALLBACK_EMOJI;
    }

    const data = (await res.json()) as { response?: string };
    const emoji = extractEmoji(data.response ?? "");
    return emoji ?? FALLBACK_EMOJI;
  } catch (err) {
    console.warn("Emoji suggestion failed:", err);
    return FALLBACK_EMOJI;
  }
}
