import useStore from '../../store/useStore'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeekStrip({ offset, selectedDay, onSelectDay, onPrev, onNext }) {
  const events = useStore((s) => s.events)
  const todos  = useStore((s) => s.todos)

  const eventDates = new Set(events.map((e) => e.date))
  const todoDates  = new Set(todos.filter((t) => !t.done && t.due).map((t) => t.due))
  const base = new Date()

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + offset + i)
    const ds = d.toISOString().split('T')[0]
    return {
      name: DAYS[d.getDay()],
      num: d.getDate(),
      ds,
      isToday:   offset + i === 0,
      hasEvent:  eventDates.has(ds),
      hasTodo:   todoDates.has(ds),
      isSelected: ds === selectedDay,
    }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
      <button className="btn btn-sm" onClick={onPrev} title="Previous week">←</button>
      <div className="week-strip" style={{ flex: 1, marginBottom: 0 }}>
        {days.map((d) => (
          <div
            key={d.ds}
            className={[
              'week-day',
              d.isToday    ? 'today'    : '',
              d.hasEvent   ? 'has-event': '',
              d.isSelected ? 'selected' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onSelectDay(d.ds)}
          >
            <div className="week-day-name">{d.name}</div>
            <div className="week-day-num">{d.num}</div>
            {d.hasTodo && !d.isSelected && (
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--sage2)', margin: '2px auto 0' }} />
            )}
          </div>
        ))}
      </div>
      <button className="btn btn-sm" onClick={onNext} title="Next week">→</button>
    </div>
  )
}
