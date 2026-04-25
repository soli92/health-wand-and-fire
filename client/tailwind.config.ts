import type { Config } from 'tailwindcss'
import solidsPreset from '@soli92/solids/tailwind'

export default {
  presets: [solidsPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
} satisfies Config
