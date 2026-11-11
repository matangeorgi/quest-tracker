import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from '../../../shared/types'

export const MIN_OPACITY = 0.3
export const MAX_OPACITY = 1

interface SliderRowProps {
  id: string
  label: string
  /** Current value as a percent, 0 – 100. */
  percent: number
  min: number
  onChange: (percent: number) => void
}

function SliderRow({ id, label, percent, min, onChange }: SliderRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="w-16 shrink-0 text-[11px] tracking-wide text-white/60 uppercase">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={100}
        step={1}
        value={percent}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer accent-white"
      />
      <span className="w-9 text-right text-[11px] text-white/60 tabular-nums">{percent}%</span>
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  children
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-sm leading-none text-white/80 transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
    >
      {children}
    </button>
  )
}

interface SettingsPanelProps {
  opacity: number // MIN_OPACITY – MAX_OPACITY
  onOpacityChange: (value: number) => void
  blur: number // 0 – 1
  onBlurChange: (value: number) => void
  zoom: number // MIN_ZOOM – MAX_ZOOM
  onZoomChange: (value: number) => void
}

export default function SettingsPanel({
  opacity,
  onOpacityChange,
  blur,
  onBlurChange,
  zoom,
  onZoomChange
}: SettingsPanelProps): React.JSX.Element {
  return (
    <div className="space-y-2 border-b border-white/10 bg-black/20 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <span className="w-16 shrink-0 text-[11px] tracking-wide text-white/60 uppercase">Size</span>
        <div className="flex flex-1 items-center gap-2">
          <StepButton
            label="Smaller text"
            disabled={zoom <= MIN_ZOOM + 0.001}
            onClick={() => onZoomChange(zoom - ZOOM_STEP)}
          >
            −
          </StepButton>
          <StepButton
            label="Larger text"
            disabled={zoom >= MAX_ZOOM - 0.001}
            onClick={() => onZoomChange(zoom + ZOOM_STEP)}
          >
            +
          </StepButton>
        </div>
        <span className="w-9 text-right text-[11px] text-white/60 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
      </div>
      <SliderRow
        id="opacity"
        label="Opacity"
        percent={Math.round(opacity * 100)}
        min={MIN_OPACITY * 100}
        onChange={(p) => onOpacityChange(p / 100)}
      />
      <SliderRow
        id="blur"
        label="Blur"
        percent={Math.round(blur * 100)}
        min={0}
        onChange={(p) => onBlurChange(p / 100)}
      />
    </div>
  )
}
