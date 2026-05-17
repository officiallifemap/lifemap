import { useState, useRef } from 'react'
import ProgressBar from '../ui/ProgressBar'
import useStore from '../../store/useStore'
import CropModal from '../ui/CropModal'
import { calcGoalPerPeriod } from '../../utils/savings'

const TYPE_TAG = { wedding: 'tag-wedding', travel: 'tag-travel', exam: 'tag-exam' }

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function daysLeft(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
}

export default function EventDetailModal({ event, onClose }) {
  const todos              = useStore((s) => s.todos)
  const goals              = useStore((s) => s.goals)
  const setModal           = useStore((s) => s.setModal)
  const addEventPhoto      = useStore((s) => s.addEventPhoto)
  const removeEventPhoto   = useStore((s) => s.removeEventPhoto)
  const completeEvent      = useStore((s) => s.completeEvent)
  const uncompleteEvent    = useStore((s) => s.uncompleteEvent)
  const deleteEvent        = useStore((s) => s.deleteEvent)
  const unlinkGoalFromEvent = useStore((s) => s.unlinkGoalFromEvent)
  const linkTodoToEvent    = useStore((s) => s.linkTodoToEvent)
  const unlinkTodo         = useStore((s) => s.unlinkTodo)
  const toggleTodo         = useStore((s) => s.toggleTodo)
  const updateTodo         = useStore((s) => s.updateTodo)
  const deleteTodo         = useStore((s) => s.deleteTodo)

  const [showLinkPanel,   setShowLinkPanel]   = useState(false)
  const [confirmDel,      setConfirmDel]      = useState(false)
  const [delTodos,        setDelTodos]        = useState(true)
  const [delGoal,         setDelGoal]         = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [cropSrc,         setCropSrc]         = useState(null)
  const [editingTodoId,   setEditingTodoId]   = useState(null)
  const [editTodoText,    setEditTodoText]     = useState('')
  const [editTodoNotes,   setEditTodoNotes]   = useState('')
  const [confirmTodoDel,  setConfirmTodoDel]  = useState(null)
  const fileRef = useRef(null)

  if (!event) return null

  if (cropSrc) {
    return (
      <CropModal
        src={cropSrc}
        shape="rect"
        aspectRatio={16 / 9}
        onApply={(url) => { addEventPhoto(event.id, url); setCropSrc(null) }}
        onCancel={() => setCropSrc(null)}
      />
    )
  }

  const dl = daysLeft(event.date)

  /* ── Linked savings goal ── */
  const linkedGoal = event.linkedGoalId
    ? goals.find((g) => g.id === event.linkedGoalId) ?? null
    : null

  const hasSavings = linkedGoal !== null
  const savePct    = hasSavings ? Math.min(100, Math.round((linkedGoal.saved / linkedGoal.target) * 100)) : 0
  const { amt: perPeriodAmt, label: perPeriodLabel, complete: savingsComplete } =
    hasSavings ? calcGoalPerPeriod(linkedGoal) : { amt: 0, label: '/mo', complete: false }

  /* ── Linked to-dos ── */
  const linked   = todos.filter((t) => t.linkedEventId === event.id)
  const linkable = todos.filter((t) => !t.linkedEventId && !t.done)

  const linkedDone = linked.filter((t) => t.done).length
  const todoPct    = linked.length ? Math.round((linkedDone / linked.length) * 100) : 0

  const handlePhotoUpload = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCropSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleDelete = () => {
    deleteEvent(event.id, { deleteTodos: delTodos, deleteGoal: delGoal })
    onClose()
  }

  const startEditTodo = (t) => {
    setEditingTodoId(t.id)
    setEditTodoText(t.text)
    setEditTodoNotes(t.notes || '')
  }
  const saveEditTodo = () => {
    updateTodo(editingTodoId, { text: editTodoText.trim() || undefined, notes: editTodoNotes })
    setEditingTodoId(null)
  }

  /* ── Motivation messages ── */
  const savingsMsg = !hasSavings ? '' :
    savingsComplete            ? 'Fully funded! 🎉'
    : savePct >= 75            ? 'Almost there — keep it up!'
    : savePct >= 50            ? 'Halfway to your goal — great progress.'
    : savePct >= 25            ? 'Good momentum — stay consistent.'
    : savePct > 0              ? `$${perPeriodAmt.toLocaleString()}${perPeriodLabel} will get you there.`
    :                            `Save $${perPeriodAmt.toLocaleString()}${perPeriodLabel} to hit your target.`

  const todoMsg = linked.length === 0
    ? 'Link to-dos below to track tasks for this event.'
    : todoPct >= 100 ? 'All tasks done — you\'re ready! 🎉'
    : todoPct >= 50  ? 'More than halfway through your tasks.'
    : todoPct > 0    ? `${linkedDone} of ${linked.length} tasks complete.`
    :                  `${linked.length} task${linked.length === 1 ? '' : 's'} to tackle.`

  return (
    <div
      className="modal-overlay"
      style={{ alignItems: 'center' }}
      onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose() }}
    >
      <div className="event-detail-wrap">

        <button className="event-detail-close" onClick={onClose}>✕</button>

        {/* ── Photo area ── */}
        <div className="event-detail-photo-area">
          {event.photos?.length > 0
            ? <img src={event.photos[0]} alt="" />
            : <div className="event-detail-photo-empty">
                {event.type === 'wedding' ? '💒' : event.type === 'travel' ? '✈️' : '📅'}
              </div>
          }
          <div className="event-detail-photo-overlay" />
          <div className="event-detail-photo-actions">
            <label className="event-detail-photo-btn" style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileRef}
                onChange={(e) => handlePhotoUpload(e.target.files[0])}
                onClick={(e) => { e.target.value = '' }} />
              {event.photos?.length > 0 ? '📷 Change photo' : '📷 Add photo'}
            </label>
            {event.photos?.length > 1 && (
              <span className="event-detail-photo-btn" style={{ pointerEvents: 'none', opacity: .7 }}>
                +{event.photos.length - 1} more
              </span>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="event-detail-body">

          {/* Title row */}
          <div className="event-detail-title-row">
            <div>
              <div className="event-detail-name">{event.name}</div>
              <div className="event-detail-date">
                {fmtDate(event.date)} ·{' '}
                {event.completed
                  ? <span style={{ color: 'var(--sage2)' }}>Completed</span>
                  : dl > 0 ? `${dl} days away` : 'date passed'
                }
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={`event-tag ${TYPE_TAG[event.type] ?? 'tag-finance'}`}>{event.type}</span>
                {hasSavings && (
                  <span style={{ fontSize: 10, color: 'var(--gold)', opacity: 0.8 }}>
                    💰 {linkedGoal.name}
                  </span>
                )}
                {event.completed && (
                  <span style={{ fontSize: 10, color: 'var(--sage2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>✓ Done</span>
                )}
              </div>
            </div>
            {hasSavings && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="stat-label">Savings Goal</div>
                <div className="mono" style={{ fontSize: 20, color: 'var(--cream)' }}>${linkedGoal.target.toLocaleString()}</div>
                {!savingsComplete && (
                  <div style={{ fontSize: 11, color: 'var(--sage2)', marginTop: 2 }}>
                    ${perPeriodAmt.toLocaleString()}{perPeriodLabel} est.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Progress ── */}
          <div className="dual-progress">
            {/* To-Do always on the left */}
            <div>
              <div className="dp-label">To-Do List</div>
              <div className="dp-pct">{todoPct}%</div>
              <ProgressBar pct={todoPct} color="sky" />
              <div className="text-xs text-hint mt4">{linkedDone} of {linked.length} complete</div>
              <div className="motivation">{todoMsg}</div>
            </div>
            {/* Savings on the right — only when a goal is linked */}
            {hasSavings && (
              <div>
                <div className="dp-label">Savings</div>
                <div className="dp-pct">{savePct}%</div>
                <ProgressBar pct={savePct} color="gold" />
                <div className="text-xs text-hint mt4">${linkedGoal.saved.toLocaleString()} of ${linkedGoal.target.toLocaleString()} saved</div>
                <div className="motivation">{savingsMsg}</div>
              </div>
            )}
          </div>

          {/* ── No savings goal — CTA ── */}
          {!hasSavings && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--navy3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>No savings goal linked to this event.</div>
              <button
                className="btn btn-sm"
                style={{ fontSize: 11, flexShrink: 0 }}
                onClick={() => setModal('goal', {
                  linkedEventId: event.id,
                  name:          event.name,
                  targetDate:    event.date,
                })}
              >+ Add Savings Goal</button>
            </div>
          )}

          {/* ── Linked To-Dos ── */}
          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>
                To-Dos {linked.length > 0 && `(${linkedDone}/${linked.length})`}
              </div>
              <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setShowLinkPanel((v) => !v)}>
                {showLinkPanel ? 'Done' : '+ Link To-Do'}
              </button>
            </div>

            {linked.length === 0 && !showLinkPanel && (
              <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 8 }}>
                No to-dos linked yet. Click "+ Link To-Do" to connect existing tasks, or create a new one.
              </div>
            )}

            {linked.map((t) => (
              <div key={t.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
                {editingTodoId === t.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      className="input" style={{ fontSize: 13, padding: '6px 10px' }}
                      value={editTodoText}
                      onChange={(e) => setEditTodoText(e.target.value)}
                      placeholder="Task text"
                    />
                    <textarea
                      className="input" style={{ fontSize: 12, padding: '6px 10px', minHeight: 48, resize: 'vertical', fontFamily: 'inherit' }}
                      value={editTodoNotes}
                      onChange={(e) => setEditTodoNotes(e.target.value)}
                      placeholder="Notes (optional)"
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-primary" style={{ fontSize: 11 }} onClick={saveEditTodo}>Save</button>
                      <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setEditingTodoId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div
                      className={`todo-check${t.done ? ' done' : ''}`}
                      style={{ cursor: 'pointer', flexShrink: 0, marginTop: 1, width: 16, height: 16, fontSize: 10, borderRadius: 4 }}
                      onClick={() => toggleTodo(t.id)}
                    >{t.done ? '✓' : ''}</div>
                    <div className={`priority-dot p-${t.priority}`} style={{ flexShrink: 0, marginTop: 5 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={`todo-text${t.done ? ' done' : ''}`} style={{ margin: 0, fontSize: 13 }}>{t.text}</div>
                      {t.due   && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Due {t.due}</div>}
                      {t.notes && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3, fontStyle: 'italic' }}>{t.notes}</div>}
                    </div>
                    <div className="action-btns" style={{ flexShrink: 0 }}>
                      <button className="action-btn" style={{ fontSize: 10 }} onClick={() => startEditTodo(t)}>Edit</button>
                      <button className="action-btn" style={{ fontSize: 10 }} onClick={() => unlinkTodo(t.id)}>Unlink</button>
                      <button className="action-btn danger" style={{ fontSize: 10 }} onClick={() => setConfirmTodoDel(t.id)}>✕</button>
                    </div>
                  </div>
                )}
                {confirmTodoDel === t.id && (
                  <div className="delete-confirm" style={{ marginTop: 6 }}>
                    <span>Delete this to-do?</span>
                    <button className="btn-confirm" onClick={() => { deleteTodo(t.id); setConfirmTodoDel(null) }}>Yes, delete</button>
                    <button className="btn-cancel" onClick={() => setConfirmTodoDel(null)}>Cancel</button>
                  </div>
                )}
              </div>
            ))}

            {showLinkPanel && (
              <div style={{ marginTop: 10, background: 'var(--navy3)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
                  Select a to-do to link to this event:
                </div>
                {linkable.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 10 }}>
                    No unlinked to-dos available.
                  </div>
                )}
                {linkable.map((t) => (
                  <div key={t.id} className="link-todo-row">
                    <div className={`priority-dot p-${t.priority}`} />
                    <div className="link-todo-text">{t.text}</div>
                    {t.due && <div className="todo-due">{t.due}</div>}
                    <button
                      className="btn btn-sm" style={{ fontSize: 11, flexShrink: 0 }}
                      onClick={() => linkTodoToEvent(t.id, event.id)}
                    >Link</button>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
                  <button
                    className="btn btn-sm" style={{ fontSize: 11 }}
                    onClick={() => {
                      setShowLinkPanel(false)
                      setModal('todo', { linkedEventId: event.id, linkedEventName: event.name })
                    }}
                  >+ Create new to-do</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Notes ── */}
          {event.notes && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--navy4)', borderRadius: 8, fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', borderTop: '1px solid var(--border)', marginBottom: -4 }}>
              {event.notes}
            </div>
          )}

          {/* ── All photos ── */}
          {event.photos?.length > 0 && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Photos · {event.photos.length}
              </div>
              <div className="photo-grid">
                {event.photos.map((src, i) => (
                  <div key={i} className="photo-thumb-wrap">
                    <img src={src} className="photo-thumb" alt="" />
                    <button className="photo-remove" onClick={() => removeEventPhoto(event.id, i)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Milestones (from linked goal) ── */}
          {hasSavings && linkedGoal.milestones?.length > 0 && (
            <div className="milestone-stack" style={{ marginTop: 20 }}>
              {linkedGoal.milestones.map((m, i) => (
                <div key={i} className={`milestone-card level-${m.pct >= 100 ? 'complete' : m.pct >= 75 ? 'high' : m.pct >= 50 ? 'mid' : 'low'}`}>
                  <span className="milestone-badge">{m.pct}%</span>
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--text2)' }}>
                    {m.pct >= 100 ? 'Fully funded' : m.pct >= 75 ? 'Three quarters there' : m.pct >= 50 ? 'Halfway milestone' : 'Quarter milestone'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{m.date}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Log Contribution (only when goal is linked) ── */}
          {hasSavings && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button
                className="log-contrib-btn"
                style={{ width: '100%' }}
                onClick={() => setModal('contribution', { goalId: linkedGoal.id })}
              >+ Log Contribution</button>
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="action-btn" onClick={() => {
                setModal('event', {
                  editId: event.id, name: event.name, type: event.type,
                  date: event.date, notes: event.notes,
                })
              }}>Edit Event</button>
              {hasSavings && (
                <button className="action-btn" style={{ fontSize: 10 }}
                  onClick={() => setModal('goal', {
                    editId: linkedGoal.id, name: linkedGoal.name,
                    category: linkedGoal.category, target: linkedGoal.target,
                    monthly: linkedGoal.monthly, cadence: linkedGoal.cadence,
                    targetDate: linkedGoal.targetDate,
                  })}>Edit Goal</button>
              )}
              {hasSavings && (
                <button className="action-btn" style={{ fontSize: 10, opacity: 0.6 }}
                  title="Remove the savings goal link from this event (goal is kept)"
                  onClick={() => unlinkGoalFromEvent(linkedGoal.id)}>Unlink Goal</button>
              )}
              <button className="action-btn danger" onClick={() => setConfirmDel(true)}>Delete</button>
            </div>

            {event.completed
              ? <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => uncompleteEvent(event.id)}>
                  Undo Complete
                </button>
              : <button className="btn btn-sm" style={{ fontSize: 11, color: 'var(--sage2)', borderColor: 'var(--sage2)' }}
                  onClick={() => setConfirmComplete(true)}>
                  ✓ Mark Complete
                </button>
            }
          </div>

          {confirmDel && (
            <div style={{ marginTop: 12, padding: '14px 16px', background: 'rgba(235,133,112,.07)', border: '1px solid rgba(235,133,112,.2)', borderRadius: 10 }}>
              <div style={{ fontSize: 14, color: 'var(--text1)', fontWeight: 500, marginBottom: 12 }}>
                Delete "{event.name}"?
              </div>

              {/* Linked todos option */}
              {linked.length > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                  <input
                    type="checkbox"
                    checked={delTodos}
                    onChange={(e) => setDelTodos(e.target.checked)}
                    style={{ accentColor: 'var(--coral2)', width: 14, height: 14, cursor: 'pointer' }}
                  />
                  Also delete {linked.length} linked to-do{linked.length !== 1 ? 's' : ''}
                </label>
              )}

              {/* Linked goal option */}
              {hasSavings && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                  <input
                    type="checkbox"
                    checked={delGoal}
                    onChange={(e) => setDelGoal(e.target.checked)}
                    style={{ accentColor: 'var(--coral2)', width: 14, height: 14, cursor: 'pointer' }}
                  />
                  Also delete savings goal "{linkedGoal.name}"
                  <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 2 }}>
                    (${linkedGoal.saved.toLocaleString()} saved)
                  </span>
                </label>
              )}

              {linked.length === 0 && !hasSavings && (
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
                  This action cannot be undone.
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-confirm" onClick={handleDelete}>Yes, delete</button>
                <button className="btn-cancel" onClick={() => setConfirmDel(false)}>Cancel</button>
              </div>
            </div>
          )}
          {confirmComplete && (
            <div className="delete-confirm" style={{ marginTop: 10, background: 'rgba(100,185,130,.08)', borderColor: 'rgba(100,185,130,.2)', color: 'var(--sage2)' }}>
              <span>Mark as complete?</span>
              <button style={{ background: 'var(--sage2)', color: '#fff', border: 'none', padding: '2px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}
                onClick={() => { completeEvent(event.id); setConfirmComplete(false) }}>Confirm</button>
              <button className="btn-cancel" onClick={() => setConfirmComplete(false)}>Cancel</button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
