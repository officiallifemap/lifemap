import { useState } from 'react'
import useStore from '../../store/useStore'
import DayPanel from './DayPanel'
import EventDetailModal from '../events/EventDetailModal'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const pad = (n) => String(n).padStart(2, '0')
const ds  = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

const GOAL_COLOR = {
  'gc-gold':  '#d4a84c',
  'gc-sage':  '#72b5a3',
  'gc-sky':   '#70aeda',
  'gc-coral': '#eb8570',
}

const CATEGORIES = [
  { id: 'events',       label: 'Events',       color: '#d4a84c' },
  { id: 'todos',        label: 'To-Dos',       color: '#72b5a3' },
  { id: 'appointments', label: 'Appts',        color: '#c2baa8' },
  { id: 'birthdays',    label: 'Birthdays',    color: '#70aeda' },
  { id: 'goals',        label: 'Goal Dates',   color: '#eecb6a' },
  { id: 'payday',       label: 'Payday',       color: '#6ab87f' },
  { id: 'recurring',    label: 'Recurring',    color: '#a67fc7' },
  { id: 'expenses',     label: 'Expenses',     color: '#eb8570' },
]

function getRecurringDatesInMonth(anchorDate, freq, year, month) {
  if (!anchorDate) return []
  const anchor      = new Date(anchorDate + 'T12:00:00')
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthStart  = new Date(year, month, 1).getTime()
  const monthEnd    = new Date(year, month, daysInMonth).getTime()

  if (freq === 'monthly') {
    const day = anchor.getDate()
    const clamped = Math.min(day, daysInMonth)
    return [ds(year, month, clamped)]
  }
  if (freq === 'yearly') {
    return anchor.getMonth() === month ? [ds(year, month, anchor.getDate())] : []
  }

  const stepMs = (freq === 'weekly' ? 7 : 14) * 86400000
  let cur = anchor.getTime()
  while (cur - stepMs >= monthStart) cur -= stepMs
  const results = []
  while (cur <= monthEnd) {
    if (cur >= monthStart) {
      const d = new Date(cur)
      results.push(ds(d.getFullYear(), d.getMonth(), d.getDate()))
    }
    cur += stepMs
  }
  return results
}

function getPaydayDatesInMonth(anchorDate, freq, year, month) {
  if (!anchorDate) return []
  if (freq === 'semi-monthly') {
    const anchorDay   = new Date(anchorDate + 'T12:00:00').getDate()
    const day1        = anchorDay <= 15 ? anchorDay : anchorDay - 15
    const day2        = day1 + 15
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const results     = []
    if (day1 >= 1 && day1 <= daysInMonth) results.push(ds(year, month, day1))
    if (day2 >= 1 && day2 <= daysInMonth) results.push(ds(year, month, Math.min(day2, daysInMonth)))
    return results
  }
  return getRecurringDatesInMonth(anchorDate, freq, year, month)
}

function EventStrip({ label, color, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        fontSize: 10, lineHeight: 1.4,
        borderLeft: `2.5px solid ${color}`,
        background: `color-mix(in srgb, ${color} 16%, var(--navy))`,
        color: color,
        borderRadius: '0 3px 3px 0',
        padding: '1.5px 4px',
        marginBottom: 2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontWeight: 600,
        letterSpacing: 0.1,
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'opacity .1s' : undefined,
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.opacity = '0.7' }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.opacity = '1' }}
      title={label}
    >
      {icon && <span style={{ marginRight: 2, fontSize: 9 }}>{icon}</span>}
      {label}
    </div>
  )
}

