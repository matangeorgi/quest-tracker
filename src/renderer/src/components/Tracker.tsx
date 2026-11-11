import { useEffect, useReducer, useState } from 'react'
import { MAX_ZOOM, MIN_ZOOM, type PersistedData, type UiSettings } from '../../../shared/types'
import { newId } from '../id'
import { selectArchived, selectDone, selectOpen, tasksReducer } from '../tasksReducer'
import AddInput from './AddInput'
import ArchivedSection from './ArchivedSection'
import Header from './Header'
import SettingsPanel, { MAX_OPACITY, MIN_OPACITY } from './SettingsPanel'
import SortableList from './SortableList'
import { SortableTaskItem } from './TaskItem'

const clampOpacity = (v: number): number => Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, v))

/** Keeps zoom inside its range and on a 10% step (avoids 0.7999999 from float math). */
const clampZoom = (v: number): number => Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v)) * 10) / 10

/** Saved blur as a 0 – 1 number. Old builds saved the words off / light / strong. */
function toBlurAmount(saved: UiSettings['blur']): number {
  if (saved === undefined || saved === 'off') return 0
  if (saved === 'light') return 0.4
  if (saved === 'strong') return 0.8
  return Math.min(1, Math.max(0, saved))
}

export default function Tracker({ initial }: { initial: PersistedData }): React.JSX.Element {
  const [tasks, dispatch] = useReducer(tasksReducer, initial.tasks)
  const [opacity, setOpacity] = useState(clampOpacity(initial.ui.opacity))
  const [showArchived, setShowArchived] = useState(initial.ui.showArchived)
  const [blur, setBlur] = useState(toBlurAmount(initial.ui.blur))
  const [zoom, setZoom] = useState(clampZoom(initial.ui.zoom ?? 1))
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [adding, setAdding] = useState(false)

  // Send every change to the main process, which writes the file (debounced).
  useEffect(() => {
    window.api.save({ version: 2, tasks, ui: { opacity, showArchived, blur, zoom } })
  }, [tasks, opacity, showArchived, blur, zoom])

  // The main process scales text and rows. Apply at startup and on change.
  useEffect(() => {
    window.api.setZoom(zoom)
  }, [zoom])

  // The main process blurs the desktop behind the window. Apply at startup and on change.
  useEffect(() => {
    window.api.setBlur(blur)
  }, [blur])

  const toggleCollapsed = (): void => {
    const next = !collapsed
    setCollapsed(next)
    if (next) {
      setSettingsOpen(false)
      setAdding(false)
    }
    window.api.setCollapsed(next)
  }

  const open = selectOpen(tasks)
  const done = selectDone(tasks)
  const archived = selectArchived(tasks)

  return (
    <div
      // Only the background fades; text and badges stay fully visible.
      style={{ ['--panel-alpha' as string]: opacity }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[rgb(24_24_27/var(--panel-alpha))] text-white"
    >
      <Header
        collapsed={collapsed}
        settingsOpen={settingsOpen}
        onToggleCollapsed={toggleCollapsed}
        onToggleSettings={() => setSettingsOpen((open) => !open)}
        onAdd={() => setAdding(true)}
      />
      {!collapsed && (
        <>
          {settingsOpen && (
            <SettingsPanel
              opacity={opacity}
              onOpacityChange={setOpacity}
              blur={blur}
              onBlurChange={setBlur}
              zoom={zoom}
              onZoomChange={(value) => setZoom(clampZoom(value))}
            />
          )}
          <main className="flex-1 overflow-y-auto p-3">
            {open.length === 0 ? (
              !adding &&
              done.length === 0 && (
                <p className="py-6 text-center text-sm text-white/40">
                  No active quests. Press + to add one.
                </p>
              )
            ) : (
              <SortableList
                ids={open.map((t) => t.id)}
                onReorder={(id, overId) => dispatch({ type: 'reorder', id, overId })}
              >
                <ul className="space-y-2">
                  {open.map((task) => (
                    <SortableTaskItem key={task.id} task={task} dispatch={dispatch} />
                  ))}
                </ul>
              </SortableList>
            )}
            {adding && (
              // Sits right under the last quest and scrolls into view, so a new quest appears above it.
              <div
                ref={(el) => el?.scrollIntoView({ block: 'nearest' })}
                className={open.length > 0 ? 'mt-2' : undefined}
              >
                <AddInput
                  autoFocus
                  placeholder="New quest…"
                  onSubmit={(title) => dispatch({ type: 'add', id: newId(), title })}
                  onCancel={() => setAdding(false)}
                />
              </div>
            )}
            {done.length > 0 && (
              <>
                {/* Done quests stay in the list, below a divider, until they are Archived. */}
                {(open.length > 0 || adding) && <hr className="my-3 border-white/15" />}
                <SortableList
                  ids={done.map((t) => t.id)}
                  onReorder={(id, overId) => dispatch({ type: 'reorder', id, overId })}
                >
                  <ul className="space-y-2">
                    {done.map((task) => (
                      <SortableTaskItem key={task.id} task={task} dispatch={dispatch} />
                    ))}
                  </ul>
                </SortableList>
              </>
            )}
            <ArchivedSection
              archived={archived}
              show={showArchived}
              onToggle={() => setShowArchived((s) => !s)}
              dispatch={dispatch}
            />
          </main>
        </>
      )}
    </div>
  )
}
