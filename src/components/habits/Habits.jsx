import { useState } from 'react'
import useStore from '../../store/useStore'

const COLOR_TEXT = { 'gc-sage': 'var(--sage2)', 'gc-sky': 'var(--sky2)', 'gc-gold': 'var(--gold)', 'gc-coral': 'var(--coral2)' }
const COLOR_BG   = { 'gc-sage': 'rgba(106,171,153,.15)', 'gc-sky': 'rgba(106,163,212,.15)', 'gc-gold': 'rgba(201,168,76,.15)', 'gc-coral': 'rgba(232,125,100,.15)' }

const FREQ_LABEL = { daily: 'Daily', weekly: 'Weekly' }
const COLORS = ['gc-sage', 'gc-sky', 'gc-gold', 'gc-coral']

const pad = (n) => String(n).padStart(2, '0')

/* ── Helpers ── */
function get7DayStrip(history) {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    const ds = d.toISOString().split('T')[0]
    return { date: ds, done: history.includes(ds), isToday: i === 6, letter: 'SMTWTFS'[d.getDay()] }
  })
}

/* Returns the Sunday of the week containing `date` */
function getSunday(date) {
  const d = new Date(date)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

/* Last N weeks as { startDate, endDate, done, isCurrent, label } */
function getWeekStrip(history, n = 8) {
  const hSet   = new Set(history)
  const today  = new Date()
  today.setHours(12, 0, 0, 0)
  const sunday = getSunday(today)

  return Array.from({ length: n }, (_, i) => {
    const weekSun = new Date(sunday)
    weekSun.setDate(sunday.getDate() - (n - 1 - i) * 7)
    const days = Array.from({ length: 7 }, (_, d) => {
      const day = new Date(weekSun)
      day.setDate(weekSun.getDate() + d)
      return day.toISOString().split('T')[0]
    })
    const done = days.some((ds) => hSet.has(ds))
    const isCurrent = i === n - 1
    const mo  = weekSun.toLocaleDateString('en-US', { month: 'short' })
    const day = weekSun.getDate()
    return { days, done, isCurrent, label: `${mo} ${day}`, startDate: days[0] }
  })
}

function getMonthStrip(history, year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]
  return Array.from({ length: daysInMonth }, (_, i) => {
    const ds = `${year}-${pad(month + 1)}-${pad(i + 1)}`
    return { date: ds, done: history.includes(ds), isToday: ds === today, isFuture: ds > today, dayNum: i + 1, dow: new Date(ds + 'T12:00:00').getDay() }
  })
}

