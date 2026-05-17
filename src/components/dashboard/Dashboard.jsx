import { useState } from 'react'
import CalendarSnapshot from './CalendarSnapshot'
import ProgressBar from '../ui/ProgressBar'
import EventDetailModal from '../events/EventDetailModal'
import FirstSteps from './FirstSteps'
import useStore from '../../store/useStore'

const today    = new Date()
const todayStr = today.toISOString().split('T')[0]

const GOAL_COLOR_MAP = {
  'gc-gold':  ['gold',  'var(--gold)'],
  'gc-sage':  ['green', 'var(--sage2)'],
  'gc-sky':   ['sky',   'var(--sky2)'],
  'gc-coral': ['coral', 'var(--coral2)'],
}
const COLOR_TEXT = { 'gc-sage': 'var(--sage2)', 'gc-sky': 'var(--sky2)', 'gc-gold': 'var(--gold)', 'gc-coral': 'var(--coral2)' }

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtNoteDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
}
function isUpcoming7(due) {
  if (!due) return false
  const diff = (new Date(due) - today) / (1000 * 60 * 60 * 24)
  return diff > 0 && diff <= 7
}

const ALL_SECTIONS = [
  { id: 'calendar',  label: 'Two-Week Calendar' },
  { id: 'quicknote', label: 'Quick Note' },
  { id: 'briefing',  label: "Today's Briefing" },
  { id: 'goals',     label: 'Goal Progress' },
  { id: 'tasks',     label: 'Tasks' },
]

function CompactTaskRow({ t, toggleTodo, isToday, isPinned, onTogglePin }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <div
        className={`todo-check${t.done ? ' done' : ''}`}
        style={{ cursor: 'pointer', flexShrink: 0, width: 17, height: 17, fontSize: 10, borderRadius: 4 }}
        onClick={() => toggleTodo(t.id)}
      >{t.done ? '✓' : ''}</div>
      <div className={`priority-dot p-${t.priority}`} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className={`todo-text${t.done ? ' done' : ''}`} style={{ fontSize: 14, margin: 0 }}>{t.text}</span>
        {!t.due && <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 6, fontStyle: 'italic' }}>no date</span>}
      </div>
      {t.due && (
        <span style={{ fontSize: 12, color: isToday ? 'var(--gold)' : 'var(--text3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          {isToday ? 'Today' : fmtDate(t.due)}
        </span>
      )}
      <button
        title={isPinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
        onClick={(e) => { e.stopPropagation(); onTogglePin(t.id) }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
          fontSize: 12, opacity: isPinned ? 1 : 0.3, flexShrink: 0,
          transition: 'opacity .15s',
        }}
        onMouseEnter={(e) => { if (!isPinned) e.currentTarget.style.opacity = 0.7 }}
        onMouseLeave={(e) => { if (!isPinned) e.currentTarget.style.opacity = 0.3 }}
      >📌</button>
    </div>
  )
}

