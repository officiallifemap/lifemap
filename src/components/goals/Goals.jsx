import { useState } from 'react'
import ProgressBar from '../ui/ProgressBar'
import useStore from '../../store/useStore'
import { getMotivation } from '../../utils/motivation'

const COLOR_MAP = {
  'gc-gold':  ['gold',  'var(--gold)'],
  'gc-sage':  ['green', 'var(--sage2)'],
  'gc-sky':   ['sky',   'var(--sky2)'],
  'gc-coral': ['coral', 'var(--coral2)'],
}

function monthsUntil(dateStr) {
  if (!dateStr) return null
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24 * 30.44)
  return Math.ceil(diff)
}

export default function Goals() {
  const goals              = useStore((s) => s.goals)
  const events             = useStore((s) => s.events)
  const setModal           = useStore((s) => s.setModal)
  const setPage            = useStore((s) => s.setPage)
  const setFocusItem       = useStore((s) => s.setFocusItem)
  const reorderGoals       = useStore((s) => s.reorderGoals)
  const toggleGoalPin      = useStore((s) => s.toggleGoalPin)
  const toggleGoalCollapse = useStore((s) => s.toggleGoalCollapse)
  const deleteGoal         = useStore((s) => s.deleteGoal)
  const unlinkGoalFromEvent = useStore((s) => s.unlinkGoalFromEvent)

  const [dragId,     setDragId]     = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const ids  = goals.map((g) => g.id)
    const from = ids.indexOf(dragId)
    const to   = ids.indexOf(targetId)
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    reorderGoals(next)
    setDragId(null); setDragOverId(null)
  }

  return (
    <>
      <div className="section-title-row">
        <div className="section-title">Savings Goals</div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('goal')}>+ New Goal</button>
      </div>

      {goals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🎯</div>
          <div style={{ fontSize: 17, color: 'var(--cream)', fontWeight: 500, marginBottom: 8 }}>No savings goals yet</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 24px' }}>
            Set a target, pick a cadence, and log contributions. Watch your progress build over time.
          </div>
          <button className="btn btn-primary" onClick={() => setModal('goal')}>+ Create your first goal</button>
        </div>
      )}

      {/* alignItems: start prevents collapsed cards stretching to match taller neighbours */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {goals.map((g) => {
          const pct  = Math.round((g.saved / g.target) * 100)
          const rem  = g.target - g.saved
          const [fillClass, textColor] = COLOR_MAP[g.color] ?? ['gold', 'var(--gold)']
          const linkedEvent = g.linkedEventId ? events.find((e) => e.id === g.linkedEventId) : null

          /* ── Deficit / pace calc (only when targetDate is set) ── */
          const mos = monthsUntil(g.targetDate)
          let deficitLine = null
          if (mos !== null && mos > 0 && rem > 0) {
            const neededMonthly = Math.ceil(rem / mos)
            if (neededMonthly > g.monthly) {
              const extra = neededMonthly - g.monthly
              deficitLine = (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--navy3)', borderRadius: 7, fontSize: 12, color: 'var(--text2)' }}>
                  To reach your goal by{' '}
                  <span style={{ color: textColor }}>
                    {new Date(g.targetDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  , aim for{' '}
                  <span style={{ color: textColor, fontWeight: 600 }}>${neededMonthly.toLocaleString()}/mo</span>
                  {' '}(${extra.toLocaleString()} more than now).
                </div>
              )
            } else {
              deficitLine = (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--navy3)', borderRadius: 7, fontSize: 12, color: 'var(--sage2)' }}>
                  You're on track to reach this goal by{' '}
                  {new Date(g.targetDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.
                </div>
              )
            }
          }

          return (
            <div
              key={g.id}
              className={[
                'goal-card', g.color,
                dragId === g.id     ? 'card-dragging'  : '',
                dragOverId === g.id ? 'card-drag-over' : '',
              ].filter(Boolean).join(' ')}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(g.id) }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={() => handleDrop(g.id)}
            >
              {/* ── Header — click anywhere to expand/collapse ── */}
              <div
                className="flex-between"
                style={{ alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}
                onClick={() => toggleGoalCollapse(g.id)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                  {/* draggable scoped to handle only so button clicks don't trigger drag */}
                  <span
                    className="drag-handle"
                    style={{ marginTop: 2 }}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); setDragId(g.id) }}
                    onDragEnd={(e) => { e.stopPropagation(); setDragId(null); setDragOverId(null) }}
                    onClick={(e) => e.stopPropagation()}
                  >≡</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 500 }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {g.category}
                      {g.targetDate && (
                        <span style={{ marginLeft: 6, color: 'var(--text3)' }}>
                          · by {new Date(g.targetDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {linkedEvent && (
                      <div
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5, padding: '2px 8px', borderRadius: 20, background: 'rgba(212,168,76,.12)', border: '1px solid rgba(212,168,76,.25)', cursor: 'pointer', fontSize: 11, color: 'var(--gold)' }}
                        onClick={(e) => { e.stopPropagation(); setFocusItem({ type: 'event', id: linkedEvent.id }); setPage('events') }}
                        title="Go to linked event"
                      >
                        📅 {linkedEvent.name}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <div className="mono" style={{ fontSize: 20, color: textColor }}>{pct}%</div>
                  <button
                    className={`pin-btn${g.pinned ? ' pinned' : ''}`}
                    title={g.pinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
                    onClick={(e) => { e.stopPropagation(); toggleGoalPin(g.id) }}
                  >📌</button>
                  <button
                    className="collapse-btn"
                    onClick={(e) => { e.stopPropagation(); toggleGoalCollapse(g.id) }}
                    title={g.collapsed ? 'Expand' : 'Collapse'}
                  >{g.collapsed ? '▼' : '▲'}</button>
                </div>
              </div>

              {/* Progress bar — always visible */}
              <ProgressBar pct={pct} color={fillClass} style={{ margin: '12px 0 4px' }} />
              <div className="flex-between text-xs text-hint">
                <span>${g.saved.toLocaleString()} saved</span>
                <span>${g.target.toLocaleString()} goal</span>
              </div>

              {/* ── Expanded content ── */}
              {!g.collapsed && (
                <>
                  <div className="motivation">{getMotivation(pct)}</div>
                  <div className="divider" />
                  <div className="flex-between">
                    <div>
                      <div className="text-xs text-hint">Monthly contribution</div>
                      <div className="mono" style={{ fontSize: 14, color: 'var(--cream)', marginTop: 2 }}>${g.monthly.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-xs text-hint">Est. completion</div>
                      <div style={{ fontSize: 12, color: textColor, marginTop: 2 }}>
                        {pct >= 100
                          ? 'Complete! 🎉'
                          : g.targetDate
                            ? new Date(g.targetDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : g.monthly > 0
                              ? `~${Math.ceil(rem / g.monthly)} month${Math.ceil(rem / g.monthly) === 1 ? '' : 's'}`
                              : '—'
                        }
                      </div>
                    </div>
                  </div>

                  {deficitLine}
                </>
              )}

              {/* ── Milestones ── */}
              {g.milestones?.length > 0 && !g.collapsed && (
                <div className="milestone-stack">
                  {g.milestones.map((m, i) => (
                    <div key={i} className={`milestone-card level-${m.pct >= 100 ? 'complete' : m.pct >= 75 ? 'high' : m.pct >= 50 ? 'mid' : 'low'}`}>
                      <span className="milestone-badge">{m.pct}%</span>
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--text2)' }}>
                        {m.pct >= 100 ? 'Goal reached' : m.pct >= 75 ? 'Three quarters there' : m.pct >= 50 ? 'Halfway milestone' : 'Quarter milestone'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{m.date}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Log Contribution + Edit / Delete ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <button
                  className="log-contrib-btn"
                  onClick={(e) => { e.stopPropagation(); setModal('contribution', { goalId: g.id }) }}
                >+ Log Contribution</button>
                <div className="action-btns">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setModal('goal', {
                        editId: g.id, name: g.name, category: g.category,
                        target: g.target, monthly: g.monthly, cadence: g.cadence, targetDate: g.targetDate,
                      })
                    }}
                  >Edit</button>
                  <button
                    className="action-btn danger"
                    onClick={(e) => { e.stopPropagation(); setConfirmDel(g.id) }}
                  >Delete</button>
                </div>
              </div>

              {confirmDel === g.id && (
                <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                  <span>Delete "{g.name}"?</span>
                  <button className="btn-confirm" onClick={() => { deleteGoal(g.id); setConfirmDel(null) }}>Yes, delete</button>
                  <button className="btn-cancel"  onClick={() => setConfirmDel(null)}>Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
