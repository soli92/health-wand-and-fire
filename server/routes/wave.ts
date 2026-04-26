import { Router, Request, Response, NextFunction } from "express";
import type { NextWaveRequest, WaveConfig } from "../../shared/types";
import { NextWaveRequestSchema } from "../../shared/types";

export function createWaveRouter(
  getNextWave: (stats: NextWaveRequest) => Promise<WaveConfig>
): Router {
  const waveRouter = Router();

  /**
   * POST /api/next-wave
   *
   * Accepts the player's end-of-wave stats and returns the AI-generated
   * configuration for the next wave.
   */
  waveRouter.post(
    "/next-wave",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parsed = NextWaveRequestSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: "Invalid request body",
            details: parsed.error.flatten().fieldErrors,
          });
          return;
        }
        const wave = await getNextWave(parsed.data);
        res.status(200).json({ wave });
      } catch (err) {
        next(err);
      }
    }
  );

  return waveRouter;
}