export default function Dashboard() {
  const todos                  = useStore((s) => s.todos)
  const goals                  = useStore((s) => s.goals)
  const events                 = useStore((s) => s.events)
  const expenses               = useStore((s) => s.expenses)
  const incomeMode             = useStore((s) => s.incomeMode)
  const fixedIncome            = useStore((s) => s.fixedIncome)
  const incomeEntries          = useStore((s) => s.incomeEntries)
  const totalBudget            = useStore((s) => s.totalBudget)
  const habits                 = useStore((s) => s.habits)
  const medications            = useStore((s) => s.medications)
  const appointments           = useStore((s) => s.appointments)
  const people                 = useStore((s) => s.people)
  const notes                  = useStore((s) => s.notes)
  const addNote                = useStore((s) => s.addNote)
  const setPage                = useStore((s) => s.setPage)
  const setFocusItem           = useStore((s) => s.setFocusItem)
  const updateGoal             = useStore((s) => s.updateGoal)
  const setFinancesTab         = useStore((s) => s.setFinancesTab)
  const toggleTodo             = useStore((s) => s.toggleTodo)
  const toggleGoalPin          = useStore((s) => s.toggleGoalPin)
  const checkInHabit           = useStore((s) => s.checkInHabit)
  const checkInMedication      = useStore((s) => s.checkInMedication)
  const dashboardLayout        = useStore((s) => s.dashboardLayout) || [
    { id: 'calendar',  col: 'left'  }, { id: 'quicknote', col: 'left'  },
    { id: 'briefing',  col: 'right' }, { id: 'goals',     col: 'right' }, { id: 'tasks', col: 'right' },
  ]
  const dashboardHidden        = useStore((s) => s.dashboardHidden)      || []
  const dashboardStatOrder     = useStore((s) => s.dashboardStatOrder)   || ['upcoming-events','active-goals','habits-today','budget-used']
  const dashboardPinnedTodos   = useStore((s) => s.dashboardPinnedTodos) || []
  const setDashboardLayout     = useStore((s) => s.setDashboardLayout)
  const setDashboardStatOrder  = useStore((s) => s.setDashboardStatOrder)
  const toggleDashboardHidden  = useStore((s) => s.toggleDashboardHidden)
  const toggleDashboardPinTodo = useStore((s) => s.toggleDashboardPinTodo)

  const [quickNote,      setQuickNote]      = useState('')
  const [showCustomize,  setShowCustomize]  = useState(false)
  const [dashDragId,     setDashDragId]     = useState(null)
  const [dashDragOverId, setDashDragOverId] = useState(null)
  const [dashEventId,    setDashEventId]    = useState(null)
  // Stat card drag
  const [statDragId,     setStatDragId]     = useState(null)
  const [statDragOverId, setStatDragOverId] = useState(null)

  const dashEvent = events.find((e) => e.id === dashEventId) ?? null

  /* ── Finance stats ── */
  const thisMonth     = todayStr.slice(0, 7)
  const monthlyIncome = incomeMode === 'fixed'
    ? fixedIncome
    : incomeEntries.filter((e) => e.date?.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0)
  const monthExpenses = expenses.filter((e) => e.date?.startsWith(thisMonth))
  const totalSpent    = monthExpenses.reduce((s, e) => s + e.amt, 0)
  const budgetUsedPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const budgetColor   = budgetUsedPct > 90 ? 'coral' : budgetUsedPct > 70 ? 'gold' : 'green'

  const upcomingEvents = events
    .filter((e) => !e.completed && new Date(e.date) > today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 2)

  const pinnedGoals = goals.filter((g) => g.pinned)

  const PRIORITY_ORDER = { high: 0, med: 1, low: 2 }

  /* ── Task list: pinned → due today → upcoming 7d → undated (if empty) ── */
  const pinnedTasks   = todos.filter((t) => !t.done && dashboardPinnedTodos.includes(t.id))
  const pinnedSet     = new Set(pinnedTasks.map((t) => t.id))
  const dueTodayTasks = todos
    .filter((t) => !t.done && t.due === todayStr && !pinnedSet.has(t.id))
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1))
  const upcomingTasks = todos
    .filter((t) => !t.done && isUpcoming7(t.due) && !pinnedSet.has(t.id))
    .sort((a, b) => a.due.localeCompare(b.due))
  const combined      = [...pinnedTasks, ...dueTodayTasks, ...upcomingTasks]
  const undatedTasks  = todos
    .filter((t) => !t.done && !t.due && !pinnedSet.has(t.id))
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1))
  const taskList = combined.length > 0 ? combined.slice(0, 8) : undatedTasks.slice(0, 6)

  /* ── Briefing ── */
  const activeHabits    = habits.filter((h) => !h.archived)
  const habitsDoneToday = activeHabits.filter((h) => h.history.includes(todayStr)).length
  const medsDueToday    = medications.filter((m) => m.frequency === 'daily' && !m.checkins.includes(todayStr))
  const scheduledMeds   = medications.filter((m) => m.frequency !== 'as-needed')
  const upcomingAppts   = appointments
    .filter((a) => !a.completed && a.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)
  const days30 = Array.from({ length: 30 }, (_, n) => {
    const d = new Date(today); d.setDate(today.getDate() + n)
    return { md: `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, n }
  })
  const upcomingBdays = people.map((p) => {
    const bdMatch  = days30.find((x) => p.birthday?.slice(5)    === x.md)
    const annMatch = days30.find((x) => p.anniversary?.slice(5) === x.md)
    const match    = bdMatch ?? annMatch
    if (!match) return null
    return { ...p, daysAway: match.n, celebType: bdMatch ? 'birthday' : 'anniversary' }
  }).filter(Boolean).sort((a, b) => a.daysAway - b.daysAway)
  const showBriefing = activeHabits.length > 0 || scheduledMeds.length > 0 || upcomingAppts.length > 0 || upcomingBdays.length > 0

  /* ── Dashboard section drag-to-reorder (cross-column) ── */
  const handleDashDrop = (targetId) => {
    if (!dashDragId || dashDragId === targetId) {
      setDashDragId(null); setDashDragOverId(null); return
    }
    const targetItem = dashboardLayout.find((s) => s.id === targetId)
    if (!targetItem) { setDashDragId(null); setDashDragOverId(null); return }
    const without = dashboardLayout.filter((s) => s.id !== dashDragId)
    const toIdx   = without.findIndex((s) => s.id === targetId)
    const next    = [...without]
    next.splice(toIdx, 0, { id: dashDragId, col: targetItem.col })
    setDashboardLayout(next)
    setDashDragId(null); setDashDragOverId(null)
  }

  const handleDashDropEnd = (col) => {
    if (!dashDragId) { setDashDragId(null); setDashDragOverId(null); return }
    const without = dashboardLayout.filter((s) => s.id !== dashDragId)
    setDashboardLayout([...without, { id: dashDragId, col }])
    setDashDragId(null); setDashDragOverId(null)
  }

  /* ── Stat card drag-to-reorder ── */
  const handleStatDrop = (targetId) => {
    if (!statDragId || statDragId === targetId) {
      setStatDragId(null); setStatDragOverId(null); return
    }
    const next = [...dashboardStatOrder]
    const from = next.indexOf(statDragId)
    const to   = next.indexOf(targetId)
    next.splice(from, 1)
    next.splice(to, 0, statDragId)
    setDashboardStatOrder(next)
    setStatDragId(null); setStatDragOverId(null)
  }

  const makeDragHandle = (id) => (
    <span
      className="drag-handle"
      style={{ fontSize: 14, opacity: 0.4, lineHeight: 1, marginRight: 4, flexShrink: 0 }}
      draggable
      onDragStart={(e) => { e.stopPropagation(); setDashDragId(id) }}
      onDragEnd={() => { setDashDragId(null); setDashDragOverId(null) }}
      onClick={(e) => e.stopPropagation()}
      title="Drag to reorder"
    >≡</span>
  )

  const wrapSection = (id, children) => (
    <div
      key={id}
      onDragOver={(e) => { e.preventDefault(); setDashDragOverId(id) }}
      onDragLeave={() => setDashDragOverId(null)}
      onDrop={() => handleDashDrop(id)}
      style={{
        borderRadius: 14,
        outline: dashDragOverId === id ? '2px solid var(--gold)' : 'none',
        outlineOffset: 2,
        opacity: dashDragId === id ? 0.4 : 1,
        transition: 'opacity .15s',
      }}
    >
      {children}
    </div>
  )

  /* ── Stat card renderers ── */
  const statCardDefs = {
    'budget-used': () => (
      <div className="card-accent card-accent-sm" onClick={() => { setPage('finances'); setFinancesTab('expenses') }}>
        <div className="stat-label">Budget Used</div>
        <div className="stat-value stat-value-sm">{budgetUsedPct}<span style={{ fontSize: 14, color: 'var(--text2)' }}>%</span></div>
        <ProgressBar pct={budgetUsedPct} color={budgetColor} />
        <div className="stat-sub">${totalSpent.toLocaleString()} of ${totalBudget.toLocaleString()}</div>
      </div>
    ),
    'upcoming-events': () => (
      <div className="card-accent card-accent-sm" onClick={() => setPage('events')}>
        <div className="stat-label">Upcoming Events</div>
        {upcomingEvents.length === 0
          ? <div className="stat-sub" style={{ paddingTop: 4 }}>No upcoming events</div>
          : upcomingEvents.map((e) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="upcoming-event-name" style={{ fontSize: 13 }}>{e.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: 6 }}>{daysUntil(e.date)}d</div>
            </div>
          ))
        }
      </div>
    ),
    'active-goals': () => (
      <div className="card-accent card-accent-sm" onClick={() => setPage('goals')}>
        <div className="stat-label">Active Goals</div>
        <div className="stat-value stat-value-sm">{goals.length}</div>
        <div className="stat-sub">{pinnedGoals.length} pinned</div>
      </div>
    ),
    'habits-today': () => (
      <div className="card-accent card-accent-sm" onClick={() => setPage('habits')}>
        <div className="stat-label">Habits Today</div>
        <div className="stat-value stat-value-sm" style={{ color: habitsDoneToday === activeHabits.length && activeHabits.length > 0 ? 'var(--sage2)' : undefined }}>
          {activeHabits.length === 0 ? '—' : `${habitsDoneToday}/${activeHabits.length}`}
        </div>
        <div className="stat-sub">{habitsDoneToday === activeHabits.length && activeHabits.length > 0 ? 'All done ✓' : `${activeHabits.length - habitsDoneToday} remaining`}</div>
      </div>
    ),
  }

  /* ── Section renderers ── */
  const renderCalendar = () => wrapSection('calendar',
    <div className="card-lg card-compact">
      <div className="section-title-row" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {makeDragHandle('calendar')}
          <div className="section-title-sm">This Week</div>
        </div>
        <span className="btn btn-sm" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => setPage('calendar')}>Full Calendar →</span>
      </div>
      <CalendarSnapshot onEventClick={(id) => setDashEventId(id)} />
    </div>
  )

  const renderQuicknote = () => wrapSection('quicknote',
    <div className="card-lg card-compact">
      <div className="section-title-row" style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {makeDragHandle('quicknote')}
          <div className="section-title-sm">Quick Note</div>
        </div>
        <span className="btn btn-sm" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => setPage('notes')}>All →</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          className="input"
          style={{ flex: 1, fontSize: 13, padding: '6px 10px' }}
          placeholder="Capture a thought…"
          value={quickNote}
          onChange={(e) => setQuickNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && quickNote.trim()) { addNote({ body: quickNote.trim() }); setQuickNote('') }
          }}
        />
        <button
          className="btn btn-primary btn-sm"
          disabled={!quickNote.trim()}
          style={{ fontSize: 12, padding: '6px 12px' }}
          onClick={() => { if (quickNote.trim()) { addNote({ body: quickNote.trim() }); setQuickNote('') } }}
        >Save</button>
      </div>
      {notes.slice(0, 3).map((n) => (
        <div key={n.id} className="quick-note-row" onClick={() => { setFocusItem({ type: 'note', id: n.id }); setPage('notes') }} style={{ paddingTop: 7, paddingBottom: 7 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 14, color: 'var(--cream)', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {n.title || n.body?.split('\n')[0]?.slice(0, 50) || 'Note'}
            </span>
            {n.title && n.body && (
              <span style={{ fontSize: 13, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {n.body.split('\n')[0]?.slice(0, 60)}
              </span>
            )}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: 8, whiteSpace: 'nowrap' }}>
            {fmtNoteDate(n.date)}
          </span>
        </div>
      ))}
    </div>
  )

  const renderBriefing = () => wrapSection('briefing',
    showBriefing ? (
      <div className="card-lg card-compact">
        <div className="section-title-row" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {makeDragHandle('briefing')}
            <div className="section-title-sm">Today's Briefing</div>
          </div>
        </div>

        {activeHabits.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              <span>Habits</span>
              <span style={{ color: habitsDoneToday === activeHabits.length ? 'var(--sage2)' : undefined }}>{habitsDoneToday}/{activeHabits.length}</span>
            </div>
            {activeHabits.slice(0, 5).map((h) => {
              const done = h.history.includes(todayStr)
              const c    = COLOR_TEXT[h.color] || 'var(--gold)'
              return (
                <div key={h.id} className="briefing-checkin-row-sm">
                  <span style={{ flex: 1, fontSize: 14, color: done ? 'var(--text3)' : 'var(--text1)', textDecoration: done ? 'line-through' : 'none' }}>{h.name}</span>
                  <button
                    className={`briefing-check-btn${done ? ' done' : ''}`}
                    style={{ borderColor: done ? c : undefined, color: done ? c : undefined, fontSize: 12, padding: '3px 10px' }}
                    onClick={() => checkInHabit(h.id)}
                  >{done ? '✓' : 'Done'}</button>
                </div>
              )
            })}
            {activeHabits.length > 5 && (
              <div style={{ fontSize: 13, color: 'var(--text3)', paddingTop: 4, cursor: 'pointer' }} onClick={() => setPage('habits')}>
                +{activeHabits.length - 5} more →
              </div>
            )}
          </div>
        )}

        {scheduledMeds.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              <span>Medications</span>
              <span style={{ color: medsDueToday.length === 0 ? 'var(--sage2)' : 'var(--gold)' }}>
                {medsDueToday.length === 0 ? 'All taken ✓' : `${medsDueToday.length} left`}
              </span>
            </div>
            {scheduledMeds.slice(0, 4).map((m) => {
              const done = m.checkins.includes(todayStr)
              return (
                <div key={m.id} className="briefing-checkin-row-sm">
                  <span style={{ flex: 1, fontSize: 14, color: done ? 'var(--text3)' : 'var(--text1)', textDecoration: done ? 'line-through' : 'none' }}>
                    {m.name}{m.dose && <span style={{ color: 'var(--text3)', marginLeft: 5, fontWeight: 400 }}>{m.dose}</span>}
                  </span>
                  <button
                    className={`briefing-check-btn${done ? ' done' : ''}`}
                    style={{ borderColor: done ? 'var(--sage2)' : undefined, color: done ? 'var(--sage2)' : undefined, fontSize: 12, padding: '3px 10px' }}
                    onClick={() => checkInMedication(m.id)}
                  >{done ? '✓' : 'Taken'}</button>
                </div>
              )
            })}
          </div>
        )}

        {(upcomingAppts.length > 0 || upcomingBdays.length > 0) && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {upcomingAppts.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="briefing-type-pill appt">Appt</span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                <span style={{ fontSize: 13, color: a.date === todayStr ? 'var(--gold)' : 'var(--text2)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                  {a.date === todayStr ? 'Today' : fmtDate(a.date)}
                </span>
              </div>
            ))}
            {upcomingBdays.slice(0, 4).map((p) => {
              const dateStr = p.celebType === 'birthday' ? p.birthday : p.anniversary
              const dateDisplay = p.daysAway === 0 ? 'Today!' : p.daysAway === 1 ? 'Tomorrow' : fmtDate(dateStr)
              return (
                <div key={p.id + p.celebType} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`briefing-type-pill ${p.celebType === 'birthday' ? 'bday' : 'anniv'}`}>
                    {p.celebType === 'birthday' ? 'Birthday' : 'Anniv'}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <span style={{ fontSize: 13, color: p.daysAway === 0 ? 'var(--gold)' : 'var(--text2)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                    {dateDisplay}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    ) : (
      <div className="card-lg card-compact">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
          {makeDragHandle('briefing')}
          <div className="section-title-sm">Today's Briefing</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>Add habits or medications to see daily check-ins here.</div>
      </div>
    )
  )

  const renderGoals = () => wrapSection('goals',
    <div className="card-lg card-compact">
      <div className="section-title-row" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {makeDragHandle('goals')}
          <div className="section-title-sm">Goal Progress</div>
        </div>
        <span className="btn btn-sm" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => setPage('goals')}>All →</span>
      </div>
      {pinnedGoals.length === 0
        ? <div className="pin-empty" style={{ fontSize: 12, padding: '4px 0' }}>Pin a goal with 📌 to track it here.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pinnedGoals.map((g) => {
              const pct = Math.round((g.saved / g.target) * 100)
              const [fillClass, textColor] = GOAL_COLOR_MAP[g.color] ?? ['gold', 'var(--gold)']
              return (
                <div
                  key={g.id}
                  style={{ cursor: 'pointer', borderRadius: 8, padding: '4px 6px', margin: '0 -6px', transition: 'background .1s' }}
                  onClick={() => { updateGoal(g.id, { collapsed: false }); setFocusItem({ type: 'goal', id: g.id }); setPage('goals') }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                >
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 15, color: 'var(--text1)', fontWeight: 500 }}>{g.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, color: textColor, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{pct}%</span>
                      <button className="pin-btn pinned" style={{ fontSize: 11, opacity: .5 }} onClick={(e) => { e.stopPropagation(); toggleGoalPin(g.id) }}>📌</button>
                    </div>
                  </div>
                  <ProgressBar pct={pct} color={fillClass} />
                  <div className="flex-between" style={{ marginTop: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>${g.saved.toLocaleString()}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>${g.target.toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )

  const renderTasks = () => wrapSection('tasks',
    <div className="card-lg card-compact">
      <div className="section-title-row" style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {makeDragHandle('tasks')}
          <div className="section-title-sm">Tasks</div>
        </div>
        <span className="btn btn-sm" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => setPage('todos')}>All →</span>
      </div>
      {taskList.length === 0
        ? <div style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic', padding: '4px 0' }}>All caught up!</div>
        : taskList.map((t) => (
          <CompactTaskRow
            key={t.id}
            t={t}
            toggleTodo={toggleTodo}
            isToday={t.due === todayStr}
            isPinned={dashboardPinnedTodos.includes(t.id)}
            onTogglePin={toggleDashboardPinTodo}
          />
        ))
      }
      {combined.length === 0 && undatedTasks.length === 0 && todos.filter((t) => !t.done).length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, fontStyle: 'italic' }}>
          No tasks due soon. Pin tasks to always show them here.
        </div>
      )}
    </div>
  )

  const SECTION_RENDERERS = { calendar: renderCalendar, quicknote: renderQuicknote, briefing: renderBriefing, goals: renderGoals, tasks: renderTasks }

  const visibleLeft  = dashboardLayout.filter((s) => s.col === 'left'  && !dashboardHidden.includes(s.id)).map((s) => s.id)
  const visibleRight = dashboardLayout.filter((s) => s.col === 'right' && !dashboardHidden.includes(s.id)).map((s) => s.id)

  return (
    <>
      <FirstSteps />

      {/* ── Row 1: 4 stat cards + customize button ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, position: 'relative' }}>
        <button
          className="btn btn-sm"
          style={{ fontSize: 12 }}
          onClick={() => setShowCustomize((v) => !v)}
        >
          ⚙ Customize
        </button>
        {showCustomize && (
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
              background: 'var(--navy3)', border: '1px solid var(--border2)', borderRadius: 12,
              padding: '14px 18px', width: 230, boxShadow: '0 8px 32px rgba(0,0,0,.45)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Visible Sections
            </div>
            {ALL_SECTIONS.map(({ id, label }) => (
              <label
                key={id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', cursor: 'pointer', fontSize: 14, color: 'var(--text1)' }}
              >
                <input
                  type="checkbox"
                  checked={!dashboardHidden.includes(id)}
                  onChange={() => toggleDashboardHidden(id)}
                  style={{ accentColor: 'var(--gold)', width: 15, height: 15, cursor: 'pointer' }}
                />
                {label}
              </label>
            ))}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)' }}>
              Use ≡ handles to reorder sections · Drag stat cards to reorder
            </div>
          </div>
        )}
      </div>

      {/* ── Stat cards (drag-to-reorder) ── */}
      <div className="grid-4" style={{ marginBottom: 14 }}>
        {dashboardStatOrder.map((id) => (
          <div
            key={id}
            draggable
            onDragStart={(e) => { e.stopPropagation(); setStatDragId(id) }}
            onDragEnd={() => { setStatDragId(null); setStatDragOverId(null) }}
            onDragOver={(e) => { e.preventDefault(); setStatDragOverId(id) }}
            onDragLeave={() => setStatDragOverId(null)}
            onDrop={(e) => { e.stopPropagation(); handleStatDrop(id) }}
            style={{
              opacity: statDragId === id ? 0.4 : 1,
              outline: statDragOverId === id ? '2px solid var(--gold)' : 'none',
              outlineOffset: 2,
              borderRadius: 12,
              cursor: 'grab',
              transition: 'opacity .15s',
            }}
            title="Drag to reorder"
          >
            {statCardDefs[id]?.()}
          </div>
        ))}
      </div>

      {/* ── Row 2: Left + Right columns ── */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {visibleLeft.map((id) => SECTION_RENDERERS[id]?.())}
          {/* Drop zone at end of left column */}
          <div
            className={`dash-col-dropzone${dashDragOverId === 'end-left' ? ' active' : ''}`}
            style={{ display: dashDragId ? 'block' : 'none' }}
            onDragOver={(e) => { e.preventDefault(); setDashDragOverId('end-left') }}
            onDragLeave={() => setDashDragOverId(null)}
            onDrop={() => handleDashDropEnd('left')}
          >
            Move here
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {visibleRight.map((id) => SECTION_RENDERERS[id]?.())}
          {/* Drop zone at end of right column */}
          <div
            className={`dash-col-dropzone${dashDragOverId === 'end-right' ? ' active' : ''}`}
            style={{ display: dashDragId ? 'block' : 'none' }}
            onDragOver={(e) => { e.preventDefault(); setDashDragOverId('end-right') }}
            onDragLeave={() => setDashDragOverId(null)}
            onDrop={() => handleDashDropEnd('right')}
          >
            Move here
          </div>
        </div>
      </div>

      {/* Inline event detail modal — opens without leaving dashboard */}
      {dashEvent && (
        <EventDetailModal event={dashEvent} onClose={() => setDashEventId(null)} />
      )}
    </>
  )
}
