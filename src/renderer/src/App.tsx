import { useEffect, useState } from 'react'
import { DEFAULT_UI, type PersistedData } from '../../shared/types'
import Tracker from './components/Tracker'
import { SEED_TASKS } from './seed'

function App(): React.JSX.Element | null {
  const [initial, setInitial] = useState<PersistedData | null>(null)

  // Load once. No saved file yet (first launch) -> start with the dummy data.
  useEffect(() => {
    window.api.load().then((saved) => {
      setInitial(saved ?? { version: 2, tasks: SEED_TASKS, ui: DEFAULT_UI })
    })
  }, [])

  return initial ? <Tracker initial={initial} /> : null
}

export default App
