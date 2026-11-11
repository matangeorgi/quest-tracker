import type { Status, Task } from '../../shared/types'

export type TaskAction =
  | { type: 'add'; id: string; title: string }
  | { type: 'add_subtask'; parentId: string; id: string; title: string }
  | { type: 'set_status'; id: string; status: Status }
  | { type: 'rename'; id: string; title: string }
  | { type: 'delete'; id: string }
  /** Move `id` to the place of `overId`. Both must be main tasks, or sub-tasks of the same parent. */
  | { type: 'reorder'; id: string; overId: string }

function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice()
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}

/** Applies `fn` to the task with this id, whether it is a main task or a sub-task. */
function updateTask(tasks: Task[], id: string, fn: (task: Task) => Task): Task[] {
  return tasks.map((task) => {
    if (task.id === id) return fn(task)
    if (task.subtasks.some((s) => s.id === id)) {
      return { ...task, subtasks: updateTask(task.subtasks, id, fn) }
    }
    return task
  })
}

export function tasksReducer(tasks: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case 'add': {
      const title = action.title.trim()
      if (!title) return tasks
      return [...tasks, { id: action.id, title, status: 'not_started', subtasks: [] }]
    }
    case 'add_subtask': {
      const title = action.title.trim()
      if (!title) return tasks
      return updateTask(tasks, action.parentId, (parent) => ({
        ...parent,
        subtasks: [
          ...parent.subtasks,
          { id: action.id, title, status: 'not_started', subtasks: [] }
        ]
      }))
    }
    case 'set_status':
      return updateTask(tasks, action.id, (t) => ({ ...t, status: action.status }))
    case 'rename': {
      const title = action.title.trim()
      if (!title) return tasks
      return updateTask(tasks, action.id, (t) => ({ ...t, title }))
    }
    case 'reorder': {
      // Moving inside the full list keeps the order of the open tasks right,
      // even when Done or Archived tasks sit between them.
      const from = tasks.findIndex((t) => t.id === action.id)
      const to = tasks.findIndex((t) => t.id === action.overId)
      if (from !== -1 && to !== -1) return arrayMove(tasks, from, to)
      return tasks.map((t) => {
        const f = t.subtasks.findIndex((s) => s.id === action.id)
        const o = t.subtasks.findIndex((s) => s.id === action.overId)
        return f !== -1 && o !== -1 ? { ...t, subtasks: arrayMove(t.subtasks, f, o) } : t
      })
    }
    case 'delete':
      return tasks
        .filter((t) => t.id !== action.id)
        .map((t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== action.id) }))
  }
}

/** Main tasks still being worked on (not Done, not Archived). */
export const selectOpen = (tasks: Task[]): Task[] =>
  tasks.filter((t) => t.status !== 'done' && t.status !== 'archived')

/** Main tasks that are Done. They stay visible, below the open ones. */
export const selectDone = (tasks: Task[]): Task[] => tasks.filter((t) => t.status === 'done')

/** Main tasks that are Archived. Hidden unless the user opens the Archived list. */
export const selectArchived = (tasks: Task[]): Task[] =>
  tasks.filter((t) => t.status === 'archived')
