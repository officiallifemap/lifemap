import { useState, useRef, useEffect, useCallback } from 'react'
import useStore from '../../store/useStore'

function fmtDate(ds) {
  return new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* Auto-growing textarea */
function AutoTextarea({ value, onChange, placeholder, style }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px' }
  }, [value])
  return (
    <textarea
      ref={ref}
      className="input"
      style={{ resize: 'none', minHeight: 64, fontSize: 13, fontFamily: 'inherit', overflow: 'hidden', ...style }}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  )
}

/* Tag chip — clickable in filter context */
function TagChip({ label, onRemove, active, onClick, style }) {
  return (
    <span
      className={`note-tag${active ? ' active' : ''}${onClick ? ' clickable' : ''}`}
      style={style}
      onClick={onClick}
    >
      {label}
      {onRemove && (
        <span style={{ marginLeft: 4, cursor: 'pointer', opacity: .7 }} onClick={(e) => { e.stopPropagation(); onRemove() }}>×</span>
      )}
    </span>
  )
}

const PRESET_TAGS = ['wedding', 'travel', 'planning', 'personal', 'finance', 'health']

const SORT_OPTIONS = [
  { key: 'newest',    label: 'Newest' },
  { key: 'oldest',    label: 'Oldest' },
  { key: 'title-asc', label: 'Title A–Z' },
  { key: 'title-desc',label: 'Title Z–A' },
]

