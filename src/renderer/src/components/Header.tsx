interface HeaderProps {
  collapsed: boolean
  settingsOpen: boolean
  onToggleCollapsed: () => void
  onToggleSettings: () => void
  onAdd: () => void
}

const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties
const drag = { WebkitAppRegion: 'drag' } as React.CSSProperties

function IconButton({
  label,
  active,
  onClick,
  children
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={noDrag}
      className={`flex h-6 w-6 items-center justify-center rounded-md text-sm leading-none transition-colors hover:bg-white/10 ${
        active ? 'bg-white/10 text-white' : 'text-white/70'
      }`}
    >
      {children}
    </button>
  )
}

export default function Header({
  collapsed,
  settingsOpen,
  onToggleCollapsed,
  onToggleSettings,
  onAdd
}: HeaderProps): React.JSX.Element {
  return (
    <header
      style={drag}
      className="flex h-8 shrink-0 cursor-grab items-center justify-between border-b border-white/10 px-2.5"
    >
      <h1 className="text-[11px] font-semibold tracking-[0.2em] text-white/90 uppercase">
        ⚔ Quest Log
      </h1>
      <div className="flex items-center gap-0.5">
        {/* Add and Settings need the list, so they are hidden while collapsed. */}
        {!collapsed && (
          <>
            <IconButton label="Add quest" onClick={onAdd}>
              <span className="text-base">+</span>
            </IconButton>
            <IconButton label="Settings" active={settingsOpen} onClick={onToggleSettings}>
              ⚙
            </IconButton>
          </>
        )}
        <IconButton label={collapsed ? 'Expand' : 'Collapse'} onClick={onToggleCollapsed}>
          {collapsed ? '▾' : '▴'}
        </IconButton>
      </div>
    </header>
  )
}
