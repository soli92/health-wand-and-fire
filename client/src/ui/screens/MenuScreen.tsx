/**
 * MenuScreen — landing screen.
 * Uses @soli92/solids semantic Tailwind tokens.
 */

import { useNavigate } from 'react-router-dom'

export default function MenuScreen() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 text-center">
      {/* Title */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          A wizard's last stand
        </p>
        <h1 className="text-5xl font-extrabold tracking-tight text-primary drop-shadow-[0_0_20px_var(--color-primary)] sm:text-6xl">
          Health, Wand<br />& Fire
        </h1>
        <p className="text-muted-foreground text-sm">
          Powered by <span className="text-primary font-semibold">Claude AI</span> — each wave adapts to your play
        </p>
      </div>

      {/* Decorative wizard glyph */}
      <div className="text-7xl select-none" aria-hidden>🧙</div>

      {/* Controls legend */}
      <div className="rounded-lg border border-border bg-card px-6 py-4 text-left text-sm text-card-foreground">
        <p className="mb-2 font-semibold text-foreground">Controls</p>
        <ul className="space-y-1 text-muted-foreground">
          <li><kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">← →</kbd> or <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">A D</kbd> — Move</li>
          <li><kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">Space</kbd> or <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">Z</kbd> — Cast Spell</li>
        </ul>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/game')}
        className="rounded-lg border border-primary bg-primary px-10 py-4 text-lg font-bold text-primary-foreground shadow-[0_0_24px_var(--color-primary)] transition-all hover:scale-105 hover:shadow-[0_0_40px_var(--color-primary)] active:scale-95"
      >
        Begin the Omen ✦
      </button>

      <p className="text-xs text-muted-foreground/60">
        Survive as many Omen Waves as you can. Good luck, wizard.
      </p>
    </div>
  )
}
