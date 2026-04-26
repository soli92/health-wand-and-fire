import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import type { NextWaveRequest, WaveConfig } from "../shared/types";
import { createWaveRouter } from "./routes/wave";
import { aiAdapter } from "./services/aiAdapter";

export function createApp(options?: {
  getNextWave?: (stats: NextWaveRequest) => Promise<WaveConfig>;
}) {
  const getNextWave =
    options?.getNextWave ?? ((stats) => aiAdapter.getNextWave(stats));

  const app = express();

  app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json());

  app.use((req: Request, _res: Response, next: NextFunction) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.url}`);
    next();
  });

  app.use("/api", createWaveRouter(getNextWave));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[GlobalError]", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  });

  return app;
}
