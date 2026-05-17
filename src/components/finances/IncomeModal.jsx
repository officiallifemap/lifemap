import { useState } from 'react'
import useStore from '../../store/useStore'

export default function IncomeModal() {
  const activeModal        = useStore((s) => s.activeModal)
  const closeModal         = useStore((s) => s.closeModal)
  const incomeMode         = useStore((s) => s.incomeMode)
  const fixedIncome        = useStore((s) => s.fixedIncome)
  const incomeEntries      = useStore((s) => s.incomeEntries)
  const setIncomeMode      = useStore((s) => s.setIncomeMode)
  const setFixedIncome     = useStore((s) => s.setFixedIncome)
  const addIncomeEntry     = useStore((s) => s.addIncomeEntry)
  const deleteIncomeEntry  = useStore((s) => s.deleteIncomeEntry)
  const paydayAnchorDate   = useStore((s) => s.paydayAnchorDate)
  const paydayFrequency    = useStore((s) => s.paydayFrequency)
  const setPaydayAnchorDate = useStore((s) => s.setPaydayAnchorDate)
  const setPaydayFrequency  = useStore((s) => s.setPaydayFrequency)

  const [fixedVal,   setFixedVal]   = useState(String(fixedIncome))
  const [entryAmt,   setEntryAmt]   = useState('')
  const [entryDate,  setEntryDate]  = useState(new Date().toISOString().split('T')[0])
  const [entryLabel, setEntryLabel] = useState('')

  if (activeModal !== 'income') return null

  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthEntries = incomeEntries.filter((e) => e.date?.startsWith(thisMonth))
  const thisMonthTotal   = thisMonthEntries.reduce((s, e) => s + e.amount, 0)

  const handleSaveFixed = () => {
    setFixedIncome(fixedVal)
    closeModal()
  }

  const handleAddEntry = () => {
    if (!entryAmt) return
    addIncomeEntry({ amount: entryAmt, date: entryDate, label: entryLabel || 'Income' })
    setEntryAmt(''); setEntryLabel('')
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target.classList.contains('modal-overlay')) closeModal() }}
    >
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-title">Income Settings</div>

        {/* Mode toggle */}
        <div className="form-row">
          <label className="label">Income type</label>
          <div className="filter-toggle" style={{ width: '100%' }}>
            <button
              className={`filter-toggle-btn${incomeMode === 'fixed' ? ' active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => setIncomeMode('fixed')}
            >Fixed / Salary</button>
            <button
              className={`filter-toggle-btn${incomeMode === 'variable' ? ' active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => setIncomeMode('variable')}
            >Variable / Log entries</button>
          </div>
        </div>

        {incomeMode === 'fixed' && (
          <div className="form-row">
            <label className="label">Monthly take-home</label>
            <input
              className="input"
              type="number"
              placeholder="e.g. 5200"
              value={fixedVal}
              onChange={(e) => setFixedVal(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {incomeMode === 'variable' && (
          <>
            <div style={{ background: 'var(--navy3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>This month's income</div>
              <div className="mono" style={{ fontSize: 22, color: 'var(--sage2)' }}>${thisMonthTotal.toLocaleString()}</div>
            </div>

            {/* Add new entry */}
            <div className="form-row">
              <label className="label">Log a payment</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input className="input" type="number" placeholder="Amount" style={{ flex: '1 1 100px' }}
                  value={entryAmt} onChange={(e) => setEntryAmt(e.target.value)} />
                <input className="input" type="date" style={{ flex: '1 1 130px' }}
                  value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                <input className="input" placeholder="Label (e.g. Freelance, Paycheck)" style={{ flex: '2 1 180px' }}
                  value={entryLabel} onChange={(e) => setEntryLabel(e.target.value)} />
                <button className="btn btn-primary btn-sm" onClick={handleAddEntry}>+ Add</button>
              </div>
            </div>

            {/* Existing entries this month */}
            {thisMonthEntries.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>This month</div>
                {thisMonthEntries.map((entry) => (
                  <div key={entry.id} className="income-entry-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--text1)' }}>{entry.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{entry.date}</div>
                    </div>
                    <span className="mono" style={{ color: 'var(--sage2)', marginRight: 12 }}>+${Number(entry.amount).toLocaleString()}</span>
                    <button className="action-btn danger" onClick={() => deleteIncomeEntry(entry.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}

          </>
        )}

        {/* ── Payday Settings (shared for both income modes) ── */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 18, paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Payday Calendar
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
            Set your pay schedule so paydays appear on your calendar.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
              <label className="label">Frequency</label>
              <select
                className="select"
                value={paydayFrequency}
                onChange={(e) => setPaydayFrequency(e.target.value)}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="semi-monthly">Twice a month (1st &amp; 15th)</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
              <label className="label">A known pay date</label>
              <input
                className="input"
                type="date"
                value={paydayAnchorDate}
                onChange={(e) => setPaydayAnchorDate(e.target.value)}
                placeholder="Pick any past or upcoming payday"
              />
            </div>
          </div>
          {paydayAnchorDate && (
            <div style={{ fontSize: 11, color: 'var(--sage2)', marginTop: 8 }}>
              ✓ Paydays will show on your calendar. Toggle visibility with the Payday filter.
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ marginTop: 16 }}>
          <button className="btn" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (incomeMode === 'fixed') setFixedIncome(fixedVal)
            closeModal()
          }}>Save</button>
        </div>
      </div>
    </div>
  )
}
