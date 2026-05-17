import { useState } from 'react'
import useStore from '../../store/useStore'

function fmtBirthday(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function daysUntilRecurring(dateStr) {
  if (!dateStr) return null
  const today  = new Date()
  const md     = dateStr.slice(5)
  const target = new Date(`${today.getFullYear()}-${md}T12:00:00`)
  if (target < today) target.setFullYear(target.getFullYear() + 1)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['#4a7c6f','#4a7fad','#c9a84c','#c9614a','#7c6f9f','#4a8c6f']

/* ── Person form ── */
function PersonForm({ initial = {}, onSave, onCancel }) {
  const [name,  setName]  = useState(initial.name  || '')
  const [bday,  setBday]  = useState(initial.birthday    || '')
  const [ann,   setAnn]   = useState(initial.anniversary || '')
  const [phone, setPhone] = useState(initial.phone || '')
  const [email, setEmail] = useState(initial.email || '')
  const [notes, setNotes] = useState(initial.notes || '')

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onCancel() }}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-title">{initial.id ? 'Edit Person' : 'Add Person'}</div>
        <div className="form-row">
          <label className="label">Name</label>
          <input className="input" autoFocus placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="form-row" style={{ flex: 1 }}>
            <label className="label">Birthday <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
            <input className="input" type="date" value={bday} onChange={(e) => setBday(e.target.value)} />
          </div>
          <div className="form-row" style={{ flex: 1 }}>
            <label className="label">Anniversary <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
            <input className="input" type="date" value={ann}  onChange={(e) => setAnn(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="form-row" style={{ flex: 1 }}>
            <label className="label">Phone</label>
            <input className="input" placeholder="555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-row" style={{ flex: 1 }}>
            <label className="label">Email</label>
            <input className="input" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <label className="label">Notes <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
          <textarea className="input" style={{ minHeight: 52, resize: 'vertical', fontSize: 13, fontFamily: 'inherit' }}
            placeholder="Preferences, allergies, anything to remember…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), birthday: bday, anniversary: ann, phone, email, notes })}>
            {initial.id ? 'Save Changes' : 'Add Person'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function People() {
  const people         = useStore((s) => s.people)
  const addPerson      = useStore((s) => s.addPerson)
  const updatePerson   = useStore((s) => s.updatePerson)
  const deletePerson   = useStore((s) => s.deletePerson)
  const reorderPeople  = useStore((s) => s.reorderPeople)
  const addGiftIdea    = useStore((s) => s.addGiftIdea)
  const toggleGiftIdea = useStore((s) => s.toggleGiftIdea)
  const deleteGiftIdea = useStore((s) => s.deleteGiftIdea)

  const [showForm,   setShowForm]   = useState(false)
  const [editId,     setEditId]     = useState(null)
  const [expandId,   setExpandId]   = useState(null)   // single-expand accordion
  const [confirmDel, setConfirmDel] = useState(null)
  const [giftInput,  setGiftInput]  = useState({})
  const [dragId,     setDragId]     = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  // sort: 'custom' | 'birthday'
  const [sortMode, setSortMode] = useState('custom')

  const editPerson = editId ? people.find((p) => p.id === editId) : null

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const ids  = people.map((p) => p.id)
    const from = ids.indexOf(dragId)
    const to   = ids.indexOf(targetId)
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    reorderPeople(next)
    setDragId(null); setDragOverId(null)
  }

  const display = sortMode === 'birthday'
    ? [...people].sort((a, b) => {
        const da = daysUntilRecurring(a.birthday) ?? 999
        const db = daysUntilRecurring(b.birthday) ?? 999
        return da - db
      })
    : people // store order (custom drag order)

  /* Accordion — clicking an open card closes it; clicking a closed card opens it */
  const toggleExpand = (id) => setExpandId((prev) => prev === id ? null : id)

  return (
    <>
      <div className="section-title-row">
        <div className="section-title">People</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-sm"
            style={{ fontSize: 11 }}
            onClick={() => setSortMode((m) => m === 'custom' ? 'birthday' : 'custom')}
          >
            {sortMode === 'custom' ? '≡ Custom order' : '🎂 By birthday'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add Person</button>
        </div>
      </div>

      {showForm && (
        <PersonForm
          onSave={(data) => { addPerson(data); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}
      {editPerson && (
        <PersonForm
          initial={editPerson}
          onSave={(data) => { updatePerson(editId, data); setEditId(null) }}
          onCancel={() => setEditId(null)}
        />
      )}

      {people.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>◯</div>
          <div style={{ fontSize: 17, color: 'var(--cream)', fontWeight: 500, marginBottom: 8 }}>No people added yet</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 24px' }}>
            Add the people in your life to track birthdays, anniversaries, and gift ideas — and get reminders on the calendar.
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add someone</button>
        </div>
      )}

      <div className="people-grid">
        {display.map((p, idx) => {
          const avatarColor = AVATAR_COLORS[people.indexOf(p) % AVATAR_COLORS.length]
          const bdayDays    = daysUntilRecurring(p.birthday)
          const annDays     = daysUntilRecurring(p.anniversary)
          const isExpanded  = expandId === p.id
          const isDragging  = dragId === p.id
          const isDragOver  = dragOverId === p.id

          return (
            <div
              key={p.id}
              className={[
                'person-card',
                isExpanded ? 'expanded' : '',
                isDragging ? 'card-dragging'  : '',
                isDragOver ? 'card-drag-over' : '',
              ].filter(Boolean).join(' ')}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(p.id) }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={() => handleDrop(p.id)}
            >
              {/* ── Card header ── */}
              <div className="person-card-header" onClick={() => toggleExpand(p.id)}>
                {/* Drag handle */}
                {sortMode === 'custom' && (
                  <span
                    className="drag-handle"
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); setDragId(p.id) }}
                    onDragEnd={(e)   => { e.stopPropagation(); setDragId(null); setDragOverId(null) }}
                    onClick={(e)     => e.stopPropagation()}
                    style={{ marginRight: 4 }}
                  >≡</span>
                )}
                <div className="person-avatar" style={{ background: avatarColor }}>{initials(p.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, color: 'var(--cream)', fontWeight: 600 }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    {bdayDays !== null && (
                      <span className={`person-badge${bdayDays <= 14 ? ' soon' : ''}`}>
                        🎂 {bdayDays === 0 ? 'Today!' : bdayDays === 1 ? 'Tomorrow' : `in ${bdayDays}d`}
                      </span>
                    )}
                    {annDays !== null && (
                      <span className={`person-badge${annDays <= 14 ? ' soon' : ''}`}>
                        💍 {annDays === 0 ? 'Today!' : annDays === 1 ? 'Tomorrow' : `in ${annDays}d`}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ color: 'var(--text3)', fontSize: 12, flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
              </div>

              {/* ── Expanded detail ── */}
              {isExpanded && (
                <div className="person-detail">
                  {/* Contact info */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                    {p.birthday && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Birthday</div>
                        <div style={{ fontSize: 14, color: 'var(--text1)' }}>{fmtBirthday(p.birthday)}</div>
                      </div>
                    )}
                    {p.anniversary && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Anniversary</div>
                        <div style={{ fontSize: 14, color: 'var(--text1)' }}>{fmtBirthday(p.anniversary)}</div>
                      </div>
                    )}
                    {p.phone && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Phone</div>
                        <div style={{ fontSize: 14, color: 'var(--text1)' }}>{p.phone}</div>
                      </div>
                    )}
                    {p.email && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Email</div>
                        <div style={{ fontSize: 14, color: 'var(--text1)' }}>{p.email}</div>
                      </div>
                    )}
                  </div>

                  {p.notes && (
                    <div style={{ fontSize: 14, color: 'var(--text2)', fontStyle: 'italic', padding: '9px 12px', background: 'var(--navy4)', borderRadius: 8, marginBottom: 12 }}>
                      {p.notes}
                    </div>
                  )}

                  {/* Gift ideas */}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                      Gift Ideas {p.giftIdeas?.length > 0 && `(${p.giftIdeas.length})`}
                    </div>
                    {p.giftIdeas?.map((g) => (
                      <div key={g.id} className="gift-item">
                        <div
                          className={`todo-check${g.done ? ' done' : ''}`}
                          style={{ cursor: 'pointer', flexShrink: 0, width: 18, height: 18, fontSize: 10 }}
                          onClick={() => toggleGiftIdea(p.id, g.id)}
                        >{g.done ? '✓' : ''}</div>
                        <span style={{ flex: 1, fontSize: 14, color: g.done ? 'var(--text3)' : 'var(--text1)', textDecoration: g.done ? 'line-through' : 'none' }}>
                          {g.text}
                        </span>
                        <button className="action-btn danger" style={{ fontSize: 10 }} onClick={() => deleteGiftIdea(p.id, g.id)}>✕</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <input
                        className="input" style={{ fontSize: 12, padding: '5px 10px' }}
                        placeholder="Add gift idea…"
                        value={giftInput[p.id] || ''}
                        onChange={(e) => setGiftInput((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && giftInput[p.id]?.trim()) {
                            addGiftIdea(p.id, giftInput[p.id].trim())
                            setGiftInput((prev) => ({ ...prev, [p.id]: '' }))
                          }
                        }}
                      />
                      <button className="btn btn-sm" onClick={() => {
                        if (giftInput[p.id]?.trim()) {
                          addGiftIdea(p.id, giftInput[p.id].trim())
                          setGiftInput((prev) => ({ ...prev, [p.id]: '' }))
                        }
                      }}>+</button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="action-btns" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
                    <button className="action-btn" onClick={() => setEditId(p.id)}>Edit</button>
                    <button className="action-btn danger" onClick={() => setConfirmDel(p.id)}>Delete</button>
                  </div>
                  {confirmDel === p.id && (
                    <div className="delete-confirm" style={{ marginTop: 8 }}>
                      <span>Delete {p.name}?</span>
                      <button className="btn-confirm" onClick={() => { deletePerson(p.id); setConfirmDel(null); setExpandId(null) }}>Yes</button>
                      <button className="btn-cancel" onClick={() => setConfirmDel(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
