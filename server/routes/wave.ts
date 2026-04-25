import { Router, Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { NextWaveRequestSchema } from "../../shared/types";
import { aiAdapter } from "../services/aiAdapter";

export const waveRouter = Router();

/**
 * POST /api/next-wave
 *
 * Accepts the player's end-of-wave stats and returns the AI-generated
 * configuration for the next wave.
 *
 * Body: NextWaveRequest  (validated via Zod)
 * Response: { wave: WaveConfig }
 */
waveRouter.post(
  "/next-wave",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ── 1. Validate request body ──────────────────────────────────────────
      const stats = NextWaveRequestSchema.parse(req.body);

      // ── 2. Ask Claude for the next wave config ────────────────────────────
      const wave = await aiAdapter.getNextWave(stats);

      // ── 3. Return result ──────────────────────────────────────────────────
      res.status(200).json({ wave });
    } catch (err) {
      if (err instanceof ZodError) {
        // Validation error → 400 Bad Request
        res.status(400).json({
          error: "Invalid request body",
          details: err.flatten().fieldErrors,
        });
        return;
      }

      // AI / unexpected error → delegate to global handler (500)
      next(err);
    }
  }
);
