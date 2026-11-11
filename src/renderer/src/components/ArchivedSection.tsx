import type { Task } from '../../../shared/types'
import type { TaskAction } from '../tasksReducer'
import TaskItem from './TaskItem'

interface ArchivedSectionProps {
  archived: Task[]
  show: boolean
  onToggle: () => void
  dispatch: (action: TaskAction) => void
}

export default function ArchivedSection({
  archived,
  show,
  onToggle,
  dispatch
}: ArchivedSectionProps): React.JSX.Element | null {
  if (archived.length === 0) return null
  const n = archived.length

  return (
    <section className="mt-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={show}
        className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-[11px] tracking-wide text-white/50 uppercase hover:text-white/80"
      >
        <span>{show ? '▾' : '▸'}</span>
        {show ? 'Hide archived items' : `Show ${n} archived ${n === 1 ? 'item' : 'items'}`}
      </button>
      {show && (
        <ul className="mt-1.5 space-y-2">
          {archived.map((task) => (
            <TaskItem key={task.id} task={task} dispatch={dispatch} archived />
          ))}
        </ul>
      )}
    </section>
  )
}
