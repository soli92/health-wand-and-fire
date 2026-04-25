/**
 * StatsTracker — tracks per-wave player performance metrics.
 * Used to build the payload for the AI wave generation endpoint.
 */

export interface PlayerStats {
  wave: number
  shotsFired: number
  hits: number
  accuracy: number        // 0–1 float
  livesLost: number
  scoreGained: number
  waveDurationMs: number
}

export class StatsTracker {
  private shotsFired: number = 0
  private hits: number = 0
  private livesLost: number = 0
  private scoreGained: number = 0
  private startTime: number = Date.now()

  /** Called when the player fires a projectile */
  recordShot(): void {
    this.shotsFired++
  }

  /** Called when a player bullet hits an enemy */
  recordHit(): void {
    this.hits++
  }

  /** Called when the player loses a life */
  recordLifeLost(): void {
    this.livesLost++
  }

  /** Called when score is added (enemy killed, etc.) */
  addScore(amount: number): void {
    this.scoreGained += amount
  }

  /** Build a PlayerStats snapshot for the current wave */
  snapshot(wave: number): PlayerStats {
    const accuracy = this.shotsFired > 0 ? this.hits / this.shotsFired : 0
    return {
      wave,
      shotsFired: this.shotsFired,
      hits: this.hits,
      accuracy: Math.round(accuracy * 100) / 100,
      livesLost: this.livesLost,
      scoreGained: this.scoreGained,
      waveDurationMs: Date.now() - this.startTime,
    }
  }

  /** Reset all counters — call at the start of each new wave */
  reset(): void {
    this.shotsFired = 0
    this.hits = 0
    this.livesLost = 0
    this.scoreGained = 0
    this.startTime = Date.now()
  }
}
