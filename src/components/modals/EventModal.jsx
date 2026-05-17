import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'

const PRESET_TYPES = ['wedding', 'travel', 'exam', 'birthday', 'anniversary', 'other']

export default function EventModal() {
  const activeModal      = useStore((s) => s.activeModal)
  const modalData        = useStore((s) => s.modalData)
  const closeModal       = useStore((s) => s.closeModal)
  const addEvent         = useStore((s) => s.addEvent)
  const addEventWithGoal = useStore((s) => s.addEventWithGoal)
  const updateEvent      = useStore((s) => s.updateEvent)

  const [name,         setName]         = useState('')
  const [type,         setType]         = useState('wedding')
  const [customType,   setCustomType]   = useState('')
  const [date,         setDate]         = useState('')
  const [cost,         setCost]         = useState('')
  const [trackSavings, setTrackSavings] = useState(true)
  const [goalMonthly,  setGoalMonthly]  = useState('')
  const [goalCadence,  setGoalCadence]  = useState('Monthly')
  const [notes,        setNotes]        = useState('')

  const isEdit = !!modalData?.editId

  useEffect(() => {
    if (activeModal === 'event') {
      const t = modalData?.type ?? 'wedding'
      const isPreset = PRESET_TYPES.includes(t)
      setName(modalData?.name ?? '')
      setType(isPreset ? t : 'custom')
      setCustomType(isPreset ? '' : (t || ''))
      setDate(modalData?.date    ?? '')
      setCost(modalData?.cost    ? String(modalData.cost) : '')
      setTrackSavings(true)
      setGoalMonthly('')
      setGoalCadence('Monthly')
      setNotes(modalData?.notes  ?? '')
    }
  }, [activeModal, modalData])

  if (activeModal !== 'event') return null

  const reset = () => { setName(''); setDate(''); setCost(''); setNotes(''); setCustomType(''); setGoalMonthly('') }

  const hasCost    = parseFloat(cost) > 0
  const finalType  = type === 'custom' ? (customType.trim().toLowerCase() || 'other') : type

  const handleSave = () => {
    if (!name.trim() || !date) return

    if (isEdit) {
      // On edit: just update event fields. Goal linkage is managed via EventDetailModal.
      updateEvent(modalData.editId, { name: name.trim(), type: finalType, date, notes })
    } else if (hasCost && trackSavings) {
      // Create event + linked goal atomically
      addEventWithGoal({
        event: { name: name.trim(), type: finalType, date, notes },
        goal: {
          name:       name.trim(),
          category:   finalType === 'wedding' ? 'wedding' : finalType === 'travel' ? 'travel' : 'other',
          target:     parseFloat(cost),
          monthly:    parseFloat(goalMonthly) || 0,
          cadence:    goalCadence,
          targetDate: date,
        },
      })
    } else {
      // Create event with no savings goal
      addEvent({ name: name.trim(), type: finalType, date, notes })
    }

    reset()
    closeModal()
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target.classList.contains('modal-overlay')) { reset(); closeModal() } }}
    >
      <div className="modal">
        <div className="modal-title">{isEdit ? 'Edit Event' : 'New Life Event'}</div>

        <div className="form-row">
          <label className="label">Event Name</label>
          <input className="input" placeholder="e.g. Wedding, Trip to Japan…" value={name}
            onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        <div className="form-row">
          <label className="label">Type</label>
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="wedding">Wedding</option>
            <option value="travel">Travel</option>
            <option value="exam">Exam</option>
            <option value="birthday">Birthday</option>
            <option value="anniversary">Anniversary</option>
            <option value="other">Other</option>
            <option value="custom">Custom…</option>
          </select>
          {type === 'custom' && (
            <input className="input" style={{ marginTop: 6 }} placeholder="Enter event type"
              value={customType} onChange={(e) => setCustomType(e.target.value)} />
          )}
        </div>

        <div className="form-row">
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {/* Cost + savings goal — only shown when creating (not editing) */}
        {!isEdit && (
          <>
            <div className="form-row">
              <label className="label">
                Expected Cost <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input className="input" placeholder="$0" type="number" value={cost}
                onChange={(e) => setCost(e.target.value)} />
            </div>

            {hasCost && (
              <div style={{ background: 'var(--navy3)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: trackSavings ? 12 : 0 }}>
                  <input
                    type="checkbox"
                    checked={trackSavings}
                    onChange={(e) => setTrackSavings(e.target.checked)}
                    style={{ accentColor: 'var(--gold)', width: 15, height: 15, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 14, color: 'var(--text1)' }}>Create a savings goal for this event</span>
                </label>

                {trackSavings && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="label">Monthly contribution <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
                      <input className="input" placeholder="$0 / period" type="number"
                        value={goalMonthly} onChange={(e) => setGoalMonthly(e.target.value)} />
                    </div>
                    <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="label">Cadence</label>
                      <select className="select" value={goalCadence} onChange={(e) => setGoalCadence(e.target.value)}>
                        <option>Monthly</option>
                        <option>Bi-weekly</option>
                        <option>Weekly</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="form-row">
          <label className="label">Notes <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
          <textarea className="input" style={{ minHeight: 56, resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
            placeholder="Any details about this event…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={() => { reset(); closeModal() }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Create Event'}</button>
        </div>
      </div>
    </div>
  )
}
