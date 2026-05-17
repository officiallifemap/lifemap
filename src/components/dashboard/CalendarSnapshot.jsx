import { useState } from 'react'
import useStore from '../../store/useStore'

const rowHover = { cursor: 'pointer', borderRadius: 6, transition: 'background .1s' }

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const pad = (n) => String(n).padStart(2, '0')

function getWeekStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay()) // back to Sunday
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fmtDayLabel(ds) {
  return new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function CalendarSnapshot({ onSelectDay, onEventClick }) {
  const events         = useStore((s) => s.events)
  const todos          = useStore((s) => s.todos)
  const expenses       = useStore((s) => s.expenses)
  const people         = useStore((s) => s.people)
  const appointments   = useStore((s) => s.appointments)
  const setPage        = useStore((s) => s.setPage)
  const setFocusItem   = useStore((s) => s.setFocusItem)

  const today      = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr   = toDateStr(today)
  const weekStart  = getWeekStart(today)

  // 14 days: this week's Sunday → next week's Saturday
  const days = Array.from({ length: 14 }, (_, i) => {
    const d   = addDays(weekStart, i)
    const key = toDateStr(d)
    return { d, key, dayName: DAY_NAMES[d.getDay()], dayNum: d.getDate() }
  })

  const [selectedDay, setSelectedDay] = useState(todayStr)

  const eventDays   = new Set(events.filter((e) => !e.completed).map((e) => e.date.slice(0, 10)))
  const todoDays    = new Set(todos.filter((t) => !t.done && t.due).map((t) => t.due.slice(0, 10)))
  const expenseDays = new Set(expenses.map((e) => e.date.slice(0, 10)))
  const apptDays    = new Set(appointments.filter((a) => !a.completed).map((a) => a.date.slice(0, 10)))
  // Birthday/anniversary: recurring — match by MM-DD across all years
  const peopleDays  = new Set(days.filter(({ key }) => {
    const mmdd = key.slice(5)
    return people.some((p) => p.birthday?.slice(5) === mmdd || p.anniversary?.slice(5) === mmdd)
  }).map(({ key }) => key))

  const handleSelect = (key) => {
    setSelectedDay(key)
    onSelectDay?.(key)
  }

  /* Detail for selected day */
  const dayEvents   = events.filter((e) => !e.completed && e.date.slice(0, 10) === selectedDay)
  const dayTodos    = todos.filter((t) => !t.done && t.due === selectedDay)
  const dayExpenses = expenses.filter((e) => e.date === selectedDay)
  const dayAppts    = appointments.filter((a) => !a.completed && a.date.slice(0, 10) === selectedDay)
  const selectedMD  = selectedDay.slice(5)
  const dayPeople   = people.filter((p) => p.birthday?.slice(5) === selectedMD || p.anniversary?.slice(5) === selectedMD)
  const hasAnything = dayEvents.length > 0 || dayTodos.length > 0 || dayExpenses.length > 0 || dayAppts.length > 0 || dayPeople.length > 0

  // Split into 2 rows of 7
  const week1 = days.slice(0, 7)
  const week2 = days.slice(7, 14)

  return (
    <div>
      {/* Day-name header */}
      <div className="two-week-grid" style={{ marginBottom: 4 }}>
        {DAY_NAMES.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, paddingBottom: 3 }}>{d}</div>
        ))}
      </div>

      {/* Week 1 */}
      <div className="two-week-grid" style={{ marginBottom: 3 }}>
        {week1.map(({ key, dayNum }) => {
          const isToday    = key === todayStr
          const isSelected = key === selectedDay
          const hasEv  = eventDays.has(key)
          const hasTd  = todoDays.has(key)
          const hasExp = expenseDays.has(key)
          const hasPpl = peopleDays.has(key)
          const hasApt = apptDays.has(key)
          return (
            <div
              key={key}
              className={[
                'two-week-cell',
                isToday    ? 'tw-today'    : '',
                isSelected ? 'tw-selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleSelect(key)}
            >
              <span className="tw-day-num">{dayNum}</span>
              <div className="tw-dots">
                {hasEv  && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--navy)' : 'var(--gold)'  }} />}
                {hasTd  && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--navy)' : 'var(--sage2)' }} />}
                {hasExp && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--navy)' : 'var(--coral2)'}} />}
                {hasPpl && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--navy)' : 'var(--sky2)' }} />}
                {hasApt && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--navy)' : 'var(--cream3)'}} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Week 2 */}
      <div className="two-week-grid">
        {week2.map(({ key, dayNum }) => {
          const isToday    = key === todayStr
          const isSelected = key === selectedDay
          const hasEv  = eventDays.has(key)
          const hasTd  = todoDays.has(key)
          const hasExp = expenseDays.has(key)
          const hasPpl = peopleDays.has(key)
          const hasApt = apptDays.has(key)
          return (
            <div
              key={key}
              className={[
                'two-week-cell',
                isToday    ? 'tw-today'    : '',
                isSelected ? 'tw-selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleSelect(key)}
            >
              <span className="tw-day-num">{dayNum}</span>
              <div className="tw-dots">
                {hasEv  && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--navy)' : 'var(--gold)'  }} />}
                {hasTd  && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--navy)' : 'var(--sage2)' }} />}
                {hasExp && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--navy)' : 'var(--coral2)'}} />}
                {hasPpl && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--navy)' : 'var(--sky2)' }} />}
                {hasApt && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--navy)' : 'var(--cream3)'}} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {[['var(--gold)', 'Event'], ['var(--sage2)', 'To-Do'], ['var(--coral2)', 'Expense'], ['var(--sky2)', 'Birthday'], ['var(--cream3)', 'Appt']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text2)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />{label}
          </div>
        ))}
      </div>

      {/* Inline day detail */}
      {hasAnything && (
        <div className="tw-inline-detail">
          <div className="tw-inline-detail-title">{fmtDayLabel(selectedDay)}</div>

          {dayEvents.map((e) => (
            <div
              key={e.id}
              className="tw-detail-row"
              style={rowHover}
              title="View event details"
              onClick={() => onEventClick ? onEventClick(e.id) : (setFocusItem({ type: 'event', id: e.id }), setPage('events'))}
              onMouseEnter={(ev) => ev.currentTarget.style.background = 'rgba(255,255,255,.05)'}
              onMouseLeave={(ev) => ev.currentTarget.style.background = ''}
            >
              <span style={{ fontSize: 10, color: 'var(--gold)' }}>●</span>
              <span>{e.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>details →</span>
            </div>
          ))}

          {dayTodos.map((t) => (
            <div
              key={t.id}
              className="tw-detail-row"
              style={rowHover}
              title="Open task"
              onClick={() => { setFocusItem({ type: 'todo', id: t.id }); setPage('todos') }}
              onMouseEnter={(ev) => ev.currentTarget.style.background = 'rgba(255,255,255,.05)'}
              onMouseLeave={(ev) => ev.currentTarget.style.background = ''}
            >
              <span style={{ fontSize: 10, color: 'var(--sage2)' }}>●</span>
              <span>{t.text}</span>
              <span className={`priority-pill ${t.priority}`} style={{ marginLeft: 'auto' }}>
                {t.priority === 'high' ? 'High' : t.priority === 'med' ? 'Med' : 'Low'}
              </span>
            </div>
          ))}

          {dayExpenses.map((e) => (
            <div key={e.id} className="tw-detail-row">
              <span style={{ fontSize: 10, color: 'var(--coral2)' }}>●</span>
              <span>{e.note || 'Expense'}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--coral2)', fontFamily: 'var(--font-mono)' }}>-${e.amt}</span>
            </div>
          ))}

          {dayAppts.map((a) => (
            <div key={a.id} className="tw-detail-row">
              <span style={{ fontSize: 10, color: 'var(--cream3)' }}>●</span>
              <span>{a.title}</span>
              {a.time && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>{a.time}</span>}
            </div>
          ))}

          {dayPeople.map((p) => {
            const isBday = p.birthday?.slice(5) === selectedMD
            const isAnn  = p.anniversary?.slice(5) === selectedMD
            return (
              <div key={p.id + (isBday ? 'b' : 'a')} className="tw-detail-row">
                <span style={{ fontSize: 10, color: 'var(--sky2)' }}>●</span>
                <span>{p.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--sky2)' }}>{isBday ? '🎂 Birthday' : '💍 Anniversary'}</span>
              </div>
            )
          })}
        </div>
      )}

      {!hasAnything && selectedDay && (
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center' }}>
          Nothing on {fmtDayLabel(selectedDay)}.
        </div>
      )}
    </div>
  )
}
