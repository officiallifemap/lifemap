import { useState } from 'react'
import useStore from '../../store/useStore'

function fmtDate(ds) {
  return new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function daysAway(ds) {
  const diff = Math.ceil((new Date(ds) - new Date()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0)  return `${Math.abs(diff)}d ago`
  return `in ${diff}d`
}

/* ── Appointment form ── */
function ApptForm({ initial = {}, onSave, onCancel }) {
  const [title,    setTitle]    = useState(initial.title    || '')
  const [date,     setDate]     = useState(initial.date     || '')
  const [time,     setTime]     = useState(initial.time     || '')
  const [provider, setProvider] = useState(initial.provider || '')
  const [notes,    setNotes]    = useState(initial.notes    || '')
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onCancel() }}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-title">{initial.id ? 'Edit Appointment' : 'New Appointment'}</div>
        <div className="form-row">
          <label className="label">Title</label>
          <input className="input" autoFocus placeholder="e.g. Dentist checkup" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="form-row" style={{ flex: 1 }}>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-row" style={{ flex: 1 }}>
            <label className="label">Time <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <label className="label">Provider / Location <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
          <input className="input" placeholder="Dr. Smith, Clinic name…" value={provider} onChange={(e) => setProvider(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="label">Notes <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
          <textarea className="input" style={{ minHeight: 48, resize: 'vertical', fontSize: 13, fontFamily: 'inherit' }}
            placeholder="Any prep notes…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={!title.trim() || !date}
            onClick={() => onSave({ title: title.trim(), date, time, provider, notes })}>
            {initial.id ? 'Save Changes' : 'Add Appointment'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Medication form ── */
function MedForm({ initial = {}, onSave, onCancel }) {
  const [name, setName] = useState(initial.name  || '')
  const [dose, setDose] = useState(initial.dose  || '')
  const [freq, setFreq] = useState(initial.frequency || 'daily')
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onCancel() }}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-title">{initial.id ? 'Edit Medication' : 'Add Medication'}</div>
        <div className="form-row">
          <label className="label">Name</label>
          <input className="input" autoFocus placeholder="e.g. Vitamin D" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="label">Dose <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
          <input className="input" placeholder="e.g. 1000 IU, 2 capsules" value={dose} onChange={(e) => setDose(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="label">Frequency</label>
          <select className="select" value={freq} onChange={(e) => setFreq(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="as-needed">As needed</option>
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), dose, frequency: freq })}>
            {initial.id ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Appointments column ── */
function Appointments() {
  const appointments          = useStore((s) => s.appointments)
  const addAppointment        = useStore((s) => s.addAppointment)
  const updateAppointment     = useStore((s) => s.updateAppointment)
  const deleteAppointment     = useStore((s) => s.deleteAppointment)
  const toggleAppointmentDone = useStore((s) => s.toggleAppointmentDone)
  const reorderAppointments   = useStore((s) => s.reorderAppointments)

  const [showForm,   setShowForm]   = useState(false)
  const [editId,     setEditId]     = useState(null)
  const [expandId,   setExpandId]   = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [dragId,     setDragId]     = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  // Use store order directly — user can drag to reorder; no automatic date-sort
  const upcoming  = appointments.filter((a) => !a.completed)
  const completed = appointments.filter((a) =>  a.completed)

  const editAppt = editId ? appointments.find((a) => a.id === editId) : null
  const toggleExpand = (id) => setExpandId((prev) => prev === id ? null : id)

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const upcomingIds  = upcoming.map((a) => a.id)
    const from = upcomingIds.indexOf(dragId)
    const to   = upcomingIds.indexOf(targetId)
    if (from === -1 || to === -1) { setDragId(null); setDragOverId(null); return }
    const next = [...upcomingIds]
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    const completedIds = completed.map((a) => a.id)
    reorderAppointments([...next, ...completedIds])
    setDragId(null); setDragOverId(null)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add</button>
      </div>

      {showForm && (
        <ApptForm onSave={(d) => { addAppointment(d); setShowForm(false) }} onCancel={() => setShowForm(false)} />
      )}
      {editAppt && (
        <ApptForm initial={editAppt}
          onSave={(d) => { updateAppointment(editId, d); setEditId(null) }}
          onCancel={() => setEditId(null)} />
      )}

      {upcoming.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '32px 10px' }}>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.5 }}>
            No upcoming appointments. Add one to get a days-away countdown.
          </div>
          <button className="btn btn-sm" onClick={() => setShowForm(true)}>+ Add appointment</button>
        </div>
      )}

      {upcoming.map((a) => {
        const da        = daysAway(a.date)
        const isToday   = da === 'Today'
        const isExpanded = expandId === a.id
        const isDragging = dragId === a.id
        const isDragOver = dragOverId === a.id

        return (
          <div
            key={a.id}
            style={{
              marginBottom: 8,
              opacity: isDragging ? 0.4 : 1,
              outline: isDragOver ? '2px solid var(--gold)' : 'none',
              outlineOffset: -1,
              borderRadius: 12,
              transition: 'opacity .15s',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOverId(a.id) }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={() => handleDrop(a.id)}
          >
            <div
              className="appt-card"
              style={{
                cursor: 'pointer', flexDirection: 'column', gap: 0, padding: 0,
                ...(isToday    ? { borderColor: 'var(--gold)', background: 'rgba(201,168,76,.06)' } : undefined),
                ...(isExpanded ? { borderColor: 'var(--border2)' } : undefined),
              }}
              onClick={() => toggleExpand(a.id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '13px 14px' }}>
                {/* Drag handle */}
                <span
                  className="drag-handle"
                  style={{ fontSize: 13, opacity: 0.3, cursor: 'grab', lineHeight: 1, marginTop: 3, flexShrink: 0 }}
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); setDragId(a.id) }}
                  onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                  onClick={(e) => e.stopPropagation()}
                  title="Drag to reorder"
                >≡</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
                    {fmtDate(a.date)}{a.time && ` · ${a.time}`}{a.provider && ` · ${a.provider}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: isToday ? 'var(--gold)' : 'var(--text3)' }}>{da}</span>
                  {/* Inline check button */}
                  <button
                    className="action-btn"
                    style={{ padding: '2px 8px', fontSize: 11, color: 'var(--sage2)', borderColor: 'var(--sage2)' }}
                    onClick={(e) => { e.stopPropagation(); toggleAppointmentDone(a.id) }}
                    title="Mark done"
                  >✓</button>
                  <span style={{ color: 'var(--text3)', fontSize: 11 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px' }}
                  onClick={(e) => e.stopPropagation()}>
                  {a.notes && (
                    <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 10 }}>{a.notes}</div>
                  )}
                  <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                    <button className="action-btn" onClick={() => { setEditId(a.id); setExpandId(null) }}>Edit</button>
                    <button className="action-btn danger" onClick={() => setConfirmDel(a.id)}>Delete</button>
                  </div>
                  {confirmDel === a.id && (
                    <div className="delete-confirm" style={{ marginTop: 8 }}>
                      <span>Delete "{a.title}"?</span>
                      <button className="btn-confirm" onClick={() => { deleteAppointment(a.id); setConfirmDel(null); setExpandId(null) }}>Yes</button>
                      <button className="btn-cancel" onClick={() => setConfirmDel(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {completed.length > 0 && (
        <div style={{ marginTop: 20, opacity: .55 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Completed ({completed.length})
          </div>
          {completed.map((a) => (
            <div key={a.id} className="appt-card" style={{ marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: 'var(--text2)', textDecoration: 'line-through' }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{fmtDate(a.date)}</div>
              </div>
              <button className="action-btn" onClick={() => toggleAppointmentDone(a.id)}>Undo</button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ── Medications column ── */
function Medications() {
  const medications        = useStore((s) => s.medications)
  const addMedication      = useStore((s) => s.addMedication)
  const updateMedication   = useStore((s) => s.updateMedication)
  const deleteMedication   = useStore((s) => s.deleteMedication)
  const checkInMedication  = useStore((s) => s.checkInMedication)
  const logMedicationDate  = useStore((s) => s.logMedicationDate)
  const reorderMedications = useStore((s) => s.reorderMedications)

  const [showForm,     setShowForm]     = useState(false)
  const [editId,       setEditId]       = useState(null)
  const [expandId,     setExpandId]     = useState(null)
  const [confirmDel,   setConfirmDel]   = useState(null)
  const [backdateOpen, setBackdateOpen] = useState({})
  const [backdateVal,  setBackdateVal]  = useState({})
  const [dragId,       setDragId]       = useState(null)
  const [dragOverId,   setDragOverId]   = useState(null)

  const todayStr = new Date().toISOString().split('T')[0]
  const editMed  = editId ? medications.find((m) => m.id === editId) : null

  const daily     = medications.filter((m) => m.frequency === 'daily')
  const doneToday = daily.filter((m) => m.checkins.includes(todayStr)).length

  const toggleExpand = (id) => setExpandId((prev) => prev === id ? null : id)

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const ids  = medications.map((m) => m.id)
    const from = ids.indexOf(dragId)
    const to   = ids.indexOf(targetId)
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    reorderMedications(next)
    setDragId(null); setDragOverId(null)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
          {daily.length > 0 && `${doneToday}/${daily.length} taken today`}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add</button>
      </div>

      {showForm && (
        <MedForm onSave={(d) => { addMedication(d); setShowForm(false) }} onCancel={() => setShowForm(false)} />
      )}
      {editMed && (
        <MedForm initial={editMed}
          onSave={(d) => { updateMedication(editId, d); setEditId(null) }}
          onCancel={() => setEditId(null)} />
      )}

      {medications.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '32px 10px' }}>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.5 }}>
            No medications tracked yet. Add one to get daily check-in reminders.
          </div>
          <button className="btn btn-sm" onClick={() => setShowForm(true)}>+ Add medication</button>
        </div>
      )}

      {medications.map((m) => {
        const doneNow     = m.checkins.includes(todayStr)
        const showCheckIn = m.frequency === 'daily' || m.frequency === 'weekly'
        const isExpanded  = expandId === m.id
        const bdOpen      = backdateOpen[m.id] || false
        const bdVal       = backdateVal[m.id]  || ''
        const isDragging  = dragId === m.id
        const isDragOver  = dragOverId === m.id

        return (
          <div
            key={m.id}
            style={{
              marginBottom: 8,
              opacity: isDragging ? 0.4 : 1,
              outline: isDragOver ? '2px solid var(--gold)' : 'none',
              outlineOffset: -1,
              borderRadius: 12,
              transition: 'opacity .15s',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOverId(m.id) }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={() => handleDrop(m.id)}
          >
            <div
              className="med-card"
              style={{
                cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0,
                ...(doneNow    ? { borderColor: 'var(--sage2)', background: 'rgba(106,171,153,.07)' } : undefined),
                ...(isExpanded ? { borderColor: 'var(--border2)' } : undefined),
              }}
              onClick={() => toggleExpand(m.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px' }}>
                {/* Drag handle */}
                <span
                  className="drag-handle"
                  style={{ fontSize: 13, opacity: 0.3, cursor: 'grab', lineHeight: 1, flexShrink: 0 }}
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); setDragId(m.id) }}
                  onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                  onClick={(e) => e.stopPropagation()}
                  title="Drag to reorder"
                >≡</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>
                    {m.dose && `${m.dose} · `}{m.frequency}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {/* Inline check-in — clickable pill */}
                  {showCheckIn && (
                    <span
                      style={{
                        fontSize: 12, padding: '2px 10px', borderRadius: 20, cursor: 'pointer',
                        border: `1.5px solid ${doneNow ? 'var(--sage2)' : 'var(--border2)'}`,
                        color: doneNow ? 'var(--sage2)' : 'var(--text3)',
                        background: doneNow ? 'rgba(106,171,153,.1)' : 'none',
                        transition: 'all .12s',
                        userSelect: 'none',
                      }}
                      title={doneNow ? 'Click to undo' : 'Mark taken today'}
                      onClick={(e) => { e.stopPropagation(); checkInMedication(m.id) }}
                    >
                      {doneNow ? '✓ Taken' : 'Not taken'}
                    </span>
                  )}
                  <span style={{ color: 'var(--text3)', fontSize: 11 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px' }}
                  onClick={(e) => e.stopPropagation()}>

                  <div style={{ marginBottom: 10 }}>
                    <button
                      style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                      onClick={() => setBackdateOpen((prev) => ({ ...prev, [m.id]: !bdOpen }))}
                    >
                      {bdOpen ? '▲ close' : '+ log past day'}
                    </button>
                    {bdOpen && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 5, alignItems: 'center' }}>
                        <input
                          className="input"
                          type="date"
                          style={{ flex: 1, fontSize: 12, padding: '4px 8px' }}
                          max={todayStr}
                          value={bdVal}
                          onChange={(e) => setBackdateVal((prev) => ({ ...prev, [m.id]: e.target.value }))}
                        />
                        <button
                          className="btn btn-sm"
                          style={{ fontSize: 11, flexShrink: 0 }}
                          disabled={!bdVal}
                          onClick={() => {
                            if (bdVal) { logMedicationDate(m.id, bdVal); setBackdateVal((prev) => ({ ...prev, [m.id]: '' })) }
                          }}
                        >
                          {bdVal && m.checkins.includes(bdVal) ? 'Unlog' : 'Log'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                    <button className="action-btn" onClick={() => { setEditId(m.id); setExpandId(null) }}>Edit</button>
                    <button className="action-btn danger" onClick={() => setConfirmDel(m.id)}>Delete</button>
                  </div>
                  {confirmDel === m.id && (
                    <div className="delete-confirm" style={{ marginTop: 8 }}>
                      <span>Delete "{m.name}"?</span>
                      <button className="btn-confirm" onClick={() => { deleteMedication(m.id); setConfirmDel(null); setExpandId(null) }}>Yes</button>
                      <button className="btn-cancel" onClick={() => setConfirmDel(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}

/* ── Root Wellness component — two-column layout with clear separator ── */
export default function Wellness() {
  return (
    <>
      <div className="section-title">Wellness</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, alignItems: 'start' }}>
        {/* Left column — Appointments */}
        <div style={{ paddingRight: 24 }}>
          <div style={{
            fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5,
            fontWeight: 600, marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8,
          }}>
            Appointments
          </div>
          <Appointments />
        </div>

        {/* Vertical divider */}
        <div style={{ borderLeft: '1px solid var(--border2)', paddingLeft: 24 }}>
          <div style={{
            fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.5,
            fontWeight: 600, marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8,
          }}>
            Medications
          </div>
          <Medications />
        </div>
      </div>
    </>
  )
}
