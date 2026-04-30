import type { ReactNode } from 'react'
import type { TouchControlSettings } from '../../game/touchControlSettings'
import {
  DEFAULT_TOUCH_CONTROL_SETTINGS,
  clampTouchSettings,
} from '../../game/touchControlSettings'

interface TouchControlsSettingsPanelProps {
  value: TouchControlSettings
  onChange: (next: TouchControlSettings) => void
  onApply: () => void
  onReset: () => void
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1 text-left">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}

export default function TouchControlsSettingsPanel({
  value,
  onChange,
  onApply,
  onReset,
}: TouchControlsSettingsPanelProps) {
  const patch = (p: Partial<TouchControlSettings>) => {
    onChange(clampTouchSettings({ ...value, ...p }))
  }

  return (
    <div className="w-full max-w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-border bg-card/95 p-3 text-left shadow-lg">
      <p className="text-xs font-semibold text-primary mb-2">Touch controls</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Move ring — horizontal">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(value.stickXNorm * 100)}
            onChange={(e) => patch({ stickXNorm: Number(e.target.value) / 100 })}
            className="w-full accent-primary"
          />
        </Field>
        <Field label="Move ring — vertical">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(value.stickYNorm * 100)}
            onChange={(e) => patch({ stickYNorm: Number(e.target.value) / 100 })}
            className="w-full accent-primary"
          />
        </Field>
        <Field label="Cast strip height">
          <input
            type="range"
            min={56}
            max={140}
            step={2}
            value={value.fireZoneH}
            onChange={(e) => patch({ fireZoneH: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </Field>
        <Field label="Move ring size">
          <input
            type="range"
            min={36}
            max={90}
            step={2}
            value={value.stickRadius}
            onChange={(e) => patch({ stickRadius: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </Field>
        <Field label="Hint transparency">
          <input
            type="range"
            min={15}
            max={100}
            step={5}
            value={Math.round(value.overlayOpacity * 100)}
            onChange={(e) => patch({ overlayOpacity: Number(e.target.value) / 100 })}
            className="w-full accent-primary"
          />
        </Field>
        <Field label="Pause — from top">
          <input
            type="range"
            min={28}
            max={120}
            step={2}
            value={value.pauseInsetTop}
            onChange={(e) => patch({ pauseInsetTop: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </Field>
        <Field label="Pause — from right">
          <input
            type="range"
            min={4}
            max={120}
            step={2}
            value={value.pauseInsetRight}
            onChange={(e) => patch({ pauseInsetRight: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          onClick={onApply}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Apply & save
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_TOUCH_CONTROL_SETTINGS })}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Defaults
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Revert unsaved
        </button>
      </div>
    </div>
  )
}
