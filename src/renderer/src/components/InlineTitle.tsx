import { useState } from 'react'

interface InlineTitleProps {
  value: string
  className?: string
  onCommit: (title: string) => void
}

/** Shows a title. Double-click to edit; Enter or click away saves, Esc cancels. */
export default function InlineTitle({
  value,
  className = '',
  onCommit
}: InlineTitleProps): React.JSX.Element {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = (): void => {
    const title = draft.trim()
    if (title && title !== value) onCommit(title)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span
        title="Double-click to rename"
        onDoubleClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className={`break-words ${className}`}
      >
        {value}
      </span>
    )
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') setEditing(false)
      }}
      className={`w-full rounded bg-white/10 px-1 text-white outline-none ring-1 ring-white/40 ${className}`}
    />
  )
}
