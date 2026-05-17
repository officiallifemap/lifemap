import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'

const MILESTONE_PCTS = [25, 50, 75, 100]

function getMilestoneMessage(pct) {
  if (pct >= 100) return { text: 'Goal reached. Well done.', level: 'complete' }
  if (pct >= 75)  return { text: 'Three quarters there — the finish line is close.', level: 'high' }
  if (pct >= 50)  return { text: "Halfway there. You're making it happen.", level: 'mid' }
  if (pct >= 25)  return { text: 'A solid start. Keep the momentum going.', level: 'low' }
  return null
}

function fmtMonth(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function ContributionModal() {
  const activeModal     = useStore((s) => s.activeModal)
  const modalData       = useStore((s) => s.modalData)
  const closeModal      = useStore((s) => s.closeModal)
  const addContribution = useStore((s) => s.addContribution)
  const goals           = useStore((s) => s.goals)
  const events          = useStore((s) => s.events)

  // Goals are the only contribution target now; build display name with event context
  const allItems = goals.map((g) => {
    const linkedEvent = g.linkedEventId ? events.find((e) => e.id === g.linkedEventId) : null
    const label = linkedEvent ? `${g.name} (${linkedEvent.name})` : g.name
    return { key: `goal-${g.id}`, id: g.id, type: 'goal', name: label }
  })

  // Form + result state — reset on open
  const [amount,      setAmount]      = useState('')
  const [date,        setDate]        = useState('')
  const [note,        setNote]        = useState('')
  const [targetKey,   setTargetKey]   = useState('')
  const [confirmData, setConfirmData] = useState(null)

  const preKey = modalData?.goalId ? `goal-${modalData.goalId}` : ''

  useEffect(() => {
    if (activeModal === 'contribution') {
      setAmount('')
      setNote('')
      setDate(new Date().toISOString().split('T')[0])
      setConfirmData(null)
      setTargetKey(preKey)
    }
  }, [activeModal, preKey])

  if (activeModal !== 'contribution') return null

  // Resolve target goal from targetKey
  const resolvedItem = allItems.find((i) => i.key === targetKey) ?? null
  const target = resolvedItem ? goals.find((g) => g.id === resolvedItem.id) : null

  const maxVal    = target?.target ?? 0
  const prevSaved = target?.saved ?? 0
  const planned   = target?.monthly ?? null
  const tDate     = target?.targetDate ?? null
  const pct       = maxVal > 0 ? Math.min(100, Math.round((prevSaved / maxVal) * 100)) : 0

  const handleSave = () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0 || !target) return

    const newSaved  = prevSaved + amt
    const prevPct   = maxVal > 0 ? Math.round((prevSaved / maxVal) * 100) : 0
    const newPct    = maxVal > 0 ? Math.round((newSaved  / maxVal) * 100) : 0

    const hitMilestones = MILESTONE_PCTS.filter((m) => newPct >= m && prevPct < m)
    const topMilestone  = hitMilestones.length > 0 ? Math.max(...hitMilestones) : null
    const milestoneMsg  = topMilestone ? getMilestoneMessage(topMilestone) : null

    let projectionMsg = null
    if (planned && tDate && amt > planned) {
      const remaining = maxVal - newSaved
      if (remaining > 0) {
        const moToFinish = Math.ceil(remaining / amt)
        const projDate   = new Date()
        projDate.setMonth(projDate.getMonth() + moToFinish)
        projectionMsg = `At this pace, you'd reach your goal by ${projDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} instead of ${fmtMonth(tDate)}.`
      }
    }

    addContribution({ goalId: resolvedItem.id, amount: amt, date, note })
    setConfirmData({ amt, newPct, newSaved, milestoneMsg, projectionMsg, hitMilestones, label: target.name })
  }

  const handleClose = () => closeModal()

  // ── Confirm phase ──
  if (confirmData) {
    const autoClose = !confirmData.milestoneMsg && !confirmData.projectionMsg
    return (
      <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) handleClose() }}>
        <div className="modal" style={{ maxWidth: 420 }}>
          <AutoClose enabled={autoClose} onClose={handleClose} />
          <div className="contrib-confirm">
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 10 }}>{confirmData.label}</div>
            <div className="contrib-confirm-amount">+${confirmData.amt.toLocaleString()}</div>
            <div style={{ margin: '14px 0 8px' }}>
              <div className="progress-bar">
                <div
                  className={`progress-fill gold${confirmData.hitMilestones?.length > 0 ? ' milestone-pulse' : ''}`}
                  style={{ width: `${Math.min(100, confirmData.newPct)}%`, transition: 'width .7s ease' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--text3)' }}>
                <span>${confirmData.newSaved.toLocaleString()} saved</span>
                <span>${maxVal.toLocaleString()} goal</span>
              </div>
            </div>
            <div className="contrib-confirm-msg">
              You're now <strong style={{ color: 'var(--gold)' }}>{confirmData.newPct}%</strong> there.
            </div>
            {confirmData.milestoneMsg && (
              <div className="contrib-confirm-milestone">
                {confirmData.newPct >= 100 ? '🎉 ' : '✦ '}
                {confirmData.milestoneMsg.text}
              </div>
            )}
            {confirmData.projectionMsg && (
              <div className="contrib-confirm-projection">{confirmData.projectionMsg}</div>
            )}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 18 }} onClick={handleClose}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Form phase ──
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) handleClose() }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-title">Log Contribution</div>

        {/* Target selector — shown when not pre-selected */}
        <div className="form-row">
          <label className="label">Apply to</label>
          <select
            className="select"
            value={targetKey}
            onChange={(e) => setTargetKey(e.target.value)}
          >
            <option value="">— choose a savings goal —</option>
            {allItems.map((item) => (
              <option key={item.key} value={item.key}>{item.name}</option>
            ))}
          </select>
        </div>

        {target && (
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
            {pct}% saved · ${prevSaved.toLocaleString()} of ${maxVal.toLocaleString()}
          </div>
        )}

        <div className="form-row">
          <label className="label">Amount</label>
          <input
            className="input" type="number" placeholder="$0.00" autoFocus
            value={amount} onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div className="form-row">
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="label">Note <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
          <input className="input" placeholder="e.g. birthday money, skipped takeout…"
            value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!target || !amount || parseFloat(amount) <= 0} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function AutoClose({ enabled, onClose }) {
  useEffect(() => {
    if (!enabled) return
    const t = setTimeout(onClose, 2800)
    return () => clearTimeout(t)
  }, [enabled, onClose])
  return null
}
