import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../../shared/types'
import { newId } from '../id'
import type { TaskAction } from '../tasksReducer'
import AddInput from './AddInput'
import InlineTitle from './InlineTitle'
import SortableList from './SortableList'
import StatusSelect from './StatusSelect'

type Dispatch = (action: TaskAction) => void
type Sortable = ReturnType<typeof useSortable>

function Checkbox({
  checked,
  small,
  onClick
}: {
  checked: boolean
  small: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className={`mt-0.5 flex shrink-0 items-center justify-center rounded-full border transition-colors ${
        small ? 'h-3.5 w-3.5 text-[8px]' : 'h-4 w-4 text-[10px]'
      } ${
        checked
          ? 'border-emerald-400 bg-emerald-400/30 text-emerald-200'
          : 'border-white/30 text-transparent hover:border-white/70'
      }`}
    >
      ✓
    </button>
  )
}

function HoverButton({
  label,
  onClick,
  children
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-5 w-5 items-center justify-center rounded text-xs text-white/50 hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  )
}

/** The grip you drag to reorder. Only this element starts a drag. */
function DragHandle({
  sortable
}: {
  sortable: Pick<Sortable, 'attributes' | 'listeners' | 'setActivatorNodeRef'>
}): React.JSX.Element {
  return (
    <button
      type="button"
      ref={sortable.setActivatorNodeRef}
      aria-label="Drag to reorder"
      title="Drag to reorder"
      {...sortable.attributes}
      {...sortable.listeners}
      className="mt-0.5 flex h-4 w-3 shrink-0 cursor-grab touch-none items-center justify-center text-[10px] leading-none text-white/30 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white/70 active:cursor-grabbing"
    >
      ⋮⋮
    </button>
  )
}

function sortableStyle(s: Sortable): React.CSSProperties {
  return {
    transform: CSS.Transform.toString(s.transform),
    transition: s.transition,
    position: 'relative',
    zIndex: s.isDragging ? 20 : undefined,
    opacity: s.isDragging ? 0.85 : undefined
  }
}

interface TaskRowProps {
  task: Task
  level: 0 | 1
  dispatch: Dispatch
  handle?: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
}

function TaskRow({
  task,
  level,
  dispatch,
  handle,
  meta,
  actions
}: TaskRowProps): React.JSX.Element {
  // Done and Archived both look finished: checked, dimmed, crossed out.
  // Unchecking reopens the task (a sub-task goes back to Not started, a main task to WIP).
  const finished = task.status === 'done' || task.status === 'archived'
  const small = level === 1
  return (
    <div className="group flex items-start gap-2">
      {handle}
      <Checkbox
        checked={finished}
        small={small}
        onClick={() =>
          dispatch({
            type: 'set_status',
            id: task.id,
            status: finished ? (small ? 'not_started' : 'wip') : 'done'
          })
        }
      />
      <div
        className={`min-w-0 flex-1 leading-snug ${small ? 'text-xs' : 'text-sm font-medium'} ${
          finished ? 'text-white/40 line-through' : 'text-white/90'
        }`}
      >
        <InlineTitle
          value={task.title}
          onCommit={(title) => dispatch({ type: 'rename', id: task.id, title })}
        />
      </div>
      {/* Sub-tasks are just a checkbox: no counter, no status badge. */}
      {!small && (
        <>
          <div className="mt-0.5 w-8 shrink-0 text-right">{meta}</div>
          <StatusSelect
            status={task.status}
            onChange={(status) => dispatch({ type: 'set_status', id: task.id, status })}
          />
        </>
      )}
      <div className="flex w-10 shrink-0 justify-end opacity-0 transition-opacity group-hover:opacity-100">
        {actions}
        <HoverButton label="Delete" onClick={() => dispatch({ type: 'delete', id: task.id })}>
          ×
        </HoverButton>
      </div>
    </div>
  )
}

function SubTaskItem({ task, dispatch }: { task: Task; dispatch: Dispatch }): React.JSX.Element {
  const sortable = useSortable({ id: task.id })
  return (
    <li ref={sortable.setNodeRef} style={sortableStyle(sortable)}>
      <TaskRow
        task={task}
        level={1}
        dispatch={dispatch}
        handle={<DragHandle sortable={sortable} />}
      />
    </li>
  )
}

interface TaskItemProps {
  task: Task
  dispatch: Dispatch
  /** In the Archived list: no sub-task list, no "add sub-task". */
  archived?: boolean
  /** Set by SortableTaskItem. */
  handle?: React.ReactNode
  setNodeRef?: (el: HTMLElement | null) => void
  style?: React.CSSProperties
}

export default function TaskItem({
  task,
  dispatch,
  archived = false,
  handle,
  setNodeRef,
  style
}: TaskItemProps): React.JSX.Element {
  const [addingSub, setAddingSub] = useState(false)
  const total = task.subtasks.length
  const doneCount = task.subtasks.filter((s) => s.status === 'done').length

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5"
    >
      <TaskRow
        task={task}
        level={0}
        dispatch={dispatch}
        handle={handle}
        meta={
          total > 0 ? (
            <span className="text-[11px] text-white/40 tabular-nums">
              {doneCount}/{total}
            </span>
          ) : null
        }
        actions={
          archived ? null : (
            <HoverButton label="Add sub-task" onClick={() => setAddingSub(true)}>
              +
            </HoverButton>
          )
        }
      />
      {!archived && (total > 0 || addingSub) && (
        <SortableList
          ids={task.subtasks.map((s) => s.id)}
          onReorder={(id, overId) => dispatch({ type: 'reorder', id, overId })}
        >
          <ul className="mt-2 ml-2 space-y-1.5 border-l border-white/15 pl-3">
            {task.subtasks.map((sub) => (
              <SubTaskItem key={sub.id} task={sub} dispatch={dispatch} />
            ))}
            {addingSub && (
              <li>
                <AddInput
                  autoFocus
                  small
                  placeholder="New sub-task…"
                  onSubmit={(title) =>
                    dispatch({ type: 'add_subtask', parentId: task.id, id: newId(), title })
                  }
                  onCancel={() => setAddingSub(false)}
                />
              </li>
            )}
          </ul>
        </SortableList>
      )}
    </li>
  )
}

/** A main task in the open or Done list: can be dragged up and down within its list. */
export function SortableTaskItem({
  task,
  dispatch
}: {
  task: Task
  dispatch: Dispatch
}): React.JSX.Element {
  const sortable = useSortable({ id: task.id })
  return (
    <TaskItem
      task={task}
      dispatch={dispatch}
      handle={<DragHandle sortable={sortable} />}
      setNodeRef={sortable.setNodeRef}
      style={sortableStyle(sortable)}
    />
  )
}
