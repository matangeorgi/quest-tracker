import type { Task } from '../../shared/types'

/** Dummy data for the very first launch (when tasks.json does not exist yet). */
export const SEED_TASKS: Task[] = [
  {
    id: 'seed-1',
    title: 'Fix map zoom regression',
    status: 'wip',
    subtasks: [
      { id: 'seed-1a', title: 'Reproduce on staging', status: 'done', subtasks: [] },
      { id: 'seed-1b', title: 'Write regression test', status: 'wip', subtasks: [] },
      { id: 'seed-1c', title: 'Open pull request', status: 'in_cr', subtasks: [] }
    ]
  },
  {
    id: 'seed-2',
    title: 'Review field tab PR',
    status: 'in_cr',
    subtasks: []
  },
  {
    id: 'seed-3',
    title: 'Update onboarding docs',
    status: 'wip',
    subtasks: [
      { id: 'seed-3a', title: 'Refresh screenshots', status: 'wip', subtasks: [] },
      { id: 'seed-3b', title: 'Add troubleshooting section', status: 'in_cr', subtasks: [] }
    ]
  },
  {
    id: 'seed-6',
    title: 'Plan next sprint',
    status: 'not_started',
    subtasks: []
  },
  {
    id: 'seed-4',
    title: 'Set up CI cache',
    status: 'done',
    subtasks: [{ id: 'seed-4a', title: 'Measure build time', status: 'done', subtasks: [] }]
  },
  {
    id: 'seed-5',
    title: 'Clean up unused feature flags',
    status: 'archived',
    subtasks: []
  }
]
