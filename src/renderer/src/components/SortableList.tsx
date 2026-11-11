import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type Modifier
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

// Items only move up and down.
const lockHorizontal: Modifier = ({ transform }) => ({ ...transform, x: 0 })

interface SortableListProps {
  ids: string[]
  onReorder: (id: string, overId: string) => void
  children: React.ReactNode
}

/** Drag-to-reorder scope. Each list (main tasks, or one task's sub-tasks) has its own. */
export default function SortableList({
  ids,
  onReorder,
  children
}: SortableListProps): React.JSX.Element {
  // A drag starts after 4px of movement, so plain clicks still work.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[lockHorizontal]}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) onReorder(String(active.id), String(over.id))
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}
