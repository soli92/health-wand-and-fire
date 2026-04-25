/**
 * MenuScreen — landing page with game title and start button.
 * Uses shadcn/ui components from the local registry (@/components/ui).
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function MenuScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      {/* Ambient glow decoration */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-accent/20 blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Title card */}
        <Card className="border-primary/40 bg-background/80 backdrop-blur-sm shadow-2xl shadow-primary/10 mb-6">
          <CardHeader className="text-center pb-2">
            {/* Wizard icon */}
            <div className="text-6xl mb-3 drop-shadow-[0_0_20px_var(--color-primary)]" aria-hidden="true">
              🧙
            </div>
            <CardTitle className="text-3xl sm:text-4xl font-bold text-primary tracking-tight leading-tight">
              Health, Wand<br />and Fire
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2 italic text-base">
              An AI-forged gauntlet of endless dark waves
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each wave is conjured by an ancient oracle.<br />
              Prove your arcane might — or be consumed.
            </p>

            {/* Controls reminder */}
            <div className="rounded-md bg-accent/50 border border-primary/20 p-3 text-xs text-muted-foreground space-y-1">
              <p><kbd className="bg-background/60 border border-primary/30 rounded px-1 py-0.5">← →</kbd> Move</p>
              <p><kbd className="bg-background/60 border border-primary/30 rounded px-1 py-0.5">Space</kbd> Cast spell</p>
            </div>

            <Button
              size="lg"
              className="w-full text-base font-semibold tracking-wide mt-2"
              onClick={() => navigate('/game')}
            >
              ⚔️ Begin the Omen
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/50">
          Powered by AI wave generation
        </p>
      </div>
    </div>
  )
}
