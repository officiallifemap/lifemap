import useStore from '../../store/useStore'

function fmtDay(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

const TYPE_TAG = { wedding: 'tag-wedding', travel: 'tag-travel', exam: 'tag-exam' }

export default function DayPanel({ selectedDay, onEventClick }) {
  const events       = useStore((s) => s.events)
  const todos        = useStore((s) => s.todos)
  const expenses     = useStore((s) => s.expenses)
  const people       = useStore((s) => s.people)
  const appointments = useStore((s) => s.appointments)
  const setModal     = useStore((s) => s.setModal)
  const toggleTodo   = useStore((s) => s.toggleTodo)

  const dayEvents   = events.filter((e) => e.date.slice(0, 10) === selectedDay)
  const dayTodos    = todos.filter((t) => t.due === selectedDay)
  const dayExpenses = expenses.filter((e) => e.date === selectedDay)
  const dayAppts    = appointments.filter((a) => a.date.slice(0, 10) === selectedDay)
  const selectedMD  = selectedDay.slice(5)
  const dayPeople   = people.filter((p) => p.birthday?.slice(5) === selectedMD || p.anniversary?.slice(5) === selectedMD)

  const totalSpent = dayExpenses.reduce((s, e) => s + e.amt, 0)

  return (
    <div className="day-panel">
      <div className="card-lg" style={{ padding: '16px 18px' }}>
        {/* Day title */}
        <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600, marginBottom: 14, lineHeight: 1.3 }}>
          {fmtDay(selectedDay)}
        </div>

        {/* Quick-add buttons */}
        <div className="day-panel-quick">
          {[
            { label: '+ Event',   modal: 'event',     data: { date: selectedDay } },
            { label: '+ To-Do',   modal: 'todo',      data: { due:  selectedDay } },
            { label: '+ Expense', modal: 'quick-add', data: { type: 'expense', date: selectedDay } },
            { label: '+ Goal',    modal: 'goal',      data: {} },
          ].map(({ label, modal, data }) => (
            <button
              key={label}
              className="btn btn-sm"
              style={{ fontSize: 11 }}
              onClick={() => setModal(modal, data)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Events */}
        <div className="day-section-label">Events</div>
        {dayEvents.length === 0
          ? <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>No events</div>
          : dayEvents.map((e) => (
            <div
              key={e.id}
              style={{
                marginBottom: 8, padding: '8px 10px', background: 'var(--navy3)', borderRadius: 8,
                cursor: onEventClick ? 'pointer' : 'default',
                transition: 'background .1s',
              }}
              onClick={() => onEventClick?.(e.id)}
              onMouseEnter={(ev) => { if (onEventClick) ev.currentTarget.style.background = 'var(--navy4)' }}
              onMouseLeave={(ev) => { if (onEventClick) ev.currentTarget.style.background = 'var(--navy3)' }}
            >
              <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500 }}>{e.name}</div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`event-tag ${TYPE_TAG[e.type] ?? 'tag-finance'}`}>{e.type}</span>
                {onEventClick && <span style={{ fontSize: 10, color: 'var(--text3)' }}>Click to view →</span>}
              </div>
            </div>
          ))
        }

        {/* To-Dos */}
        <div className="day-section-label">To-Dos</div>
        {dayTodos.length === 0
          ? <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>No to-dos</div>
          : dayTodos.map((t) => (
            <div
              key={t.id}
              className="todo-item"
              style={{ padding: '6px 0', cursor: 'pointer' }}
              onClick={() => toggleTodo(t.id)}
            >
              <div className={`todo-check${t.done ? ' done' : ''}`} style={{ flexShrink: 0 }}>
                {t.done ? '✓' : ''}
              </div>
              <div className={`priority-dot p-${t.priority}`} />
              <div className={`todo-text${t.done ? ' done' : ''}`} style={{ fontSize: 12 }}>{t.text}</div>
            </div>
          ))
        }

        {/* Expenses */}
        <div className="day-section-label">Expenses</div>
        {dayExpenses.length === 0
          ? <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>No expenses</div>
          : (
            <>
              {dayExpenses.map((e) => (
                <div key={e.id} className="expense-row" style={{ padding: '5px 0' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text1)' }}>{e.note || 'Expense'}</div>
                    <div className="expense-cat" style={{ fontSize: 10 }}>{e.cat}</div>
                  </div>
                  <div className="expense-amt mono" style={{ fontSize: 12 }}>-${e.amt}</div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6 }} className="flex-between">
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Total</span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--coral2)' }}>-${totalSpent.toLocaleString()}</span>
              </div>
            </>
          )
        }

        {/* Appointments */}
        {dayAppts.length > 0 && (
          <>
            <div className="day-section-label">Appointments</div>
            {dayAppts.map((a) => (
              <div key={a.id} style={{ marginBottom: 6, padding: '7px 10px', background: 'var(--navy3)', borderRadius: 8, borderLeft: '3px solid var(--cream3)' }}>
                <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {a.time && `${a.time}${a.provider ? ' · ' : ''}`}{a.provider}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Birthdays / Anniversaries */}
        {dayPeople.length > 0 && (
          <>
            <div className="day-section-label">Birthdays & Anniversaries</div>
            {dayPeople.map((p) => {
              const isBday = p.birthday?.slice(5) === selectedMD
              const isAnn  = p.anniversary?.slice(5) === selectedMD
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text1)' }}>
                  <span style={{ fontSize: 14 }}>{isBday ? '🎂' : '💍'}</span>
                  <span style={{ flex: 1 }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--sky2)' }}>{isBday ? 'Birthday' : 'Anniversary'}</span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
