import type { WaveConfig } from "../../shared/types";
import { WaveConfigSchema } from "../../shared/types";

/** Strip optional ```json fences — models often wrap JSON anyway. */
export function normalizeModelJsonText(raw: string): string {
  let t = raw.trim();
  const openFence = /^```(?:json)?\s*\r?\n?/i;
  const closeFence = /\r?\n```\s*$/;
  if (openFence.test(t)) {
    t = t.replace(openFence, "").replace(closeFence, "").trim();
  }
  return t;
}

/**
 * Parse and validate wave JSON from Claude text output.
 * Tolerates markdown fences and extracts the outer {...} when wrapped in prose.
 */
export function parseWaveConfigFromModelText(rawText: string): WaveConfig | null {
  const normalized = normalizeModelJsonText(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");
    if (start === -1 || end <= start) {
      return null;
    }
    try {
      parsed = JSON.parse(normalized.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  const validated = WaveConfigSchema.safeParse(parsed);
  return validated.success ? validated.data : null;
}
