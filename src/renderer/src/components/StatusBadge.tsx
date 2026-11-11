import type { Status } from '../../../shared/types'

export const STATUS_ORDER: Status[] = ['not_started', 'wip', 'in_cr', 'done', 'archived']

export const STATUS_STYLES: Record<Status, { label: string; className: string }> = {
  not_started: {
    label: 'Not started',
    className: 'border-white/20 bg-white/10 text-white/60 hover:bg-white/20'
  },
  wip: {
    label: 'WIP',
    className: 'border-amber-400/50 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
  },
  in_cr: {
    label: 'In CR',
    className: 'border-indigo-400/50 bg-indigo-400/20 text-indigo-300 hover:bg-indigo-400/30'
  },
  done: {
    label: 'Done',
    className:
      'border-emerald-400/40 bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25'
  },
  archived: {
    label: 'Archived',
    className: 'border-white/10 bg-transparent text-white/40 hover:bg-white/10'
  }
}

interface StatusBadgeProps {
  status: Status
  onClick: () => void
  ref?: React.Ref<HTMLButtonElement>
}

export default function StatusBadge({
  status,
  onClick,
  ref
}: StatusBadgeProps): React.JSX.Element {
  const { label, className } = STATUS_STYLES[status]
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      title="Change status"
      className={`w-[68px] shrink-0 rounded-full border py-0.5 text-center text-[10px] font-semibold tracking-wide whitespace-nowrap transition-colors ${className}`}
    >
      {label}
    </button>
  )
}
