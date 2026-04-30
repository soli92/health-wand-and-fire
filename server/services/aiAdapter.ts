import Anthropic from "@anthropic-ai/sdk";
import { WaveConfig, NextWaveRequest } from "../../shared/types";
import { parseWaveConfigFromModelText } from "./parseWaveConfigFromModel";

// ─── Constants ─────────────────────────────────────────────────────────────────

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 256;

const SYSTEM_PROMPT = `You are the AI director of "Health, Wand and Fire", a fantasy arcade shooter.
The player is a wizard repelling waves of dark creatures.
You receive the player's stats at the end of each wave and must return
ONLY a valid JSON object (no markdown, no extra text) with the next wave config.

Balancing rules:
- accuracy > 0.7 → increase difficulty (speed, shootFrequency, enemyCount)
- livesLost >= 2  → reduce difficulty, set powerUpSpawn: true
- wave > 5        → use advanced patterns (pincer, flanking)
- Always keep the game challenging but not frustrating

The "comment" field must be written in epic fantasy tone.
Example: "The goblin horde grows smarter. Brace yourself, wizard."

Respond ONLY with valid JSON matching this schema:
{ enemyCount, speed, shootFrequency, pattern, powerUpSpawn, comment }
Valid patterns: swarm | pincer | wall | random | flanking`;

/**
 * Fallback wave config returned when Claude's response cannot be parsed.
 * Represents a medium-difficulty wave to keep the game playable.
 */
const FALLBACK_WAVE: WaveConfig = {
  enemyCount: 8,
  speed: 1.5,
  shootFrequency: 1.2,
  pattern: "random",
  powerUpSpawn: false,
  comment:
    "The shadows stir in silence. Something stirs beyond the mist… stay vigilant, wizard.",
};

// ─── Service ───────────────────────────────────────────────────────────────────

class AiAdapter {
  private readonly client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Sends the player's end-of-wave stats to Claude and returns a validated
   * WaveConfig for the next wave. Falls back to FALLBACK_WAVE on any error.
   */
  async getNextWave(stats: NextWaveRequest): Promise<WaveConfig> {
    // Inner stats object matches the system prompt ("player's stats"); avoids redundant nesting for the model.
    const userMessage = JSON.stringify(stats.stats, null, 2);

    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      // Extract raw text content from the first content block
      const firstBlock = response.content[0];
      if (!firstBlock || firstBlock.type !== "text") {
        console.warn("[AiAdapter] Unexpected response structure — using fallback");
        return FALLBACK_WAVE;
      }

      const rawText = firstBlock.text.trim();

      const wave = parseWaveConfigFromModelText(rawText);
      if (!wave) {
        console.warn(
          "[AiAdapter] Could not parse model output as WaveConfig | Raw:",
          rawText,
          "— using fallback"
        );
        return FALLBACK_WAVE;
      }

      return wave;
    } catch (err) {
      console.warn("[AiAdapter] Claude API error — using fallback wave:", err);
      return FALLBACK_WAVE;
    }
  }
}

// Export as a singleton
export const aiAdapter = new AiAdapter();
