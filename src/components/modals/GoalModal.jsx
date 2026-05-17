import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'

const PRESET_CATEGORIES = ['emergency', 'wedding', 'travel', 'retirement', 'home', 'education', 'other']

export default function GoalModal() {
  const activeModal = useStore((s) => s.activeModal)
  const modalData   = useStore((s) => s.modalData)
  const closeModal  = useStore((s) => s.closeModal)
  const addGoal     = useStore((s) => s.addGoal)
  const updateGoal  = useStore((s) => s.updateGoal)
  const events      = useStore((s) => s.events)

  const [name,          setName]          = useState('')
  const [category,      setCategory]      = useState('other')
  const [customCat,     setCustomCat]     = useState('')
  const [target,        setTarget]        = useState('')
  const [monthly,       setMonthly]       = useState('')
  const [cadence,       setCadence]       = useState('Monthly')
  const [targetDate,    setTargetDate]    = useState('')
  const [linkedEventId, setLinkedEventId] = useState('')   // '' = none

  const isEdit = !!modalData?.editId

  // Linkable events: those without an existing goal link (or the one already linked in edit)
  const linkableEvents = events.filter((e) =>
    !e.linkedGoalId || e.linkedGoalId === modalData?.editId
  )

  useEffect(() => {
    if (activeModal === 'goal') {
      const cat = modalData?.category ?? 'other'
      const isPreset = PRESET_CATEGORIES.includes(cat)
      setName(modalData?.name ?? '')
      setCategory(isPreset ? cat : 'custom')
      setCustomCat(isPreset ? '' : (cat || ''))
      setTarget(modalData?.target       ? String(modalData.target)       : '')
      setMonthly(modalData?.monthly     ? String(modalData.monthly)      : '')
      setCadence(modalData?.cadence     ?? 'Monthly')
      setTargetDate(modalData?.targetDate ?? '')
      // Pre-fill linkedEventId if passed from EventDetailModal
      setLinkedEventId(modalData?.linkedEventId ? String(modalData.linkedEventId) : '')
    }
  }, [activeModal, modalData])

  if (activeModal !== 'goal') return null

  const reset = () => {
    setName(''); setCategory('other'); setCustomCat(''); setTarget(''); setMonthly(''); setTargetDate(''); setLinkedEventId('')
  }

  const handleSave = () => {
    if (!name.trim() || !target) return
    const finalCategory  = category === 'custom' ? (customCat.trim() || 'other') : category
    const linkedEventNum = linkedEventId ? Number(linkedEventId) : null

    if (isEdit) {
      updateGoal(modalData.editId, {
        name: name.trim(), category: finalCategory,
        target: Number(target), monthly: Number(monthly || 0),
        cadence, targetDate,
      })
    } else {
      addGoal({
        name: name.trim(), category: finalCategory,
        target, monthly: monthly || 0, cadence, targetDate,
        linkedEventId: linkedEventNum,
      })
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
        <div className="modal-title">{isEdit ? 'Edit Goal' : 'New Savings Goal'}</div>

        <div className="form-row">
          <label className="label">Goal Name</label>
          <input className="input" placeholder="e.g. Emergency Fund, New Car…" value={name}
            onChange={(e) => setName(e.target.value)} autoFocus />
        </div>

        <div className="form-row">
          <label className="label">Category</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="emergency">Emergency</option>
            <option value="wedding">Wedding</option>
            <option value="travel">Travel</option>
            <option value="retirement">Retirement</option>
            <option value="home">Home</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
            <option value="custom">Custom…</option>
          </select>
          {category === 'custom' && (
            <input className="input" style={{ marginTop: 6 }} placeholder="Enter category name"
              value={customCat} onChange={(e) => setCustomCat(e.target.value)} />
          )}
        </div>

        <div className="form-row">
          <label className="label">Target Amount</label>
          <input className="input" placeholder="$0" type="number" min="1" value={target}
            onChange={(e) => setTarget(e.target.value)} />
        </div>

        <div className="form-row">
          <label className="label">
            Contribution Amount <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input className="input" placeholder="$0 / period" type="number" min="0" value={monthly}
            onChange={(e) => setMonthly(e.target.value)} />
        </div>

        <div className="form-row">
          <label className="label">Cadence</label>
          <select className="select" value={cadence} onChange={(e) => setCadence(e.target.value)}>
            <option>Monthly</option>
            <option>Bi-weekly</option>
            <option>Weekly</option>
          </select>
        </div>

        <div className="form-row">
          <label className="label">Target Date <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
          <input className="input" type="date" value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)} />
          {targetDate && (
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>
              Used to calculate if your contribution pace is on track.
            </div>
          )}
        </div>

        {/* Link to Life Event — only show when creating, or when editing an already-linked goal */}
        {!isEdit && linkableEvents.length > 0 && (
          <div className="form-row">
            <label className="label">Link to Life Event <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
            <select className="select" value={linkedEventId} onChange={(e) => setLinkedEventId(e.target.value)}>
              <option value="">— None —</option>
              {linkableEvents.map((e) => (
                <option key={e.id} value={String(e.id)}>{e.name}</option>
              ))}
            </select>
            {linkedEventId && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>
                This goal will appear in that event's detail view.
              </div>
            )}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn" onClick={() => { reset(); closeModal() }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Create Goal'}</button>
        </div>
      </div>
    </div>
  )
}
