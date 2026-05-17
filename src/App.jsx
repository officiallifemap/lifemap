import { useEffect } from 'react'
import AuthGate from './components/auth/AuthGate'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './components/dashboard/Dashboard'
import Finances from './components/finances/Finances'
import Events from './components/events/Events'
import Goals from './components/goals/Goals'
import Calendar from './components/calendar/Calendar'
import Todos from './components/todos/Todos'
import Habits from './components/habits/Habits'
import People from './components/people/People'
import Wellness from './components/wellness/Wellness'
import Notes from './components/notes/Notes'
import QuickAddModal from './components/modals/QuickAddModal'
import EventModal from './components/modals/EventModal'
import TodoModal from './components/modals/TodoModal'
import GoalModal from './components/modals/GoalModal'
import IncomeModal from './components/finances/IncomeModal'
import BudgetModal from './components/finances/BudgetModal'
import ContributionModal from './components/modals/ContributionModal'
import useStore from './store/useStore'

const sections = {
  dashboard: Dashboard,
  finances:  Finances,
  events:    Events,
  goals:     Goals,
  calendar:  Calendar,
  todos:     Todos,
  habits:    Habits,
  people:    People,
  wellness:  Wellness,
  notes:     Notes,
}

export default function App() {
  const currentPage = useStore((s) => s.currentPage)
  const darkMode    = useStore((s) => s.darkMode)
  const Section     = sections[currentPage] ?? Dashboard

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !darkMode)
  }, [darkMode])

  return (
    <AuthGate>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Topbar />
          <div className="content">
            <Section />
          </div>
        </main>

        {/* Modals */}
        <QuickAddModal />
        <EventModal />
        <TodoModal />
        <GoalModal />
        <IncomeModal />
        <BudgetModal />
        <ContributionModal />
      </div>
    </AuthGate>
  )
}