function getYearMonths(history, year) {
  const today = new Date()
  return Array.from({ length: 12 }, (_, m) => {
    const daysInMonth = new Date(year, m + 1, 0).getDate()
    let done = 0, total = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${pad(m + 1)}-${pad(d)}`
      if (ds <= today.toISOString().split('T')[0]) { total++; if (history.includes(ds)) done++ }
    }
    return { month: m, done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  })
}

function calcStreak(history, frequency) {
  if (!history?.length) return 0
  const hSet = new Set(history)
  const today = new Date().toISOString().split('T')[0]
  const prev = (ds) => {
    const d = new Date(ds + 'T12:00:00'); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]
  }
  if (frequency === 'daily') {
    const yest = prev(today)
    let start = hSet.has(today) ? today : hSet.has(yest) ? yest : null
    if (!start) return 0
    let streak = 0, cur = start
    while (hSet.has(cur)) { streak++; cur = prev(cur) }
    return streak
  }
  const weeks = new Set(history.map((d) => {
    const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() - dt.getDay()); return dt.toISOString().split('T')[0]
  }))
  return weeks.size
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/* ── Habit form (inline) ── */
function HabitForm({ initial = {}, onSave, onCancel }) {
  const [name,  setName]  = useState(initial.name  || '')
  const [freq,  setFreq]  = useState(initial.frequency || 'daily')
  const [color, setColor] = useState(initial.color || 'gc-sage')
  const valid = name.trim()
  return (
    <div className="habit-form-card">
      <div className="form-row" style={{ marginBottom: 10 }}>
        <label className="label">Habit name</label>
        <input className="input" autoFocus placeholder="e.g. Morning run, Read 20 min…"
          value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && valid && onSave({ name: name.trim(), frequency: freq, color })} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label className="label">Frequency</label>
          <select className="select" value={freq} onChange={(e) => setFreq(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div>
          <label className="label">Color</label>
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            {COLORS.map((c) => (
              <button key={c} style={{ width: 22, height: 22, borderRadius: '50%', border: color === c ? '2px solid var(--cream)' : '2px solid transparent', background: COLOR_TEXT[c], cursor: 'pointer', padding: 0 }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={!valid} onClick={() => onSave({ name: name.trim(), frequency: freq, color })}>
          {initial.id ? 'Save' : 'Add Habit'}
        </button>
      </div>
    </div>
  )
}

/* ── Week strip view (for weekly habits) ── */
function WeekStrip({ history, color }) {
  const textColor = COLOR_TEXT[color] || 'var(--gold)'
  const weeks = getWeekStrip(history, 8)
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 10, marginBottom: 4 }}>
      {weeks.map(({ done, isCurrent, label, startDate }) => (
        <div key={startDate} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={label}>
          <div style={{
            width: '100%', aspectRatio: '1', borderRadius: 6,
            background: done ? textColor : 'transparent',
            border: `1.5px solid ${isCurrent ? textColor : done ? 'transparent' : 'var(--border2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: done ? 'var(--navy)' : 'var(--text3)', fontWeight: done ? 700 : 400,
            transition: 'background .12s',
          }}>
            {done ? '✓' : ''}
          </div>
          <div style={{ fontSize: 9, color: isCurrent ? textColor : 'var(--text3)', textAlign: 'center', lineHeight: 1 }}>
            {isCurrent ? 'now' : label.split(' ')[1]}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Month view ── */
function MonthView({ history, color, year, month, onToggleDate }) {
  const days = getMonthStrip(history, year, month)
  const firstDow = days[0]?.dow ?? 0
  const textColor = COLOR_TEXT[color] || 'var(--gold)'
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
        {days.map(({ date, done, isToday, isFuture, dayNum }) => (
          <div
            key={date}
            onClick={() => !isFuture && onToggleDate(date)}
            title={date}
            style={{
              aspectRatio: '1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: done ? 700 : 400, cursor: isFuture ? 'default' : 'pointer',
              background: done ? textColor : isToday ? 'var(--navy4)' : 'transparent',
              color: done ? 'var(--navy)' : isToday ? textColor : isFuture ? 'var(--text3)' : 'var(--text2)',
              border: isToday && !done ? `1.5px solid ${textColor}` : '1.5px solid transparent',
              opacity: isFuture ? 0.35 : 1,
              transition: 'background .12s',
            }}
          >{dayNum}</div>
        ))}
      </div>
    </div>
  )
}

/* ── Year view ── */
function YearView({ history, color, year }) {
  const months = getYearMonths(history, year)
  const textColor = COLOR_TEXT[color] || 'var(--gold)'
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
        {months.map(({ month, done, total, pct }) => (
          <div key={month} style={{ background: 'var(--navy4)', borderRadius: 7, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>{MONTH_NAMES[month]}</div>
            <div style={{ height: 4, background: 'var(--navy)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: textColor, borderRadius: 3, transition: 'width .3s' }} />
            </div>
            <div style={{ fontSize: 11, color: pct > 0 ? textColor : 'var(--text3)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {total === 0 ? '—' : `${done}/${total}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function Habits() {
  const habits        = useStore((s) => s.habits)
  const addHabit      = useStore((s) => s.addHabit)
  const updateHabit   = useStore((s) => s.updateHabit)
  const deleteHabit   = useStore((s) => s.deleteHabit)
  const checkInHabit  = useStore((s) => s.checkInHabit)
  const logHabitDate  = useStore((s) => s.logHabitDate)
  const reorderHabits = useStore((s) => s.reorderHabits)

  const [showForm,    setShowForm]    = useState(false)
  const [editingId,   setEditingId]   = useState(null)
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [historyView, setHistoryView] = useState({})
  const [backdateOpen, setBackdateOpen] = useState({})
  const [backdateVal,  setBackdateVal]  = useState({})
  const [dragId,      setDragId]      = useState(null)
  const [dragOverId,  setDragOverId]  = useState(null)

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const ids  = habits.filter((h) => !h.archived).map((h) => h.id)
    const from = ids.indexOf(dragId)
    const to   = ids.indexOf(targetId)
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    // Merge archived back in at end
    const archivedIds = habits.filter((h) => h.archived).map((h) => h.id)
    reorderHabits([...next, ...archivedIds])
    setDragId(null); setDragOverId(null)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const now      = new Date()
  const curYear  = now.getFullYear()
  const curMonth = now.getMonth()

  const active   = habits.filter((h) => !h.archived)
  const archived = habits.filter((h) =>  h.archived)
  const doneToday = active.filter((h) => h.history.includes(todayStr)).length

  // Default view depends on frequency: weekly habits start on 'weeks', daily on '7day'
  const getView = (id, freq) => historyView[id] ?? (freq === 'weekly' ? 'weeks' : '7day')
  const setView = (id, v)    => setHistoryView((prev) => ({ ...prev, [id]: v }))

  return (
    <>
      <div className="section-title-row">
        <div>
          <div className="section-title">Habits</div>
          {active.length > 0 && (
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
              {doneToday}/{active.length} done today
            </div>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setEditingId(null) }}>
          + New Habit
        </button>
      </div>

      {showForm && (
        <HabitForm onSave={(data) => { addHabit(data); setShowForm(false) }} onCancel={() => setShowForm(false)} />
      )}

      {active.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>⟳</div>
          <div style={{ fontSize: 17, color: 'var(--cream)', fontWeight: 500, marginBottom: 8 }}>No habits yet</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 24px' }}>
            Track daily or weekly habits and build streaks. Check in each day from here or the dashboard.
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add your first habit</button>
        </div>
      )}

      <div className="habits-grid">
        {active.map((h) => {
          const strip     = get7DayStrip(h.history)
          const streak    = calcStreak(h.history, h.frequency)
          const doneNow   = h.history.includes(todayStr)
          const textColor = COLOR_TEXT[h.color] || 'var(--gold)'
          const bgColor   = COLOR_BG[h.color]   || 'rgba(201,168,76,.12)'
          const view      = getView(h.id, h.frequency)
          const bdOpen    = backdateOpen[h.id] || false
          const bdVal     = backdateVal[h.id]  || ''
          const isWeekly  = h.frequency === 'weekly'

          if (editingId === h.id) {
            return (
              <HabitForm
                key={h.id}
                initial={h}
                onSave={(data) => { updateHabit(h.id, data); setEditingId(null) }}
                onCancel={() => setEditingId(null)}
              />
            )
          }

          // View toggle options differ by frequency
          const viewOptions = isWeekly
            ? [{ v: 'weeks', label: 'Weeks' }, { v: 'month', label: 'Month' }, { v: 'year', label: 'Year' }]
            : [{ v: '7day',  label: '7 Days'}, { v: 'month', label: 'Month' }, { v: 'year', label: 'Year' }]

          return (
            <div
              key={h.id}
              className="habit-card"
              style={{
                borderColor: dragOverId === h.id ? 'var(--gold)' : doneNow ? textColor : undefined,
                background: doneNow ? bgColor : undefined,
                opacity: dragId === h.id ? 0.4 : 1,
                transition: 'opacity .15s',
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(h.id) }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={() => handleDrop(h.id)}
            >
              {/* Header */}
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span
                    className="drag-handle"
                    style={{ fontSize: 14, opacity: 0.35, cursor: 'grab', lineHeight: 1, marginTop: 3, flexShrink: 0 }}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); setDragId(h.id) }}
                    onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                    onClick={(e) => e.stopPropagation()}
                    title="Drag to reorder"
                  >≡</span>
                  <div>
                    <div style={{ fontSize: 16, color: 'var(--cream)', fontWeight: 600 }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {FREQ_LABEL[h.frequency]}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="habit-streak" style={{ color: textColor }}>{streak > 0 ? '🔥 ' : ''}{streak}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5 }}>streak</div>
                </div>
              </div>

              {/* History view toggle */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {viewOptions.map(({ v, label }) => (
                  <button
                    key={v}
                    style={{
                      padding: '3px 9px', borderRadius: 6,
                      border: `1px solid ${view === v ? textColor : 'var(--border)'}`,
                      background: view === v ? `${textColor}22` : 'none',
                      color: view === v ? textColor : 'var(--text3)',
                      fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                    onClick={() => setView(h.id, v)}
                  >{label}</button>
                ))}
              </div>

              {/* History display */}
              {view === '7day' && (
                <div className="habit-7day">
                  {strip.map(({ date, done, isToday, letter }) => (
                    <div
                      key={date}
                      className={['habit-dot', done ? 'done' : 'missed', isToday ? 'today' : ''].filter(Boolean).join(' ')}
                      style={done ? { background: textColor, color: 'var(--navy)' } : isToday ? { borderColor: textColor } : undefined}
                      title={date}
                    >{done ? '✓' : letter}</div>
                  ))}
                </div>
              )}
              {view === 'weeks' && (
                <WeekStrip history={h.history} color={h.color} />
              )}
              {view === 'month' && (
                <MonthView
                  history={h.history}
                  color={h.color}
                  year={curYear}
                  month={curMonth}
                  onToggleDate={(ds) => logHabitDate(h.id, ds)}
                />
              )}
              {view === 'year' && (
                <YearView history={h.history} color={h.color} year={curYear} />
              )}

              {/* Check-in button */}
              <button
                className={`habit-checkin-btn${doneNow ? ' done' : ''}`}
                style={{ marginTop: 10, ...(doneNow ? { borderColor: textColor, color: textColor } : {}) }}
                onClick={() => checkInHabit(h.id)}
              >
                {doneNow
                  ? `✓ ${isWeekly ? 'Week' : 'Today'} done — undo`
                  : `Mark ${isWeekly ? 'this week' : 'today'} done`}
              </button>

              {/* Back-date logging */}
              <div style={{ marginTop: 6 }}>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 11, cursor: 'pointer', padding: '2px 0', fontFamily: 'inherit' }}
                  onClick={() => setBackdateOpen((prev) => ({ ...prev, [h.id]: !bdOpen }))}
                >
                  {bdOpen ? '▲ close' : '+ log a past day'}
                </button>
                {bdOpen && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                    <input
                      className="input"
                      type="date"
                      style={{ flex: 1, fontSize: 12, padding: '4px 8px' }}
                      max={todayStr}
                      value={bdVal}
                      onChange={(e) => setBackdateVal((prev) => ({ ...prev, [h.id]: e.target.value }))}
                    />
                    <button
                      className="btn btn-sm"
                      style={{ fontSize: 11, flexShrink: 0 }}
                      disabled={!bdVal}
                      onClick={() => {
                        if (bdVal) { logHabitDate(h.id, bdVal); setBackdateVal((prev) => ({ ...prev, [h.id]: '' })) }
                      }}
                    >
                      {bdVal && h.history.includes(bdVal) ? 'Unlog' : 'Log'}
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="action-btns" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
                <button className="action-btn" onClick={() => setEditingId(h.id)}>Edit</button>
                <button className="action-btn" onClick={() => updateHabit(h.id, { archived: true })}>Archive</button>
                <button className="action-btn danger" onClick={() => setConfirmDel(h.id)}>Delete</button>
              </div>
              {confirmDel === h.id && (
                <div className="delete-confirm">
                  <span>Delete "{h.name}"?</span>
                  <button className="btn-confirm" onClick={() => { deleteHabit(h.id); setConfirmDel(null) }}>Yes</button>
                  <button className="btn-cancel"  onClick={() => setConfirmDel(null)}>Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {archived.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Archived ({archived.length})
          </div>
          {archived.map((h) => (
            <div key={h.id} className="expense-row" style={{ opacity: .6 }}>
              <span style={{ fontSize: 14 }}>{h.name}</span>
              <button className="action-btn" onClick={() => updateHabit(h.id, { archived: false })}>Restore</button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
