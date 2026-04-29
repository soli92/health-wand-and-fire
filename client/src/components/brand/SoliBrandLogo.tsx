interface SoliBrandLogoProps {
  className?: string
}

export default function SoliBrandLogo({ className = '' }: SoliBrandLogoProps) {
  return (
    <img
      src="/brand/soli-logo-gold.svg"
      alt="Soli"
      className={className}
      loading="eager"
      decoding="async"
    />
  )
}
