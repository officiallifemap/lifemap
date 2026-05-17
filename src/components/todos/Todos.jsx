import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'

const SORT_OPTIONS = [
  { id: 'priority', label: 'Priority' },
  { id: 'due',      label: 'Due Date' },
  { id: 'added',    label: 'Recently Added' },
  { id: 'custom',   label: 'Custom' },
]

const PRIORITY_ORDER = { high: 0, med: 1, low: 2 }

function PriorityPill({ p }) {
  const label = p === 'high' ? 'High' : p === 'med' ? 'Medium' : 'Low'
  return <span className={`priority-pill ${p}`}>{label}</span>
}

export default function Todos() {
  const todos               = useStore((s) => s.todos)
  const events              = useStore((s) => s.events)
  const dashboardPinnedTodos = useStore((s) => s.dashboardPinnedTodos) || []
  const toggleTodo           = useStore((s) => s.toggleTodo)
  const updateTodo           = useStore((s) => s.updateTodo)
  const deleteTodo           = useStore((s) => s.deleteTodo)
  const reorderTodos         = useStore((s) => s.reorderTodos)
  const toggleDashboardPinTodo = useStore((s) => s.toggleDashboardPinTodo)
  const setModal             = useStore((s) => s.setModal)
  const setPage              = useStore((s) => s.setPage)
  const focusItem            = useStore((s) => s.focusItem)
  const clearFocusItem       = useStore((s) => s.clearFocusItem)

  const [filter,      setFilter]      = useState('active')   // 'active' | 'completed' | 'event-linked'
  const [eventFilter, setEventFilter] = useState('all')       // 'all' | event id (string)
  const [sortBy,      setSortBy]      = useState('priority')
  const [expanded,    setExpanded]    = useState(null)
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [dragId,      setDragId]      = useState(null)
  const [dragOverId,  setDragOverId]  = useState(null)

  /* Auto-expand todo when navigated here via focusItem */
  useEffect(() => {
    if (focusItem?.type === 'todo') {
      const t = todos.find((x) => x.id === focusItem.id)
      if (t) {
        setFilter(t.done ? 'completed' : 'active')
        setExpanded(t.id)
        setSortBy('custom')
      }
      clearFocusItem()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const active    = todos.filter((t) => !t.done)
  const completed = todos.filter((t) =>  t.done)
  const linked    = todos.filter((t) => t.linkedEventId != null)

  const applySort = (list) => {
    if (sortBy === 'custom') return list
    return [...list].sort((a, b) => {
      if (sortBy === 'priority') return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
      if (sortBy === 'due')      return (a.due ?? 'zzz').localeCompare(b.due ?? 'zzz')
      return b.id - a.id
    })
  }

  let baseList
  if (filter === 'active')      baseList = active
  else if (filter === 'completed') baseList = completed
  else {
    // event-linked: can further filter by event
    baseList = eventFilter === 'all'
      ? linked
      : linked.filter((t) => String(t.linkedEventId) === eventFilter)
  }
  const visible = applySort(baseList)

  /* Events that have at least one linked todo */
  const eventsWithTodos = events.filter((e) => todos.some((t) => t.linkedEventId === e.id))

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const allIds     = todos.map((t) => t.id)
    const visibleIds = visible.map((t) => t.id)
    const from = visibleIds.indexOf(dragId)
    const to   = visibleIds.indexOf(targetId)
    const newVisible = [...visibleIds]
    newVisible.splice(from, 1)
    newVisible.splice(to, 0, dragId)
    const visibleSet = new Set(visibleIds)
    let vi = 0
    const newAll = allIds.map((id) => visibleSet.has(id) ? newVisible[vi++] : id)
    reorderTodos(newAll)
    setDragId(null); setDragOverId(null)
  }

  const fmtCompleted = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const eventName    = (id) => events.find((e) => e.id === id)?.name ?? null
  const toggleExpand = (id) => setExpanded((prev) => (prev === id ? null : id))

  return (
    <>
      <div className="section-title-row">
        <div className="section-title">To-Do List</div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('todo')}>+ Add To-Do</button>
      </div>

      {/* Filter tabs + sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div className="filter-toggle">
          <button className={`filter-toggle-btn${filter === 'active'       ? ' active' : ''}`} onClick={() => setFilter('active')}>
            Active ({active.length})
          </button>
          <button className={`filter-toggle-btn${filter === 'completed'    ? ' active' : ''}`} onClick={() => setFilter('completed')}>
            Completed ({completed.length})
          </button>
          <button className={`filter-toggle-btn${filter === 'event-linked' ? ' active' : ''}`} onClick={() => setFilter('event-linked')}>
            Event-Linked ({linked.length})
          </button>
        </div>

        <div className="sort-controls" style={{ marginBottom: 0 }}>
          <span className="sort-label">Sort:</span>
          {SORT_OPTIONS.map((o) => (
            <button key={o.id} className={`sort-btn${sortBy === o.id ? ' active' : ''}`} onClick={() => setSortBy(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event sub-filter (only when event-linked tab is active) */}
      {filter === 'event-linked' && eventsWithTodos.length > 0 && (
        <div className="filter-chips" style={{ marginBottom: 10 }}>
          <button className={`filter-chip${eventFilter === 'all' ? ' active' : ''}`} onClick={() => setEventFilter('all')}>
            All Events
          </button>
          {eventsWithTodos.map((e) => (
            <button
              key={e.id}
              className={`filter-chip${eventFilter === String(e.id) ? ' active' : ''}`}
              onClick={() => setEventFilter(String(e.id))}
            >
              📅 {e.name}
            </button>
          ))}
        </div>
      )}

      {sortBy === 'custom' && visible.length > 1 && (
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, paddingLeft: 2 }}>
          Drag ≡ to reorder
        </div>
      )}

      <div className="card-lg">
        {visible.length === 0 && (
          filter === 'active' && todos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>☑</div>
              <div style={{ fontSize: 17, color: 'var(--cream)', fontWeight: 500, marginBottom: 8 }}>Nothing on your list yet</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 24px' }}>
                Add tasks with due dates, priorities, and optional links to your life events.
              </div>
              <button className="btn btn-primary" onClick={() => setModal('todo')}>+ Add your first to-do</button>
            </div>
          ) : (
            <div className="empty-state">
              {filter === 'active'       ? 'All caught up — no active to-dos.' :
               filter === 'completed'    ? 'Nothing completed yet.' :
               filter === 'event-linked' ? "No event-linked to-dos yet. Link a to-do from an event's detail view." :
               'No to-dos.'}
            </div>
          )
        )}

        {visible.map((t) => {
          const isOpen     = expanded === t.id
          const linked     = eventName(t.linkedEventId)
          const isDragging = dragId === t.id
          const isDragOver = dragOverId === t.id
          const isPinned   = dashboardPinnedTodos.includes(t.id)

          return (
            <div
              key={t.id}
              style={{
                opacity: isDragging ? 0.4 : 1,
                outline: isDragOver ? '2px solid var(--gold)' : 'none',
                outlineOffset: -1,
                borderRadius: 8,
                transition: 'opacity .15s',
              }}
              onDragOver={(e) => { if (sortBy === 'custom') { e.preventDefault(); setDragOverId(t.id) } }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={() => handleDrop(t.id)}
            >
              {/* Main row */}
              <div
                className={`todo-item expandable${isOpen ? ' open' : ''}`}
                style={{ cursor: 'pointer', alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 }}
                onClick={() => toggleExpand(t.id)}
              >
                {sortBy === 'custom' && (
                  <span
                    className="drag-handle"
                    style={{ fontSize: 14, opacity: 0.35, cursor: 'grab', lineHeight: 1, flexShrink: 0, marginTop: 2, marginRight: 2 }}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); setDragId(t.id) }}
                    onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                    onClick={(e) => e.stopPropagation()}
                    title="Drag to reorder"
                  >≡</span>
                )}

                <div
                  className={`todo-check${t.done ? ' done' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleTodo(t.id) }}
                  style={{ cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
                >
                  {t.done ? '✓' : ''}
                </div>

                <div className={`priority-dot p-${t.priority}`} style={{ marginTop: 6 }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div className={`todo-text${t.done ? ' done' : ''}`} style={{ margin: 0 }}>{t.text}</div>
                    <PriorityPill p={t.priority} />
                    {linked && (
                      <span
                        className="linked-event-badge"
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setPage('events')
                        }}
                      >📅 {linked}</span>
                    )}
                    {isPinned && (
                      <span style={{ fontSize: 11, color: 'var(--gold)', opacity: 0.8 }}>📌</span>
                    )}
                  </div>
                  {t.due && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Due {t.due}</div>
                  )}
                  {!t.due && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, fontStyle: 'italic' }}>No due date</div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {/* Pin to dashboard */}
                  <button
                    title={isPinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
                    onClick={(e) => { e.stopPropagation(); toggleDashboardPinTodo(t.id) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px',
                      fontSize: 13, opacity: isPinned ? 1 : 0.25, transition: 'opacity .15s',
                    }}
                    onMouseEnter={(e) => { if (!isPinned) e.currentTarget.style.opacity = '0.7' }}
                    onMouseLeave={(e) => { if (!isPinned) e.currentTarget.style.opacity = '0.25' }}
                  >📌</button>

                  <div className="action-btns" onClick={(e) => e.stopPropagation()}>
                    <button className="action-btn" onClick={() => setModal('todo', {
                      editId: t.id, text: t.text, due: t.due, priority: t.priority,
                      notes: t.notes, linkedEventId: t.linkedEventId,
                    })}>Edit</button>
                    <button className="action-btn danger" onClick={() => setConfirmDel(t.id)}>Delete</button>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{isOpen ? '▲' : '▼'}</div>
                </div>
              </div>

              {/* Delete confirm */}
              {confirmDel === t.id && (
                <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                  <span>Delete this task?</span>
                  <button className="btn-confirm" onClick={() => { deleteTodo(t.id); setConfirmDel(null) }}>Yes, delete</button>
                  <button className="btn-cancel"  onClick={() => setConfirmDel(null)}>Cancel</button>
                </div>
              )}

              {/* Expanded detail */}
              {isOpen && (
                <div className="todo-detail" onClick={(e) => e.stopPropagation()}>
                  <div className="todo-detail-meta">
                    {t.due && <span><span style={{ color: 'var(--text3)' }}>Due:</span>&nbsp;{t.due}</span>}
                    {t.done && t.completedAt && (
                      <span>
                        <span style={{ color: 'var(--text3)' }}>Completed:</span>&nbsp;
                        <span style={{ color: 'var(--sage2)' }}>{fmtCompleted(t.completedAt)}</span>
                      </span>
                    )}
                    {linked && <span><span style={{ color: 'var(--text3)' }}>Event:</span>&nbsp;{linked}</span>}
                  </div>
                  <textarea
                    className="todo-notes"
                    placeholder="Add a note…"
                    value={t.notes || ''}
                    onChange={(e) => updateTodo(t.id, { notes: e.target.value })}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
