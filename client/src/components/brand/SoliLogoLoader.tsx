interface SoliLogoLoaderProps {
  className?: string
}

export default function SoliLogoLoader({ className = '' }: SoliLogoLoaderProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <span className="absolute inline-flex h-full w-full rounded-full bg-primary/20 animate-ping" />
      <img
        src="/brand/soli-symbol.svg"
        alt="Loading"
        className="relative h-10 w-10 animate-spin [animation-duration:2.2s]"
        loading="eager"
        decoding="async"
      />
    </div>
  )
}
