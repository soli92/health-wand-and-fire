import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { waveRouter } from "./routes/wave";

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Basic request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api", waveRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[GlobalError]", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err instanceof Error ? err.message : "Unknown error",
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🧙 Health, Wand and Fire — server running on port ${PORT}`);
});

export default app;
