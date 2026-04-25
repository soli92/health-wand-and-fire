/**
 * GameOverScreen — displays final stats and options to retry or return to menu.
 * Reads score/wave/stats from location.state passed by GameScreen on navigate.
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PlayerStats } from '@/game/StatsTracker'

interface GameOverState {
  score: number
  wave: number
  lastStats?: PlayerStats
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-primary/10 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  )
}

export default function GameOverScreen() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const state     = (location.state as GameOverState | null) ?? { score: 0, wave: 1 }
  const { score, wave, lastStats } = state

  const accuracy = lastStats
    ? `${Math.round(lastStats.accuracy * 100)}%`
    : '—'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-destructive/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-4">
        {/* Main card */}
        <Card className="border-destructive/40 bg-background/80 backdrop-blur-sm shadow-2xl shadow-destructive/10">
          <CardHeader className="text-center pb-2">
            <div className="text-5xl mb-3" aria-hidden="true">💀</div>
            <CardTitle className="text-3xl font-bold text-primary">
              The Darkness Prevails
            </CardTitle>
            <CardDescription className="italic text-muted-foreground mt-1">
              Your flame has been extinguished by the eternal void.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Score highlight */}
            <div className="text-center py-3 rounded-lg bg-accent/40 border border-primary/20">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Final Score</p>
              <p className="text-4xl font-extrabold text-primary tabular-nums tracking-tight">
                {score.toString().padStart(6, '0')}
              </p>
              <Badge variant="outline" className="mt-2 border-primary/40 text-muted-foreground">
                Wave {wave} reached
              </Badge>
            </div>

            {/* Stats breakdown */}
            {lastStats && (
              <div className="rounded-lg bg-background/50 border border-primary/10 px-4 py-2 space-y-0.5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Last Wave Stats</p>
                <StatRow label="Shots fired"  value={lastStats.shotsFired} />
                <StatRow label="Enemies hit"  value={lastStats.hits} />
                <StatRow label="Accuracy"     value={accuracy} />
                <StatRow label="Score gained" value={lastStats.scoreGained} />
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <Button
                className="w-full font-semibold"
                onClick={() => navigate('/game')}
              >
                🔮 Play Again
              </Button>
              <Button
                variant="outline"
                className="w-full border-primary/30 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/')}
              >
                🏰 Return to Sanctum
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/40 italic">
          "Even the brightest star must one day fall..."
        </p>
      </div>
    </div>
  )
}
