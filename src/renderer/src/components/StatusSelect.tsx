import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Status } from '../../../shared/types'
import StatusBadge, { STATUS_ORDER, STATUS_STYLES } from './StatusBadge'

const MENU_WIDTH = 124
const ROW_HEIGHT = 30
const MENU_HEIGHT = STATUS_ORDER.length * ROW_HEIGHT + 8

interface StatusSelectProps {
  status: Status
  onChange: (status: Status) => void
}

/** The status pill. Click it to open a list of all statuses and pick one. */
export default function StatusSelect({ status, onChange }: StatusSelectProps): React.JSX.Element {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const open = pos !== null

  const toggle = (): void => {
    if (open) return setPos(null)
    const rect = buttonRef.current!.getBoundingClientRect()
    // Open below the pill; if there is no room, open above it.
    let top = rect.bottom + 4
    if (top + MENU_HEIGHT > window.innerHeight - 4) top = Math.max(4, rect.top - 4 - MENU_HEIGHT)
    setPos({ top, left: Math.max(4, rect.right - MENU_WIDTH) })
  }

  // The list closes on: a click outside, Esc, scrolling, resizing, or leaving the window.
  useEffect(() => {
    if (!open) return
    const close = (): void => setPos(null)
    const onPointerDown = (e: PointerEvent): void => {
      const target = e.target as Node
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close()
    }
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', close)
    window.addEventListener('blur', close)
    document.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('blur', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [open])

  return (
    <>
      <StatusBadge ref={buttonRef} status={status} onClick={toggle} />
      {pos &&
        // Rendered on <body> so the scrolling list and rounded panel cannot clip it.
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="fixed z-50 rounded-lg border border-white/15 bg-[#1c1c1f] p-1 shadow-xl"
          >
            {STATUS_ORDER.map((option) => {
              const { label, className } = STATUS_STYLES[option]
              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={option === status}
                  onClick={() => {
                    setPos(null)
                    if (option !== status) onChange(option)
                  }}
                  style={{ height: ROW_HEIGHT }}
                  className="flex w-full items-center justify-between rounded-md px-1.5 text-white/80 hover:bg-white/10"
                >
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${className}`}
                  >
                    {label}
                  </span>
                  {option === status && <span className="text-xs text-white/80">✓</span>}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </>
  )
}