export default function Calendar() {
  const events           = useStore((s) => s.events)
  const todos            = useStore((s) => s.todos)
  const expenses         = useStore((s) => s.expenses)
  const recurringBills   = useStore((s) => s.recurringBills)  || []
  const people           = useStore((s) => s.people)
  const appointments     = useStore((s) => s.appointments)
  const goals            = useStore((s) => s.goals)
  const paydayAnchorDate = useStore((s) => s.paydayAnchorDate)
  const paydayFrequency  = useStore((s) => s.paydayFrequency)

  const now = new Date()
  const [year,        setYear]        = useState(now.getFullYear())
  const [month,       setMonth]       = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(now.toISOString().split('T')[0])
  const [visibleCats, setVisibleCats] = useState(
    new Set(['events', 'todos', 'appointments', 'birthdays', 'goals', 'payday', 'recurring'])
  )
  const [openEventId, setOpenEventId] = useState(null)

  const todayStr    = now.toISOString().split('T')[0]
  const monthLabel  = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const openEvent = events.find((e) => e.id === openEventId) ?? null

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  const toggleCat = (id) => setVisibleCats((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const monthPrefix = `${year}-${pad(month + 1)}`

  /* ── Build per-day item lists ── */
  const itemsByDay = {}
  const addItem = (dateKey, item) => {
    if (!itemsByDay[dateKey]) itemsByDay[dateKey] = []
    itemsByDay[dateKey].push(item)
  }

  if (visibleCats.has('events')) {
    events
      .filter((e) => e.date?.startsWith(monthPrefix))
      .forEach((e) => addItem(e.date.slice(0, 10), {
        label: e.name, color: '#d4a84c', eventId: e.id,
      }))
  }

  if (visibleCats.has('todos')) {
    todos
      .filter((t) => !t.done && t.due?.startsWith(monthPrefix))
      .forEach((t) => addItem(t.due.slice(0, 10), { label: t.text, color: '#72b5a3' }))
  }

  if (visibleCats.has('appointments')) {
    appointments
      .filter((a) => !a.completed && a.date?.startsWith(monthPrefix))
      .forEach((a) => addItem(a.date.slice(0, 10), { label: a.title, color: '#c2baa8' }))
  }

  if (visibleCats.has('birthdays')) {
    Array.from({ length: daysInMonth }, (_, i) => {
      const dayKey = ds(year, month, i + 1)
      const mmdd   = dayKey.slice(5)
      people.forEach((p) => {
        if (p.birthday?.slice(5)    === mmdd) addItem(dayKey, { label: p.name, color: '#70aeda', icon: '🎂' })
        if (p.anniversary?.slice(5) === mmdd) addItem(dayKey, { label: p.name, color: '#70aeda', icon: '💍' })
      })
    })
  }

  if (visibleCats.has('goals')) {
    goals
      .filter((g) => g.targetDate?.startsWith(monthPrefix))
      .forEach((g) => {
        const c = GOAL_COLOR[g.color] || '#eecb6a'
        addItem(g.targetDate.slice(0, 10), { label: `🎯 ${g.name}`, color: c })
      })
  }

  if (visibleCats.has('payday') && paydayAnchorDate) {
    getPaydayDatesInMonth(paydayAnchorDate, paydayFrequency, year, month)
      .forEach((dateKey) => addItem(dateKey, { label: '💵 Payday', color: '#6ab87f' }))
  }

  if (visibleCats.has('recurring')) {
    expenses
      .filter((e) => e.recurring && e.recurringAnchorDate)
      .forEach((e) => {
        getRecurringDatesInMonth(e.recurringAnchorDate, e.recurringFreq || 'monthly', year, month)
          .forEach((dateKey) => addItem(dateKey, { label: `🔄 ${e.note || e.cat}`, color: '#a67fc7' }))
      })
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    recurringBills.forEach((b) => {
      const day = Math.min(b.dueDay, daysInMonth)
      addItem(ds(year, month, day), { label: `🔄 ${b.name}`, color: '#a67fc7' })
    })
  }

  if (visibleCats.has('expenses')) {
    expenses
      .filter((e) => e.date?.startsWith(monthPrefix))
      .forEach((e) => addItem(e.date.slice(0, 10), { label: e.note || e.cat, color: '#eb8570' }))
  }

  return (
    <>
      <div className="cal-page">
        {/* ── Main calendar grid ── */}
        <div className="cal-main">
          <div className="card-lg">
            {/* Header */}
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>{monthLabel}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm" onClick={prevMonth}>← Prev</button>
                <button className="btn btn-sm" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDay(todayStr) }}>Today</button>
                <button className="btn btn-sm" onClick={nextMonth}>Next →</button>
              </div>
            </div>

            {/* Category filter pills */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => {
                const active = visibleCats.has(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCat(cat.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 20,
                      border: `1.5px solid ${active ? cat.color : 'rgba(255,255,255,0.1)'}`,
                      background: active ? `color-mix(in srgb, ${cat.color} 14%, transparent)` : 'transparent',
                      color: active ? cat.color : 'rgba(255,255,255,0.3)',
                      fontSize: 11, fontWeight: 500, cursor: 'pointer',
                      transition: 'all .15s', letterSpacing: 0.2,
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: active ? cat.color : 'rgba(255,255,255,0.2)',
                      flexShrink: 0, display: 'inline-block', transition: 'background .15s',
                    }} />
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {/* Day-name header */}
            <div className="cal-header">
              {DAY_NAMES.map((d, i) => (
                <div key={d} className="cal-day-name"
                  style={{ color: (i === 0 || i === 6) ? 'rgba(255,255,255,0.28)' : undefined }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="cal-grid-fill">
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`e${i}`} className="cal-cell empty" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d          = i + 1
                const key        = ds(year, month, d)
                const isToday    = key === todayStr
                const isSelected = key === selectedDay
                const colIdx     = (firstDay + i) % 7
                const isWeekend  = colIdx === 0 || colIdx === 6
                const items      = itemsByDay[key] || []
                const visible    = items.slice(0, 3)
                const extra      = items.length - 3

                return (
                  <div
                    key={d}
                    className={[
                      'cal-cell',
                      isToday    ? 'today-cell'   : '',
                      isSelected ? 'cal-selected' : '',
                      isWeekend  ? 'cal-weekend'  : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedDay(key)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: visible.length ? 2 : 0 }}>
                      <span style={{
                        width: 22, height: 22,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%',
                        background: isToday ? '#d4a84c' : 'transparent',
                        color: isToday ? '#0c1220' : isSelected ? '#d4a84c' : isWeekend ? 'rgba(255,255,255,0.35)' : 'var(--text2)',
                        fontSize: 11, fontWeight: isToday ? 700 : 500,
                        flexShrink: 0, lineHeight: 1,
                      }}>{d}</span>
                    </div>

                    {visible.map((item, j) => (
                      <EventStrip
                        key={j}
                        label={item.label}
                        color={item.color}
                        icon={item.icon}
                        onClick={item.eventId ? (e) => { e.stopPropagation(); setOpenEventId(item.eventId) } : null}
                      />
                    ))}
                    {extra > 0 && (
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', paddingLeft: 4, marginTop: 1 }}>
                        +{extra} more
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Day panel ── */}
        <DayPanel selectedDay={selectedDay} onEventClick={(id) => setOpenEventId(id)} />
      </div>

      {/* Event detail modal */}
      {openEvent && (
        <EventDetailModal event={openEvent} onClose={() => setOpenEventId(null)} />
      )}
    </>
  )
}
