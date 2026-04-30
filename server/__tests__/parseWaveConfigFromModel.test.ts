import { describe, expect, it } from "vitest";
import { normalizeModelJsonText, parseWaveConfigFromModelText } from "../services/parseWaveConfigFromModel";

describe("normalizeModelJsonText", () => {
  it("strips ```json fences", () => {
    const raw = '```json\n{ "x": 1 }\n```';
    expect(normalizeModelJsonText(raw)).toBe('{ "x": 1 }');
  });

  it("strips ``` fences without language tag", () => {
    const raw = "```\n{}\n```";
    expect(normalizeModelJsonText(raw)).toBe("{}");
  });
});

describe("parseWaveConfigFromModelText", () => {
  const valid = `{"enemyCount":10,"speed":1.2,"shootFrequency":0.9,"pattern":"pincer","powerUpSpawn":false,"comment":"The mist thickens."}`;

  it("parses plain JSON", () => {
    const w = parseWaveConfigFromModelText(valid);
    expect(w).not.toBeNull();
    expect(w!.pattern).toBe("pincer");
    expect(w!.enemyCount).toBe(10);
  });

  it("parses fenced JSON", () => {
    const w = parseWaveConfigFromModelText(`Here you go:\n\`\`\`json\n${valid}\n\`\`\``);
    expect(w).not.toBeNull();
    expect(w!.enemyCount).toBe(10);
  });

  it("extracts object from surrounding prose", () => {
    const w = parseWaveConfigFromModelText(`Sure! ${valid} Hope it helps.`);
    expect(w).not.toBeNull();
    expect(w!.pattern).toBe("pincer");
  });

  it("returns null for invalid schema", () => {
    expect(parseWaveConfigFromModelText('{"enemyCount":2}')).toBeNull();
  });
});
