import { useState } from 'react'

interface AddInputProps {
  placeholder: string
  onSubmit: (title: string) => void
  /** If set, Esc or clicking away with an empty box calls this. */
  onCancel?: () => void
  autoFocus?: boolean
  small?: boolean
}

export default function AddInput({
  placeholder,
  onSubmit,
  onCancel,
  autoFocus = false,
  small = false
}: AddInputProps): React.JSX.Element {
  const [text, setText] = useState('')

  return (
    <input
      autoFocus={autoFocus}
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && text.trim()) {
          onSubmit(text)
          setText('')
        }
        if (e.key === 'Escape') onCancel?.()
      }}
      onBlur={() => {
        if (!text.trim()) onCancel?.()
      }}
      className={`w-full rounded-md border border-white/10 bg-white/5 text-white placeholder:text-white/30 outline-none focus:border-white/40 ${
        small ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
      }`}
    />
  )
}
