import { describe, expect, it } from "vitest";
import request from "supertest";
import type { NextWaveRequest, WaveConfig } from "../../shared/types";
import { createApp } from "../app";

const mockWave: WaveConfig = {
  enemyCount: 6,
  speed: 1.0,
  shootFrequency: 0.5,
  pattern: "swarm",
  powerUpSpawn: true,
  comment: "Test wave from mock director.",
};

const validStats: NextWaveRequest["stats"] = {
  wave: 1,
  accuracy: 0.5,
  livesLost: 0,
  timeMs: 10000,
  scoreGained: 100,
};

describe("POST /api/next-wave", () => {
  it("returns 200 and wave config when body is valid", async () => {
    const app = createApp({
      getNextWave: async () => mockWave,
    });

    const res = await request(app)
      .post("/api/next-wave")
      .send({ stats: validStats })
      .expect(200);

    expect(res.body).toEqual({ wave: mockWave });
  });

  it("returns 400 when stats are invalid", async () => {
    const app = createApp({
      getNextWave: async () => mockWave,
    });

    const res = await request(app)
      .post("/api/next-wave")
      .send({
        stats: {
          wave: 0,
          accuracy: 2,
          livesLost: -1,
          timeMs: 0,
          scoreGained: "x",
        },
      })
      .expect(400);

    expect(res.body.error).toBe("Invalid request body");
    expect(res.body.details).toBeDefined();
  });

  it("propagates AI errors to global handler (500)", async () => {
    const app = createApp({
      getNextWave: async () => {
        throw new Error("Claude unavailable");
      },
    });

    const res = await request(app)
      .post("/api/next-wave")
      .send({ stats: validStats })
      .expect(500);

    expect(res.body.error).toBe("Internal Server Error");
    expect(res.body.message).toContain("Claude");
  });
});

describe("GET /health", () => {
  it("returns ok", async () => {
    const app = createApp({
      getNextWave: async () => mockWave,
    });

    const res = await request(app).get("/health").expect(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.timestamp).toBe("string");
  });
});
