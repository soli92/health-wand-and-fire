import { Link } from 'react-router-dom'
import SoliBrandLogo from './SoliBrandLogo'

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="inline-flex items-center gap-3 hover:opacity-90 transition-opacity">
          <SoliBrandLogo className="h-7 w-auto" />
          <span className="text-sm font-semibold tracking-wide text-foreground/90">Health, Wand & Fire</span>
        </Link>
        <img
          src="/brand/soli-symbol.svg"
          alt=""
          aria-hidden="true"
          className="h-5 w-5 opacity-90"
          loading="eager"
          decoding="async"
        />
      </div>
    </header>
  )
}
