import { describe, expect, it } from 'vitest'
import type { Task } from '../../shared/types'
import { selectArchived, selectDone, selectOpen, tasksReducer } from './tasksReducer'

const sub = (id: string, status: Task['status'] = 'wip'): Task => ({
  id,
  title: id,
  status,
  subtasks: []
})
const task = (id: string, status: Task['status'] = 'wip', subtasks: Task[] = []): Task => ({
  id,
  title: id,
  status,
  subtasks
})

describe('tasksReducer', () => {
  it('adds a main task as Not started and trims the title', () => {
    const next = tasksReducer([], { type: 'add', id: 'a', title: '  Fix bug  ' })
    expect(next).toEqual([{ id: 'a', title: 'Fix bug', status: 'not_started', subtasks: [] }])
  })

  it('ignores empty titles on add, add_subtask and rename', () => {
    const tasks = [task('a')]
    expect(tasksReducer(tasks, { type: 'add', id: 'b', title: '   ' })).toBe(tasks)
    expect(tasksReducer(tasks, { type: 'add_subtask', parentId: 'a', id: 's', title: '' })).toBe(tasks)
    expect(tasksReducer(tasks, { type: 'rename', id: 'a', title: ' ' })).toBe(tasks)
  })

  it('adds a sub-task under the right parent', () => {
    const next = tasksReducer([task('a'), task('b')], {
      type: 'add_subtask',
      parentId: 'b',
      id: 's1',
      title: 'Step'
    })
    expect(next[0].subtasks).toHaveLength(0)
    expect(next[1].subtasks.map((s) => s.id)).toEqual(['s1'])
    expect(next[1].subtasks[0].status).toBe('not_started')
  })

  it('sets any status directly, on main tasks and sub-tasks', () => {
    let tasks = [task('a', 'wip', [sub('s', 'not_started')]), task('b')]
    tasks = tasksReducer(tasks, { type: 'set_status', id: 's', status: 'in_cr' })
    expect(tasks[0].subtasks[0].status).toBe('in_cr')
    tasks = tasksReducer(tasks, { type: 'set_status', id: 'b', status: 'not_started' })
    expect(tasks[1].status).toBe('not_started')
    expect(tasks[0].status).toBe('wip')
  })

  it('moves a Done main task out of the open list but keeps it visible, and back when reopened', () => {
    let tasks = [task('a'), task('b')]
    tasks = tasksReducer(tasks, { type: 'set_status', id: 'a', status: 'done' })
    expect(selectOpen(tasks).map((t) => t.id)).toEqual(['b'])
    expect(selectDone(tasks).map((t) => t.id)).toEqual(['a'])
    expect(selectArchived(tasks)).toHaveLength(0)

    tasks = tasksReducer(tasks, { type: 'set_status', id: 'a', status: 'wip' })
    expect(selectOpen(tasks).map((t) => t.id)).toEqual(['a', 'b'])
    expect(selectDone(tasks)).toHaveLength(0)
  })

  it('hides a task only when it is Archived, and brings it back when reopened', () => {
    let tasks = [task('a', 'done'), task('b')]
    tasks = tasksReducer(tasks, { type: 'set_status', id: 'a', status: 'archived' })
    expect(selectDone(tasks)).toHaveLength(0)
    expect(selectOpen(tasks).map((t) => t.id)).toEqual(['b'])
    expect(selectArchived(tasks).map((t) => t.id)).toEqual(['a'])

    tasks = tasksReducer(tasks, { type: 'set_status', id: 'a', status: 'done' })
    expect(selectDone(tasks).map((t) => t.id)).toEqual(['a'])
    expect(selectArchived(tasks)).toHaveLength(0)
  })

  it('keeps the original order inside each list', () => {
    const tasks = [task('a', 'done'), task('b'), task('c', 'done'), task('d'), task('e', 'archived')]
    expect(selectOpen(tasks).map((t) => t.id)).toEqual(['b', 'd'])
    expect(selectDone(tasks).map((t) => t.id)).toEqual(['a', 'c'])
    expect(selectArchived(tasks).map((t) => t.id)).toEqual(['e'])
  })

  it('keeps Done sub-tasks under their parent, in the open list', () => {
    const tasks = tasksReducer([task('a', 'wip', [sub('s1'), sub('s2')])], {
      type: 'set_status',
      id: 's1',
      status: 'done'
    })
    expect(selectOpen(tasks)[0].subtasks.map((s) => s.status)).toEqual(['done', 'wip'])
  })

  it('does not change the parent when all sub-tasks are Done', () => {
    let tasks = [task('a', 'wip', [sub('s1'), sub('s2')])]
    tasks = tasksReducer(tasks, { type: 'set_status', id: 's1', status: 'done' })
    tasks = tasksReducer(tasks, { type: 'set_status', id: 's2', status: 'done' })
    expect(tasks[0].status).toBe('wip')
    expect(selectOpen(tasks)).toHaveLength(1)
  })

  it('keeps sub-tasks when a main task is marked Done or Archived', () => {
    let tasks = tasksReducer([task('a', 'wip', [sub('s1')])], {
      type: 'set_status',
      id: 'a',
      status: 'done'
    })
    expect(selectDone(tasks)[0].subtasks).toHaveLength(1)
    tasks = tasksReducer(tasks, { type: 'set_status', id: 'a', status: 'archived' })
    expect(selectArchived(tasks)[0].subtasks).toHaveLength(1)
  })

  it('reorders main tasks, keeping the open order right around Done tasks', () => {
    const tasks = [task('a'), task('x', 'done'), task('b'), task('c')]
    const next = tasksReducer(tasks, { type: 'reorder', id: 'c', overId: 'a' })
    expect(selectOpen(next).map((t) => t.id)).toEqual(['c', 'a', 'b'])
    expect(selectDone(next).map((t) => t.id)).toEqual(['x'])
  })

  it('reorders Done tasks among themselves', () => {
    const tasks = [task('a', 'done'), task('b'), task('c', 'done')]
    const next = tasksReducer(tasks, { type: 'reorder', id: 'c', overId: 'a' })
    expect(selectDone(next).map((t) => t.id)).toEqual(['c', 'a'])
    expect(selectOpen(next).map((t) => t.id)).toEqual(['b'])
  })

  it('reorders sub-tasks inside their parent only', () => {
    const tasks = [task('a', 'wip', [sub('s1'), sub('s2'), sub('s3')]), task('b', 'wip', [sub('t1')])]
    const next = tasksReducer(tasks, { type: 'reorder', id: 's3', overId: 's1' })
    expect(next[0].subtasks.map((s) => s.id)).toEqual(['s3', 's1', 's2'])
    expect(next[1].subtasks.map((s) => s.id)).toEqual(['t1'])
  })

  it('ignores a reorder across different parents or unknown ids', () => {
    const tasks = [task('a', 'wip', [sub('s1')]), task('b', 'wip', [sub('t1')])]
    expect(tasksReducer(tasks, { type: 'reorder', id: 's1', overId: 't1' })).toEqual(tasks)
    expect(tasksReducer(tasks, { type: 'reorder', id: 's1', overId: 'b' })).toEqual(tasks)
    expect(tasksReducer(tasks, { type: 'reorder', id: 'nope', overId: 'a' })).toEqual(tasks)
  })

  it('renames and deletes main tasks and sub-tasks', () => {
    let tasks = [task('a', 'wip', [sub('s1'), sub('s2')]), task('b')]
    tasks = tasksReducer(tasks, { type: 'rename', id: 's1', title: 'Renamed' })
    expect(tasks[0].subtasks[0].title).toBe('Renamed')
    tasks = tasksReducer(tasks, { type: 'delete', id: 's2' })
    expect(tasks[0].subtasks.map((s) => s.id)).toEqual(['s1'])
    tasks = tasksReducer(tasks, { type: 'delete', id: 'a' })
    expect(tasks.map((t) => t.id)).toEqual(['b'])
  })
})