export default function Notes() {
  const notes          = useStore((s) => s.notes)
  const addNote        = useStore((s) => s.addNote)
  const updateNote     = useStore((s) => s.updateNote)
  const deleteNote     = useStore((s) => s.deleteNote)
  const focusItem      = useStore((s) => s.focusItem)
  const clearFocusItem = useStore((s) => s.clearFocusItem)

  const [search,     setSearch]     = useState('')
  const [filterTag,  setFilterTag]  = useState('All')
  const [sortKey,    setSortKey]    = useState('newest')
  const [expandId,   setExpandId]   = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  // New note form state
  const [newTitle, setNewTitle] = useState('')
  const [newBody,  setNewBody]  = useState('')
  const [newTag,   setNewTag]   = useState('')
  const [newTags,  setNewTags]  = useState([])
  const [showNew,  setShowNew]  = useState(false)

  // Edit state (inline)
  const [editTitle, setEditTitle] = useState('')
  const [editBody,  setEditBody]  = useState('')
  const [editTag,   setEditTag]   = useState('')
  const [editTags,  setEditTags]  = useState([])

  const allTags = ['All', ...new Set(notes.flatMap((n) => n.tags || []))]

  const filtered = notes
    .filter((n) => filterTag === 'All' || (n.tags || []).includes(filterTag))
    .filter((n) => {
      if (!search) return true
      const q = search.toLowerCase()
      return n.title?.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q) || (n.tags || []).some((t) => t.toLowerCase().includes(q))
    })
    .sort((a, b) => {
      if (sortKey === 'newest')     return b.date.localeCompare(a.date)
      if (sortKey === 'oldest')     return a.date.localeCompare(b.date)
      if (sortKey === 'title-asc')  return (a.title || 'zzz').localeCompare(b.title || 'zzz')
      if (sortKey === 'title-desc') return (b.title || 'zzz').localeCompare(a.title || 'zzz')
      return 0
    })

  const handleCreate = () => {
    if (!newBody.trim() && !newTitle.trim()) return
    addNote({ title: newTitle.trim(), body: newBody.trim(), tags: newTags })
    setNewTitle(''); setNewBody(''); setNewTags([]); setNewTag(''); setShowNew(false)
  }

  const startEdit = (n) => {
    setExpandId(n.id)
    setEditTitle(n.title || '')
    setEditBody(n.body  || '')
    setEditTags([...(n.tags || [])])
    setEditTag('')
  }

  const saveEdit = (id) => {
    updateNote(id, { title: editTitle.trim(), body: editBody.trim(), tags: editTags })
    setExpandId(null)
  }

  const addTagToNew = () => {
    const t = newTag.trim().toLowerCase()
    if (t && !newTags.includes(t)) setNewTags((prev) => [...prev, t])
    setNewTag('')
  }
  const addTagToEdit = () => {
    const t = editTag.trim().toLowerCase()
    if (t && !editTags.includes(t)) setEditTags((prev) => [...prev, t])
    setEditTag('')
  }

  /* Auto-expand a note when navigated here via focusItem */
  useEffect(() => {
    if (focusItem?.type === 'note') {
      const n = notes.find((x) => x.id === focusItem.id)
      if (n) {
        setExpandId(n.id)
        setEditTitle(n.title || '')
        setEditBody(n.body  || '')
        setEditTags([...(n.tags || [])])
        setEditTag('')
      }
      clearFocusItem()
    }
  }, [focusItem]) // eslint-disable-line react-hooks/exhaustive-deps

  const cycleSort = () => {
    const idx = SORT_OPTIONS.findIndex((o) => o.key === sortKey)
    setSortKey(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].key)
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? 'Newest'

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="section-title-row" style={{ marginBottom: 12 }}>
        <div className="section-title">Notes</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={cycleSort}>
            Sort: {currentSortLabel}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew((v) => !v)}>
            {showNew ? '✕ Cancel' : '+ New Note'}
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        className="input note-search"
        placeholder="Search notes…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      {/* Tag filters */}
      {allTags.length > 1 && (
        <div className="filter-chips" style={{ marginBottom: 16 }}>
          {allTags.map((t) => (
            <button key={t} className={`filter-chip${filterTag === t ? ' active' : ''}`} onClick={() => setFilterTag(filterTag === t ? 'All' : t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* New note form */}
      {showNew && (
        <div className="note-card note-card-new">
          <input className="input" placeholder="Title (optional)" style={{ marginBottom: 8, fontSize: 14 }}
            value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <AutoTextarea placeholder="Write anything…" value={newBody} onChange={(e) => setNewBody(e.target.value)} />

          {/* Preset tag suggestions */}
          <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
            {PRESET_TAGS.filter((t) => !newTags.includes(t)).map((t) => (
              <span
                key={t}
                className="note-tag"
                style={{ cursor: 'pointer', opacity: .7 }}
                onClick={() => setNewTags((prev) => [...prev, t])}
              >+ {t}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {newTags.map((t) => (
              <TagChip key={t} label={t} onRemove={() => setNewTags((prev) => prev.filter((x) => x !== t))} />
            ))}
            <input
              className="input" style={{ width: 120, padding: '3px 8px', fontSize: 12 }}
              placeholder="custom tag…"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTagToNew() } }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!newBody.trim() && !newTitle.trim()} onClick={handleCreate}>
              Save Note
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !showNew && (
        notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>◻</div>
            <div style={{ fontSize: 17, color: 'var(--cream)', fontWeight: 500, marginBottom: 8 }}>No notes yet</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 24px' }}>
              Capture anything — ideas, lists, plans. Tag them to find them later.
            </div>
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ Capture a thought</button>
          </div>
        ) : (
          <div className="empty-state">No notes match your search.</div>
        )
      )}

      {/* Notes grid */}
      <div className="notes-grid">
        {filtered.map((n) => {
          const isExpanded = expandId === n.id
          const preview = n.body?.split('\n')[0] || ''

          return (
            <div key={n.id} className={`note-card${isExpanded ? ' expanded' : ''}`}>
              {isExpanded ? (
                /* ── Edit mode ── */
                <>
                  <input className="input" placeholder="Title (optional)" style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}
                    value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <AutoTextarea placeholder="Write anything…" value={editBody} onChange={(e) => setEditBody(e.target.value)} />

                  {/* Preset tag suggestions */}
                  <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                    {PRESET_TAGS.filter((t) => !editTags.includes(t)).map((t) => (
                      <span
                        key={t}
                        className="note-tag"
                        style={{ cursor: 'pointer', opacity: .7 }}
                        onClick={() => setEditTags((prev) => [...prev, t])}
                      >+ {t}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {editTags.map((t) => (
                      <TagChip key={t} label={t} onRemove={() => setEditTags((prev) => prev.filter((x) => x !== t))} />
                    ))}
                    <input
                      className="input" style={{ width: 110, padding: '3px 8px', fontSize: 12 }}
                      placeholder="custom tag…"
                      value={editTag}
                      onChange={(e) => setEditTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTagToEdit() } }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <button className="action-btn danger" onClick={() => setConfirmDel(n.id)}>Delete</button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" onClick={() => setExpandId(null)}>Cancel</button>
                      <button className="btn btn-primary" onClick={() => saveEdit(n.id)}>Save</button>
                    </div>
                  </div>
                  {confirmDel === n.id && (
                    <div className="delete-confirm" style={{ marginTop: 8 }}>
                      <span>Delete this note?</span>
                      <button className="btn-confirm" onClick={() => { deleteNote(n.id); setConfirmDel(null); setExpandId(null) }}>Yes</button>
                      <button className="btn-cancel" onClick={() => setConfirmDel(null)}>Cancel</button>
                    </div>
                  )}
                </>
              ) : (
                /* ── Preview mode ── */
                (() => {
                  // Always show a title: use explicit title, or fall back to first line of body
                  const displayTitle  = n.title || n.body?.split('\n')[0]?.slice(0, 60) || 'Note'
                  // Body preview: if title came from body's first line, show rest of body; otherwise show first line
                  const bodyPreview   = n.title
                    ? (n.body?.split('\n')[0] || '')
                    : (n.body?.split('\n').slice(1).join(' ').trim() || '')
                  return (
                <div style={{ position: 'relative' }}>
                  {/* Quick delete button */}
                  <button
                    className="note-quick-delete"
                    title="Delete note"
                    onClick={(e) => { e.stopPropagation(); setConfirmDel(confirmDel === n.id ? null : n.id) }}
                  >×</button>

                  <div onClick={() => startEdit(n)} style={{ cursor: 'pointer', paddingRight: 24 }}>
                    <div style={{ fontSize: 16, color: 'var(--cream)', fontWeight: 600, marginBottom: 5 }}>{displayTitle}</div>
                    {bodyPreview && (
                      <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>
                        {bodyPreview.length > 120 ? bodyPreview.slice(0, 120) + '…' : bodyPreview}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 4, marginTop: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginRight: 4 }}>
                        {fmtDate(n.date)}
                      </span>
                      {(n.tags || []).map((t) => (
                        <TagChip
                          key={t}
                          label={t}
                          active={filterTag === t}
                          onClick={(e) => { e.stopPropagation(); setFilterTag(filterTag === t ? 'All' : t) }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Inline delete confirm */}
                  {confirmDel === n.id && (
                    <div className="delete-confirm" style={{ marginTop: 8 }}>
                      <span>Delete this note?</span>
                      <button className="btn-confirm" onClick={() => { deleteNote(n.id); setConfirmDel(null) }}>Yes</button>
                      <button className="btn-cancel" onClick={() => setConfirmDel(null)}>No</button>
                    </div>
                  )}
                </div>
                  )
                })()
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
