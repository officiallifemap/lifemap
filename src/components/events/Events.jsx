import { useState, useEffect } from 'react'
import ProgressBar from '../ui/ProgressBar'
import useStore from '../../store/useStore'
import EventDetailModal from './EventDetailModal'

const TYPE_TAG   = { wedding: 'tag-wedding', travel: 'tag-travel', exam: 'tag-exam' }
const TYPE_EMOJI = { wedding: '💒', travel: '✈️', exam: '📝', birthday: '🎂', anniversary: '💍' }

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function daysLeft(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
}

export default function Events() {
  const events         = useStore((s) => s.events)
  const todos          = useStore((s) => s.todos)
  const goals          = useStore((s) => s.goals)
  const reorderEvents  = useStore((s) => s.reorderEvents)
  const setModal       = useStore((s) => s.setModal)
  const focusItem      = useStore((s) => s.focusItem)
  const clearFocusItem = useStore((s) => s.clearFocusItem)

  const [openEventId, setOpenEventId] = useState(null)

  /* Auto-open event detail when navigated here via focusItem */
  useEffect(() => {
    if (focusItem?.type === 'event' && focusItem.id) {
      setOpenEventId(focusItem.id)
      clearFocusItem()
    }
  }, [focusItem]) // eslint-disable-line react-hooks/exhaustive-deps
  const [dragId,      setDragId]      = useState(null)
  const [dragOverId,  setDragOverId]  = useState(null)

  const openEvent = events.find((e) => e.id === openEventId) ?? null

  /* Respect store order; completed events sink to bottom */
  const active    = events.filter((e) => !e.completed)
  const completed = events.filter((e) =>  e.completed)
  const display   = [...active, ...completed]

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const ids  = events.map((e) => e.id)
    const from = ids.indexOf(dragId)
    const to   = ids.indexOf(targetId)
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    reorderEvents(next)
    setDragId(null); setDragOverId(null)
  }

  return (
    <>
      <div className="section-title-row">
        <div className="section-title">Life Events</div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('event')}>+ New Event</button>
      </div>

      {events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📅</div>
          <div style={{ fontSize: 17, color: 'var(--cream)', fontWeight: 500, marginBottom: 8 }}>No life events yet</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 24px' }}>
            Track things you're planning and saving for — a wedding, trip, move, or anything worth looking forward to.
          </div>
          <button className="btn btn-primary" onClick={() => setModal('event')}>+ Add your first event</button>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {display.map((e) => {
          const linkedGoal   = e.linkedGoalId ? goals.find((g) => g.id === e.linkedGoalId) : null
          const hasSavings   = linkedGoal !== null
          const savePct      = hasSavings ? Math.min(100, Math.round((linkedGoal.saved / linkedGoal.target) * 100)) : 0
          const linkedTodos  = todos.filter((t) => t.linkedEventId === e.id)
          const doneTodos    = linkedTodos.filter((t) => t.done).length
          const todoPct      = linkedTodos.length ? Math.round((doneTodos / linkedTodos.length) * 100) : 0
          const dl        = daysLeft(e.date)
          const photo0    = e.photos?.[0] ?? null
          const isDragging = dragId === e.id
          const isDragOver = dragOverId === e.id

          return (
            <div
              key={e.id}
              className={[
                'event-compact-card',
                e.completed ? 'ev-completed' : '',
                isDragging  ? 'card-dragging'  : '',
                isDragOver  ? 'card-drag-over' : '',
              ].filter(Boolean).join(' ')}
              onDragOver={(ev) => { ev.preventDefault(); setDragOverId(e.id) }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={() => handleDrop(e.id)}
              onClick={() => setOpenEventId(e.id)}
            >
              {/* ── Drag handle — left side ── */}
              {!e.completed && (
                <span
                  className="drag-handle"
                  style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 14, opacity: 0.35, cursor: 'grab', zIndex: 2,
                    lineHeight: 1, padding: '4px 2px',
                  }}
                  draggable
                  onDragStart={(ev) => { ev.stopPropagation(); setDragId(e.id) }}
                  onDragEnd={(ev)   => { ev.stopPropagation(); setDragId(null); setDragOverId(null) }}
                  onClick={(ev)     => ev.stopPropagation()}
                  title="Drag to reorder"
                >≡</span>
              )}

              {/* ── Thumbnail ── */}
              <div className="event-compact-thumb">
                {photo0
                  ? <img src={photo0} alt={e.name} />
                  : <div className="event-compact-no-photo">{TYPE_EMOJI[e.type] ?? '📅'}</div>
                }
                <div className="event-compact-overlay" />

                <div className="event-compact-tag-pos">
                  <span className={`event-tag ${TYPE_TAG[e.type] ?? 'tag-finance'}`}>{e.type}</span>
                </div>

                {e.completed && (
                  <div className="event-compact-done-pos">✓ Done</div>
                )}
              </div>

              {/* ── Info ── */}
              <div className="event-compact-body">
                <div className="event-compact-name">{e.name}</div>
                <div className="event-compact-meta">
                  {fmtDate(e.date)}
                  {!e.completed && dl > 0 && ` · ${dl}d away`}
                  {!e.completed && dl <= 0 && ' · passed'}
                  {e.completed && ' · completed'}
                </div>

                <div className="event-compact-bars">
                  <div className="event-compact-bar-wrap">
                    <div className="event-compact-bar-label">
                      <span>To-Do</span>
                      <span style={{ color: 'var(--sky2)' }}>{todoPct}%</span>
                    </div>
                    <ProgressBar pct={todoPct} color="sky" style={{ margin: 0 }} />
                  </div>
                  {hasSavings && (
                    <div className="event-compact-bar-wrap">
                      <div className="event-compact-bar-label">
                        <span>Savings</span>
                        <span style={{ color: 'var(--gold)' }}>{savePct}%</span>
                      </div>
                      <ProgressBar pct={savePct} color="gold" style={{ margin: 0 }} />
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                  {linkedTodos.length > 0 && `${doneTodos}/${linkedTodos.length} tasks`}
                  {hasSavings && linkedTodos.length > 0 && ' · '}
                  {hasSavings && `$${linkedGoal.saved.toLocaleString()} of $${linkedGoal.target.toLocaleString()} saved`}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail modal */}
      {openEvent && (
        <EventDetailModal
          event={openEvent}
          onClose={() => setOpenEventId(null)}
        />
      )}
    </>
  )
}
